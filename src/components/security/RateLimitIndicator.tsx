import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Progress } from "@/components/ui/progress";
import { AlertTriangle, Activity } from "lucide-react";

const DEFAULT_DAILY_LIMIT = 10;

export function RateLimitIndicator() {
  const { user } = useAuth();

  const { data } = useQuery({
    queryKey: ["rate-limit", user?.id],
    queryFn: async () => {
      // Get daily limit from settings
      const { data: settings } = await supabase
        .from("app_settings")
        .select("value")
        .eq("key", "daily_quote_limit")
        .maybeSingle();

      const limit = settings?.value
        ? typeof settings.value === "number"
          ? settings.value
          : Number(settings.value) || DEFAULT_DAILY_LIMIT
        : DEFAULT_DAILY_LIMIT;

      // Count today's quote requests
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { count } = await supabase
        .from("quote_requests")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user!.id)
        .gte("created_at", today.toISOString());

      return { used: count || 0, limit };
    },
    enabled: !!user,
    refetchInterval: 60_000,
  });

  if (!data) return null;

  const percentage = Math.min((data.used / data.limit) * 100, 100);
  const isNearLimit = percentage >= 80;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          {isNearLimit ? (
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          ) : (
            <Activity className="h-4 w-4 text-muted-foreground" />
          )}
          <span className="font-medium">Quote Requests Today</span>
        </div>
        <span className={isNearLimit ? "font-semibold text-amber-600" : "text-muted-foreground"}>
          {data.used} / {data.limit}
        </span>
      </div>
      <Progress value={percentage} className="h-2" />
      {isNearLimit && (
        <p className="text-xs text-amber-600">
          You're approaching your daily limit. Contact support if you need more.
        </p>
      )}
    </div>
  );
}
