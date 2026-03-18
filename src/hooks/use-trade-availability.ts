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
      // Fetch ALL configs (admins see all, users only see active via RLS)
      // We'll filter by is_active in JS to handle both cases
      const { data, error } = await supabase
        .from("pricing_configs")
        .select("asset, side, network, is_active");
      if (error) throw error;
      return data as AvailabilityEntry[];
    },
    staleTime: 30_000,
  });

  // Check if any active config exists for this asset+side
  const isAvailable = (asset: string, side: "buy" | "sell"): boolean => {
    const matching = configs.filter(
      (c) => c.asset === asset && (c.side === side || c.side === null)
    );
    if (matching.length === 0) return true; // No configs at all = assume available
    return matching.some((c) => c.is_active);
  };

  // Check if a specific network is available
  const isNetworkAvailable = (asset: string, side: "buy" | "sell", network: string): boolean => {
    const matching = configs.filter(
      (c) => c.asset === asset && (c.side === side || c.side === null) && (c.network === network || c.network === null)
    );
    if (matching.length === 0) return true; // No configs = assume available
    return matching.some((c) => c.is_active);
  };

  return { isAvailable, isNetworkAvailable, isLoading, configs };
}
