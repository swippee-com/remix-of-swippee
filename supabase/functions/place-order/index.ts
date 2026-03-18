import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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

    const { rate_lock_id, payment_method_id, payout_address_id } =
      await req.json();

    if (!rate_lock_id) {
      return new Response(
        JSON.stringify({ error: "rate_lock_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // 1. Validate rate lock
    const { data: lock, error: lockError } = await supabase
      .from("rate_locks")
      .select("*")
      .eq("id", rate_lock_id)
      .eq("user_id", userId)
      .eq("status", "active")
      .single();

    if (lockError || !lock) {
      return new Response(
        JSON.stringify({ error: "Rate lock not found or already used" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate min order
    if (lock.pricing_config_id) {
      const { data: pConfig } = await supabase
        .from("pricing_configs")
        .select("min_order_npr")
        .eq("id", lock.pricing_config_id)
        .single();

      if (pConfig && lock.total_pay < pConfig.min_order_npr) {
        return new Response(
          JSON.stringify({ error: `Minimum order is NPR ${pConfig.min_order_npr}. This order is NPR ${lock.total_pay}.` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Check expiry
    if (new Date(lock.expires_at) < new Date()) {
      await supabase
        .from("rate_locks")
        .update({ status: "expired" })
        .eq("id", rate_lock_id);

      return new Response(
        JSON.stringify({ error: "Rate lock has expired. Please refresh your rate." }),
        { status: 410, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Check account frozen
    const { data: frozen } = await supabase.rpc("is_account_frozen", {
      _user_id: userId,
    });
    if (frozen) {
      return new Response(
        JSON.stringify({ error: "Account is frozen" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2b. Readiness checks
    const { data: profile } = await supabase
      .from("profiles")
      .select("phone_verified")
      .eq("id", userId)
      .single();
    if (!profile?.phone_verified) {
      return new Response(
        JSON.stringify({ error: "Phone number not verified. Please verify your phone first." }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: kycRows } = await supabase
      .from("kyc_submissions")
      .select("id")
      .eq("user_id", userId)
      .eq("status", "approved")
      .limit(1);
    if (!kycRows || kycRows.length === 0) {
      return new Response(
        JSON.stringify({ error: "KYC not approved. Please complete KYC verification first." }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: pmRows } = await supabase
      .from("payment_methods")
      .select("id")
      .eq("user_id", userId)
      .limit(1);
    if (!pmRows || pmRows.length === 0) {
      return new Response(
        JSON.stringify({ error: "No payment method found. Please add a payment method first." }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (lock.side === "buy") {
      const { data: payoutRows } = await supabase
        .from("payout_addresses")
        .select("id")
        .eq("user_id", userId)
        .limit(1);
      if (!payoutRows || payoutRows.length === 0) {
        return new Response(
          JSON.stringify({ error: "No crypto wallet address found. Please add a payout address to receive your crypto." }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    let requiresManualReview = false;
    const { data: inventory } = await supabase
      .from("inventory_balances")
      .select("*")
      .eq("asset", lock.asset)
      .eq("network", lock.network)
      .single();

    if (lock.side === "buy") {
      // User buying crypto — check if we have enough
      if (
        !inventory ||
        !inventory.is_enabled ||
        inventory.available_amount < lock.total_receive
      ) {
        requiresManualReview = true;
      }
      // Check low threshold
      if (
        inventory &&
        inventory.available_amount - lock.total_receive <
          inventory.low_threshold
      ) {
        requiresManualReview = true;
      }
    }

    // Check order size threshold
    if (lock.total_pay > (lock.pricing_config_id ? 500000 : 500000)) {
      // Fetch actual config threshold
      if (lock.pricing_config_id) {
        const { data: config } = await supabase
          .from("pricing_configs")
          .select("max_auto_order_npr")
          .eq("id", lock.pricing_config_id)
          .single();
        if (config && lock.total_pay > config.max_auto_order_npr) {
          requiresManualReview = true;
        }
      }
    }

    // 4. Mark rate lock as used
    await supabase
      .from("rate_locks")
      .update({ status: "used" })
      .eq("id", rate_lock_id);

    // 5. Create order
    const orderStatus = requiresManualReview ? "manual_review" : "awaiting_payment";
    const orderType = requiresManualReview ? "manual_review" : "instant";

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        user_id: userId,
        rate_lock_id,
        side: lock.side,
        asset: lock.asset,
        network: lock.network,
        payment_method_id: payment_method_id || null,
        payout_address_id: payout_address_id || null,
        input_amount_npr:
          lock.amount_input_type === "npr" ? lock.amount_input_value : null,
        input_amount_crypto:
          lock.amount_input_type === "crypto" ? lock.amount_input_value : null,
        final_rate_npr: lock.final_rate_npr,
        fee_total_npr: lock.fees_npr,
        total_pay_npr: lock.total_pay,
        total_receive_crypto: lock.total_receive,
        order_type: orderType,
        requires_manual_review: requiresManualReview,
        status: orderStatus,
      })
      .select()
      .single();

    if (orderError) {
      console.error("Order insert error:", orderError);
      // Revert rate lock
      await supabase
        .from("rate_locks")
        .update({ status: "active" })
        .eq("id", rate_lock_id);
      return new Response(
        JSON.stringify({ error: "Failed to create order" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 6. Create status history
    await supabase.from("order_status_history").insert({
      order_id: order.id,
      old_status: null,
      new_status: orderStatus,
      actor_id: userId,
      actor_role: "user",
      note: requiresManualReview
        ? "Order requires manual review"
        : "Order placed successfully",
    });

    // 7. Reserve inventory if buying
    if (lock.side === "buy" && inventory && !requiresManualReview) {
      await supabase
        .from("inventory_balances")
        .update({
          available_amount: inventory.available_amount - lock.total_receive,
          reserved_amount: inventory.reserved_amount + lock.total_receive,
        })
        .eq("id", inventory.id);
    }

    // 8. Create notification
    await supabase.from("notifications").insert({
      user_id: userId,
      type: "trade_update",
      title: "Order Placed",
      message: requiresManualReview
        ? `Your ${lock.side} order for ${lock.asset} requires manual confirmation. We'll review it shortly.`
        : `Your ${lock.side} order for ${lock.asset} has been placed. Please complete payment.`,
      link: `/dashboard/orders/${order.id}`,
    });

    return new Response(
      JSON.stringify({
        success: true,
        order: {
          id: order.id,
          status: order.status,
          requires_manual_review: requiresManualReview,
          side: order.side,
          asset: order.asset,
          network: order.network,
          final_rate_npr: order.final_rate_npr,
          total_pay_npr: order.total_pay_npr,
          total_receive_crypto: order.total_receive_crypto,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("place-order error:", error);
    const msg = error instanceof Error ? error.message : "Order placement failed";
    return new Response(JSON.stringify({ success: false, error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
