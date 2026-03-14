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
    const { phone } = await req.json();

    if (!phone || typeof phone !== "string" || phone.length < 10) {
      return new Response(
        JSON.stringify({ error: "Valid phone number is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Clean phone number — strip leading + or 0, keep digits only
    const cleanPhone = phone.replace(/\D/g, "").replace(/^0+/, "");

    // Generate 6-digit code
    const code = String(Math.floor(100000 + Math.random() * 900000));

    // Store in DB using service role
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Invalidate previous codes for this phone
    await supabase
      .from("phone_verification_codes")
      .update({ verified: true })
      .eq("phone", cleanPhone)
      .eq("verified", false);

    // Insert new code
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

    // Send SMS via SMSBit API
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
    console.log("SMS API response:", smsResult);

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
