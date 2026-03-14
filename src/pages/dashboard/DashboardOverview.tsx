import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Shield, ArrowLeftRight, FileText, CreditCard, Plus } from "lucide-react";

const recentActivity = [
  { id: "1", type: "Quote Request", asset: "USDT", amount: "500", status: "quoted" as const, date: "2 hours ago" },
  { id: "2", type: "Trade", asset: "BTC", amount: "0.05", status: "completed" as const, date: "1 day ago" },
  { id: "3", type: "Quote Request", asset: "ETH", amount: "2.0", status: "submitted" as const, date: "3 days ago" },
];

export default function DashboardPage() {
  return (
    <DashboardLayout>
      <PageHeader title="Dashboard" description="Welcome back! Here's your account overview.">
        <Button asChild><Link to="/dashboard/quotes"><Plus className="mr-1 h-4 w-4" /> New Quote</Link></Button>
      </PageHeader>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="KYC Status" value="Approved" icon={Shield} description="Identity verified" />
        <StatCard title="Active Trades" value="2" icon={ArrowLeftRight} description="In progress" />
        <StatCard title="Completed Trades" value="14" icon={FileText} />
        <StatCard title="Payment Methods" value="3" icon={CreditCard} />
      </div>

      <div className="mt-8">
        <h2 className="text-lg font-semibold">Recent Activity</h2>
        <div className="mt-4 rounded-lg border bg-card shadow-card">
          <div className="divide-y">
            {recentActivity.map((item) => (
              <div key={item.id} className="flex items-center justify-between px-6 py-4">
                <div>
                  <p className="text-sm font-medium">{item.type} — {item.amount} {item.asset}</p>
                  <p className="text-xs text-muted-foreground">{item.date}</p>
                </div>
                <StatusBadge status={item.status} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
