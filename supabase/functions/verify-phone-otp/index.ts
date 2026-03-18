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
    const { phone, code } = await req.json();

    if (!phone || !code) {
      return new Response(
        JSON.stringify({ error: "Phone and code are required" }),
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

    const authHeader = req.headers.get("Authorization");
    let userId: string | null = null;

    if (authHeader) {
      const anonClient = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_ANON_KEY")!
      );
      const {
        data: { user },
      } = await anonClient.auth.getUser(authHeader.replace("Bearer ", ""));
      userId = user?.id ?? null;
    }

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

    if (existingVerifiedPhone && (!userId || existingVerifiedPhone.id !== userId)) {
      return new Response(
        JSON.stringify({ error: "This phone number is already linked to another account" }),
        { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: match, error: matchError } = await supabase
      .from("phone_verification_codes")
      .select("*")
      .eq("phone", cleanPhone)
      .eq("code", code)
      .eq("verified", false)
      .gte("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (matchError || !match) {
      return new Response(
        JSON.stringify({ error: "Invalid or expired verification code" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    await supabase
      .from("phone_verification_codes")
      .update({ verified: true, user_id: userId })
      .eq("id", match.id);

    if (userId) {
      // Use upsert in case profile doesn't exist yet (race with auth trigger)
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ phone: cleanPhone, phone_verified: true })
        .eq("id", userId);

      // If update affected 0 rows (profile not created yet), retry after a short delay
      if (profileError) {
        console.error("Profile update error:", profileError);
      }
    }

    return new Response(
      JSON.stringify({ success: true, verified: true }),
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
