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
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No auth" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Verify the user
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Extract IP and user agent
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("cf-connecting-ip") ||
      "unknown";
    const userAgent = req.headers.get("user-agent") || "unknown";

    const body = await req.json().catch(() => ({}));
    const loginMethod = body.login_method || "password";
    const sessionId = body.session_id || null;

    // Use service role to insert (bypasses RLS)
    const adminClient = createClient(supabaseUrl, serviceKey);

    // Insert login event
    await adminClient.from("login_events").insert({
      user_id: user.id,
      ip_address: ip,
      user_agent: userAgent,
      login_method: loginMethod,
    });

    // Upsert session
    if (sessionId) {
      // Mark all other sessions as not current
      await adminClient
        .from("user_sessions")
        .update({ is_current: false })
        .eq("user_id", user.id);

      // Upsert current session
      const { data: existing } = await adminClient
        .from("user_sessions")
        .select("id")
        .eq("user_id", user.id)
        .eq("session_id", sessionId)
        .maybeSingle();

      if (existing) {
        await adminClient
          .from("user_sessions")
          .update({
            ip_address: ip,
            user_agent: userAgent,
            last_active_at: new Date().toISOString(),
            is_current: true,
          })
          .eq("id", existing.id);
      } else {
        await adminClient.from("user_sessions").insert({
          user_id: user.id,
          session_id: sessionId,
          ip_address: ip,
          user_agent: userAgent,
          is_current: true,
        });
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
