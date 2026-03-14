import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const TRACKER_KEY = "swippee_login_tracked";

export function useLoginTracker() {
  const { session } = useAuth();

  useEffect(() => {
    if (!session?.access_token) return;

    // Use sessionStorage so it persists across remounts but clears on new browser session
    const trackedToken = sessionStorage.getItem(TRACKER_KEY);
    if (trackedToken === session.access_token) return;

    sessionStorage.setItem(TRACKER_KEY, session.access_token);

    supabase.functions.invoke("track-login", {
      body: {
        login_method: "password",
        session_id: session.access_token.slice(-12),
      },
    });
  }, [session?.access_token]);
}
