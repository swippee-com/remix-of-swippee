import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowDownUp, Loader2, CheckCircle, Circle, AlertCircle, Ban } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { BRAND, type SupportedAsset, type SupportedNetwork } from "@/config/brand";
import { useTradePricing, type TradeSide, type AmountType } from "@/hooks/use-trade-pricing";
import { RateLockTimer } from "./RateLockTimer";
import { ReadinessGate } from "./ReadinessGate";
import { useAuth } from "@/contexts/AuthContext";
import { useTradeReadiness } from "@/hooks/use-trade-readiness";
import { useTradeAvailability } from "@/hooks/use-trade-availability";
import { useIsMobile } from "@/hooks/use-mobile";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const ASSET_NETWORKS: Record<string, SupportedNetwork[]> = {
  USDT: ["TRC20", "ERC20", "BEP20", "Polygon"],
  BTC: ["ERC20"],
  ETH: ["ERC20"],
  USDC: ["ERC20", "Polygon"],
};

interface TradeWidgetProps {
  variant?: "compact" | "full";
  defaultAsset?: SupportedAsset;
  defaultSide?: TradeSide;
  className?: string;
}

export function TradeWidget({ variant = "full", defaultAsset = "USDT", defaultSide = "buy", className }: TradeWidgetProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [side, setSide] = useState<TradeSide>(defaultSide);
  const [asset, setAsset] = useState<SupportedAsset>(defaultAsset);
  const [network, setNetwork] = useState<SupportedNetwork>(ASSET_NETWORKS[defaultAsset]?.[0] || "TRC20");
  const [amountType, setAmountType] = useState<AmountType>("npr");
  const [amountStr, setAmountStr] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("bank_transfer");
  const [gateOpen, setGateOpen] = useState(false);
  const [placing, setPlacing] = useState(false);

  const amount = parseFloat(amountStr) || 0;
  const networks = ASSET_NETWORKS[asset] || ["TRC20"];

  const { isAvailable, isNetworkAvailable, isLoading: availLoading } = useTradeAvailability();
  const sideAvailable = isNetworkAvailable(asset, side, network);

  const { state, pricing, rateLock, countdown, error, lockRate, refreshRate } = useTradePricing({
    asset,
    network,
    side,
    amount,
    amountType,
    paymentMethod,
  });

  const handleAssetChange = (val: string) => {
    const a = val as SupportedAsset;
    setAsset(a);
    const nets = ASSET_NETWORKS[a] || ["TRC20"];
    if (!nets.includes(network)) setNetwork(nets[0]);
  };

  const toggleAmountType = () => {
    setAmountType((t) => (t === "npr" ? "crypto" : "npr"));
    setAmountStr("");
  };

  const { allReady, steps, isLoading: readinessLoading } = useTradeReadiness(side);
  const completedCount = steps.filter((s) => s.passed).length;

  const handleCTA = async () => {
    if (!sideAvailable) return;
    if (!user || !allReady) {
      setGateOpen(true);
      return;
    }

    if (state === "priced") {
      await lockRate();
    } else if (state === "locked" && rateLock) {
      setPlacing(true);
      try {
        const { data, error: fnError } = await supabase.functions.invoke("place-order", {
          body: { rate_lock_id: rateLock.id },
        });
        if (fnError || !data?.success) {
          toast({ title: "Order failed", description: data?.error || fnError?.message || "Failed to place order", variant: "destructive" });
          return;
        }
        toast({ title: "Order placed!", description: `Your ${side} order for ${asset} has been created.` });
        navigate(`/dashboard/orders/${data.order.id}`);
      } finally {
        setPlacing(false);
      }
    } else if (state === "expired") {
      refreshRate();
    }
  };

  const ctaLabel = useMemo(() => {
    if (!sideAvailable) return `${side === "buy" ? "Buying" : "Selling"} ${asset} is paused`;
    if (placing) return "Placing Order…";
    if (state === "calculating" || state === "locking") return "Calculating…";
    if (state === "expired") return "Refresh Rate";
    if (state === "locked") return `Confirm ${side === "buy" ? "Buy" : "Sell"} ${asset}`;
    if (state === "error") return "Try Again";
    return `${side === "buy" ? "Buy" : "Sell"} ${asset}`;
  }, [state, side, asset, placing, sideAvailable]);

  const isCompact = variant === "compact";

  return (
    <>
      <div className={cn("rounded-xl border bg-card shadow-card", isCompact ? "p-4" : "p-6", className)}>
        {/* Buy/Sell Toggle */}
        <div className="flex rounded-lg bg-muted p-1 mb-4">
          {(["buy", "sell"] as TradeSide[]).map((s) => {
            const available = isAvailable(asset, s);
            return (
              <button
                key={s}
                onClick={() => setSide(s)}
                className={cn(
                  "flex-1 rounded-md text-sm font-semibold transition-all relative",
                  isMobile ? "py-3" : "py-2",
                  side === s
                    ? s === "buy"
                      ? "bg-success text-success-foreground shadow-sm"
                      : "bg-destructive text-destructive-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {s === "buy" ? "Buy" : "Sell"}
                {!available && !availLoading && (
                  <Badge variant="outline" className="absolute -top-2 -right-1 text-[10px] px-1 py-0 border-warning text-warning bg-warning/10">
                    Paused
                  </Badge>
                )}
              </button>
            );
          })}
        </div>

        {/* Unavailable banner */}
        {!sideAvailable && !availLoading && (
          <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/5 p-3 flex items-center gap-2 text-sm text-destructive">
            <Ban className="h-4 w-4 shrink-0" />
            <span>{side === "buy" ? "Buying" : "Selling"} {asset} is currently unavailable. Please check back later.</span>
          </div>
        )}

        {/* Asset & Network */}
        <div className="grid gap-3 grid-cols-2">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Asset</label>
            <Select value={asset} onValueChange={handleAssetChange}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {BRAND.supportedAssets.map((a) => (
                  <SelectItem key={a} value={a}>{a}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Network</label>
            <Select value={network} onValueChange={(v) => setNetwork(v as SupportedNetwork)}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {networks.map((n) => (
                  <SelectItem key={n} value={n}>{n}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Amount Input */}
        <div className="mt-4 space-y-3">
          <div className="rounded-lg border bg-background p-3">
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium text-muted-foreground">
                {side === "buy" ? "You pay" : "You send"}
              </label>
              <span className="text-xs font-medium text-muted-foreground">{amountType === "npr" ? "NPR" : asset}</span>
            </div>
            <input
              type="number"
              inputMode="decimal"
              placeholder="0.00"
              value={amountStr}
              onChange={(e) => setAmountStr(e.target.value)}
              disabled={!sideAvailable}
              className={cn(
                "w-full bg-transparent font-semibold outline-none placeholder:text-muted-foreground/40",
                isMobile ? "text-3xl" : "text-2xl",
                !sideAvailable && "opacity-50"
              )}
            />
          </div>

          <div className="flex justify-center">
            <button
              onClick={toggleAmountType}
              disabled={!sideAvailable}
              className="rounded-full border bg-card p-2 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
            >
              <ArrowDownUp className="h-4 w-4" />
            </button>
          </div>

          <div className="rounded-lg border bg-background p-3">
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium text-muted-foreground">
                {side === "buy" ? "You receive" : "You get"}
              </label>
              <span className="text-xs font-medium text-muted-foreground">{amountType === "npr" ? asset : "NPR"}</span>
            </div>
            <AnimatePresence mode="wait">
              {state === "calculating" ? (
                <Skeleton className="h-8 w-32" />
              ) : pricing ? (
                <motion.p
                  key={`${pricing.total_receive_crypto}-${pricing.total_pay_npr}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={cn("font-semibold", isMobile ? "text-3xl" : "text-2xl")}
                >
                  {side === "buy"
                    ? amountType === "npr"
                      ? pricing.total_receive_crypto.toFixed(asset === "BTC" || asset === "ETH" ? 8 : 2)
                      : `रू ${pricing.total_pay_npr.toLocaleString()}`
                    : amountType === "crypto"
                      ? `रू ${pricing.total_pay_npr.toLocaleString()}`
                      : pricing.total_receive_crypto.toFixed(asset === "BTC" || asset === "ETH" ? 8 : 2)
                  }
                </motion.p>
              ) : (
                <p className={cn("font-semibold text-muted-foreground/40", isMobile ? "text-3xl" : "text-2xl")}>0.00</p>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Payment Method */}
        {!isCompact && (
          <div className="mt-4">
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Payment Method</label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {BRAND.paymentMethods.map((pm) => (
                  <SelectItem key={pm.value} value={pm.value}>{pm.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Rate & Fees */}
        {pricing && state !== "idle" && (
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Swippee rate</span>
              <span className="font-medium">रू {pricing.final_rate_npr.toLocaleString()}{(asset === "USDT" || asset === "USDC") ? "/unit" : `/${asset}`}</span>
            </div>

            {!isCompact && (
              <Accordion type="single" collapsible>
                <AccordionItem value="fees" className="border-0">
                  <AccordionTrigger className="py-1 text-xs text-muted-foreground hover:no-underline">
                    Fee breakdown
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Market rate</span>
                        <span>रू {(pricing.crypto_usd_price * pricing.usd_npr_rate).toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Fees (network + settlement)</span>
                        <span>रू {pricing.fees_npr.toLocaleString()}</span>
                      </div>
                      {pricing.requires_manual_review && (
                        <p className="text-warning text-xs mt-1">⚠ Large order — requires manual review</p>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            )}
          </div>
        )}

        {/* Rate Lock Timer */}
        {(state === "locked" || state === "expired") && (
          <RateLockTimer
            seconds={countdown}
            expired={state === "expired"}
            onRefresh={refreshRate}
            className="mt-3"
          />
        )}

        {/* Min/Max validation */}
        {pricing && amount > 0 && pricing.total_pay_npr < pricing.min_order_npr && (
          <p className="mt-3 text-sm text-destructive">
            Minimum order is रू {pricing.min_order_npr.toLocaleString()}
          </p>
        )}
        {pricing && amount > 0 && pricing.total_pay_npr > pricing.max_auto_order_npr && (
          <p className="mt-3 text-sm text-warning">
            ⚠ Orders above रू {pricing.max_auto_order_npr.toLocaleString()} require manual review
          </p>
        )}

        {/* Error */}
        {error && state === "error" && (
          <p className="mt-3 text-sm text-destructive">{error}</p>
        )}

        {/* CTA */}
        <div className={cn(isMobile && "sticky bottom-0 bg-card pb-4 pt-2 -mx-4 px-4 mt-2 border-t border-border/50")}>
          <Button
            variant={side === "buy" ? "default" : "destructive"}
            className={cn("w-full", isCompact ? "h-11" : "h-12 text-base font-semibold")}
            disabled={
              !sideAvailable || placing || state === "calculating" || state === "locking" || (state === "idle" && amount <= 0) ||
              (pricing != null && amount > 0 && pricing.total_pay_npr < pricing.min_order_npr)
            }
            onClick={handleCTA}
          >
            {(state === "calculating" || state === "locking") && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {!sideAvailable && <Ban className="mr-2 h-4 w-4" />}
            {ctaLabel}
          </Button>
        </div>

        {/* Inline readiness checklist */}
        {user && sideAvailable && !allReady && !readinessLoading && (
          <div className="mt-4 rounded-lg border border-warning/30 bg-warning/5 p-3 space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-warning">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{completedCount}/{steps.length} steps complete — finish setup to trade</span>
            </div>
            <div className="space-y-1">
              {steps.map((step) => (
                <div key={step.key} className="flex items-center gap-2 text-xs">
                  {step.passed ? (
                    <CheckCircle className="h-3.5 w-3.5 text-success shrink-0" />
                  ) : (
                    <Circle className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  )}
                  <span className={cn("flex-1", step.passed ? "text-muted-foreground line-through" : "text-foreground")}>
                    {step.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <ReadinessGate open={gateOpen} onOpenChange={setGateOpen} side={side} />
    </>
  );
}
