import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { useState } from "react";
import { Copy } from "lucide-react";

interface DepositModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  walletId: string;
}

export function DepositModal({ open, onOpenChange, walletId }: DepositModalProps) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [amount, setAmount] = useState("");
  const refCode = `DEP-${user?.id?.slice(0, 8).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;

  const mutation = useMutation({
    mutationFn: async () => {
      const numAmount = parseFloat(amount);
      if (!numAmount || numAmount <= 0) throw new Error("Enter a valid amount.");
      if (numAmount < 100) throw new Error("Minimum deposit is NPR 100.");
      if (numAmount > 10000000) throw new Error("Maximum deposit is NPR 1,00,00,000.");
      const { error } = await supabase.from("wallet_transactions").insert({
        wallet_id: walletId,
        user_id: user!.id,
        type: "deposit" as any,
        amount: numAmount,
        description: `Deposit request — Ref: ${refCode}`,
        status: "pending" as any,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["wallet-transactions"] });
      toast({ title: "Deposit request submitted", description: "Transfer NPR to the bank details below with your reference number." });
      setAmount("");
      onOpenChange(false);
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const copyRef = () => {
    navigator.clipboard.writeText(refCode);
    toast({ title: "Reference copied" });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Deposit NPR</DialogTitle>
          <DialogDescription>Transfer funds to our bank account and submit a deposit request.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-md border bg-muted/50 p-4 text-sm space-y-2">
            <p className="font-medium">Bank Details</p>
            <p>Bank: <span className="text-muted-foreground">Contact admin for bank details</span></p>
            <div className="flex items-center gap-2">
              <p>Reference: <span className="font-mono font-medium">{refCode}</span></p>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={copyRef}>
                <Copy className="h-3 w-3" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">Include this reference in your bank transfer remarks.</p>
          </div>

          <div>
            <label className="text-sm font-medium">Amount (NPR)</label>
            <Input
              className="mt-1"
              type="number"
              min="1"
              placeholder="e.g. 50000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => mutation.mutate()} disabled={mutation.isPending}>
            {mutation.isPending ? "Submitting…" : "Submit Deposit Request"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
