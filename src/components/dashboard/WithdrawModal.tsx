import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { useState } from "react";
import { TotpVerifyModal } from "@/components/security/TotpVerifyModal";
import { AlertTriangle, Shield } from "lucide-react";
import { Link } from "react-router-dom";

interface WithdrawModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  walletId: string;
  balance: number;
}

export function WithdrawModal({ open, onOpenChange, walletId, balance }: WithdrawModalProps) {
  const { user, profile } = useAuth();
  const qc = useQueryClient();
  const [amount, setAmount] = useState("");
  const [paymentMethodId, setPaymentMethodId] = useState("");
  const [showTotpModal, setShowTotpModal] = useState(false);

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

  const { data: threshold = 50000 } = useQuery({
    queryKey: ["withdrawal-2fa-threshold"],
    queryFn: async () => {
      const { data } = await supabase
        .from("app_settings")
        .select("value")
        .eq("key", "withdrawal_2fa_threshold")
        .single();
      return (data?.value as any)?.amount ?? 50000;
    },
    enabled: open,
  });

  const numAmount = parseFloat(amount) || 0;
  const exceedsThreshold = numAmount >= threshold;
  const is2faEnabled = profile?.is_2fa_enabled ?? false;

  const mutation = useMutation({
    mutationFn: async () => {
      if (!numAmount || numAmount <= 0) throw new Error("Enter a valid amount.");
      if (numAmount < 100) throw new Error("Minimum withdrawal is NPR 100.");
      if (numAmount > balance) throw new Error("Insufficient balance.");
      if (numAmount > 10000000) throw new Error("Maximum withdrawal is NPR 1,00,00,000.");
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

  const handleSubmit = () => {
    if (exceedsThreshold) {
      if (!is2faEnabled) {
        toast({
          title: "2FA Required",
          description: `Withdrawals of NPR ${threshold.toLocaleString()} or more require two-factor authentication. Please enable 2FA in Settings.`,
          variant: "destructive",
        });
        return;
      }
      setShowTotpModal(true);
    } else {
      mutation.mutate();
    }
  };

  return (
    <>
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
              {exceedsThreshold && (
                <div className="mt-2 flex items-start gap-2 rounded-md border border-warning/50 bg-warning/10 p-2.5 text-xs">
                  {is2faEnabled ? (
                    <>
                      <Shield className="mt-0.5 h-3.5 w-3.5 shrink-0 text-warning" />
                      <span>This withdrawal exceeds NPR {threshold.toLocaleString()}. You'll need to verify with your authenticator app.</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-destructive" />
                      <span>
                        Withdrawals ≥ NPR {threshold.toLocaleString()} require 2FA.{" "}
                        <Link to="/dashboard/settings" className="font-medium underline">
                          Enable 2FA in Settings
                        </Link>
                      </span>
                    </>
                  )}
                </div>
              )}
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
            <Button
              onClick={handleSubmit}
              disabled={mutation.isPending || (exceedsThreshold && !is2faEnabled)}
            >
              {mutation.isPending ? "Submitting…" : "Request Withdrawal"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <TotpVerifyModal
        open={showTotpModal}
        onVerified={() => {
          setShowTotpModal(false);
          mutation.mutate();
        }}
        onCancel={() => setShowTotpModal(false)}
      />
    </>
  );
}
