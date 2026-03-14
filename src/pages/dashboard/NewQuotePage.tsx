import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BRAND } from "@/config/brand";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

export default function NewQuotePage() {
  const navigate = useNavigate();
  const [side, setSide] = useState<string>("buy");

  return (
    <DashboardLayout>
      <PageHeader title="New Quote Request" description="Tell us what you want to trade." />
      <form
        className="mt-6 max-w-2xl space-y-6"
        onSubmit={(e) => { e.preventDefault(); navigate("/dashboard/quotes"); }}
      >
        <div className="rounded-lg border bg-card p-6 shadow-card space-y-4">
          <h2 className="font-semibold">Trade Details</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium">Side *</label>
              <Select value={side} onValueChange={setSide}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="buy">Buy Crypto</SelectItem>
                  <SelectItem value="sell">Sell Crypto</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Asset *</label>
              <Select>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select asset" /></SelectTrigger>
                <SelectContent>
                  {BRAND.supportedAssets.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Network *</label>
              <Select>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select network" /></SelectTrigger>
                <SelectContent>
                  {BRAND.supportedNetworks.map((n) => <SelectItem key={n} value={n}>{n}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Fiat Currency</label>
              <Select defaultValue={BRAND.defaultFiatCurrency}>
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
              <Select>
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
              <Input className="mt-1" type="number" step="any" placeholder="e.g. 500 or 0.05" required />
            </div>
          </div>
        </div>

        <div className="rounded-lg border bg-card p-6 shadow-card space-y-4">
          <h2 className="font-semibold">Settlement Details</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium">Preferred Payment Method</label>
              <Select>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {BRAND.paymentMethods.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {side === "sell" && (
              <div>
                <label className="text-sm font-medium">Payout Address</label>
                <Input className="mt-1" placeholder="Your fiat payout details" />
              </div>
            )}
            {side === "buy" && (
              <div>
                <label className="text-sm font-medium">Receiving Wallet Address</label>
                <Input className="mt-1" placeholder="Your crypto wallet address" />
              </div>
            )}
          </div>
          <div>
            <label className="text-sm font-medium">Notes</label>
            <Textarea className="mt-1" placeholder="Any additional information..." rows={3} />
          </div>
        </div>

        <div className="flex gap-3 justify-end">
          <Button type="button" variant="outline" onClick={() => navigate("/dashboard/quotes")}>Cancel</Button>
          <Button type="submit">Submit Quote Request</Button>
        </div>
      </form>
    </DashboardLayout>
  );
}
