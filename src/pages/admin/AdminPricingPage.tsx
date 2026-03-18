import { AdminLayout } from "@/components/layout/AdminLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";
import { Save, ChevronDown, Calculator, Settings2, DollarSign } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type PricingConfig = Database["public"]["Tables"]["pricing_configs"]["Row"];
type CryptoAsset = Database["public"]["Enums"]["crypto_asset"];
type TradeSide = Database["public"]["Enums"]["trade_side"];

const ASSETS: CryptoAsset[] = ["USDT", "USDC", "BTC", "ETH"];
const STABLECOINS: CryptoAsset[] = ["USDT", "USDC"];
const PAYMENT_METHODS = ["bank_transfer", "esewa", "khalti", "ime_pay"] as const;

export default function AdminPricingPage() {
  const queryClient = useQueryClient();

  const { data: configs = [], isLoading } = useQuery({
    queryKey: ["admin-pricing-configs"],
    queryFn: async () => {
      const { data, error } = await supabase.from("pricing_configs").select("*").order("asset").order("side");
      if (error) throw error;
      return data;
    },
  });

  const { data: settings = {} } = useQuery({
    queryKey: ["admin-app-settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("app_settings").select("*");
      if (error) throw error;
      const map: Record<string, any> = {};
      (data || []).forEach((s) => { map[s.key] = { id: s.id, value: s.value }; });
      return map;
    },
  });

  // Group configs by asset
  const grouped = ASSETS.map((asset) => ({
    asset,
    isStable: STABLECOINS.includes(asset),
    configs: configs.filter((c) => c.asset === asset),
  })).filter((g) => g.configs.length > 0);

  return (
    <AdminLayout>
      <PageHeader title="Pricing Configuration" description="Manage markups, fees, and enable/disable trading per asset." />

      <div className="mt-6 space-y-6">
        {isLoading && <p className="text-sm text-muted-foreground text-center py-8">Loading configs…</p>}

        {grouped.map((group) => (
          <AssetGroup key={group.asset} asset={group.asset} isStable={group.isStable} configs={group.configs} />
        ))}

        {configs.length === 0 && !isLoading && (
          <p className="text-sm text-muted-foreground text-center py-8">No pricing configs found. Add configs from the database.</p>
        )}

        {/* Global Settings */}
        <GlobalSettingsSection settings={settings} />

        {/* Live Calculator */}
        <LiveCalculator />
      </div>
    </AdminLayout>
  );
}

/* ───── Asset Group Card ───── */
function AssetGroup({ asset, isStable, configs }: { asset: CryptoAsset; isStable: boolean; configs: PricingConfig[] }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          {asset}
          <Badge variant="secondary" className="text-xs font-normal">
            {isStable ? "Fixed Markup (NPR)" : "% Spread"}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {configs.map((config) => (
          <ConfigRow key={config.id} config={config} isStable={isStable} />
        ))}
      </CardContent>
    </Card>
  );
}

/* ───── Single Config Row ───── */
function ConfigRow({ config, isStable }: { config: PricingConfig; isStable: boolean }) {
  const queryClient = useQueryClient();
  const [active, setActive] = useState(config.is_active);
  const [markup, setMarkup] = useState(String(isStable ? (config.fixed_markup_npr ?? 0) : (config.percent_spread ?? 0)));
  const [networkFee, setNetworkFee] = useState(String(config.network_fee_npr));
  const [minOrder, setMinOrder] = useState(String(config.min_order_npr));
  const [maxAuto, setMaxAuto] = useState(String(config.max_auto_order_npr));
  const [dirty, setDirty] = useState(false);

  const adjustments = (config.payment_adjustments || {}) as Record<string, number>;
  const [payAdj, setPayAdj] = useState<Record<string, string>>(
    Object.fromEntries(PAYMENT_METHODS.map((m) => [m, String(adjustments[m] ?? 0)]))
  );

  const markDirty = () => setDirty(true);

  const mutation = useMutation({
    mutationFn: async () => {
      const update: any = {
        is_active: active,
        network_fee_npr: Number(networkFee),
        min_order_npr: Number(minOrder),
        max_auto_order_npr: Number(maxAuto),
        payment_adjustments: Object.fromEntries(PAYMENT_METHODS.map((m) => [m, Number(payAdj[m] || 0)])),
      };
      if (isStable) update.fixed_markup_npr = Number(markup);
      else update.percent_spread = Number(markup);
      const { error } = await supabase.from("pricing_configs").update(update).eq("id", config.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-pricing-configs"] });
      setDirty(false);
      toast({ title: "Saved" });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const sideLabel = config.side ? config.side.charAt(0).toUpperCase() + config.side.slice(1) : "All";

  return (
    <div className="rounded-lg border bg-muted/20 p-4 space-y-3">
      {/* Header: side label + network + toggle */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Badge variant={config.side === "buy" ? "default" : config.side === "sell" ? "destructive" : "outline"} className="text-xs">
            {sideLabel}
          </Badge>
          {config.network && <Badge variant="secondary" className="text-xs">{config.network}</Badge>}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{active ? "Active" : "Paused"}</span>
          <Switch checked={active} onCheckedChange={(v) => { setActive(v); markDirty(); }} />
        </div>
      </div>

      {/* Main fields */}
      <div className="grid gap-3 sm:grid-cols-4">
        <div>
          <Label className="text-xs">{isStable ? "Markup (NPR)" : "Spread (%)"}</Label>
          <Input type="number" step={isStable ? "0.01" : "0.001"} value={markup}
            onChange={(e) => { setMarkup(e.target.value); markDirty(); }} className="mt-1" />
        </div>
        <div>
          <Label className="text-xs">Network Fee (NPR)</Label>
          <Input type="number" step="0.01" value={networkFee}
            onChange={(e) => { setNetworkFee(e.target.value); markDirty(); }} className="mt-1" />
        </div>
        <div>
          <Label className="text-xs">Min Order (NPR)</Label>
          <Input type="number" value={minOrder}
            onChange={(e) => { setMinOrder(e.target.value); markDirty(); }} className="mt-1" />
        </div>
        <div>
          <Label className="text-xs">Max Auto (NPR)</Label>
          <Input type="number" value={maxAuto}
            onChange={(e) => { setMaxAuto(e.target.value); markDirty(); }} className="mt-1" />
        </div>
      </div>

      {/* Expandable: Payment adjustments */}
      <Collapsible>
        <CollapsibleTrigger className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
          <ChevronDown className="h-3 w-3" /> Payment adjustments
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-2">
          <div className="grid gap-2 sm:grid-cols-2">
            {PAYMENT_METHODS.map((m) => (
              <div key={m} className="flex items-center gap-2">
                <Label className="text-xs w-28 capitalize">{m.replace(/_/g, " ")}</Label>
                <Input type="number" step="0.01" value={payAdj[m]}
                  onChange={(e) => { setPayAdj({ ...payAdj, [m]: e.target.value }); markDirty(); }} className="flex-1" />
              </div>
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Save */}
      {dirty && (
        <Button size="sm" onClick={() => mutation.mutate()} disabled={mutation.isPending}>
          <Save className="h-3 w-3 mr-1" /> {mutation.isPending ? "Saving…" : "Save Changes"}
        </Button>
      )}
    </div>
  );
}

/* ───── Global Settings ───── */
function GlobalSettingsSection({ settings }: { settings: Record<string, { id: string; value: any }> }) {
  const queryClient = useQueryClient();
  const [rateLockDuration, setRateLockDuration] = useState(String(settings.rate_lock_duration?.value ?? 120));
  const [maxAutoOrder, setMaxAutoOrder] = useState(String(settings.max_auto_order_npr?.value ?? 500000));
  const [manualReviewThreshold, setManualReviewThreshold] = useState(String(settings.manual_review_threshold_npr?.value ?? 100000));

  const saveSetting = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: any }) => {
      if (settings[key]) {
        const { error } = await supabase.from("app_settings").update({ value }).eq("id", settings[key].id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("app_settings").insert({ key, value });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-app-settings"] });
      toast({ title: "Setting saved" });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2"><Settings2 className="h-4 w-4" /> Global Settings</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label className="text-xs">Rate Lock Duration (seconds)</Label>
            <Input type="number" value={rateLockDuration} onChange={(e) => setRateLockDuration(e.target.value)} />
            <Button size="sm" className="w-full" onClick={() => saveSetting.mutate({ key: "rate_lock_duration", value: Number(rateLockDuration) })} disabled={saveSetting.isPending}>Save</Button>
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Max Auto Order (NPR)</Label>
            <Input type="number" value={maxAutoOrder} onChange={(e) => setMaxAutoOrder(e.target.value)} />
            <Button size="sm" className="w-full" onClick={() => saveSetting.mutate({ key: "max_auto_order_npr", value: Number(maxAutoOrder) })} disabled={saveSetting.isPending}>Save</Button>
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Manual Review Threshold (NPR)</Label>
            <Input type="number" value={manualReviewThreshold} onChange={(e) => setManualReviewThreshold(e.target.value)} />
            <Button size="sm" className="w-full" onClick={() => saveSetting.mutate({ key: "manual_review_threshold_npr", value: Number(manualReviewThreshold) })} disabled={saveSetting.isPending}>Save</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/* ───── Live Calculator ───── */
function LiveCalculator() {
  const [asset, setAsset] = useState<CryptoAsset>("USDT");
  const [side, setSide] = useState<TradeSide>("buy");
  const [amount, setAmount] = useState("10000");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const calculate = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("calculate-price", {
        body: { asset, side, amount: Number(amount), amount_type: "npr", payment_method: "bank_transfer" },
      });
      if (error) throw error;
      const p = data?.pricing || data;
      setResult(p);
    } catch (err: any) {
      toast({ title: "Calculation error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2"><Calculator className="h-4 w-4" /> Live Price Preview</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-4">
          <div>
            <Label className="text-xs">Asset</Label>
            <Select value={asset} onValueChange={(v) => setAsset(v as CryptoAsset)}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {ASSETS.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Side</Label>
            <Select value={side} onValueChange={(v) => setSide(v as TradeSide)}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="buy">Buy</SelectItem>
                <SelectItem value="sell">Sell</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Amount (NPR)</Label>
            <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="mt-1" />
          </div>
          <div className="flex items-end">
            <Button onClick={calculate} disabled={loading} className="w-full">
              {loading ? "Calculating…" : "Calculate"}
            </Button>
          </div>
        </div>

        {result && (
          <div className="rounded-lg border bg-muted/30 p-4 text-sm space-y-1">
            <p><span className="font-medium">Crypto USD Price:</span> ${Number(result.crypto_usd_price).toLocaleString()}</p>
            <p><span className="font-medium">USD/NPR Rate:</span> {Number(result.usd_npr_rate).toLocaleString()}</p>
            <p><span className="font-medium">Base NPR Price:</span> {Number(result.base_npr_price).toLocaleString()}</p>
            <p><span className="font-medium">Final Rate:</span> NPR {Number(result.final_rate_npr).toLocaleString()}</p>
            <p><span className="font-medium">Fees:</span> NPR {Number(result.fees_npr || 0).toLocaleString()}</p>
            <p className="font-semibold pt-1 border-t"><span>Total Pay:</span> NPR {Number(result.total_pay_npr || result.total_pay).toLocaleString()}</p>
            <p className="font-semibold"><span>Total Receive:</span> {Number(result.total_receive_crypto || result.total_receive).toFixed(8)} {asset}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
