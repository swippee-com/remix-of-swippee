import { AdminLayout } from "@/components/layout/AdminLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";
import { Wallet, Check, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { toast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function AdminWalletPage() {
  const qc = useQueryClient();

  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ["admin-wallet-transactions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("wallet_transactions")
        .select("*, wallets!inner(user_id, balance_npr)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Fetch profiles for user names
  const userIds = [...new Set(transactions.map((t: any) => t.user_id))];
  const { data: profiles = [] } = useQuery({
    queryKey: ["admin-wallet-profiles", userIds.join(",")],
    queryFn: async () => {
      if (userIds.length === 0) return [];
      const { data } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .in("id", userIds);
      return data || [];
    },
    enabled: userIds.length > 0,
  });

  const profileMap = Object.fromEntries(profiles.map((p) => [p.id, p]));

  const actionMutation = useMutation({
    mutationFn: async ({ txId, action, walletId, amount, type, userId }: {
      txId: string; action: "completed" | "rejected"; walletId: string; amount: number; type: string; userId: string;
    }) => {
      // Update transaction status
      const { error: txError } = await supabase
        .from("wallet_transactions")
        .update({ status: action as any, admin_note: action === "completed" ? "Approved by admin" : "Rejected by admin" })
        .eq("id", txId);
      if (txError) throw txError;

      // If approved, update wallet balance
      if (action === "completed") {
        const { data: wallet } = await supabase.from("wallets").select("balance_npr").eq("id", walletId).single();
        if (!wallet) throw new Error("Wallet not found");
        const currentBalance = Number(wallet.balance_npr);
        const newBalance = type === "deposit" ? currentBalance + amount : currentBalance - amount;
        if (newBalance < 0) throw new Error("Insufficient wallet balance for withdrawal");

        const { error: walletError } = await supabase
          .from("wallets")
          .update({ balance_npr: newBalance })
          .eq("id", walletId);
        if (walletError) throw walletError;

        // Update balance_after on transaction
        await supabase.from("wallet_transactions").update({ balance_after: newBalance }).eq("id", txId);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-wallet-transactions"] });
      toast({ title: "Transaction updated" });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const pendingTx = transactions.filter((t) => t.status === "pending");
  const completedTx = transactions.filter((t) => t.status !== "pending");

  const renderTable = (items: any[]) => (
    items.length === 0 ? (
      <EmptyState icon={<Wallet className="mx-auto h-10 w-10" />} title="No transactions" description="" className="mt-4" />
    ) : (
      <div className="rounded-lg border bg-card shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b bg-muted/50">
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">User</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Type</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Amount</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Description</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Date</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Actions</th>
            </tr></thead>
            <tbody className="divide-y">
              {items.map((tx) => {
                const profile = profileMap[tx.user_id];
                return (
                  <tr key={tx.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-4">
                      <p className="text-sm font-medium">{profile?.full_name || "Unknown"}</p>
                      <p className="text-xs text-muted-foreground">{profile?.email}</p>
                    </td>
                    <td className="px-4 py-4 capitalize">{(tx.type as string).replace(/_/g, " ")}</td>
                    <td className="px-4 py-4 font-medium">NPR {Number(tx.amount).toLocaleString()}</td>
                    <td className="px-4 py-4"><StatusBadge status={tx.status} /></td>
                    <td className="px-4 py-4 text-xs text-muted-foreground max-w-[200px] truncate">{tx.description || "—"}</td>
                    <td className="px-4 py-4 text-muted-foreground">{format(new Date(tx.created_at), "PP p")}</td>
                    <td className="px-4 py-4">
                      {tx.status === "pending" ? (
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="default"
                            className="h-7 gap-1"
                            disabled={actionMutation.isPending}
                            onClick={() => actionMutation.mutate({
                              txId: tx.id, action: "completed", walletId: tx.wallet_id,
                              amount: Number(tx.amount), type: tx.type, userId: tx.user_id,
                            })}
                          >
                            <Check className="h-3 w-3" /> Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            className="h-7 gap-1"
                            disabled={actionMutation.isPending}
                            onClick={() => actionMutation.mutate({
                              txId: tx.id, action: "rejected", walletId: tx.wallet_id,
                              amount: Number(tx.amount), type: tx.type, userId: tx.user_id,
                            })}
                          >
                            <X className="h-3 w-3" /> Reject
                          </Button>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    )
  );

  return (
    <AdminLayout>
      <PageHeader title="Wallet Management" description="Approve deposits and withdrawals." />
      {isLoading ? (
        <div className="flex justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>
      ) : (
        <Tabs defaultValue="pending" className="mt-6">
          <TabsList>
            <TabsTrigger value="pending">Pending ({pendingTx.length})</TabsTrigger>
            <TabsTrigger value="all">All Transactions</TabsTrigger>
          </TabsList>
          <TabsContent value="pending" className="mt-4">{renderTable(pendingTx)}</TabsContent>
          <TabsContent value="all" className="mt-4">{renderTable(completedTx)}</TabsContent>
        </Tabs>
      )}
    </AdminLayout>
  );
}
