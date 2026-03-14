import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Plus, FileText } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";

export default function QuotesPage() {
  const { user } = useAuth();

  const { data: quotes = [], isLoading } = useQuery({
    queryKey: ["user-quote-requests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("quote_requests")
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
      <PageHeader title="Quote Requests" description="Request quotes and manage your trading requests.">
        <Button asChild><Link to="/dashboard/quotes/new"><Plus className="mr-1 h-4 w-4" /> New Quote Request</Link></Button>
      </PageHeader>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : quotes.length === 0 ? (
        <EmptyState
          icon={<FileText className="mx-auto h-10 w-10" />}
          title="No quote requests yet"
          description="Request your first quote to start trading."
          action={<Button asChild><Link to="/dashboard/quotes/new">Request a Quote</Link></Button>}
          className="mt-6"
        />
      ) : (
        <div className="mt-6 rounded-lg border bg-card shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-6 py-3 text-left font-medium text-muted-foreground">Side</th>
                  <th className="px-6 py-3 text-left font-medium text-muted-foreground">Asset</th>
                  <th className="px-6 py-3 text-left font-medium text-muted-foreground">Amount</th>
                  <th className="px-6 py-3 text-left font-medium text-muted-foreground">Status</th>
                  <th className="px-6 py-3 text-left font-medium text-muted-foreground">Date</th>
                  <th className="px-6 py-3 text-left font-medium text-muted-foreground">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {quotes.map((q) => (
                  <tr key={q.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4 capitalize">{q.side}</td>
                    <td className="px-6 py-4">{q.asset}</td>
                    <td className="px-6 py-4">
                      {q.amount_crypto ? `${q.amount_crypto} ${q.asset}` : `${q.fiat_currency} ${Number(q.amount_fiat).toLocaleString()}`}
                    </td>
                    <td className="px-6 py-4"><StatusBadge status={q.status} /></td>
                    <td className="px-6 py-4 text-muted-foreground">{format(new Date(q.created_at), "PP")}</td>
                    <td className="px-6 py-4">
                      <Button variant="ghost" size="sm" asChild>
                        <Link to={`/dashboard/quotes/${q.id}`}>View</Link>
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
