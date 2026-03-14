import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { Monitor, Smartphone, Shield, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";

function parseDevice(ua: string): { label: string; isMobile: boolean } {
  const mobile = /mobile|android|iphone|ipad/i.test(ua);
  const browser = ua.match(/(Chrome|Firefox|Safari|Edge|Opera)/i)?.[1] || "Browser";
  const os = ua.match(/(Windows|Mac|Linux|Android|iOS|iPhone)/i)?.[1] || "";
  return { label: `${browser}${os ? ` on ${os}` : ""}`, isMobile: mobile };
}

export function ActiveSessions() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: sessions, isLoading } = useQuery({
    queryKey: ["user-sessions", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_sessions" as any)
        .select("*")
        .eq("user_id", user!.id)
        .is("revoked_at", null)
        .order("last_active_at", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
    enabled: !!user,
  });

  const revokeMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      const { data, error } = await supabase.functions.invoke("revoke-session", {
        body: { session_id: sessionId },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-sessions"] });
      toast({ title: "Session revoked" });
    },
    onError: (err: any) =>
      toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2].map((i) => (
          <Skeleton key={i} className="h-14 w-full" />
        ))}
      </div>
    );
  }

  if (!sessions?.length) {
    return <p className="text-sm text-muted-foreground">No active sessions.</p>;
  }

  return (
    <div className="space-y-2">
      {sessions.map((s: any) => {
        const device = parseDevice(s.user_agent || "");
        return (
          <div
            key={s.id}
            className="flex items-center gap-3 rounded-lg border px-4 py-3 text-sm"
          >
            {device.isMobile ? (
              <Smartphone className="h-4 w-4 shrink-0 text-muted-foreground" />
            ) : (
              <Monitor className="h-4 w-4 shrink-0 text-muted-foreground" />
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="font-medium truncate">{device.label}</p>
                {s.is_current && (
                  <Badge variant="secondary" className="text-xs">
                    <Shield className="mr-1 h-3 w-3" />
                    Current
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {s.ip_address || "Unknown IP"} ·{" "}
                {format(new Date(s.last_active_at), "MMM d, h:mm a")}
              </p>
            </div>
            {!s.is_current && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => revokeMutation.mutate(s.id)}
                disabled={revokeMutation.isPending}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        );
      })}
    </div>
  );
}
