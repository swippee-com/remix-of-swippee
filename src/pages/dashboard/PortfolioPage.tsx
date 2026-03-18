import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { EmptyState } from "@/components/shared/EmptyState";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useMarketPrices, useNprRate, convertPrice, currencySymbol, type Currency } from "@/hooks/use-market-prices";
import { PieChart, TrendingUp, TrendingDown, Wallet, BarChart3, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useFormattedDate } from "@/hooks/use-formatted-date";

interface CompletedOrder {
  id: string;
  asset: string;
  side: "buy" | "sell";
  total_receive_crypto: number;
  total_pay_npr: number;
  final_rate_npr: number;
  fee_total_npr: number;
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

function computeHoldings(orders: CompletedOrder[]): Holding[] {
  const map: Record<string, { qty: number; costSum: number; boughtQty: number; soldQty: number }> = {};

  for (const o of orders) {
    if (!map[o.asset]) map[o.asset] = { qty: 0, costSum: 0, boughtQty: 0, soldQty: 0 };
    const entry = map[o.asset];
    const crypto = Number(o.total_receive_crypto);
    const rate = Number(o.final_rate_npr);
    if (o.side === "buy") {
      entry.qty += crypto;
      entry.costSum += rate * crypto;
      entry.boughtQty += crypto;
    } else {
      entry.qty -= crypto;
      entry.soldQty += crypto;
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
  const { t } = useLanguage();
  const { formatDate } = useFormattedDate();
  const [currency, setCurrency] = useState<Currency>("npr");
  const { prices, isLoading: pricesLoading } = useMarketPrices();
  const nprData = useNprRate();

  const { data: orders = [], isLoading: ordersLoading } = useQuery({
    queryKey: ["portfolio-orders", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("orders")
        .select("id, asset, side, total_receive_crypto, total_pay_npr, final_rate_npr, fee_total_npr, network, status, created_at")
        .eq("user_id", user.id)
        .eq("status", "completed")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as CompletedOrder[];
    },
    enabled: !!user?.id,
  });

  const holdings = useMemo(() => computeHoldings(orders), [orders]);

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

  const isLoading = ordersLoading || pricesLoading;

  const fmt = (usd: number) => {
    const val = convertPrice(usd, currency, rate);
    return `${sym}${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <DashboardLayout>
      <PageHeader
        title={t("portfolio.title")}
        description={t("portfolio.description")}
      />

      {/* Currency toggle */}
      <div className="mb-6 flex items-center gap-2">
        <Button size="sm" variant={currency === "npr" ? "default" : "outline"} onClick={() => setCurrency("npr")}>NPR</Button>
        <Button size="sm" variant={currency === "usd" ? "default" : "outline"} onClick={() => setCurrency("usd")}>USD</Button>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-lg" />)
        ) : (
          <>
            <StatCard title={t("portfolio.totalValue")} value={fmt(portfolioValue)} icon={PieChart} />
            <StatCard
              title={t("portfolio.totalPL")}
              value={fmt(totalPL)}
              icon={totalPL >= 0 ? TrendingUp : TrendingDown}
              trend={portfolioValue > 0 ? {
                value: Math.round((totalPL / (portfolioValue - totalPL || 1)) * 10000) / 100,
                positive: totalPL >= 0,
              } : undefined}
            />
            <StatCard
              title={t("portfolio.assetsHeld")}
              value={holdings.length}
              icon={Wallet}
              description={holdings.map(h => h.asset).join(", ") || t("portfolio.none")}
            />
            <StatCard title={t("portfolio.completedTrades")} value={orders.length} icon={BarChart3} />
          </>
        )}
      </div>

      <Tabs defaultValue="holdings" className="space-y-4">
        <TabsList>
          <TabsTrigger value="holdings">{t("portfolio.holdings")}</TabsTrigger>
          <TabsTrigger value="history">{t("portfolio.tradeHistory")}</TabsTrigger>
        </TabsList>

        {/* Holdings table */}
        <TabsContent value="holdings">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t("portfolio.yourHoldings")}</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12" />)}
                </div>
              ) : holdings.length === 0 ? (
                <EmptyState
                  title={t("portfolio.noHoldings")}
                  description={t("portfolio.noHoldingsDesc")}
                  icon={<PieChart className="h-10 w-10" />}
                />
              ) : (
                <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("portfolio.asset")}</TableHead>
                      <TableHead className="text-right">{t("portfolio.quantity")}</TableHead>
                      <TableHead className="text-right">{t("portfolio.avgCost")}</TableHead>
                      <TableHead className="text-right">{t("portfolio.currentPrice")}</TableHead>
                      <TableHead className="text-right">{t("portfolio.value")}</TableHead>
                      <TableHead className="text-right">{t("portfolio.24h")}</TableHead>
                      <TableHead className="text-right">{t("portfolio.pl")}</TableHead>
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
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Order history */}
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t("portfolio.completedTradesTitle")}</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12" />)}
                </div>
              ) : orders.length === 0 ? (
                <EmptyState
                  title={t("portfolio.noTrades")}
                  description={t("portfolio.noTradesDesc")}
                  icon={<BarChart3 className="h-10 w-10" />}
                />
              ) : (
                <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("portfolio.date")}</TableHead>
                      <TableHead>{t("portfolio.type")}</TableHead>
                      <TableHead>{t("portfolio.asset")}</TableHead>
                      <TableHead>{t("portfolio.network")}</TableHead>
                      <TableHead className="text-right">{t("portfolio.amount")}</TableHead>
                      <TableHead className="text-right">{t("portfolio.rate")}</TableHead>
                      <TableHead className="text-right">{t("portfolio.total")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="text-muted-foreground">
                          {formatDate(order.created_at, "MMM d, yyyy")}
                        </TableCell>
                        <TableCell>
                          <span className={cn(
                            "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                            order.side === "buy" ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
                          )}>
                            {order.side.toUpperCase()}
                          </span>
                        </TableCell>
                        <TableCell className="font-medium">{order.asset}</TableCell>
                        <TableCell className="text-muted-foreground">{order.network}</TableCell>
                        <TableCell className="text-right font-mono">
                          {Number(order.total_receive_crypto).toLocaleString(undefined, { maximumFractionDigits: 8 })}
                        </TableCell>
                        <TableCell className="text-right">{fmt(Number(order.final_rate_npr))}</TableCell>
                        <TableCell className="text-right font-medium">{fmt(Number(order.total_pay_npr))}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}
