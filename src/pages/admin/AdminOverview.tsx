import { AdminLayout } from "@/components/layout/AdminLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { ClipboardCheck, FileText, ArrowLeftRight, AlertTriangle, DollarSign, Activity } from "lucide-react";

const recentActions = [
  { action: "KYC Approved", user: "Ram Sharma", time: "10 min ago" },
  { action: "Quote Sent", user: "Sita Thapa", time: "25 min ago" },
  { action: "Trade Completed", user: "Hari Bahadur", time: "1 hour ago" },
  { action: "Payment Proof Reviewed", user: "Gita KC", time: "2 hours ago" },
];

export default function AdminOverview() {
  return (
    <AdminLayout>
      <PageHeader title="Admin Dashboard" description="Overview of desk operations." />
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard title="Pending KYC" value="5" icon={ClipboardCheck} />
        <StatCard title="Open Quotes" value="8" icon={FileText} />
        <StatCard title="Active Trades" value="12" icon={ArrowLeftRight} />
        <StatCard title="Disputed" value="1" icon={AlertTriangle} />
        <StatCard title="Today's Volume" value="₹ 2.4M" icon={DollarSign} />
        <StatCard title="Monthly Fees" value="₹ 84K" icon={Activity} />
      </div>
      <div className="mt-8">
        <h2 className="text-lg font-semibold">Recent Activity</h2>
        <div className="mt-4 rounded-lg border bg-card shadow-card divide-y">
          {recentActions.map((a, i) => (
            <div key={i} className="flex items-center justify-between px-6 py-4">
              <div>
                <p className="text-sm font-medium">{a.action}</p>
                <p className="text-xs text-muted-foreground">{a.user}</p>
              </div>
              <span className="text-xs text-muted-foreground">{a.time}</span>
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}
