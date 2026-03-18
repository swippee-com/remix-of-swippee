import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { BRAND } from "@/config/brand";
import { usePageMeta } from "@/hooks/use-page-meta";
import { useMarketPrices, useNprRate, convertPrice, currencySymbol, type Currency } from "@/hooks/use-market-prices";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowRight, Calculator } from "lucide-react";

const NETWORK_FEES_USD: Record<string, number> = {
  TRC20: 1,
  ERC20: 5,
  BEP20: 0.5,
  Polygon: 0.1,
};

function getTradingFeePercent(amountUsd: number): number {
  if (amountUsd >= 10000) return 0.5;
  if (amountUsd >= 1000) return 1.0;
  return 1.5;
}

export default function FeesPage() {
  usePageMeta(
    "Fees & Pricing — Swippee Nepal Crypto Trading",
    "Transparent fee structure for buying and selling crypto in Nepal. Calculate trading fees, network fees, and total costs at Swippee."
  );
  const { prices } = useMarketPrices();
  const { rate: nprRate } = useNprRate();

  const [side, setSide] = useState<"buy" | "sell">("buy");
  const [currency, setCurrency] = useState<Currency>("npr");
  const [asset, setAsset] = useState<string>("USDT");
  const [network, setNetwork] = useState<string>("TRC20");
  const [amountStr, setAmountStr] = useState("");

  const estimate = useMemo(() => {
    const amount = parseFloat(amountStr);
    if (!amount || amount <= 0) return null;

    const amountUsd = currency === "npr" ? amount / nprRate : amount;
    const feePercent = getTradingFeePercent(amountUsd);
    const tradingFeeUsd = amountUsd * (feePercent / 100);
    const networkFeeUsd = NETWORK_FEES_USD[network] ?? 1;
    const totalCostUsd = amountUsd + tradingFeeUsd + networkFeeUsd;

    const coinPrice = prices.find(
      (p) => p.symbol === asset
    )?.price;

    const cryptoAmount = coinPrice ? amountUsd / coinPrice : null;

    const toDisplay = (usd: number) => convertPrice(usd, currency, nprRate);

    return {
      tradeAmount: toDisplay(amountUsd),
      tradingFee: toDisplay(tradingFeeUsd),
      feePercent,
      networkFee: toDisplay(networkFeeUsd),
      totalCost: toDisplay(totalCostUsd),
      cryptoAmount,
      symbol: currencySymbol(currency),
    };
  }, [amountStr, currency, asset, network, side, nprRate, prices]);

  const fmt = (n: number) =>
    n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <PublicLayout>
      <div className="container py-20">
        <div className="mx-auto max-w-2xl">
          <h1 className="text-3xl font-bold tracking-tight">Fees</h1>
          <p className="mt-4 text-muted-foreground">Transparent pricing with no hidden charges.</p>
          <div className="mt-8 space-y-6">
            <div className="rounded-lg border bg-card p-6 shadow-card">
              <h2 className="font-semibold">Trading Fees</h2>
              <p className="mt-2 text-sm text-muted-foreground"><p className="mt-2 text-sm text-muted-foreground">Our trading fee is applied per order and disclosed upfront before you confirm. Fees vary based on trade size, asset, and market conditions.</p> Fees vary based on trade size, asset, and market conditions.</p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="rounded-md bg-muted p-4">
                  <p className="text-sm font-medium">Standard Trades</p>
                  <p className="mt-1 text-2xl font-semibold">0.5 – 1.5%</p>
                  <p className="mt-1 text-xs text-muted-foreground">Per transaction</p>
                </div>
                <div className="rounded-md bg-muted p-4">
                  <p className="text-sm font-medium">Large Volume</p>
                  <p className="mt-1 text-2xl font-semibold">Negotiable</p>
                  <p className="mt-1 text-xs text-muted-foreground">Contact our desk</p>
                </div>
              </div>
            </div>
            <div className="rounded-lg border bg-card p-6 shadow-card">
              <h2 className="font-semibold">Network Fees</h2>
              <p className="mt-2 text-sm text-muted-foreground">Blockchain network fees are passed through at cost. The fee depends on the network used (e.g., TRC20 is typically lower than ERC20).</p>
            </div>
            <div className="rounded-lg border bg-card p-6 shadow-card">
              <h2 className="font-semibold">No Hidden Fees</h2>
              <p className="mt-2 text-sm text-muted-foreground">Every quote includes all applicable fees. What you see is what you pay. No account fees, no deposit fees, no surprise charges.</p>
            </div>
          </div>

          <div className="mt-12 rounded-lg border bg-card p-6 shadow-card">
            <div className="flex items-center gap-2 mb-6">
              <Calculator className="h-5 w-5 text-muted-foreground" />
              <h2 className="text-lg font-semibold">Fee Calculator</h2>
            </div>

            <div className="flex flex-wrap items-center gap-4 mb-6">
              <div className="inline-flex rounded-md border">
                <button
                  onClick={() => setSide("buy")}
                  className={`px-4 py-2 text-sm font-medium rounded-l-md transition-colors ${
                    side === "buy"
                      ? "bg-primary text-primary-foreground"
                      : "bg-background text-muted-foreground hover:bg-muted"
                  }`}
                >
                  Buy
                </button>
                <button
                  onClick={() => setSide("sell")}
                  className={`px-4 py-2 text-sm font-medium rounded-r-md transition-colors ${
                    side === "sell"
                      ? "bg-primary text-primary-foreground"
                      : "bg-background text-muted-foreground hover:bg-muted"
                  }`}
                >
                  Sell
                </button>
              </div>

              <div className="inline-flex rounded-md border">
                <button
                  onClick={() => setCurrency("npr")}
                  className={`px-4 py-2 text-sm font-medium rounded-l-md transition-colors ${
                    currency === "npr"
                      ? "bg-primary text-primary-foreground"
                      : "bg-background text-muted-foreground hover:bg-muted"
                  }`}
                >
                  NPR
                </button>
                <button
                  onClick={() => setCurrency("usd")}
                  className={`px-4 py-2 text-sm font-medium rounded-r-md transition-colors ${
                    currency === "usd"
                      ? "bg-primary text-primary-foreground"
                      : "bg-background text-muted-foreground hover:bg-muted"
                  }`}
                >
                  USD
                </button>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label>Asset</Label>
                <Select value={asset} onValueChange={setAsset}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {BRAND.supportedAssets.map((a) => (
                      <SelectItem key={a} value={a}>{a}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Amount ({currency.toUpperCase()})</Label>
                <Input
                  type="number"
                  placeholder="e.g. 100000"
                  value={amountStr}
                  onChange={(e) => setAmountStr(e.target.value)}
                  min={0}
                />
              </div>

              <div className="space-y-2">
                <Label>Network</Label>
                <Select value={network} onValueChange={setNetwork}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {BRAND.supportedNetworks.map((n) => (
                      <SelectItem key={n} value={n}>{n}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {estimate && (
              <div className="mt-6 rounded-md border bg-muted/50 p-5 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Trade Amount</span>
                  <span className="font-medium">{estimate.symbol} {fmt(estimate.tradeAmount)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Trading Fee ({estimate.feePercent}%)</span>
                  <span className="font-medium">{estimate.symbol} {fmt(estimate.tradingFee)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Network Fee ({network})</span>
                  <span className="font-medium">{estimate.symbol} {fmt(estimate.networkFee)}</span>
                </div>
                <div className="border-t my-2" />
                <div className="flex justify-between text-sm font-semibold">
                  <span>Total Cost</span>
                  <span>{estimate.symbol} {fmt(estimate.totalCost)}</span>
                </div>
                {estimate.cryptoAmount !== null && (
                  <>
                    <div className="border-t my-2" />
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">You {side === "buy" ? "receive" : "send"} approx.</span>
                      <span className="font-semibold text-primary">
                        ~{estimate.cryptoAmount < 1
                          ? estimate.cryptoAmount.toFixed(6)
                          : fmt(estimate.cryptoAmount)} {asset}
                      </span>
                    </div>
                  </>
                )}
              </div>
            )}

            <div className="mt-6 flex justify-end">
              <Button asChild variant="hero">
                <Link to="/auth/signup">
                  Get a Quote <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
