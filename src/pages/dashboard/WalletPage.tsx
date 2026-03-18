import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { WalletSkeleton } from "@/components/shared/DashboardSkeleton";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";
import { Wallet, ArrowDownToLine, ArrowUpFromLine } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useFormattedDate } from "@/hooks/use-formatted-date";
import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { useRealtimeInvalidation } from "@/hooks/use-realtime";
import { DepositModal } from "@/components/dashboard/DepositModal";
import { WithdrawModal } from "@/components/dashboard/WithdrawModal";

export default function WalletPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { formatDate } = useFormattedDate();
  const [depositOpen, setDepositOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);

  const walletKeys = useMemo(() => [["user-wallet"], ["wallet-transactions"]], []);
  useRealtimeInvalidation("wallet_transactions", walletKeys);

  const { data: wallet, isLoading: walletLoading } = useQuery({
    queryKey: ["user-wallet"],
    queryFn: async () => {
      const { data, error } = await supabase.from("wallets").select("*").eq("user_id", user!.id).maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: transactions = [], isLoading: txLoading } = useQuery({
    queryKey: ["wallet-transactions"],
    queryFn: async () => {
      const { data, error } = await supabase.from("wallet_transactions").select("*").eq("user_id", user!.id).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const isLoading = walletLoading || txLoading;
  const balance = wallet?.balance_npr ?? 0;
  const pendingDeposits = transactions.filter((t) => t.type === "deposit" && t.status === "pending").reduce((sum, t) => sum + Number(t.amount), 0);
  const pendingWithdrawals = transactions.filter((t) => t.type === "withdrawal" && t.status === "pending").reduce((sum, t) => sum + Number(t.amount), 0);

  return (
    <DashboardLayout>
      <PageHeader title={t("wallet.title")} description={t("wallet.description")}>
        <div className="flex gap-2">
          <Button size="sm" onClick={() => setDepositOpen(true)} disabled={!wallet}>
            <ArrowDownToLine className="mr-1 h-3 w-3" /> {t("wallet.deposit")}
          </Button>
          <Button size="sm" variant="outline" onClick={() => setWithdrawOpen(true)} disabled={!wallet || balance <= 0}>
            <ArrowUpFromLine className="mr-1 h-3 w-3" /> {t("wallet.withdraw")}
          </Button>
        </div>
      </PageHeader>

      {isLoading ? (
        <div className="mt-6"><WalletSkeleton /></div>
      ) : (
        <>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <StatCard title={t("wallet.availableBalance")} value={`NPR ${Number(balance).toLocaleString()}`} icon={Wallet} />
            <StatCard title={t("wallet.pendingDeposits")} value={`NPR ${pendingDeposits.toLocaleString()}`} icon={ArrowDownToLine} />
            <StatCard title={t("wallet.pendingWithdrawals")} value={`NPR ${pendingWithdrawals.toLocaleString()}`} icon={ArrowUpFromLine} />
          </div>

          <div className="mt-8">
            <h2 className="text-lg font-semibold">{t("wallet.transactionHistory")}</h2>
            {transactions.length === 0 ? (
              <EmptyState icon={<Wallet className="mx-auto h-10 w-10" />} title={t("wallet.noTransactions")} description={t("wallet.noTransactionsDesc")} className="mt-4" />
            ) : (
              <>
                {/* Mobile: Card layout */}
                <div className="mt-4 md:hidden space-y-3">
                  {transactions.map((tx) => (
                    <div key={tx.id} className="rounded-lg border bg-card p-4 shadow-card">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium capitalize">{(tx.type as string).replace(/_/g, " ")}</span>
                        <StatusBadge status={tx.status} />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className={cn(
                          "text-sm font-semibold",
                          tx.type === "deposit" || tx.type === "trade_credit" ? "text-success" : "text-destructive"
                        )}>
                          {tx.type === "deposit" || tx.type === "trade_credit" ? "+" : "-"}NPR {Number(tx.amount).toLocaleString()}
                        </span>
                        <span className="text-xs text-muted-foreground">{formatDate(tx.created_at, "PP")}</span>
                      </div>
                      {tx.description && (
                        <p className="mt-1.5 text-xs text-muted-foreground truncate">{tx.description}</p>
                      )}
                    </div>
                  ))}
                </div>

                {/* Desktop: Table layout */}
                <div className="mt-4 hidden md:block rounded-lg border bg-card shadow-card">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead><tr className="border-b bg-muted/50">
                        <th className="px-6 py-3 text-left font-medium text-muted-foreground">{t("wallet.colType")}</th>
                        <th className="px-6 py-3 text-left font-medium text-muted-foreground">{t("wallet.colAmount")}</th>
                        <th className="px-6 py-3 text-left font-medium text-muted-foreground">{t("wallet.colStatus")}</th>
                        <th className="px-6 py-3 text-left font-medium text-muted-foreground">{t("wallet.colDescription")}</th>
                        <th className="px-6 py-3 text-left font-medium text-muted-foreground">{t("wallet.colDate")}</th>
                      </tr></thead>
                      <tbody className="divide-y">
                        {transactions.map((tx) => (
                          <tr key={tx.id} className="hover:bg-muted/30 transition-colors">
                            <td className="px-6 py-4 capitalize">{(tx.type as string).replace(/_/g, " ")}</td>
                            <td className="px-6 py-4">
                              <span className={tx.type === "deposit" || tx.type === "trade_credit" ? "text-success" : "text-destructive"}>
                                {tx.type === "deposit" || tx.type === "trade_credit" ? "+" : "-"}NPR {Number(tx.amount).toLocaleString()}
                              </span>
                            </td>
                            <td className="px-6 py-4"><StatusBadge status={tx.status} /></td>
                            <td className="px-6 py-4 text-muted-foreground text-xs max-w-[200px] truncate">{tx.description || "—"}</td>
                            <td className="px-6 py-4 text-muted-foreground">{formatDate(tx.created_at, "PP")}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>
        </>
      )}

      {wallet && (
        <>
          <DepositModal open={depositOpen} onOpenChange={setDepositOpen} walletId={wallet.id} />
          <WithdrawModal open={withdrawOpen} onOpenChange={setWithdrawOpen} walletId={wallet.id} balance={balance} />
        </>
      )}
    </DashboardLayout>
  );
}
