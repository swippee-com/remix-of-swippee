import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCallback, useEffect, useRef } from "react";

type AdPlacement = "dashboard_banner" | "sidebar" | "landing_sponsor" | "live_prices" | "public_footer";

export interface Ad {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  link_url: string;
  link_text: string;
  placement: AdPlacement;
  priority: number;
}

export function useAds(placement: AdPlacement) {
  const { data: ads = [], isLoading } = useQuery({
    queryKey: ["ads", placement],
    queryFn: async () => {
      const now = new Date().toISOString();
      const { data } = await supabase
        .from("ads")
        .select("id, title, description, image_url, link_url, link_text, placement, priority")
        .eq("placement", placement)
        .eq("is_active", true)
        .lte("starts_at", now)
        .order("priority", { ascending: false });
      // Filter ends_at client-side (nullable)
      return ((data as any[]) || []).filter((a) => !a.ends_at || a.ends_at > now) as Ad[];
    },
    refetchInterval: 120_000,
    staleTime: 60_000,
  });

  return { ads, isLoading };
}

export function useAdTracking() {
  const tracked = useRef<Set<string>>(new Set());

  const trackImpression = useCallback(async (adId: string) => {
    if (tracked.current.has(adId)) return;
    tracked.current.add(adId);
    await supabase.from("ad_events").insert({ ad_id: adId, event_type: "impression" } as any);
  }, []);

  const trackClick = useCallback(async (adId: string) => {
    await supabase.from("ad_events").insert({ ad_id: adId, event_type: "click" } as any);
  }, []);

  return { trackImpression, trackClick };
}
