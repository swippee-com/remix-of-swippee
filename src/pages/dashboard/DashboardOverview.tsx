import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Shield, ArrowLeftRight, FileText, CreditCard, Plus, WalletCards } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useFormattedDate } from "@/hooks/use-formatted-date";
import { useMemo, useState, useCallback } from "react";
import { useRealtimeInvalidation } from "@/hooks/use-realtime";
import { OnboardingWizard } from "@/components/dashboard/OnboardingWizard";
import { PriceTicker } from "@/components/shared/PriceTicker";
import { cn } from "@/lib/utils";
import { DashboardStatsSkeleton, RecentOrdersSkeleton } from "@/components/shared/DashboardSkeleton";

const QUICK_TRADES = [
  { label: "Buy USDT", asset: "USDT", side: "buy" },
  { label: "Sell USDT", asset: "USDT", side: "sell" },
  { label: "Buy BTC", asset: "BTC", side: "buy" },
  { label: "Sell BTC", asset: "BTC", side: "sell" },
] as const;

export default function DashboardPage() {
  const { user, profile } = useAuth();
  const { t } = useLanguage();
  const { formatDate } = useFormattedDate();

  const orderKeys = useMemo(() => [["dashboard-orders", user?.id || ""], ["dashboard-order-count", user?.id || ""]], [user?.id]);
  useRealtimeInvalidation("orders", orderKeys);

  const { data: kycStatus } = useQuery({
    queryKey: ["dashboard-kyc", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("kyc_submissions")
        .select("status")
        .eq("user_id", user!.id)
        .maybeSingle();
      return data?.status || "not_submitted";
    },
    enabled: !!user,
  });

  const { data: orderStats } = useQuery({
    queryKey: ["dashboard-orders", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("orders")
        .select("status")
        .eq("user_id", user!.id);
      const all = data || [];
      return {
        active: all.filter((o) => !["completed", "cancelled", "expired", "rejected"].includes(o.status)).length,
        completed: all.filter((o) => o.status === "completed").length,
      };
    },
    enabled: !!user,
  });

  const { data: pmCount } = useQuery({
    queryKey: ["dashboard-pm-count", user?.id],
    queryFn: async () => {
      const { count } = await supabase
        .from("payment_methods")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user!.id);
      return count || 0;
    },
    enabled: !!user,
  });

  const { data: walletBalance } = useQuery({
    queryKey: ["dashboard-wallet-balance", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("wallets")
        .select("balance_npr")
        .eq("user_id", user!.id)
        .maybeSingle();
      return data?.balance_npr ?? 0;
    },
    enabled: !!user,
  });

  const { data: orderCount } = useQuery({
    queryKey: ["dashboard-order-count", user?.id],
    queryFn: async () => {
      const { count } = await supabase
        .from("orders")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user!.id);
      return count || 0;
    },
    enabled: !!user,
  });

  const { data: recentOrders = [] } = useQuery({
    queryKey: ["dashboard-recent-orders", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("orders")
        .select("id, asset, side, total_pay_npr, total_receive_crypto, status, created_at")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(5);
      return data || [];
    },
    enabled: !!user,
  });

  const kycLabel = kycStatus === "approved" ? "Approved" : kycStatus === "pending_review" ? "Pending" : kycStatus === "not_submitted" ? "Not Started" : kycStatus?.replace(/_/g, " ") || "—";

  const emailVerified = !!user?.email_confirmed_at;
  const DISMISS_KEY = "swippee_onboarding_dismissed";
  const [wizardDismissed, setWizardDismissed] = useState(() => localStorage.getItem(DISMISS_KEY) === "true");
  const handleDismiss = useCallback(() => {
    localStorage.setItem(DISMISS_KEY, "true");
    setWizardDismissed(true);
  }, []);

  const showWizard = !wizardDismissed || (
    emailVerified &&
    (kycStatus === "approved" || kycStatus === "pending_review") &&
    (pmCount ?? 0) > 0 &&
    (orderCount ?? 0) > 0
  ) ? !wizardDismissed : false;

  return (
    <DashboardLayout>
      <PageHeader title={t("dashboard.title")} description={t("dashboard.welcome")}>
        <Button asChild><Link to="/trade"><Plus className="mr-1 h-4 w-4" /> {t("dashboard.buySellCrypto")}</Link></Button>
      </PageHeader>

      {showWizard && (
        <div className="mt-6">
          <OnboardingWizard
            emailVerified={emailVerified}
            phoneVerified={profile?.phone_verified ?? false}
            kycStatus={kycStatus || "not_submitted"}
            paymentMethodCount={pmCount ?? 0}
            orderCount={orderCount ?? 0}
            dismissed={wizardDismissed}
            onDismiss={handleDismiss}
          />
        </div>
      )}

      <div className="mt-6">
        <PriceTicker />
      </div>

      {/* Quick Trade Buttons */}
      <div className="mt-6">
        <h2 className="text-sm font-medium text-muted-foreground mb-2">{t("dashboard.quickTrade")}</h2>
        <div className="flex flex-wrap gap-2">
          {QUICK_TRADES.map((qt) => (
            <Button key={`${qt.asset}-${qt.side}`} asChild variant="outline" size="sm">
              <Link to={`/trade?asset=${qt.asset}&side=${qt.side}`}>
                <span className={cn(
                  "mr-1.5 h-2 w-2 rounded-full",
                  qt.side === "buy" ? "bg-success" : "bg-destructive"
                )} />
                {qt.label}
              </Link>
            </Button>
          ))}
        </div>
      </div>

      {orderStats === undefined ? (
        <DashboardStatsSkeleton />
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-5">
          <div className="col-span-2 lg:col-span-1">
            <StatCard title={t("dashboard.walletBalance")} value={`NPR ${Number(walletBalance ?? 0).toLocaleString()}`} icon={WalletCards} description={t("dashboard.availableBalance")} />
          </div>
          <StatCard title={t("dashboard.kycStatus")} value={kycLabel} icon={Shield} description={kycStatus === "approved" ? t("dashboard.identityVerified") : undefined} />
          <StatCard title={t("dashboard.activeOrders")} value={String(orderStats?.active ?? 0)} icon={ArrowLeftRight} description={t("dashboard.inProgress")} />
          <StatCard title={t("dashboard.completedTrades")} value={String(orderStats?.completed ?? 0)} icon={FileText} />
          <StatCard title={t("dashboard.paymentMethods")} value={String(pmCount ?? 0)} icon={CreditCard} />
        </div>
      )}

      <div className="mt-8">
        <h2 className="text-lg font-semibold">{t("dashboard.recentOrders")}</h2>
        <div className="mt-4">
          {recentOrders === undefined ? (
            <RecentOrdersSkeleton />
          ) : recentOrders.length === 0 ? (
            <div className="rounded-lg border bg-card shadow-card px-6 py-8 text-center">
              <p className="text-sm text-muted-foreground mb-4">{t("dashboard.noActivity")}</p>
              <div className="flex flex-wrap justify-center gap-2">
                {kycStatus !== "approved" && kycStatus !== "pending_review" && (
                  <Button asChild variant="outline" size="sm">
                    <Link to="/dashboard/kyc"><Shield className="mr-1 h-3 w-3" /> Complete KYC</Link>
                  </Button>
                )}
                {(pmCount ?? 0) === 0 && (
                  <Button asChild variant="outline" size="sm">
                    <Link to="/dashboard/payment-methods"><CreditCard className="mr-1 h-3 w-3" /> Add Payment Method</Link>
                  </Button>
                )}
                <Button asChild size="sm">
                  <Link to="/trade"><ArrowLeftRight className="mr-1 h-3 w-3" /> Make Your First Trade</Link>
                </Button>
              </div>
            </div>
          ) : (
            <div className="rounded-lg border bg-card shadow-card">
              <div className="divide-y">
                {recentOrders.map((order) => (
                  <Link key={order.id} to={`/dashboard/orders/${order.id}`} className="flex items-center justify-between px-6 py-4 hover:bg-muted/30 transition-colors">
                    <div>
                      <p className="text-sm font-medium">
                        <span className={cn(
                          "inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold mr-2",
                          order.side === "buy" ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
                        )}>
                          {order.side === "buy" ? "BUY" : "SELL"}
                        </span>
                        {Number(order.total_receive_crypto)} {order.asset}
                      </p>
                      <p className="text-xs text-muted-foreground">{formatDate(order.created_at, "PPp")}</p>
                    </div>
                    <StatusBadge status={order.status} />
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
