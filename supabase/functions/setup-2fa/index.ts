import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import * as OTPAuth from "https://esm.sh/otpauth@9";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function generateBackupCodes(count = 8): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    const array = new Uint8Array(4);
    crypto.getRandomValues(array);
    codes.push(
      Array.from(array)
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("")
    );
  }
  return codes;
}

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

    const adminClient = createClient(supabaseUrl, serviceKey);
    const body = await req.json().catch(() => ({}));

    if (req.method === "POST") {
      // Generate new TOTP secret
      const secret = new OTPAuth.Secret({ size: 20 });
      const totp = new OTPAuth.TOTP({
        issuer: "Swippee",
        label: user.email || user.id,
        algorithm: "SHA1",
        digits: 6,
        period: 30,
        secret,
      });

      // Store secret (upsert)
      await adminClient.from("user_2fa_secrets").upsert(
        {
          user_id: user.id,
          secret: secret.base32,
          is_enabled: false,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );

      return new Response(
        JSON.stringify({
          uri: totp.toString(),
          secret: secret.base32,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (req.method === "PUT") {
      const { token, action } = body;

      if (action === "disable") {
        // Verify token before disabling
        const { data: secretRow } = await adminClient
          .from("user_2fa_secrets")
          .select("secret")
          .eq("user_id", user.id)
          .single();

        if (!secretRow) {
          return new Response(JSON.stringify({ error: "2FA not set up" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const totp = new OTPAuth.TOTP({
          secret: OTPAuth.Secret.fromBase32(secretRow.secret),
          algorithm: "SHA1",
          digits: 6,
          period: 30,
        });

        const delta = totp.validate({ token, window: 1 });
        if (delta === null) {
          return new Response(JSON.stringify({ error: "Invalid code" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        await adminClient
          .from("user_2fa_secrets")
          .update({ is_enabled: false, updated_at: new Date().toISOString() })
          .eq("user_id", user.id);

        await adminClient
          .from("profiles")
          .update({ is_2fa_enabled: false })
          .eq("id", user.id);

        return new Response(JSON.stringify({ success: true, enabled: false }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Enable: verify token
      if (!token) {
        return new Response(JSON.stringify({ error: "Token required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: secretRow } = await adminClient
        .from("user_2fa_secrets")
        .select("secret")
        .eq("user_id", user.id)
        .single();

      if (!secretRow) {
        return new Response(JSON.stringify({ error: "No 2FA secret found. Generate one first." }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const totp = new OTPAuth.TOTP({
        secret: OTPAuth.Secret.fromBase32(secretRow.secret),
        algorithm: "SHA1",
        digits: 6,
        period: 30,
      });

      const delta = totp.validate({ token, window: 1 });
      if (delta === null) {
        return new Response(JSON.stringify({ error: "Invalid verification code" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const backupCodes = generateBackupCodes();

      await adminClient
        .from("user_2fa_secrets")
        .update({
          is_enabled: true,
          backup_codes: backupCodes,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);

      await adminClient
        .from("profiles")
        .update({ is_2fa_enabled: true })
        .eq("id", user.id);

      return new Response(
        JSON.stringify({ success: true, enabled: true, backup_codes: backupCodes }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
