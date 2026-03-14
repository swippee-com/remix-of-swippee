import { PublicLayout } from "@/components/layout/PublicLayout";
import { useMarketPrices } from "@/hooks/use-market-prices";
import { PriceTicker } from "@/components/shared/PriceTicker";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { TrendingUp, TrendingDown, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

function formatMarketCap(n: number): string {
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  return `$${n.toLocaleString()}`;
}

export default function LivePrices() {
  const { prices, isLoading, lastUpdated } = useMarketPrices();

  return (
    <PublicLayout>
      <div className="container py-12">
        <div className="mb-2">
          <h1 className="text-3xl font-semibold tracking-tight">Live Market Prices</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Indicative rates updated every 60 seconds via CoinGecko.
          </p>
        </div>

        <div className="mt-6">
          <PriceTicker />
        </div>

        {lastUpdated && (
          <p className="mt-3 text-xs text-muted-foreground">
            Last updated: {format(lastUpdated, "PPpp")}
          </p>
        )}

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {isLoading
            ? Array.from({ length: 4 }).map((_, i) => (
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
            : prices.map((p) => {
                const positive = p.change24h >= 0;
                return (
                  <Card key={p.symbol}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base font-medium">
                        {p.asset} <span className="text-muted-foreground">({p.symbol})</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <p className="text-2xl font-semibold tracking-tight">
                        ${p.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
                        Market Cap: {formatMarketCap(p.marketCap)}
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
