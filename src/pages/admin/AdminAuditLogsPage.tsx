import { AdminLayout } from "@/components/layout/AdminLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { useState } from "react";

export default function AdminAuditLogsPage() {
  const [actionFilter, setActionFilter] = useState("all");
  const [search, setSearch] = useState("");

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ["admin-audit-logs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("audit_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;

      // Fetch actor names
      const actorIds = [...new Set((data || []).map((l) => l.actor_user_id).filter(Boolean))];
      let profileMap: Record<string, string> = {};
      if (actorIds.length > 0) {
        const { data: profiles } = await supabase.from("profiles").select("id, full_name").in("id", actorIds as string[]);
        profileMap = Object.fromEntries((profiles || []).map((p) => [p.id, p.full_name || "Unknown"]));
      }
      return (data || []).map((l) => ({
        ...l,
        actorName: l.actor_user_id ? profileMap[l.actor_user_id] || "Admin" : "System",
      }));
    },
  });

  const filtered = logs.filter((log: any) => {
    if (actionFilter !== "all") {
      const prefix = actionFilter.toLowerCase();
      if (!log.action.toLowerCase().includes(prefix) && !log.target_type.toLowerCase().includes(prefix)) return false;
    }
    if (search) {
      const s = search.toLowerCase();
      if (
        !log.action.toLowerCase().includes(s) &&
        !log.target_type.toLowerCase().includes(s) &&
        !log.actorName.toLowerCase().includes(s)
      ) return false;
    }
    return true;
  });

  return (
    <AdminLayout>
      <PageHeader title="Audit Logs" description="Complete log of all admin actions and system events." />
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search logs..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={actionFilter} onValueChange={setActionFilter}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Actions</SelectItem>
            <SelectItem value="kyc">KYC</SelectItem>
            <SelectItem value="quote">Quotes</SelectItem>
            <SelectItem value="trade">Trades</SelectItem>
            <SelectItem value="role">Roles</SelectItem>
            <SelectItem value="ledger">Ledger</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>
      ) : (
        <div className="mt-4 rounded-lg border bg-card shadow-card divide-y">
          {filtered.length === 0 ? (
            <p className="px-6 py-12 text-center text-sm text-muted-foreground">No audit logs found.</p>
          ) : (
            filtered.map((log: any) => (
              <div key={log.id} className="flex items-start justify-between px-6 py-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs rounded bg-muted px-1.5 py-0.5">{log.action}</span>
                    <span className="text-sm text-muted-foreground">on {log.target_type}</span>
                  </div>
                  <p className="mt-1 text-sm">
                    <span className="font-medium">{log.actorName}</span>
                    {log.target_id && <span className="text-muted-foreground"> → {log.target_id.slice(0, 8)}…</span>}
                  </p>
                  {log.metadata && Object.keys(log.metadata).length > 0 && (
                    <p className="mt-0.5 text-xs text-muted-foreground font-mono">
                      {JSON.stringify(log.metadata).slice(0, 80)}
                    </p>
                  )}
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">{format(new Date(log.created_at), "PPp")}</span>
              </div>
            ))
          )}
        </div>
      )}
    </AdminLayout>
  );
}
