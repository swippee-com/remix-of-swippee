import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// CoinGecko IDs for our supported assets
const ASSET_CG_IDS: Record<string, string> = {
  BTC: "bitcoin",
  ETH: "ethereum",
  USDT: "tether",
  USDC: "usd-coin",
};

async function fetchCryptoUsdPrice(asset: string): Promise<number> {
  const cgId = ASSET_CG_IDS[asset];
  if (!cgId) throw new Error(`Unsupported asset: ${asset}`);

  // Stablecoins: shortcut
  if (asset === "USDT" || asset === "USDC") return 1;

  const res = await fetch(
    `https://api.coingecko.com/api/v3/simple/price?ids=${cgId}&vs_currencies=usd`
  );
  if (!res.ok) throw new Error("Failed to fetch crypto price");
  const data = await res.json();
  const price = data[cgId]?.usd;
  if (!price) throw new Error("Crypto price not found");
  return price;
}

async function fetchForexRate(): Promise<{ buy: number; sell: number }> {
  const today = new Date().toISOString().split("T")[0];
  const url = `https://www.nrb.org.np/api/forex/v1/rates?from=${today}&to=${today}&per_page=1&page=1`;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error("NRB API error");
    const json = await res.json();
    const payload = json?.data?.payload?.[0];
    const usdRate = payload?.rates?.find(
      (r: { currency: { iso3: string } }) => r.currency.iso3 === "USD"
    );
    if (!usdRate) throw new Error("USD rate not found");
    return { buy: parseFloat(usdRate.buy), sell: parseFloat(usdRate.sell) };
  } catch {
    // Fallback
    return { buy: 147.64, sell: 147.64 };
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { asset, network, side, amount, amount_type, payment_method } =
      await req.json();

    if (!asset || !side) {
      return new Response(
        JSON.stringify({ error: "asset and side are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // 1. Get pricing config
    let query = supabase
      .from("pricing_configs")
      .select("*")
      .eq("asset", asset)
      .eq("is_active", true);

    // Try side-specific first, fall back to null (both)
    const { data: configs } = await query;
    const config =
      configs?.find((c: any) => c.side === side) ||
      configs?.find((c: any) => c.side === null) ||
      configs?.[0];

    if (!config) {
      return new Response(
        JSON.stringify({ error: "No pricing config for this asset" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Fetch market data
    const [cryptoUsdPrice, forexRate] = await Promise.all([
      fetchCryptoUsdPrice(asset),
      fetchForexRate(),
    ]);

    const usdNprRate = forexRate.buy;

    // 3. Calculate pricing
    let finalRateNpr: number;
    const isStablecoin = asset === "USDT" || asset === "USDC";

    if (isStablecoin && config.fixed_markup_npr != null) {
      // Stablecoin: fixed NPR markup
      if (side === "buy") {
        // User buying from Swippee → Swippee sells → sell markup
        finalRateNpr = usdNprRate + config.fixed_markup_npr;
      } else {
        // User selling to Swippee → Swippee buys → buy markup
        finalRateNpr = usdNprRate + config.fixed_markup_npr;
      }
    } else if (config.percent_spread != null) {
      // Volatile asset: percentage spread
      const baseNpr = cryptoUsdPrice * usdNprRate;
      if (side === "buy") {
        finalRateNpr = baseNpr * (1 + config.percent_spread / 100);
      } else {
        finalRateNpr = baseNpr * (1 - config.percent_spread / 100);
      }
    } else {
      // Fallback: no spread
      finalRateNpr = cryptoUsdPrice * usdNprRate;
    }

    // Add network fee
    const networkFee = config.network_fee_npr || 0;

    // Payment method adjustment
    let paymentAdjustment = 0;
    if (payment_method && config.payment_adjustments) {
      paymentAdjustment = config.payment_adjustments[payment_method] || 0;
    }

    const feesNpr = networkFee + paymentAdjustment;

    // 4. Calculate totals based on input
    let totalPayNpr: number;
    let totalReceiveCrypto: number;
    const inputAmount = amount || 0;

    if (side === "buy") {
      if (amount_type === "crypto") {
        totalReceiveCrypto = inputAmount;
        totalPayNpr = inputAmount * finalRateNpr + feesNpr;
      } else {
        totalPayNpr = inputAmount;
        totalReceiveCrypto = (inputAmount - feesNpr) / finalRateNpr;
      }
    } else {
      // sell
      if (amount_type === "crypto") {
        totalReceiveCrypto = inputAmount; // user sends this much crypto
        totalPayNpr = inputAmount * finalRateNpr - feesNpr; // user receives NPR
      } else {
        totalPayNpr = inputAmount; // user wants this much NPR
        totalReceiveCrypto = (inputAmount + feesNpr) / finalRateNpr;
      }
    }

    // 5. Check manual review threshold
    const requiresManualReview =
      (amount_type === "npr" ? inputAmount : totalPayNpr) >
      (config.max_auto_order_npr || 500000);

    return new Response(
      JSON.stringify({
        success: true,
        pricing: {
          asset,
          network: network || null,
          side,
          crypto_usd_price: cryptoUsdPrice,
          usd_npr_rate: usdNprRate,
          final_rate_npr: Math.round(finalRateNpr * 100) / 100,
          fees_npr: Math.round(feesNpr * 100) / 100,
          total_pay_npr: Math.round(totalPayNpr * 100) / 100,
          total_receive_crypto:
            Math.round(totalReceiveCrypto * 100000000) / 100000000,
          requires_manual_review: requiresManualReview,
          pricing_config_id: config.id,
          min_order_npr: config.min_order_npr,
          max_auto_order_npr: config.max_auto_order_npr,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("calculate-price error:", error);
    const msg = error instanceof Error ? error.message : "Pricing calculation failed";
    return new Response(JSON.stringify({ success: false, error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
