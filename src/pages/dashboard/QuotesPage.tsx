import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Plus, FileText } from "lucide-react";

const quotes = [
  { id: "QR-001", side: "buy" as const, asset: "USDT", amount: "500", fiat: "NPR", status: "quoted" as const, date: "Mar 12, 2026" },
  { id: "QR-002", side: "sell" as const, asset: "BTC", amount: "0.05", fiat: "NPR", status: "accepted" as const, date: "Mar 10, 2026" },
  { id: "QR-003", side: "buy" as const, asset: "ETH", amount: "2.0", fiat: "NPR", status: "submitted" as const, date: "Mar 8, 2026" },
  { id: "QR-004", side: "buy" as const, asset: "USDC", amount: "1000", fiat: "NPR", status: "expired" as const, date: "Mar 5, 2026" },
];

export default function QuotesPage() {
  return (
    <DashboardLayout>
      <PageHeader title="Quote Requests" description="Request quotes and manage your trading requests.">
        <Button asChild><Link to="/dashboard/quotes/new"><Plus className="mr-1 h-4 w-4" /> New Quote Request</Link></Button>
      </PageHeader>

      {quotes.length === 0 ? (
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
                  <th className="px-6 py-3 text-left font-medium text-muted-foreground">ID</th>
                  <th className="px-6 py-3 text-left font-medium text-muted-foreground">Side</th>
                  <th className="px-6 py-3 text-left font-medium text-muted-foreground">Asset</th>
                  <th className="px-6 py-3 text-left font-medium text-muted-foreground">Amount</th>
                  <th className="px-6 py-3 text-left font-medium text-muted-foreground">Status</th>
                  <th className="px-6 py-3 text-left font-medium text-muted-foreground">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {quotes.map((q) => (
                  <tr key={q.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4 font-medium">{q.id}</td>
                    <td className="px-6 py-4 capitalize">{q.side}</td>
                    <td className="px-6 py-4">{q.asset}</td>
                    <td className="px-6 py-4">{q.amount} {q.asset}</td>
                    <td className="px-6 py-4"><StatusBadge status={q.status} /></td>
                    <td className="px-6 py-4 text-muted-foreground">{q.date}</td>
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
