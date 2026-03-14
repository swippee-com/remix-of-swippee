import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { X, Info, AlertTriangle, Wrench } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

const typeConfig = {
  info: { icon: Info, className: "border-primary/30 bg-primary/5 text-primary" },
  warning: { icon: AlertTriangle, className: "border-warning/30 bg-warning/5 text-warning" },
  maintenance: { icon: Wrench, className: "border-destructive/30 bg-destructive/5 text-destructive" },
} as const;

export function AnnouncementBanner() {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("dismissed_announcements") || "[]");
      setDismissed(new Set(stored));
    } catch {}
  }, []);

  const { data: announcements = [] } = useQuery({
    queryKey: ["active-announcements"],
    queryFn: async () => {
      const now = new Date().toISOString();
      const { data } = await supabase
        .from("announcements")
        .select("*")
        .eq("is_active", true)
        .lte("starts_at", now)
        .order("created_at", { ascending: false });
      // Filter ends_at client-side (nullable)
      return (data || []).filter((a: any) => !a.ends_at || a.ends_at > now);
    },
    refetchInterval: 60_000,
  });

  const visible = announcements.filter((a: any) => !dismissed.has(a.id));
  if (visible.length === 0) return null;

  const dismiss = (id: string) => {
    const next = new Set(dismissed);
    next.add(id);
    setDismissed(next);
    localStorage.setItem("dismissed_announcements", JSON.stringify([...next]));
  };

  return (
    <div className="space-y-2 mb-4">
      {visible.map((a: any) => {
        const config = typeConfig[a.type as keyof typeof typeConfig] || typeConfig.info;
        const Icon = config.icon;
        return (
          <div
            key={a.id}
            className={cn("flex items-start gap-3 rounded-lg border px-4 py-3 text-sm", config.className)}
          >
            <Icon className="mt-0.5 h-4 w-4 shrink-0" />
            <div className="flex-1">
              <span className="font-semibold">{a.title}</span>
              {a.message && <span className="ml-1">{a.message}</span>}
            </div>
            <button onClick={() => dismiss(a.id)} className="shrink-0 rounded p-0.5 hover:opacity-70">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
