import { AdminLayout } from "@/components/layout/AdminLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";
import { DollarSign, Calculator, Save, Settings2 } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type PricingConfig = Database["public"]["Tables"]["pricing_configs"]["Row"];
type CryptoAsset = Database["public"]["Enums"]["crypto_asset"];
type TradeSide = Database["public"]["Enums"]["trade_side"];

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

  const stablecoins = configs.filter((c) => c.asset === "USDT" || c.asset === "USDC");
  const volatile = configs.filter((c) => c.asset === "BTC" || c.asset === "ETH");

  return (
    <AdminLayout>
      <PageHeader title="Pricing Configuration" description="Manage markups, spreads, fees, and order thresholds." />

      <Tabs defaultValue="markups" className="mt-6">
        <TabsList>
          <TabsTrigger value="markups">Markups & Spreads</TabsTrigger>
          <TabsTrigger value="fees">Network Fees</TabsTrigger>
          <TabsTrigger value="payments">Payment Adjustments</TabsTrigger>
          <TabsTrigger value="global">Global Settings</TabsTrigger>
          <TabsTrigger value="calculator">Live Calculator</TabsTrigger>
        </TabsList>

        <TabsContent value="markups" className="mt-4 space-y-6">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Stablecoins — Fixed Markup (NPR)</h3>
          <div className="grid gap-4 md:grid-cols-2">
            {stablecoins.map((c) => (
              <PricingCard key={c.id} config={c} mode="markup" />
            ))}
          </div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider pt-4">Volatile Assets — Percentage Spread</h3>
          <div className="grid gap-4 md:grid-cols-2">
            {volatile.map((c) => (
              <PricingCard key={c.id} config={c} mode="spread" />
            ))}
          </div>
          {configs.length === 0 && !isLoading && (
            <p className="text-sm text-muted-foreground text-center py-8">No pricing configs found. Add configs from the database.</p>
          )}
        </TabsContent>

        <TabsContent value="fees" className="mt-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {configs.map((c) => (
              <NetworkFeeCard key={c.id} config={c} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="payments" className="mt-4">
          <div className="grid gap-4 md:grid-cols-2">
            {configs.map((c) => (
              <PaymentAdjustmentsCard key={c.id} config={c} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="global" className="mt-4">
          <GlobalSettingsSection settings={settings} />
        </TabsContent>

        <TabsContent value="calculator" className="mt-4">
          <LiveCalculator />
        </TabsContent>
      </Tabs>
    </AdminLayout>
  );
}

function PricingCard({ config, mode }: { config: PricingConfig; mode: "markup" | "spread" }) {
  const queryClient = useQueryClient();
  const [value, setValue] = useState(
    mode === "markup" ? String(config.fixed_markup_npr ?? 0) : String(config.percent_spread ?? 0)
  );
  const [minOrder, setMinOrder] = useState(String(config.min_order_npr));
  const [maxAuto, setMaxAuto] = useState(String(config.max_auto_order_npr));
  const [active, setActive] = useState(config.is_active);

  const mutation = useMutation({
    mutationFn: async () => {
      const update: any = {
        is_active: active,
        min_order_npr: Number(minOrder),
        max_auto_order_npr: Number(maxAuto),
      };
      if (mode === "markup") update.fixed_markup_npr = Number(value);
      else update.percent_spread = Number(value);
      const { error } = await supabase.from("pricing_configs").update(update).eq("id", config.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-pricing-configs"] });
      toast({ title: "Config saved" });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            {config.asset} <Badge variant="outline" className="capitalize">{config.side || "all"}</Badge>
            {config.network && <Badge variant="secondary">{config.network}</Badge>}
          </CardTitle>
          <Switch checked={active} onCheckedChange={setActive} />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <Label>{mode === "markup" ? "Fixed Markup (NPR)" : "Spread (%)"}</Label>
          <Input type="number" step={mode === "markup" ? "0.01" : "0.001"} value={value} onChange={(e) => setValue(e.target.value)} className="mt-1" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-xs">Min Order (NPR)</Label>
            <Input type="number" value={minOrder} onChange={(e) => setMinOrder(e.target.value)} className="mt-1" />
          </div>
          <div>
            <Label className="text-xs">Max Auto (NPR)</Label>
            <Input type="number" value={maxAuto} onChange={(e) => setMaxAuto(e.target.value)} className="mt-1" />
          </div>
        </div>
        <Button size="sm" className="w-full" onClick={() => mutation.mutate()} disabled={mutation.isPending}>
          <Save className="h-3 w-3 mr-1" /> {mutation.isPending ? "Saving…" : "Save"}
        </Button>
      </CardContent>
    </Card>
  );
}

function NetworkFeeCard({ config }: { config: PricingConfig }) {
  const queryClient = useQueryClient();
  const [fee, setFee] = useState(String(config.network_fee_npr));

  const mutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("pricing_configs").update({ network_fee_npr: Number(fee) }).eq("id", config.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-pricing-configs"] });
      toast({ title: "Fee updated" });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">{config.asset} {config.network || ""} <span className="capitalize text-muted-foreground">({config.side || "all"})</span></CardTitle>
      </CardHeader>
      <CardContent className="flex gap-2">
        <Input type="number" step="0.01" value={fee} onChange={(e) => setFee(e.target.value)} />
        <Button size="sm" onClick={() => mutation.mutate()} disabled={mutation.isPending}>
          <Save className="h-3 w-3" />
        </Button>
      </CardContent>
    </Card>
  );
}

function PaymentAdjustmentsCard({ config }: { config: PricingConfig }) {
  const queryClient = useQueryClient();
  const adjustments = (config.payment_adjustments || {}) as Record<string, number>;
  const [values, setValues] = useState<Record<string, string>>(
    Object.fromEntries(PAYMENT_METHODS.map((m) => [m, String(adjustments[m] ?? 0)]))
  );

  const mutation = useMutation({
    mutationFn: async () => {
      const adj: Record<string, number> = {};
      PAYMENT_METHODS.forEach((m) => { adj[m] = Number(values[m] || 0); });
      const { error } = await supabase.from("pricing_configs").update({ payment_adjustments: adj }).eq("id", config.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-pricing-configs"] });
      toast({ title: "Adjustments saved" });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">{config.asset} <span className="capitalize text-muted-foreground">({config.side || "all"})</span></CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {PAYMENT_METHODS.map((m) => (
          <div key={m} className="flex items-center gap-2">
            <Label className="text-xs w-28 capitalize">{m.replace(/_/g, " ")}</Label>
            <Input type="number" step="0.01" value={values[m]} onChange={(e) => setValues({ ...values, [m]: e.target.value })} className="flex-1" />
          </div>
        ))}
        <Button size="sm" className="w-full" onClick={() => mutation.mutate()} disabled={mutation.isPending}>
          <Save className="h-3 w-3 mr-1" /> Save
        </Button>
      </CardContent>
    </Card>
  );
}

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
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Settings2 className="h-4 w-4" /> Rate Lock Duration</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          <Label className="text-xs">Duration (seconds)</Label>
          <Input type="number" value={rateLockDuration} onChange={(e) => setRateLockDuration(e.target.value)} />
          <Button size="sm" className="w-full" onClick={() => saveSetting.mutate({ key: "rate_lock_duration", value: Number(rateLockDuration) })} disabled={saveSetting.isPending}>Save</Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><DollarSign className="h-4 w-4" /> Max Auto Order</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          <Label className="text-xs">Max Amount (NPR)</Label>
          <Input type="number" value={maxAutoOrder} onChange={(e) => setMaxAutoOrder(e.target.value)} />
          <Button size="sm" className="w-full" onClick={() => saveSetting.mutate({ key: "max_auto_order_npr", value: Number(maxAutoOrder) })} disabled={saveSetting.isPending}>Save</Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Settings2 className="h-4 w-4" /> Manual Review Threshold</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          <Label className="text-xs">Threshold (NPR)</Label>
          <Input type="number" value={manualReviewThreshold} onChange={(e) => setManualReviewThreshold(e.target.value)} />
          <Button size="sm" className="w-full" onClick={() => saveSetting.mutate({ key: "manual_review_threshold_npr", value: Number(manualReviewThreshold) })} disabled={saveSetting.isPending}>Save</Button>
        </CardContent>
      </Card>
    </div>
  );
}

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
        body: { asset, side, amount_npr: Number(amount), payment_method: "bank_transfer" },
      });
      if (error) throw error;
      setResult(data);
    } catch (err: any) {
      toast({ title: "Calculation error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2"><Calculator className="h-4 w-4" /> Live Price Preview</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-4">
          <div>
            <Label>Asset</Label>
            <Select value={asset} onValueChange={(v) => setAsset(v as CryptoAsset)}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="USDT">USDT</SelectItem>
                <SelectItem value="USDC">USDC</SelectItem>
                <SelectItem value="BTC">BTC</SelectItem>
                <SelectItem value="ETH">ETH</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Side</Label>
            <Select value={side} onValueChange={(v) => setSide(v as TradeSide)}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="buy">Buy</SelectItem>
                <SelectItem value="sell">Sell</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Amount (NPR)</Label>
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
            <p className="font-semibold pt-1 border-t"><span>Total Pay:</span> NPR {Number(result.total_pay).toLocaleString()}</p>
            <p className="font-semibold"><span>Total Receive:</span> {Number(result.total_receive).toFixed(8)} {asset}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
