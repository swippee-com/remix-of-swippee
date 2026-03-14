import { PublicLayout } from "@/components/layout/PublicLayout";
import { useMarketPrices, useNprRate, convertPrice, currencySymbol, searchCoins, type Currency, type MarketPrice } from "@/hooks/use-market-prices";
import { PriceTicker } from "@/components/shared/PriceTicker";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";
import { TrendingUp, TrendingDown, ArrowRight, Search, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useState, useMemo, useEffect, useRef } from "react";
import { AdBanner } from "@/components/ads/AdBanner";
import { usePageMeta } from "@/hooks/use-page-meta";

function formatMarketCap(n: number, currency: Currency): string {
  const sym = currencySymbol(currency);
  if (n >= 1e12) return `${sym}${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9) return `${sym}${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `${sym}${(n / 1e6).toFixed(2)}M`;
  return `${sym}${n.toLocaleString()}`;
}

export default function LivePrices() {
  usePageMeta(
    "Live Crypto Prices in Nepal — USDT, BTC, ETH | Swippee",
    "Track live cryptocurrency prices in NPR. Real-time USDT, BTC, ETH, USDC rates for Nepal. Updated every minute."
  );
  const { prices, isLoading, lastUpdated } = useMarketPrices();
  const nprData = useNprRate();
  const [currency, setCurrency] = useState<Currency>("usd");
  const [search, setSearch] = useState("");
  const [remoteResults, setRemoteResults] = useState<MarketPrice[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const sym = currencySymbol(currency);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const filtered = useMemo(() => {
    if (!search.trim()) return prices;
    const q = search.toLowerCase();
    return prices.filter(
      (p) => p.asset.toLowerCase().includes(q) || p.symbol.toLowerCase().includes(q)
    );
  }, [prices, search]);

  // Remote search fallback when local filter finds nothing
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (filtered.length > 0 || search.trim().length < 2) {
      setRemoteResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const results = await searchCoins(search.trim());
        setRemoteResults(results);
      } catch {
        setRemoteResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 500);

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [search, filtered.length]);

  const displayPrices = filtered.length > 0 ? filtered : remoteResults;

  return (
    <PublicLayout>
      <div className="container py-12">
        <div className="mb-2">
          <h1 className="text-3xl font-semibold tracking-tight">Live Market Prices</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Top cryptocurrencies by market cap · Updated every 60 seconds
          </p>
        </div>

        <div className="mt-6">
          <PriceTicker currency={currency} />
        </div>

        {/* Controls row */}
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative max-w-xs flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search coins…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="flex items-center rounded-lg border bg-card p-1">
            <button
              onClick={() => setCurrency("usd")}
              className={cn(
                "rounded-md px-4 py-1.5 text-sm font-medium transition-colors",
                currency === "usd"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              USD ($)
            </button>
            <button
              onClick={() => setCurrency("npr")}
              className={cn(
                "rounded-md px-4 py-1.5 text-sm font-medium transition-colors",
                currency === "npr"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              NPR (रू)
            </button>
          </div>
        </div>

        {currency === "npr" && (
          <div className="mt-3 flex items-center gap-2 rounded-lg border border-accent bg-accent/10 px-4 py-2.5 text-sm">
            <span className="font-medium text-foreground">NRB Exchange Rate:</span>
            <span className="text-muted-foreground">
              1 USD = रू{nprData.rate.toFixed(2)} (Buy) / रू{nprData.sell.toFixed(2)} (Sell)
            </span>
            {nprData.date && (
              <span className="ml-auto text-xs text-muted-foreground">
                {format(new Date(nprData.date), "PPP")}
              </span>
            )}
          </div>
        )}

        {lastUpdated && (
          <p className="mt-3 text-xs text-muted-foreground">
            Last updated: {format(lastUpdated, "PPpp")}
          </p>
        )}

        <AdBanner placement="live_prices" className="mt-6" />

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {isLoading
            ? Array.from({ length: 12 }).map((_, i) => (
                <Card key={i}>
                  <CardHeader className="pb-2">
                    <Skeleton className="h-5 w-24" />
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Skeleton className="h-8 w-32" />
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-28" />
                  </CardContent>
                </Card>
              ))
            : isSearching ? (
                <div className="col-span-full flex items-center justify-center gap-2 py-12 text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Searching for "{search}"…
                </div>
              )
            : displayPrices.length === 0 && search.trim().length > 0 ? (
                <div className="col-span-full py-12 text-center text-muted-foreground">
                  No coins match "{search}"
                </div>
              ) : displayPrices.map((p) => {
                const positive = p.change24h >= 0;
                const displayPrice = convertPrice(p.price, currency, nprData.rate);
                const displayCap = convertPrice(p.marketCap, currency, nprData.rate);
                return (
                  <Card key={p.id}>
                    <CardHeader className="flex flex-row items-center gap-3 pb-2">
                      <img src={p.image} alt={p.asset} className="h-8 w-8 rounded-full" />
                      <div className="min-w-0">
                        <CardTitle className="truncate text-base font-medium">
                          {p.asset}
                        </CardTitle>
                        <p className="text-xs text-muted-foreground">
                          {p.symbol} · #{p.rank}
                        </p>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <p className="text-2xl font-semibold tracking-tight">
                        {sym}{displayPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                      <div
                        className={cn(
                          "flex items-center gap-1 text-sm font-medium",
                          positive ? "text-success" : "text-destructive"
                        )}
                      >
                        {positive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                        {Math.abs(p.change24h).toFixed(2)}% (24h)
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Market Cap: {formatMarketCap(displayCap, currency)}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
        </div>

        <div className="mt-12 text-center">
          <p className="text-muted-foreground">Ready to trade at competitive OTC rates?</p>
          <Button className="mt-4" size="lg" asChild>
            <Link to="/auth/signup">
              Start Trading <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </PublicLayout>
  );
}
