import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { OrderRowSkeleton } from "@/components/shared/DashboardSkeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";
import { ShoppingCart, ArrowLeftRight, Search } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useFormattedDate } from "@/hooks/use-formatted-date";
import { useMemo, useState } from "react";
import { useRealtimeInvalidation } from "@/hooks/use-realtime";
import { cn } from "@/lib/utils";

const TABS = [
  { key: "all", label: "All" },
  { key: "awaiting_payment", label: "Awaiting Payment" },
  { key: "under_review", label: "Under Review" },
  { key: "completed", label: "Completed" },
  { key: "cancelled", label: "Cancelled" },
  { key: "manual_review", label: "Manual Review" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

const TAB_FILTERS: Record<TabKey, string[]> = {
  all: [],
  awaiting_payment: ["awaiting_payment", "rate_locked"],
  under_review: ["under_review", "payment_proof_uploaded"],
  completed: ["completed"],
  cancelled: ["cancelled", "expired", "rejected"],
  manual_review: ["manual_review"],
};

export default function OrdersPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { formatDate } = useFormattedDate();
  const [activeTab, setActiveTab] = useState<TabKey>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const queryKeys = useMemo(() => [["orders-list", user?.id || ""]], [user?.id]);
  useRealtimeInvalidation("orders", queryKeys);

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["orders-list", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, rate_locks(asset, side, final_rate_npr, payment_method)")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  const filtered = activeTab === "all"
    ? orders
    : orders.filter((o) => TAB_FILTERS[activeTab].includes(o.status));

  return (
    <DashboardLayout>
      <PageHeader title={t("orders.title")} description={t("orders.description")}>
        <Button asChild>
          <Link to="/trade">
            <ArrowLeftRight className="mr-1 h-4 w-4" /> {t("orders.newOrder")}
          </Link>
        </Button>
      </PageHeader>

      {/* Tabs */}
      <div className="mt-6 flex gap-1 overflow-x-auto rounded-lg border bg-muted/30 p-1">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              "whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              activeTab === tab.key
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="mt-4 rounded-lg border bg-card shadow-card overflow-x-auto">
        {isLoading ? (
          <div className="flex justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<ShoppingCart className="mx-auto h-10 w-10" />}
            title={t("orders.noOrders")}
            description={t("orders.noOrdersDesc")}
            action={
              <Button asChild><Link to="/trade">{t("orders.newOrder")}</Link></Button>
            }
          />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="px-4 py-3 font-medium">{t("orders.colSide")}</th>
                <th className="px-4 py-3 font-medium">{t("orders.colAsset")}</th>
                <th className="px-4 py-3 font-medium">{t("orders.colRate")}</th>
                <th className="px-4 py-3 font-medium">{t("orders.colAmount")}</th>
                <th className="px-4 py-3 font-medium">{t("orders.colStatus")}</th>
                <th className="px-4 py-3 font-medium">{t("orders.colDate")}</th>
                <th className="px-4 py-3 font-medium">{t("orders.colAction")}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((order) => (
                <tr key={order.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <span className={cn(
                      "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold",
                      order.side === "buy" ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
                    )}>
                      {order.side === "buy" ? "Buy" : "Sell"}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium">{order.asset}</td>
                  <td className="px-4 py-3">NPR {Number(order.final_rate_npr).toLocaleString()}</td>
                  <td className="px-4 py-3">NPR {Number(order.total_pay_npr).toLocaleString()}</td>
                  <td className="px-4 py-3"><StatusBadge status={order.status} /></td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDate(order.created_at, "PP")}</td>
                  <td className="px-4 py-3">
                    <Button asChild variant="ghost" size="sm">
                      <Link to={`/dashboard/orders/${order.id}`}>{t("orders.view")}</Link>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </DashboardLayout>
  );
}
