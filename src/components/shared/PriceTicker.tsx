import { useMarketPrices } from "@/hooks/use-market-prices";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown } from "lucide-react";

export function PriceTicker() {
  const { prices, isLoading } = useMarketPrices();

  if (isLoading) {
    return (
      <div className="flex gap-3 overflow-x-auto pb-1">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-36 shrink-0 rounded-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex gap-3 overflow-x-auto pb-1">
      {prices.map((p) => {
        const positive = p.change24h >= 0;
        return (
          <div
            key={p.symbol}
            className="flex shrink-0 items-center gap-2 rounded-full border bg-card px-4 py-2 text-sm shadow-subtle"
          >
            <span className="font-semibold text-foreground">{p.symbol}</span>
            <span className="text-muted-foreground">
              ${p.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
