import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface AvailabilityEntry {
  asset: string;
  side: string | null;
  network: string | null;
  is_active: boolean;
}

export function useTradeAvailability() {
  const { data: configs = [], isLoading } = useQuery({
    queryKey: ["trade-availability"],
    queryFn: async () => {
      // RLS only returns rows where is_active = true for authenticated users.
      // So if a config is paused, it won't appear here at all.
      const { data, error } = await supabase
        .from("pricing_configs")
        .select("asset, side, network, is_active");
      if (error) throw error;
      return data as AvailabilityEntry[];
    },
    staleTime: 30_000,
  });

  // A side is available if there's at least one active config for that asset+side.
  // Since RLS filters out inactive rows, presence = active.
  const isAvailable = (asset: string, side: "buy" | "sell"): boolean => {
    const matching = configs.filter(
      (c) => c.asset === asset && (c.side === side || c.side === null)
    );
    // If no configs returned for this asset+side, trading is disabled
    return matching.length > 0;
  };

  // Check if a specific network is available
  const isNetworkAvailable = (asset: string, side: "buy" | "sell", network: string): boolean => {
    const matching = configs.filter(
      (c) => c.asset === asset && (c.side === side || c.side === null) && (c.network === network || c.network === null)
    );
    return matching.length > 0;
  };

  return { isAvailable, isNetworkAvailable, isLoading, configs };
}
