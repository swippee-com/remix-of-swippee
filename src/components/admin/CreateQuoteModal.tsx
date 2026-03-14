import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Calculator, Send } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type QuoteRequest = Database["public"]["Tables"]["quote_requests"]["Row"];

interface CreateQuoteModalProps {
  quoteRequest: QuoteRequest;
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export function CreateQuoteModal({ quoteRequest, open, onClose, onCreated }: CreateQuoteModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  // Pricing fields
  const [quotedPrice, setQuotedPrice] = useState("");
  const [feeAmount, setFeeAmount] = useState("");
  const [spreadAmount, setSpreadAmount] = useState("");
  const [settlementInstructions, setSettlementInstructions] = useState("");
  const [internalNote, setInternalNote] = useState("");
  const [expiryHours, setExpiryHours] = useState("24");

  // Computed totals
  const [totalUserPays, setTotalUserPays] = useState(0);
  const [totalUserReceives, setTotalUserReceives] = useState(0);

  const recalculate = useCallback(() => {
    const price = parseFloat(quotedPrice) || 0;
    const fee = parseFloat(feeAmount) || 0;
    const spread = parseFloat(spreadAmount) || 0;
    const cryptoAmount = quoteRequest.amount_crypto ? Number(quoteRequest.amount_crypto) : 0;
    const fiatAmount = quoteRequest.amount_fiat ? Number(quoteRequest.amount_fiat) : 0;

    if (quoteRequest.side === "buy") {
      // User buys crypto: pays fiat, receives crypto
      if (cryptoAmount > 0) {
        const subtotal = cryptoAmount * price;
        const total = subtotal + fee + spread;
        setTotalUserPays(Math.round(total * 100) / 100);
        setTotalUserReceives(cryptoAmount);
      } else if (fiatAmount > 0) {
        setTotalUserPays(fiatAmount);
        const netFiat = fiatAmount - fee - spread;
        const cryptoReceived = price > 0 ? netFiat / price : 0;
        setTotalUserReceives(Math.round(cryptoReceived * 100000000) / 100000000);
      }
    } else {
      // User sells crypto: sends crypto, receives fiat
      if (cryptoAmount > 0) {
        const subtotal = cryptoAmount * price;
        const net = subtotal - fee - spread;
        setTotalUserPays(cryptoAmount);
        setTotalUserReceives(Math.round(Math.max(net, 0) * 100) / 100);
      } else if (fiatAmount > 0) {
        setTotalUserReceives(fiatAmount);
        const grossFiat = fiatAmount + fee + spread;
        const cryptoNeeded = price > 0 ? grossFiat / price : 0;
        setTotalUserPays(Math.round(cryptoNeeded * 100000000) / 100000000);
      }
    }
  }, [quotedPrice, feeAmount, spreadAmount, quoteRequest]);

  useEffect(() => {
    recalculate();
  }, [recalculate]);

  const handleSubmit = async () => {
    if (!user) return;

    const price = parseFloat(quotedPrice);
    const fee = parseFloat(feeAmount) || 0;

    if (!price || price <= 0) {
      toast({ title: "Enter a valid quoted price", variant: "destructive" });
      return;
    }

    if (totalUserPays <= 0 || totalUserReceives <= 0) {
      toast({ title: "Invalid calculation — check amounts", variant: "destructive" });
      return;
    }

    setLoading(true);

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + (parseInt(expiryHours) || 24));

    // Insert quote
    const { error: quoteError } = await supabase.from("quotes").insert({
      quote_request_id: quoteRequest.id,
      created_by: user.id,
      quoted_price: price,
      fee_amount: fee,
      spread_amount: parseFloat(spreadAmount) || null,
      total_user_pays: totalUserPays,
      total_user_receives: totalUserReceives,
      expires_at: expiresAt.toISOString(),
      settlement_instructions: settlementInstructions || null,
      internal_note: internalNote || null,
    });

    if (quoteError) {
      toast({ title: "Error creating quote", description: quoteError.message, variant: "destructive" });
      setLoading(false);
      return;
    }

    // Update quote request status to "quoted"
    await supabase
      .from("quote_requests")
      .update({ status: "quoted" as any })
      .eq("id", quoteRequest.id);

    // Create audit log
    await supabase.from("audit_logs").insert({
      actor_user_id: user.id,
      actor_role: "admin",
      target_type: "quote_request",
      target_id: quoteRequest.id,
      action: "quote_created",
      metadata: {
        quoted_price: price,
        fee_amount: fee,
        total_user_pays: totalUserPays,
        total_user_receives: totalUserReceives,
      },
    });

    toast({ title: "Quote sent!", description: "The user will be notified." });
    setLoading(false);
    onCreated();
  };

  const isBuy = quoteRequest.side === "buy";
  const { fiat_currency: fiat, asset } = quoteRequest;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Create Quote
          </DialogTitle>
          <DialogDescription>
            {isBuy ? "User wants to buy" : "User wants to sell"}{" "}
            {quoteRequest.amount_crypto
              ? `${quoteRequest.amount_crypto} ${asset}`
              : `${fiat} ${Number(quoteRequest.amount_fiat).toLocaleString()} worth of ${asset}`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Pricing Calculator */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="quoted-price">Rate per {asset} ({fiat})</Label>
              <Input
                id="quoted-price"
                type="number"
                step="any"
                placeholder="e.g. 133.50"
                value={quotedPrice}
                onChange={(e) => setQuotedPrice(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="fee">Fee ({fiat})</Label>
              <Input
                id="fee"
                type="number"
                step="any"
                placeholder="0"
                value={feeAmount}
                onChange={(e) => setFeeAmount(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="spread">Spread ({fiat})</Label>
              <Input
                id="spread"
                type="number"
                step="any"
                placeholder="0"
                value={spreadAmount}
                onChange={(e) => setSpreadAmount(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="expiry">Expiry (hours)</Label>
              <Input
                id="expiry"
                type="number"
                min="1"
                max="168"
                value={expiryHours}
                onChange={(e) => setExpiryHours(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>

          {/* Live Preview */}
          <div className="rounded-lg border bg-muted/30 p-4 space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Quote Preview</p>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{isBuy ? "User Pays" : "User Sends"}</span>
              <span className="font-semibold">
                {isBuy
                  ? `${fiat} ${totalUserPays.toLocaleString()}`
                  : `${totalUserPays.toLocaleString()} ${asset}`}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{isBuy ? "User Receives" : "User Gets"}</span>
              <span className="font-semibold">
                {isBuy
                  ? `${totalUserReceives.toLocaleString()} ${asset}`
                  : `${fiat} ${totalUserReceives.toLocaleString()}`}
              </span>
            </div>
            <Separator />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Effective Rate</span>
              <span>
                {totalUserPays > 0 && totalUserReceives > 0
                  ? isBuy
                    ? `${fiat} ${(totalUserPays / totalUserReceives).toFixed(2)} / ${asset}`
                    : `${fiat} ${(totalUserReceives / totalUserPays).toFixed(2)} / ${asset}`
                  : "—"}
              </span>
            </div>
          </div>

          <div>
            <Label htmlFor="instructions">Settlement Instructions (visible to user)</Label>
            <Textarea
              id="instructions"
              placeholder="e.g. Transfer to bank account 123456, reference: TRADE-XXX"
              value={settlementInstructions}
              onChange={(e) => setSettlementInstructions(e.target.value)}
              className="mt-1"
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="internal-note">Internal Note (admin only)</Label>
            <Textarea
              id="internal-note"
              placeholder="Any internal notes about this quote..."
              value={internalNote}
              onChange={(e) => setInternalNote(e.target.value)}
              className="mt-1"
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading || !quotedPrice}>
            <Send className="mr-1 h-4 w-4" />
            {loading ? "Sending…" : "Send Quote"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
