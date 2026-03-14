import { AdminLayout } from "@/components/layout/AdminLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { MessageSquare } from "lucide-react";

const tickets = [
  { id: "T-001", user: "Ram Sharma", subject: "Payment not received", status: "open" as const, date: "Mar 11, 2026" },
  { id: "T-002", user: "Gita KC", subject: "KYC document query", status: "pending_admin" as const, date: "Mar 10, 2026" },
  { id: "T-003", user: "Sita Thapa", subject: "Trade settlement delay", status: "resolved" as const, date: "Mar 8, 2026" },
];

export default function AdminSupportPage() {
  return (
    <AdminLayout>
      <PageHeader title="Support Tickets" description="Manage user support requests." />
      <div className="mt-6 rounded-lg border bg-card shadow-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="border-b bg-muted/50">
            <th className="px-6 py-3 text-left font-medium text-muted-foreground">ID</th>
            <th className="px-6 py-3 text-left font-medium text-muted-foreground">User</th>
            <th className="px-6 py-3 text-left font-medium text-muted-foreground">Subject</th>
            <th className="px-6 py-3 text-left font-medium text-muted-foreground">Status</th>
            <th className="px-6 py-3 text-left font-medium text-muted-foreground">Date</th>
            <th className="px-6 py-3 text-left font-medium text-muted-foreground">Actions</th>
          </tr></thead>
          <tbody className="divide-y">
            {tickets.map((t) => (
              <tr key={t.id} className="hover:bg-muted/30 transition-colors">
                <td className="px-6 py-4 font-medium">{t.id}</td>
                <td className="px-6 py-4">{t.user}</td>
                <td className="px-6 py-4">{t.subject}</td>
                <td className="px-6 py-4"><StatusBadge status={t.status} /></td>
                <td className="px-6 py-4 text-muted-foreground">{t.date}</td>
                <td className="px-6 py-4"><Button variant="ghost" size="sm"><MessageSquare className="h-3 w-3 mr-1" /> Reply</Button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
}
