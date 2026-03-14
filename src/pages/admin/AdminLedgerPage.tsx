import { AdminLayout } from "@/components/layout/AdminLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";

const entries = [
  { id: "L-001", trade: "TR-010", asset: "USDT", amount: "500", direction: "credit", bucket: "client_receivable", description: "Quote accepted", date: "Mar 12, 2026" },
  { id: "L-002", trade: "TR-010", asset: "NPR", amount: "66,250", direction: "debit", bucket: "fiat_clearing", description: "Fiat clearing entry", date: "Mar 12, 2026" },
  { id: "L-003", trade: "TR-011", asset: "BTC", amount: "0.1", direction: "debit", bucket: "otc_inventory", description: "Inventory allocation", date: "Mar 11, 2026" },
  { id: "L-004", trade: "TR-012", asset: "NPR", amount: "8,400", direction: "credit", bucket: "fees_revenue", description: "Trading fee", date: "Mar 10, 2026" },
];

export default function AdminLedgerPage() {
  return (
    <AdminLayout>
      <PageHeader title="Ledger" description="Internal accounting ledger for all financial events." />
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search ledger..." />
        </div>
        <Select defaultValue="all">
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Buckets</SelectItem>
            <SelectItem value="client_receivable">Client Receivable</SelectItem>
            <SelectItem value="client_payable">Client Payable</SelectItem>
            <SelectItem value="fees_revenue">Fees Revenue</SelectItem>
            <SelectItem value="otc_inventory">OTC Inventory</SelectItem>
            <SelectItem value="fiat_clearing">Fiat Clearing</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="mt-4 rounded-lg border bg-card shadow-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="border-b bg-muted/50">
            <th className="px-6 py-3 text-left font-medium text-muted-foreground">ID</th>
            <th className="px-6 py-3 text-left font-medium text-muted-foreground">Trade</th>
            <th className="px-6 py-3 text-left font-medium text-muted-foreground">Asset</th>
            <th className="px-6 py-3 text-left font-medium text-muted-foreground">Amount</th>
            <th className="px-6 py-3 text-left font-medium text-muted-foreground">Direction</th>
            <th className="px-6 py-3 text-left font-medium text-muted-foreground">Bucket</th>
            <th className="px-6 py-3 text-left font-medium text-muted-foreground">Description</th>
            <th className="px-6 py-3 text-left font-medium text-muted-foreground">Date</th>
          </tr></thead>
          <tbody className="divide-y">
            {entries.map((e) => (
              <tr key={e.id} className="hover:bg-muted/30 transition-colors">
                <td className="px-6 py-4 font-mono text-xs">{e.id}</td>
                <td className="px-6 py-4 font-medium">{e.trade}</td>
                <td className="px-6 py-4">{e.asset}</td>
                <td className="px-6 py-4">{e.amount}</td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${e.direction === "credit" ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}`}>
                    {e.direction}
                  </span>
                </td>
                <td className="px-6 py-4 text-xs">{e.bucket.replace(/_/g, " ")}</td>
                <td className="px-6 py-4 text-muted-foreground">{e.description}</td>
                <td className="px-6 py-4 text-muted-foreground">{e.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
}
