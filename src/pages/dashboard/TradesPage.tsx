import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Timeline } from "@/components/shared/Timeline";
import { EmptyState } from "@/components/shared/EmptyState";
import { ArrowLeftRight } from "lucide-react";

const trades = [
  { id: "TR-001", side: "buy" as const, asset: "USDT", amount: "500", rate: "132.5", status: "completed" as const, date: "Mar 10, 2026" },
  { id: "TR-002", side: "sell" as const, asset: "BTC", amount: "0.05", rate: "8,250,000", status: "awaiting_fiat_payment" as const, date: "Mar 12, 2026" },
];

export default function TradesPage() {
  return (
    <DashboardLayout>
      <PageHeader title="Trades" description="Track all your trade settlements." />

      {trades.length === 0 ? (
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
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-6 py-3 text-left font-medium text-muted-foreground">ID</th>
                  <th className="px-6 py-3 text-left font-medium text-muted-foreground">Side</th>
                  <th className="px-6 py-3 text-left font-medium text-muted-foreground">Asset</th>
                  <th className="px-6 py-3 text-left font-medium text-muted-foreground">Amount</th>
                  <th className="px-6 py-3 text-left font-medium text-muted-foreground">Rate</th>
                  <th className="px-6 py-3 text-left font-medium text-muted-foreground">Status</th>
                  <th className="px-6 py-3 text-left font-medium text-muted-foreground">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {trades.map((t) => (
                  <tr key={t.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4 font-medium">{t.id}</td>
                    <td className="px-6 py-4 capitalize">{t.side}</td>
                    <td className="px-6 py-4">{t.asset}</td>
                    <td className="px-6 py-4">{t.amount} {t.asset}</td>
                    <td className="px-6 py-4">{t.rate} NPR</td>
                    <td className="px-6 py-4"><StatusBadge status={t.status} /></td>
                    <td className="px-6 py-4 text-muted-foreground">{t.date}</td>
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
