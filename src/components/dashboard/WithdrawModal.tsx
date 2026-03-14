import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { useState } from "react";

interface WithdrawModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  walletId: string;
  balance: number;
}

export function WithdrawModal({ open, onOpenChange, walletId, balance }: WithdrawModalProps) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [amount, setAmount] = useState("");
  const [paymentMethodId, setPaymentMethodId] = useState("");

  const { data: paymentMethods = [] } = useQuery({
    queryKey: ["user-payment-methods"],
    queryFn: async () => {
      const { data } = await supabase
        .from("payment_methods")
        .select("id, label, payment_type, bank_name")
        .eq("user_id", user!.id);
      return data || [];
    },
    enabled: !!user && open,
  });

  const mutation = useMutation({
    mutationFn: async () => {
      const numAmount = parseFloat(amount);
      if (!numAmount || numAmount <= 0) throw new Error("Enter a valid amount.");
      if (numAmount > balance) throw new Error("Insufficient balance.");
      if (!paymentMethodId) throw new Error("Select a payment method.");

      const pm = paymentMethods.find((p) => p.id === paymentMethodId);
      const { error } = await supabase.from("wallet_transactions").insert({
        wallet_id: walletId,
        user_id: user!.id,
        type: "withdrawal" as any,
        amount: numAmount,
        description: `Withdrawal to ${pm?.label || "payment method"}`,
        status: "pending" as any,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["wallet-transactions"] });
      toast({ title: "Withdrawal requested", description: "Admin will process your withdrawal shortly." });
      setAmount("");
      setPaymentMethodId("");
      onOpenChange(false);
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Withdraw NPR</DialogTitle>
          <DialogDescription>Request a withdrawal to your payment method. Current balance: NPR {balance.toLocaleString()}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Amount (NPR)</label>
            <Input
              className="mt-1"
              type="number"
              min="1"
              max={balance}
              placeholder="e.g. 10000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm font-medium">Payment Method</label>
            <Select value={paymentMethodId} onValueChange={setPaymentMethodId}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select payment method" />
              </SelectTrigger>
              <SelectContent>
                {paymentMethods.map((pm) => (
                  <SelectItem key={pm.id} value={pm.id}>
                    {pm.label} ({pm.payment_type.replace(/_/g, " ")})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {paymentMethods.length === 0 && (
              <p className="mt-1 text-xs text-muted-foreground">No payment methods found. Add one in Payment Methods first.</p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => mutation.mutate()} disabled={mutation.isPending}>
            {mutation.isPending ? "Submitting…" : "Request Withdrawal"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
