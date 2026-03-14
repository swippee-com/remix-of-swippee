import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Shield, ArrowLeftRight, FileText, CreditCard, Plus } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { useMemo } from "react";
import { useRealtimeInvalidation } from "@/hooks/use-realtime";

export default function DashboardPage() {
  const { user } = useAuth();

  const tradeKeys = useMemo(() => [["dashboard-trades", user?.id || ""], ["dashboard-activity", user?.id || ""]], [user?.id]);
  const quoteKeys = useMemo(() => [["dashboard-activity", user?.id || ""]], [user?.id]);
  useRealtimeInvalidation("otc_trades", tradeKeys);
  useRealtimeInvalidation("quote_requests", quoteKeys);

  const { data: kycStatus } = useQuery({
    queryKey: ["dashboard-kyc", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("kyc_submissions")
        .select("status")
        .eq("user_id", user!.id)
        .maybeSingle();
      return data?.status || "not_submitted";
    },
    enabled: !!user,
  });

  const { data: tradeStats } = useQuery({
    queryKey: ["dashboard-trades", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("otc_trades")
        .select("status")
        .eq("user_id", user!.id);
      const all = data || [];
      return {
        active: all.filter((t) => !["completed", "cancelled", "failed"].includes(t.status)).length,
        completed: all.filter((t) => t.status === "completed").length,
      };
    },
    enabled: !!user,
  });

  const { data: pmCount } = useQuery({
    queryKey: ["dashboard-pm-count", user?.id],
    queryFn: async () => {
      const { count } = await supabase
        .from("payment_methods")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user!.id);
      return count || 0;
    },
    enabled: !!user,
  });

  const { data: recentActivity = [] } = useQuery({
    queryKey: ["dashboard-activity", user?.id],
    queryFn: async () => {
      const { data: quotes } = await supabase
        .from("quote_requests")
        .select("id, asset, amount_crypto, amount_fiat, status, created_at, side")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(5);
      const { data: trades } = await supabase
        .from("otc_trades")
        .select("id, asset, gross_amount, status, created_at, side")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(5);
      const items = [
        ...(quotes || []).map((q) => ({
          id: q.id,
          type: "Quote Request",
          asset: q.asset,
          amount: q.amount_crypto ? String(q.amount_crypto) : String(q.amount_fiat),
          status: q.status,
          date: q.created_at,
        })),
        ...(trades || []).map((t) => ({
          id: t.id,
          type: "Trade",
          asset: t.asset,
          amount: String(t.gross_amount),
          status: t.status,
          date: t.created_at,
        })),
      ];
      items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      return items.slice(0, 5);
    },
    enabled: !!user,
  });

  const kycLabel = kycStatus === "approved" ? "Approved" : kycStatus === "pending_review" ? "Pending" : kycStatus === "not_submitted" ? "Not Started" : kycStatus?.replace(/_/g, " ") || "—";

  return (
    <DashboardLayout>
      <PageHeader title="Dashboard" description="Welcome back! Here's your account overview.">
        <Button asChild><Link to="/dashboard/quotes/new"><Plus className="mr-1 h-4 w-4" /> New Quote</Link></Button>
      </PageHeader>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="KYC Status" value={kycLabel} icon={Shield} description={kycStatus === "approved" ? "Identity verified" : undefined} />
        <StatCard title="Active Trades" value={String(tradeStats?.active ?? 0)} icon={ArrowLeftRight} description="In progress" />
        <StatCard title="Completed Trades" value={String(tradeStats?.completed ?? 0)} icon={FileText} />
        <StatCard title="Payment Methods" value={String(pmCount ?? 0)} icon={CreditCard} />
      </div>

      <div className="mt-8">
        <h2 className="text-lg font-semibold">Recent Activity</h2>
        <div className="mt-4 rounded-lg border bg-card shadow-card">
          {recentActivity.length === 0 ? (
            <p className="px-6 py-8 text-center text-sm text-muted-foreground">No recent activity yet.</p>
          ) : (
            <div className="divide-y">
              {recentActivity.map((item) => (
                <div key={item.id} className="flex items-center justify-between px-6 py-4">
                  <div>
                    <p className="text-sm font-medium">{item.type} — {item.amount} {item.asset}</p>
                    <p className="text-xs text-muted-foreground">{format(new Date(item.date), "PPp")}</p>
                  </div>
                  <StatusBadge status={item.status} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
