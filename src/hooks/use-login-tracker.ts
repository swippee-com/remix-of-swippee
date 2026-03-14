import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useLoginTracker() {
  const { session } = useAuth();
  const tracked = useRef<string | null>(null);

  useEffect(() => {
    if (!session?.access_token || tracked.current === session.access_token) return;
    tracked.current = session.access_token;

    supabase.functions.invoke("track-login", {
      body: {
        login_method: "password",
        session_id: session.access_token.slice(-12), // short identifier
      },
    });
  }, [session?.access_token]);
}
