import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface AvailabilityEntry {
  asset: string;
  side: string | null;
  is_active: boolean;
}

export function useTradeAvailability() {
  const { data: configs = [], isLoading } = useQuery({
    queryKey: ["trade-availability"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pricing_configs")
        .select("asset, side, is_active");
      if (error) throw error;
      return data as AvailabilityEntry[];
    },
    staleTime: 30_000,
  });

  const isAvailable = (asset: string, side: "buy" | "sell"): boolean => {
    // Find configs matching this asset+side
    const matching = configs.filter(
      (c) => c.asset === asset && (c.side === side || c.side === null)
    );
    if (matching.length === 0) return true; // No config = assume available
    return matching.some((c) => c.is_active);
  };

  return { isAvailable, isLoading, configs };
}
