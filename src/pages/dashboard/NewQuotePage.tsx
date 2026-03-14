import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BRAND } from "@/config/brand";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import type { Database } from "@/integrations/supabase/types";

type CryptoAsset = Database["public"]["Enums"]["crypto_asset"];
type CryptoNetwork = Database["public"]["Enums"]["crypto_network"];
type TradeSide = Database["public"]["Enums"]["trade_side"];

export default function NewQuotePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [side, setSide] = useState<TradeSide>("buy");
  const [asset, setAsset] = useState<CryptoAsset | "">("");
  const [network, setNetwork] = useState<CryptoNetwork | "">("");
  const [fiatCurrency, setFiatCurrency] = useState<string>(BRAND.defaultFiatCurrency);
  const [amountType, setAmountType] = useState<"crypto" | "fiat" | "">("");
  const [amount, setAmount] = useState("");
  const [paymentMethodId, setPaymentMethodId] = useState("");
  const [payoutAddressId, setPayoutAddressId] = useState("");
  const [notes, setNotes] = useState("");

  const { data: paymentMethods = [] } = useQuery({
    queryKey: ["user-payment-methods"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payment_methods")
        .select("id, label, payment_type")
        .eq("user_id", user!.id);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: payoutAddresses = [] } = useQuery({
    queryKey: ["user-payout-addresses"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payout_addresses")
        .select("id, label, asset, network")
        .eq("user_id", user!.id);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const filteredAddresses = payoutAddresses.filter(
    (a) => (!asset || a.asset === asset) && (!network || a.network === network)
  );

  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!asset || !network || !amountType || !amount) {
        throw new Error("Please fill in all required fields.");
      }
      const payload: any = {
        user_id: user!.id,
        side,
        asset,
        network,
        fiat_currency: fiatCurrency,
        notes: notes || null,
        preferred_payment_method_id: paymentMethodId || null,
        payout_address_id: payoutAddressId || null,
      };
      if (amountType === "crypto") {
        payload.amount_crypto = parseFloat(amount);
      } else {
        payload.amount_fiat = parseFloat(amount);
      }
      const { error } = await supabase.from("quote_requests").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-quote-requests"] });
      toast({ title: "Quote request submitted", description: "We'll get back to you shortly with a quote." });
      navigate("/dashboard/quotes");
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  return (
    <DashboardLayout>
      <PageHeader title="New Quote Request" description="Tell us what you want to trade." />
      <form
        className="mt-6 max-w-2xl space-y-6"
        onSubmit={(e) => { e.preventDefault(); submitMutation.mutate(); }}
      >
        <div className="rounded-lg border bg-card p-6 shadow-card space-y-4">
          <h2 className="font-semibold">Trade Details</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium">Side *</label>
              <Select value={side} onValueChange={(v) => setSide(v as TradeSide)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="buy">Buy Crypto</SelectItem>
                  <SelectItem value="sell">Sell Crypto</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Asset *</label>
              <Select value={asset} onValueChange={(v) => setAsset(v as CryptoAsset)}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select asset" /></SelectTrigger>
                <SelectContent>
                  {BRAND.supportedAssets.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Network *</label>
              <Select value={network} onValueChange={(v) => setNetwork(v as CryptoNetwork)}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select network" /></SelectTrigger>
                <SelectContent>
                  {BRAND.supportedNetworks.map((n) => <SelectItem key={n} value={n}>{n}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Fiat Currency</label>
              <Select value={fiatCurrency} onValueChange={setFiatCurrency}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {BRAND.supportedFiatCurrencies.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium">Amount Type *</label>
              <Select value={amountType} onValueChange={(v) => setAmountType(v as "crypto" | "fiat")}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="crypto">Crypto Amount</SelectItem>
                  <SelectItem value="fiat">Fiat Amount</SelectItem>
                </SelectContent>
              </Select>
              <p className="mt-1 text-xs text-muted-foreground">Specify if you want a specific crypto or fiat amount.</p>
            </div>
            <div>
              <label className="text-sm font-medium">Amount *</label>
              <Input
                className="mt-1"
                type="number"
                step="any"
                placeholder="e.g. 500 or 0.05"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>
          </div>
        </div>

        <div className="rounded-lg border bg-card p-6 shadow-card space-y-4">
          <h2 className="font-semibold">Settlement Details</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium">Preferred Payment Method</label>
              <Select value={paymentMethodId} onValueChange={setPaymentMethodId}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {paymentMethods.length === 0 ? (
                    <SelectItem value="none" disabled>No payment methods added</SelectItem>
                  ) : (
                    paymentMethods.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.label}</SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            {side === "buy" && (
              <div>
                <label className="text-sm font-medium">Receiving Wallet Address</label>
                <Select value={payoutAddressId} onValueChange={setPayoutAddressId}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select saved address" /></SelectTrigger>
                  <SelectContent>
                    {filteredAddresses.length === 0 ? (
                      <SelectItem value="none" disabled>No matching addresses</SelectItem>
                    ) : (
                      filteredAddresses.map((a) => (
                        <SelectItem key={a.id} value={a.id}>{a.label} ({a.asset} • {a.network})</SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <div>
            <label className="text-sm font-medium">Notes</label>
            <Textarea
              className="mt-1"
              placeholder="Any additional information..."
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>

        <div className="flex gap-3 justify-end">
          <Button type="button" variant="outline" onClick={() => navigate("/dashboard/quotes")}>Cancel</Button>
          <Button type="submit" disabled={submitMutation.isPending}>
            {submitMutation.isPending ? "Submitting…" : "Submit Quote Request"}
          </Button>
        </div>
      </form>
    </DashboardLayout>
  );
}
