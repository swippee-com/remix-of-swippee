import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Subscribe to postgres_changes on a table and invalidate query keys on any change.
 */
export function useRealtimeInvalidation(
  table: string,
  queryKeys: string[][],
  filter?: string
) {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channelName = `realtime-${table}-${filter || "all"}`;
    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table, filter },
        () => {
          queryKeys.forEach((key) =>
            queryClient.invalidateQueries({ queryKey: key })
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [table, filter, queryClient, queryKeys]);
}
