import { useMarketPrices, useNprRate, convertPrice, currencySymbol, type Currency } from "@/hooks/use-market-prices";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown } from "lucide-react";

interface PriceTickerProps {
  currency?: Currency;
}

export function PriceTicker({ currency = "usd" }: PriceTickerProps) {
  const { prices, isLoading } = useMarketPrices();
  const nprRate = useNprRate();
  const sym = currencySymbol(currency);

  if (isLoading) {
    return (
      <div className="flex gap-3 overflow-x-auto pb-1">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-36 shrink-0 rounded-full" />
        ))}
      </div>
    );
  }

  // Show top 4 in the ticker strip
  const top = prices.slice(0, 4);

  return (
    <div className="flex gap-3 overflow-x-auto pb-1">
      {top.map((p) => {
        const positive = p.change24h >= 0;
        const displayPrice = convertPrice(p.price, currency);
        return (
          <div
            key={p.symbol}
            className="flex shrink-0 items-center gap-2 rounded-full border bg-card px-4 py-2 text-sm shadow-subtle"
          >
            <span className="font-semibold text-foreground">{p.symbol}</span>
            <span className="text-muted-foreground">
              {sym}{displayPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span
              className={cn(
                "flex items-center gap-0.5 text-xs font-medium",
                positive ? "text-success" : "text-destructive"
              )}
            >
              {positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {Math.abs(p.change24h).toFixed(2)}%
            </span>
          </div>
        );
      })}
    </div>
  );
}
