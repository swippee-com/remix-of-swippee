import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const RATE_LOCK_SECONDS = 45;

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

    const {
      asset,
      network,
      side,
      payment_method,
      amount_input_type,
      amount_input_value,
      pricing, // from calculate-price response
    } = await req.json();

    if (!asset || !network || !side || !amount_input_value || !pricing) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Expire any existing active locks for this user
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
        crypto_usd_price: pricing.crypto_usd_price,
        usd_npr_rate: pricing.usd_npr_rate,
        base_npr_price: pricing.crypto_usd_price * pricing.usd_npr_rate,
        final_rate_npr: pricing.final_rate_npr,
        fees_npr: pricing.fees_npr,
        total_pay: pricing.total_pay_npr,
        total_receive: pricing.total_receive_crypto,
        expires_at: expiresAt,
        pricing_config_id: pricing.pricing_config_id || null,
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
      crypto_usd_price: pricing.crypto_usd_price,
      usd_npr_rate: pricing.usd_npr_rate,
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
