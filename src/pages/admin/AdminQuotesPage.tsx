import { AdminLayout } from "@/components/layout/AdminLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Eye } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { useState } from "react";

export default function AdminQuotesPage() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [sideFilter, setSideFilter] = useState("all");
  const [search, setSearch] = useState("");

  const { data: quoteRequests = [], isLoading } = useQuery({
    queryKey: ["admin-quote-requests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("quote_requests")
        .select("*, profiles!quote_requests_user_id_fkey(full_name, email)")
        .order("created_at", { ascending: false });
      if (error) {
        // Fallback without join if FK name doesn't match
        const { data: fallback, error: e2 } = await supabase
          .from("quote_requests")
          .select("*")
          .order("created_at", { ascending: false });
        if (e2) throw e2;
        return fallback;
      }
      return data;
    },
  });

  const filtered = quoteRequests.filter((q: any) => {
    if (statusFilter !== "all" && q.status !== statusFilter) return false;
    if (sideFilter !== "all" && q.side !== sideFilter) return false;
    if (search) {
      const s = search.toLowerCase();
      const name = q.profiles?.full_name?.toLowerCase() || "";
      const email = q.profiles?.email?.toLowerCase() || "";
      if (!name.includes(s) && !email.includes(s) && !q.asset.toLowerCase().includes(s)) return false;
    }
    return true;
  });

  return (
    <AdminLayout>
      <PageHeader title="Quote Requests" description="Review and send quotes to users." />
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search by user or asset..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="submitted">Submitted</SelectItem>
            <SelectItem value="under_review">Under Review</SelectItem>
            <SelectItem value="quoted">Quoted</SelectItem>
            <SelectItem value="accepted">Accepted</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sideFilter} onValueChange={setSideFilter}>
          <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sides</SelectItem>
            <SelectItem value="buy">Buy</SelectItem>
            <SelectItem value="sell">Sell</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : (
        <div className="mt-4 rounded-lg border bg-card shadow-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b bg-muted/50">
              <th className="px-6 py-3 text-left font-medium text-muted-foreground">User</th>
              <th className="px-6 py-3 text-left font-medium text-muted-foreground">Side</th>
              <th className="px-6 py-3 text-left font-medium text-muted-foreground">Asset</th>
              <th className="px-6 py-3 text-left font-medium text-muted-foreground">Amount</th>
              <th className="px-6 py-3 text-left font-medium text-muted-foreground">Status</th>
              <th className="px-6 py-3 text-left font-medium text-muted-foreground">Date</th>
              <th className="px-6 py-3 text-left font-medium text-muted-foreground">Actions</th>
            </tr></thead>
            <tbody className="divide-y">
              {filtered.map((q: any) => (
                <tr key={q.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-6 py-4">{q.profiles?.full_name || "—"}</td>
                  <td className="px-6 py-4 capitalize">{q.side}</td>
                  <td className="px-6 py-4">{q.asset}</td>
                  <td className="px-6 py-4">
                    {q.amount_crypto ? `${q.amount_crypto} ${q.asset}` : `${q.fiat_currency} ${Number(q.amount_fiat).toLocaleString()}`}
                  </td>
                  <td className="px-6 py-4"><StatusBadge status={q.status} /></td>
                  <td className="px-6 py-4 text-muted-foreground">{format(new Date(q.created_at), "PP")}</td>
                  <td className="px-6 py-4">
                    <Button variant="ghost" size="sm" asChild>
                      <Link to={`/admin/quotes/${q.id}`}><Eye className="h-3 w-3 mr-1" /> View</Link>
                    </Button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="px-6 py-12 text-center text-muted-foreground">No quote requests found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </AdminLayout>
  );
}
