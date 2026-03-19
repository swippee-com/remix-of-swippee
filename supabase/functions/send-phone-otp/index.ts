import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const normalizePhone = (phone: string) => {
  let digits = phone.replace(/\D/g, "").replace(/^0+/, "");

  if (digits.startsWith("977") && digits.length > 10) {
    digits = digits.slice(-10);
  }

  return digits;
};

const isValidPhone = (phone: string) => /^9\d{9}$/.test(phone);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { phone } = await req.json();

    if (!phone || typeof phone !== "string") {
      return new Response(
        JSON.stringify({ error: "Valid phone number is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const cleanPhone = normalizePhone(phone);

    if (!isValidPhone(cleanPhone)) {
      return new Response(
        JSON.stringify({ error: "Enter a valid phone number" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Rate limit: max 3 OTP sends per phone per 10 minutes
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const { count: recentCount, error: countError } = await supabase
      .from("phone_verification_codes")
      .select("id", { count: "exact", head: true })
      .eq("phone", cleanPhone)
      .gte("created_at", tenMinutesAgo);

    if (countError) {
      console.error("Rate limit check error:", countError);
    }

    if ((recentCount ?? 0) >= 3) {
      return new Response(
        JSON.stringify({ error: "Too many attempts. Please wait 10 minutes before trying again." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if phone is already verified by another user
    const { data: existingVerifiedPhone, error: existingPhoneError } = await supabase
      .from("profiles")
      .select("id")
      .eq("phone", cleanPhone)
      .eq("phone_verified", true)
      .limit(1)
      .maybeSingle();

    if (existingPhoneError) {
      console.error("Existing phone check error:", existingPhoneError);
      return new Response(
        JSON.stringify({ error: "Unable to verify phone availability" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (existingVerifiedPhone) {
      return new Response(
        JSON.stringify({ error: "This phone number is already linked to an account" }),
        { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const code = String(Math.floor(100000 + Math.random() * 900000));

    await supabase
      .from("phone_verification_codes")
      .update({ verified: true })
      .eq("phone", cleanPhone)
      .eq("verified", false);

    const { error: insertError } = await supabase
      .from("phone_verification_codes")
      .insert({ phone: cleanPhone, code });

    if (insertError) {
      console.error("Insert error:", insertError);
      return new Response(
        JSON.stringify({ error: "Failed to generate verification code" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const apiKey = Deno.env.get("SMSBIT_API_KEY");
    if (!apiKey) {
      console.error("SMSBIT_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "SMS service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const smsMessage = `Your Swippee verification code is ${code}`;
    const smsParams = new URLSearchParams({
      key: apiKey,
      contacts: cleanPhone,
      senderid: "SMSBit",
      msg: smsMessage,
      responsetype: "json",
      campaign: "7190",
      routeid: "10261",
      type: "text",
    });

    const smsResponse = await fetch(
      `https://bulk.bedbyaspokhrel.com.np/smsapi/index.php?${smsParams.toString()}`
    );
    const smsResult = await smsResponse.text();
    console.log("SMS API status:", smsResponse.status, "response length:", smsResult.length);

    if (smsResult.startsWith("ERR")) {
      return new Response(
        JSON.stringify({ error: "Failed to send SMS. Please try again." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, message: "Verification code sent" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
