import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { Monitor, Smartphone, Globe } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

function parseDevice(ua: string): { label: string; isMobile: boolean } {
  const mobile = /mobile|android|iphone|ipad/i.test(ua);
  const browser = ua.match(/(Chrome|Firefox|Safari|Edge|Opera)/i)?.[1] || "Browser";
  const os = ua.match(/(Windows|Mac|Linux|Android|iOS|iPhone)/i)?.[1] || "";
  return { label: `${browser}${os ? ` on ${os}` : ""}`, isMobile: mobile };
}

export function LoginHistory() {
  const { user } = useAuth();

  const { data: events, isLoading } = useQuery({
    queryKey: ["login-events", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("login_events" as any)
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data as any[];
    },
    enabled: !!user,
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (!events?.length) {
    return <p className="text-sm text-muted-foreground">No login history yet.</p>;
  }

  return (
    <div className="space-y-2">
      {events.map((event: any) => {
        const device = parseDevice(event.user_agent || "");
        return (
          <div
            key={event.id}
            className="flex items-center gap-3 rounded-lg border px-4 py-3 text-sm"
          >
            {device.isMobile ? (
              <Smartphone className="h-4 w-4 shrink-0 text-muted-foreground" />
            ) : (
              <Monitor className="h-4 w-4 shrink-0 text-muted-foreground" />
            )}
            <div className="min-w-0 flex-1">
              <p className="font-medium truncate">{device.label}</p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Globe className="h-3 w-3" />
                <span>{event.ip_address || "Unknown IP"}</span>
                {event.city && <span>· {event.city}{event.country ? `, ${event.country}` : ""}</span>}
              </div>
            </div>
            <div className="shrink-0 text-right text-xs text-muted-foreground">
              {format(new Date(event.created_at), "MMM d, h:mm a")}
            </div>
          </div>
        );
      })}
    </div>
  );
}
