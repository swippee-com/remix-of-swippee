import { AdminLayout } from "@/components/layout/AdminLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { useState } from "react";

export default function AdminLedgerPage() {
  const [bucketFilter, setBucketFilter] = useState("all");
  const [search, setSearch] = useState("");

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ["admin-ledger"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ledger_entries")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data;
    },
  });

  const filtered = entries.filter((e: any) => {
    if (bucketFilter !== "all" && e.account_bucket !== bucketFilter) return false;
    if (search) {
      const s = search.toLowerCase();
      if (
        !(e.description || "").toLowerCase().includes(s) &&
        !(e.entry_type || "").toLowerCase().includes(s) &&
        !(e.asset || "").toLowerCase().includes(s) &&
        !(e.currency || "").toLowerCase().includes(s)
      ) return false;
    }
    return true;
  });

  return (
    <AdminLayout>
      <PageHeader title="Ledger" description="Internal accounting ledger for all financial events." />
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search ledger..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={bucketFilter} onValueChange={setBucketFilter}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Buckets</SelectItem>
            <SelectItem value="client_receivable">Client Receivable</SelectItem>
            <SelectItem value="client_payable">Client Payable</SelectItem>
            <SelectItem value="fees_revenue">Fees Revenue</SelectItem>
            <SelectItem value="settlement_pending">Settlement Pending</SelectItem>
            <SelectItem value="otc_inventory">OTC Inventory</SelectItem>
            <SelectItem value="fiat_clearing">Fiat Clearing</SelectItem>
            <SelectItem value="crypto_clearing">Crypto Clearing</SelectItem>
            <SelectItem value="manual_adjustment">Manual Adjustment</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>
      ) : (
        <div className="mt-4 rounded-lg border bg-card shadow-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b bg-muted/50">
              <th className="px-6 py-3 text-left font-medium text-muted-foreground">Type</th>
              <th className="px-6 py-3 text-left font-medium text-muted-foreground">Asset/Currency</th>
              <th className="px-6 py-3 text-left font-medium text-muted-foreground">Amount</th>
              <th className="px-6 py-3 text-left font-medium text-muted-foreground">Direction</th>
              <th className="px-6 py-3 text-left font-medium text-muted-foreground">Bucket</th>
              <th className="px-6 py-3 text-left font-medium text-muted-foreground">Description</th>
              <th className="px-6 py-3 text-left font-medium text-muted-foreground">Date</th>
            </tr></thead>
            <tbody className="divide-y">
              {filtered.map((e: any) => (
                <tr key={e.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-6 py-4 font-mono text-xs">{e.entry_type}</td>
                  <td className="px-6 py-4">{e.asset || e.currency || "—"}</td>
                  <td className="px-6 py-4">{Number(e.amount).toLocaleString()}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${e.direction === "credit" ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}`}>
                      {e.direction}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs capitalize">{e.account_bucket.replace(/_/g, " ")}</td>
                  <td className="px-6 py-4 text-muted-foreground max-w-[200px] truncate">{e.description || "—"}</td>
                  <td className="px-6 py-4 text-muted-foreground whitespace-nowrap">{format(new Date(e.created_at), "PP")}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="px-6 py-12 text-center text-muted-foreground">No ledger entries found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </AdminLayout>
  );
}
