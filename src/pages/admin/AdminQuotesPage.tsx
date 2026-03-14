import { AdminLayout } from "@/components/layout/AdminLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Send, Eye } from "lucide-react";

const quoteRequests = [
  { id: "QR-010", user: "Ram Sharma", side: "buy", asset: "USDT", amount: "500", fiat: "NPR", status: "submitted" as const, date: "Mar 12, 2026" },
  { id: "QR-011", user: "Gita KC", side: "sell", asset: "BTC", amount: "0.1", fiat: "NPR", status: "under_review" as const, date: "Mar 12, 2026" },
  { id: "QR-012", user: "Sita Thapa", side: "buy", asset: "ETH", amount: "5", fiat: "NPR", status: "quoted" as const, date: "Mar 11, 2026" },
  { id: "QR-013", user: "Bikram Rai", side: "buy", asset: "USDC", amount: "2000", fiat: "NPR", status: "accepted" as const, date: "Mar 10, 2026" },
];

export default function AdminQuotesPage() {
  return (
    <AdminLayout>
      <PageHeader title="Quote Requests" description="Review and send quotes to users." />
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search..." />
        </div>
        <Select defaultValue="all">
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="submitted">Submitted</SelectItem>
            <SelectItem value="under_review">Under Review</SelectItem>
            <SelectItem value="quoted">Quoted</SelectItem>
            <SelectItem value="accepted">Accepted</SelectItem>
          </SelectContent>
        </Select>
        <Select defaultValue="all">
          <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sides</SelectItem>
            <SelectItem value="buy">Buy</SelectItem>
            <SelectItem value="sell">Sell</SelectItem>
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
            <th className="px-6 py-3 text-left font-medium text-muted-foreground">Status</th>
            <th className="px-6 py-3 text-left font-medium text-muted-foreground">Date</th>
            <th className="px-6 py-3 text-left font-medium text-muted-foreground">Actions</th>
          </tr></thead>
          <tbody className="divide-y">
            {quoteRequests.map((q) => (
              <tr key={q.id} className="hover:bg-muted/30 transition-colors">
                <td className="px-6 py-4 font-medium">{q.id}</td>
                <td className="px-6 py-4">{q.user}</td>
                <td className="px-6 py-4 capitalize">{q.side}</td>
                <td className="px-6 py-4">{q.asset}</td>
                <td className="px-6 py-4">{q.amount} {q.asset}</td>
                <td className="px-6 py-4"><StatusBadge status={q.status} /></td>
                <td className="px-6 py-4 text-muted-foreground">{q.date}</td>
                <td className="px-6 py-4">
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm"><Eye className="h-3 w-3" /></Button>
                    <Button variant="ghost" size="sm"><Send className="h-3 w-3" /></Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
}
