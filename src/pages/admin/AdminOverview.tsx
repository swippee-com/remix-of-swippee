import { AdminLayout } from "@/components/layout/AdminLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { ClipboardCheck, ShoppingCart, AlertTriangle, DollarSign, Activity } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

export default function AdminOverview() {
  const { data: stats } = useQuery({
    queryKey: ["admin-overview-stats"],
    queryFn: async () => {
      const [kyc, orders, ledger] = await Promise.all([
        supabase.from("kyc_submissions").select("status"),
        supabase.from("orders").select("status, total_pay_npr, created_at"),
        supabase.from("ledger_entries").select("amount, account_bucket, direction, created_at"),
      ]);

      const pendingKyc = (kyc.data || []).filter((k) => k.status === "pending_review").length;
      const allOrders = orders.data || [];
      const activeOrders = allOrders.filter((o) => !["completed", "cancelled", "expired", "rejected"].includes(o.status)).length;
      const disputed = 0; // orders don't have a disputed status

      // Today's volume
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayOrders = allOrders.filter((o) => new Date(o.created_at) >= today);
      const todayVolume = todayOrders.reduce((sum, o) => sum + Number(o.total_pay_npr), 0);

      // Monthly fees from ledger
      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);
      const monthlyFees = (ledger.data || [])
        .filter((e) => e.account_bucket === "fees_revenue" && new Date(e.created_at) >= monthStart)
        .reduce((sum, e) => sum + Number(e.amount), 0);

      return { pendingKyc, activeOrders, disputed, todayVolume, monthlyFees };
    },
  });

  const { data: recentLogs = [] } = useQuery({
    queryKey: ["admin-overview-activity"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("audit_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(8);
      if (error) throw error;
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

  return (
    <AdminLayout>
      <PageHeader title="Admin Dashboard" description="Overview of desk operations." />
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <StatCard title="Pending KYC" value={String(stats?.pendingKyc ?? "—")} icon={ClipboardCheck} />
        <StatCard title="Active Orders" value={String(stats?.activeOrders ?? "—")} icon={ShoppingCart} />
        <StatCard title="Disputed" value={String(stats?.disputed ?? "—")} icon={AlertTriangle} />
        <StatCard title="Today's Volume" value={stats ? `₨ ${Math.round(stats.todayVolume).toLocaleString()}` : "—"} icon={DollarSign} />
        <StatCard title="Monthly Fees" value={stats ? `₨ ${Math.round(stats.monthlyFees).toLocaleString()}` : "—"} icon={Activity} />
      </div>
      <div className="mt-8">
        <h2 className="text-lg font-semibold">Recent Activity</h2>
        <div className="mt-4 rounded-lg border bg-card shadow-card divide-y">
          {recentLogs.length === 0 ? (
            <p className="px-6 py-8 text-center text-sm text-muted-foreground">No recent activity.</p>
          ) : (
            recentLogs.map((a: any) => (
              <div key={a.id} className="flex items-center justify-between px-6 py-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs rounded bg-muted px-1.5 py-0.5">{a.action}</span>
                    <span className="text-xs text-muted-foreground">{a.target_type}</span>
                  </div>
                  <p className="mt-0.5 text-sm text-muted-foreground">{a.actorName}</p>
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">{format(new Date(a.created_at), "PPp")}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
