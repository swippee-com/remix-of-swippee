import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { EmptyState } from "@/components/shared/EmptyState";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useMarketPrices, useNprRate, convertPrice, currencySymbol, type Currency } from "@/hooks/use-market-prices";
import { PieChart, TrendingUp, TrendingDown, Wallet, BarChart3, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface OtcTrade {
  id: string;
  asset: string;
  side: "buy" | "sell";
  net_amount: number;
  gross_amount: number;
  quoted_rate: number;
  fee_amount: number;
  fiat_currency: string;
  network: string;
  status: string;
  created_at: string;
}

interface Holding {
  asset: string;
  quantity: number;
  avgCostBasis: number;
  totalInvested: number;
  totalBought: number;
  totalSold: number;
}

const ASSET_META: Record<string, { name: string; color: string }> = {
  USDT: { name: "Tether", color: "bg-emerald-500" },
  BTC: { name: "Bitcoin", color: "bg-amber-500" },
  ETH: { name: "Ethereum", color: "bg-blue-500" },
  USDC: { name: "USD Coin", color: "bg-sky-500" },
};

function computeHoldings(trades: OtcTrade[]): Holding[] {
  const map: Record<string, { qty: number; costSum: number; boughtQty: number; soldQty: number }> = {};

  for (const t of trades) {
    if (!map[t.asset]) map[t.asset] = { qty: 0, costSum: 0, boughtQty: 0, soldQty: 0 };
    const entry = map[t.asset];
    if (t.side === "buy") {
      entry.qty += Number(t.net_amount);
      entry.costSum += Number(t.quoted_rate) * Number(t.net_amount);
      entry.boughtQty += Number(t.net_amount);
    } else {
      entry.qty -= Number(t.net_amount);
      entry.soldQty += Number(t.net_amount);
    }
  }

  return Object.entries(map)
    .filter(([, v]) => v.qty > 0.00001)
    .map(([asset, v]) => ({
      asset,
      quantity: v.qty,
      avgCostBasis: v.boughtQty > 0 ? v.costSum / v.boughtQty : 0,
      totalInvested: v.costSum,
      totalBought: v.boughtQty,
      totalSold: v.soldQty,
    }))
    .sort((a, b) => b.totalInvested - a.totalInvested);
}

export default function PortfolioPage() {
  const { user } = useAuth();
  const [currency, setCurrency] = useState<Currency>("npr");
  const { prices, isLoading: pricesLoading } = useMarketPrices();
  const nprData = useNprRate();

  const { data: trades = [], isLoading: tradesLoading } = useQuery({
    queryKey: ["portfolio-trades", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("otc_trades")
        .select("id, asset, side, net_amount, gross_amount, quoted_rate, fee_amount, fiat_currency, network, status, created_at")
        .eq("user_id", user.id)
        .eq("status", "completed")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as OtcTrade[];
    },
    enabled: !!user?.id,
  });

  const holdings = useMemo(() => computeHoldings(trades), [trades]);

  const priceMap = useMemo(() => {
    const m: Record<string, { price: number; change24h: number; image: string }> = {};
    for (const p of prices) {
      const sym = p.symbol.toUpperCase();
      m[sym] = { price: p.price, change24h: p.change24h, image: p.image };
    }
    return m;
  }, [prices]);

  const rate = nprData.rate;
  const sym = currencySymbol(currency);

  const portfolioValue = useMemo(() => {
    return holdings.reduce((sum, h) => {
      const usdPrice = priceMap[h.asset]?.price ?? 0;
      return sum + h.quantity * usdPrice;
    }, 0);
  }, [holdings, priceMap]);

  const totalPL = useMemo(() => {
    return holdings.reduce((sum, h) => {
      const usdPrice = priceMap[h.asset]?.price ?? 0;
      const currentVal = h.quantity * usdPrice;
      const costVal = h.avgCostBasis > 0 ? h.quantity * h.avgCostBasis : 0;
      return sum + (currentVal - costVal);
    }, 0);
  }, [holdings, priceMap]);

  const isLoading = tradesLoading || pricesLoading;

  const fmt = (usd: number) => {
    const val = convertPrice(usd, currency, rate);
    return `${sym}${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <DashboardLayout>
      <PageHeader
        title="Portfolio"
        description="Track your crypto holdings and performance from completed trades."
      />

      {/* Currency toggle */}
      <div className="mb-6 flex items-center gap-2">
        <Button
          size="sm"
          variant={currency === "npr" ? "default" : "outline"}
          onClick={() => setCurrency("npr")}
        >
          NPR
        </Button>
        <Button
          size="sm"
          variant={currency === "usd" ? "default" : "outline"}
          onClick={() => setCurrency("usd")}
        >
          USD
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-lg" />
          ))
        ) : (
          <>
            <StatCard
              title="Total Portfolio Value"
              value={fmt(portfolioValue)}
              icon={PieChart}
            />
            <StatCard
              title="Total P&L"
              value={fmt(totalPL)}
              icon={totalPL >= 0 ? TrendingUp : TrendingDown}
              trend={portfolioValue > 0 ? {
                value: Math.round((totalPL / (portfolioValue - totalPL || 1)) * 10000) / 100,
                positive: totalPL >= 0,
              } : undefined}
            />
            <StatCard
              title="Assets Held"
              value={holdings.length}
              icon={Wallet}
              description={holdings.map(h => h.asset).join(", ") || "None"}
            />
            <StatCard
              title="Completed Trades"
              value={trades.length}
              icon={BarChart3}
            />
          </>
        )}
      </div>

      <Tabs defaultValue="holdings" className="space-y-4">
        <TabsList>
          <TabsTrigger value="holdings">Holdings</TabsTrigger>
          <TabsTrigger value="history">Trade History</TabsTrigger>
        </TabsList>

        {/* Holdings table */}
        <TabsContent value="holdings">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Your Holdings</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12" />)}
                </div>
              ) : holdings.length === 0 ? (
                <EmptyState
                  title="No holdings yet"
                  description="Complete a buy trade to see your portfolio here."
                  icon={PieChart}
                />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Asset</TableHead>
                      <TableHead className="text-right">Quantity</TableHead>
                      <TableHead className="text-right">Avg Cost</TableHead>
                      <TableHead className="text-right">Current Price</TableHead>
                      <TableHead className="text-right">Value</TableHead>
                      <TableHead className="text-right">24h</TableHead>
                      <TableHead className="text-right">P&L</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {holdings.map((h) => {
                      const mp = priceMap[h.asset];
                      const currentPrice = mp?.price ?? 0;
                      const change24h = mp?.change24h ?? 0;
                      const currentValue = h.quantity * currentPrice;
                      const pl = currentValue - h.quantity * h.avgCostBasis;
                      const plPct = h.avgCostBasis > 0 ? ((currentPrice - h.avgCostBasis) / h.avgCostBasis) * 100 : 0;
                      const meta = ASSET_META[h.asset];

                      return (
                        <TableRow key={h.asset}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              {mp?.image ? (
                                <img src={mp.image} alt={h.asset} className="h-8 w-8 rounded-full" />
                              ) : (
                                <div className={cn("h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold text-primary-foreground", meta?.color ?? "bg-muted")}>{h.asset[0]}</div>
                              )}
                              <div>
                                <p className="font-medium">{h.asset}</p>
                                <p className="text-xs text-muted-foreground">{meta?.name ?? h.asset}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {h.quantity.toLocaleString(undefined, { maximumFractionDigits: 8 })}
                          </TableCell>
                          <TableCell className="text-right">{fmt(h.avgCostBasis)}</TableCell>
                          <TableCell className="text-right">{fmt(currentPrice)}</TableCell>
                          <TableCell className="text-right font-medium">{fmt(currentValue)}</TableCell>
                          <TableCell className="text-right">
                            <span className={cn("inline-flex items-center gap-0.5 text-sm font-medium", change24h >= 0 ? "text-success" : "text-destructive")}>
                              {change24h >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                              {Math.abs(change24h).toFixed(2)}%
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <div>
                              <span className={cn("font-medium", pl >= 0 ? "text-success" : "text-destructive")}>
                                {pl >= 0 ? "+" : ""}{fmt(pl)}
                              </span>
                              <p className={cn("text-xs", plPct >= 0 ? "text-success" : "text-destructive")}>
                                {plPct >= 0 ? "+" : ""}{plPct.toFixed(2)}%
                              </p>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Trade history */}
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Completed Trades</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12" />)}
                </div>
              ) : trades.length === 0 ? (
                <EmptyState
                  title="No completed trades"
                  description="Your completed trades will appear here."
                  icon={BarChart3}
                />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Asset</TableHead>
                      <TableHead>Network</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="text-right">Rate</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {trades.map((t) => (
                      <TableRow key={t.id}>
                        <TableCell className="text-muted-foreground">
                          {format(new Date(t.created_at), "MMM d, yyyy")}
                        </TableCell>
                        <TableCell>
                          <StatusBadge
                            status={t.side === "buy" ? "approved" : "rejected"}
                            label={t.side.toUpperCase()}
                          />
                        </TableCell>
                        <TableCell className="font-medium">{t.asset}</TableCell>
                        <TableCell className="text-muted-foreground">{t.network}</TableCell>
                        <TableCell className="text-right font-mono">
                          {Number(t.net_amount).toLocaleString(undefined, { maximumFractionDigits: 8 })}
                        </TableCell>
                        <TableCell className="text-right">
                          {fmt(Number(t.quoted_rate))}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {fmt(Number(t.gross_amount))}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}
