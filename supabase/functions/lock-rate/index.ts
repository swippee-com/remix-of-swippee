import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const RATE_LOCK_SECONDS = 45;

const ASSET_CG_IDS: Record<string, string> = {
  BTC: "bitcoin",
  ETH: "ethereum",
  USDT: "tether",
  USDC: "usd-coin",
};

async function fetchCryptoUsdPrice(asset: string): Promise<number> {
  const cgId = ASSET_CG_IDS[asset];
  if (!cgId) throw new Error(`Unsupported asset: ${asset}`);
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

async function fetchForexRate(supabase: any): Promise<{ buy: number; sell: number }> {
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
    // Fallback: use last known rate from market_price_snapshots
    const { data: snapshot } = await supabase
      .from("market_price_snapshots")
      .select("usd_npr_rate")
      .order("fetched_at", { ascending: false })
      .limit(1)
      .single();
    const fallbackRate = snapshot?.usd_npr_rate || 147.64;
    return { buy: fallbackRate, sell: fallbackRate };
  }
}

function calculatePricing(
  asset: string,
  side: string,
  config: any,
  cryptoUsdPrice: number,
  usdNprRate: number,
  amount: number,
  amountType: string,
  paymentMethod: string | null
) {
  const isStablecoin = asset === "USDT" || asset === "USDC";
  let finalRateNpr: number;

  if (isStablecoin && config.fixed_markup_npr != null) {
    if (side === "buy") {
      finalRateNpr = usdNprRate + config.fixed_markup_npr;
    } else {
      finalRateNpr = usdNprRate - config.fixed_markup_npr;
    }
  } else if (config.percent_spread != null) {
    const baseNpr = cryptoUsdPrice * usdNprRate;
    if (side === "buy") {
      finalRateNpr = baseNpr * (1 + config.percent_spread / 100);
    } else {
      finalRateNpr = baseNpr * (1 - config.percent_spread / 100);
    }
  } else {
    finalRateNpr = cryptoUsdPrice * usdNprRate;
  }

  const networkFee = config.network_fee_npr || 0;
  let paymentAdjustment = 0;
  if (paymentMethod && config.payment_adjustments) {
    paymentAdjustment = config.payment_adjustments[paymentMethod] || 0;
  }
  const feesNpr = networkFee + paymentAdjustment;

  let totalPayNpr: number;
  let totalReceiveCrypto: number;

  if (side === "buy") {
    if (amountType === "crypto") {
      totalReceiveCrypto = amount;
      totalPayNpr = amount * finalRateNpr + feesNpr;
    } else {
      totalPayNpr = amount;
      totalReceiveCrypto = (amount - feesNpr) / finalRateNpr;
    }
  } else {
    if (amountType === "crypto") {
      totalReceiveCrypto = amount;
      totalPayNpr = amount * finalRateNpr - feesNpr;
    } else {
      totalPayNpr = amount;
      totalReceiveCrypto = (amount + feesNpr) / finalRateNpr;
    }
  }

  return {
    finalRateNpr: Math.round(finalRateNpr * 100) / 100,
    feesNpr: Math.round(feesNpr * 100) / 100,
    totalPayNpr: Math.round(totalPayNpr * 100) / 100,
    totalReceiveCrypto: Math.round(totalReceiveCrypto * 100000000) / 100000000,
    cryptoUsdPrice,
    usdNprRate,
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } =
      await supabaseUser.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claimsData.claims.sub as string;

    // Rate limit: 10 lock requests per 60 seconds per user
    const rateLimitClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );
    const { data: allowed } = await rateLimitClient.rpc("check_rate_limit", {
      _key: userId, _endpoint: "lock-rate", _max_requests: 10, _window_seconds: 60,
    });
    if (!allowed) {
      return new Response(
        JSON.stringify({ error: "Too many rate lock requests. Please wait." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const {
      asset,
      network,
      side,
      payment_method,
      amount_input_type,
      amount_input_value,
    } = await req.json();

    if (!asset || !network || !side || !amount_input_value) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // 1. Get pricing config (server-side, not from client)
    const { data: configs } = await supabase
      .from("pricing_configs")
      .select("*")
      .eq("asset", asset)
      .eq("is_active", true);

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

    // 2. Fetch fresh market data (server-side)
    const [cryptoUsdPrice, forexRate] = await Promise.all([
      fetchCryptoUsdPrice(asset),
      fetchForexRate(supabase),
    ]);
    const usdNprRate = forexRate.buy;

    // 3. Calculate pricing server-side
    const calculated = calculatePricing(
      asset,
      side,
      config,
      cryptoUsdPrice,
      usdNprRate,
      amount_input_value,
      amount_input_type || "npr",
      payment_method || null
    );

    // 4. Validate min order
    if (calculated.totalPayNpr < config.min_order_npr) {
      return new Response(
        JSON.stringify({ error: `Minimum order is NPR ${config.min_order_npr.toLocaleString()}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 5. Expire any existing active locks for this user
    await supabase
      .from("rate_locks")
      .update({ status: "expired" })
      .eq("user_id", userId)
      .eq("status", "active");

    const expiresAt = new Date(
      Date.now() + RATE_LOCK_SECONDS * 1000
    ).toISOString();

    const { data: lock, error: insertError } = await supabase
      .from("rate_locks")
      .insert({
        user_id: userId,
        asset,
        network,
        side,
        payment_method: payment_method || null,
        amount_input_type: amount_input_type || "npr",
        amount_input_value: amount_input_value,
        crypto_usd_price: calculated.cryptoUsdPrice,
        usd_npr_rate: calculated.usdNprRate,
        base_npr_price: calculated.cryptoUsdPrice * calculated.usdNprRate,
        final_rate_npr: calculated.finalRateNpr,
        fees_npr: calculated.feesNpr,
        total_pay: calculated.totalPayNpr,
        total_receive: calculated.totalReceiveCrypto,
        expires_at: expiresAt,
        pricing_config_id: config.id,
        status: "active",
      })
      .select()
      .single();

    if (insertError) {
      console.error("Rate lock insert error:", insertError);
      return new Response(
        JSON.stringify({ error: "Failed to create rate lock" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Save market snapshot
    await supabase.from("market_price_snapshots").insert({
      asset,
      crypto_usd_price: calculated.cryptoUsdPrice,
      usd_npr_rate: calculated.usdNprRate,
    });

    return new Response(
      JSON.stringify({
        success: true,
        rate_lock: {
          id: lock.id,
          expires_at: lock.expires_at,
          final_rate_npr: lock.final_rate_npr,
          fees_npr: lock.fees_npr,
          total_pay: lock.total_pay,
          total_receive: lock.total_receive,
          seconds_remaining: RATE_LOCK_SECONDS,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("lock-rate error:", error);
    const msg = error instanceof Error ? error.message : "Rate lock failed";
    return new Response(JSON.stringify({ success: false, error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
