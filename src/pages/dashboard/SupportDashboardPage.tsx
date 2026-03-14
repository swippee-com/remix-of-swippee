import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";
import { HeadphonesIcon, Plus } from "lucide-react";

const tickets = [
  { id: "T-001", subject: "Payment not received", category: "Trades", status: "open" as const, date: "Mar 11, 2026" },
  { id: "T-002", subject: "KYC document query", category: "KYC", status: "resolved" as const, date: "Mar 8, 2026" },
];

export default function SupportDashboardPage() {
  return (
    <DashboardLayout>
      <PageHeader title="Support" description="Get help with your account or trades.">
        <Button><Plus className="mr-1 h-4 w-4" /> New Ticket</Button>
      </PageHeader>

      {tickets.length === 0 ? (
        <EmptyState icon={<HeadphonesIcon className="mx-auto h-10 w-10" />} title="No support tickets" description="Create a ticket if you need help." className="mt-6" />
      ) : (
        <div className="mt-6 rounded-lg border bg-card shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b bg-muted/50">
                <th className="px-6 py-3 text-left font-medium text-muted-foreground">ID</th>
                <th className="px-6 py-3 text-left font-medium text-muted-foreground">Subject</th>
                <th className="px-6 py-3 text-left font-medium text-muted-foreground">Category</th>
                <th className="px-6 py-3 text-left font-medium text-muted-foreground">Status</th>
                <th className="px-6 py-3 text-left font-medium text-muted-foreground">Date</th>
              </tr></thead>
              <tbody className="divide-y">
                {tickets.map((t) => (
                  <tr key={t.id} className="hover:bg-muted/30">
                    <td className="px-6 py-4 font-medium">{t.id}</td>
                    <td className="px-6 py-4">{t.subject}</td>
                    <td className="px-6 py-4">{t.category}</td>
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
