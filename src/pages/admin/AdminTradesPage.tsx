import { AdminLayout } from "@/components/layout/AdminLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Eye } from "lucide-react";

const trades = [
  { id: "TR-010", user: "Ram Sharma", side: "buy", asset: "USDT", amount: "500", rate: "132.5", status: "awaiting_fiat_payment" as const, date: "Mar 12, 2026" },
  { id: "TR-011", user: "Gita KC", side: "sell", asset: "BTC", amount: "0.1", rate: "8,500,000", status: "payment_proof_uploaded" as const, date: "Mar 11, 2026" },
  { id: "TR-012", user: "Sita Thapa", side: "buy", asset: "ETH", amount: "5", rate: "450,000", status: "completed" as const, date: "Mar 10, 2026" },
];

export default function AdminTradesPage() {
  return (
    <AdminLayout>
      <PageHeader title="Trades" description="Manage and settle OTC trades." />
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search trades..." />
        </div>
        <Select defaultValue="all">
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="awaiting_fiat_payment">Awaiting Payment</SelectItem>
            <SelectItem value="payment_proof_uploaded">Proof Uploaded</SelectItem>
            <SelectItem value="fiat_received">Fiat Received</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="mt-4 rounded-lg border bg-card shadow-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="border-b bg-muted/50">
            <th className="px-6 py-3 text-left font-medium text-muted-foreground">ID</th>
            <th className="px-6 py-3 text-left font-medium text-muted-foreground">User</th>
            <th className="px-6 py-3 text-left font-medium text-muted-foreground">Side</th>
            <th className="px-6 py-3 text-left font-medium text-muted-foreground">Asset</th>
            <th className="px-6 py-3 text-left font-medium text-muted-foreground">Amount</th>
            <th className="px-6 py-3 text-left font-medium text-muted-foreground">Rate (NPR)</th>
            <th className="px-6 py-3 text-left font-medium text-muted-foreground">Status</th>
            <th className="px-6 py-3 text-left font-medium text-muted-foreground">Actions</th>
          </tr></thead>
          <tbody className="divide-y">
            {trades.map((t) => (
              <tr key={t.id} className="hover:bg-muted/30 transition-colors">
                <td className="px-6 py-4 font-medium">{t.id}</td>
                <td className="px-6 py-4">{t.user}</td>
                <td className="px-6 py-4 capitalize">{t.side}</td>
                <td className="px-6 py-4">{t.asset}</td>
                <td className="px-6 py-4">{t.amount} {t.asset}</td>
                <td className="px-6 py-4">{t.rate}</td>
                <td className="px-6 py-4"><StatusBadge status={t.status} /></td>
                <td className="px-6 py-4"><Button variant="ghost" size="sm"><Eye className="h-3 w-3" /></Button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
}
