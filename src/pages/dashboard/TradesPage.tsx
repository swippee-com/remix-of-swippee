import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";
import { ArrowLeftRight, Eye } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import { useMemo } from "react";
import { useRealtimeInvalidation } from "@/hooks/use-realtime";

export default function TradesPage() {
  const { user } = useAuth();
  const keys = useMemo(() => [["user-trades"]], []);
  useRealtimeInvalidation("otc_trades", keys);

  const { data: trades = [], isLoading } = useQuery({
    queryKey: ["user-trades"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("otc_trades")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  return (
    <DashboardLayout>
      <PageHeader title="Trades" description="Track all your trade settlements." />

      {isLoading ? (
        <div className="flex justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>
      ) : trades.length === 0 ? (
        <EmptyState
          icon={<ArrowLeftRight className="mx-auto h-10 w-10" />}
          title="No trades yet"
          description="Your trades will appear here after you accept a quote."
          className="mt-6"
        />
      ) : (
        <div className="mt-6 rounded-lg border bg-card shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b bg-muted/50">
                <th className="px-6 py-3 text-left font-medium text-muted-foreground">Side</th>
                <th className="px-6 py-3 text-left font-medium text-muted-foreground">Asset</th>
                <th className="px-6 py-3 text-left font-medium text-muted-foreground">Amount</th>
                <th className="px-6 py-3 text-left font-medium text-muted-foreground">Rate</th>
                <th className="px-6 py-3 text-left font-medium text-muted-foreground">Status</th>
                <th className="px-6 py-3 text-left font-medium text-muted-foreground">Date</th>
                <th className="px-6 py-3 text-left font-medium text-muted-foreground">Action</th>
              </tr></thead>
              <tbody className="divide-y">
                {trades.map((t) => (
                  <tr key={t.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4 capitalize">{t.side}</td>
                    <td className="px-6 py-4">{t.asset}</td>
                    <td className="px-6 py-4">{t.gross_amount} {t.asset}</td>
                    <td className="px-6 py-4">{Number(t.quoted_rate).toLocaleString()} {t.fiat_currency}</td>
                    <td className="px-6 py-4"><StatusBadge status={t.status} /></td>
                    <td className="px-6 py-4 text-muted-foreground">{format(new Date(t.created_at), "PP")}</td>
                    <td className="px-6 py-4">
                      <Button variant="ghost" size="sm" asChild>
                        <Link to={`/dashboard/trades/${t.id}`}><Eye className="h-3 w-3 mr-1" /> View</Link>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
