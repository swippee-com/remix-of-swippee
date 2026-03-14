import { AdminLayout } from "@/components/layout/AdminLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Eye } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { useState } from "react";
import { Link } from "react-router-dom";

export default function AdminTradesPage() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");

  const { data: trades = [], isLoading } = useQuery({
    queryKey: ["admin-trades"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("otc_trades")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      // Fetch profiles
      const userIds = [...new Set(data.map((t) => t.user_id))];
      if (userIds.length === 0) return data.map((t) => ({ ...t, profile: null }));
      const { data: profiles } = await supabase.from("profiles").select("id, full_name, email").in("id", userIds);
      const map = Object.fromEntries((profiles || []).map((p) => [p.id, p]));
      return data.map((t) => ({ ...t, profile: map[t.user_id] || null }));
    },
  });

  const filtered = trades.filter((t: any) => {
    if (statusFilter !== "all" && t.status !== statusFilter) return false;
    if (search) {
      const s = search.toLowerCase();
      const name = t.profile?.full_name?.toLowerCase() || "";
      if (!name.includes(s) && !t.asset.toLowerCase().includes(s)) return false;
    }
    return true;
  });

  return (
    <AdminLayout>
      <PageHeader title="Trades" description="Manage and settle OTC trades." />
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search trades..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="awaiting_fiat_payment">Awaiting Payment</SelectItem>
            <SelectItem value="payment_proof_uploaded">Proof Uploaded</SelectItem>
            <SelectItem value="fiat_received">Fiat Received</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="disputed">Disputed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>
      ) : (
        <div className="mt-4 rounded-lg border bg-card shadow-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b bg-muted/50">
              <th className="px-6 py-3 text-left font-medium text-muted-foreground">User</th>
              <th className="px-6 py-3 text-left font-medium text-muted-foreground">Side</th>
              <th className="px-6 py-3 text-left font-medium text-muted-foreground">Asset</th>
              <th className="px-6 py-3 text-left font-medium text-muted-foreground">Amount</th>
              <th className="px-6 py-3 text-left font-medium text-muted-foreground">Rate</th>
              <th className="px-6 py-3 text-left font-medium text-muted-foreground">Status</th>
              <th className="px-6 py-3 text-left font-medium text-muted-foreground">Date</th>
              <th className="px-6 py-3 text-left font-medium text-muted-foreground">Actions</th>
            </tr></thead>
            <tbody className="divide-y">
              {filtered.map((t: any) => (
                <tr key={t.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-6 py-4">{t.profile?.full_name || "—"}</td>
                  <td className="px-6 py-4 capitalize">{t.side}</td>
                  <td className="px-6 py-4">{t.asset}</td>
                  <td className="px-6 py-4">{t.gross_amount} {t.asset}</td>
                  <td className="px-6 py-4">{Number(t.quoted_rate).toLocaleString()}</td>
                  <td className="px-6 py-4"><StatusBadge status={t.status} /></td>
                  <td className="px-6 py-4 text-muted-foreground">{format(new Date(t.created_at), "PP")}</td>
                  <td className="px-6 py-4">
                    <Button variant="ghost" size="sm" asChild>
                      <Link to={`/admin/trades/${t.id}`}><Eye className="h-3 w-3" /></Link>
                    </Button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={8} className="px-6 py-12 text-center text-muted-foreground">No trades found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </AdminLayout>
  );
}
