import { useQuery } from "@tanstack/react-query";

export interface MarketPrice {
  asset: string;
  symbol: string;
  price: number;
  change24h: number;
  marketCap: number;
}

const COIN_MAP: Record<string, { asset: string; symbol: string }> = {
  bitcoin: { asset: "Bitcoin", symbol: "BTC" },
  ethereum: { asset: "Ethereum", symbol: "ETH" },
  tether: { asset: "Tether", symbol: "USDT" },
  "usd-coin": { asset: "USD Coin", symbol: "USDC" },
};

async function fetchPrices(): Promise<MarketPrice[]> {
  const ids = Object.keys(COIN_MAP).join(",");
  const res = await fetch(
    `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true&include_market_cap=true`
  );
  if (!res.ok) throw new Error("Failed to fetch prices");
  const data = await res.json();

  return Object.entries(COIN_MAP).map(([id, meta]) => ({
    asset: meta.asset,
    symbol: meta.symbol,
    price: data[id]?.usd ?? 0,
    change24h: data[id]?.usd_24h_change ?? 0,
    marketCap: data[id]?.usd_market_cap ?? 0,
  }));
}

export function useMarketPrices() {
  const { data: prices = [], isLoading, dataUpdatedAt } = useQuery({
    queryKey: ["market-prices"],
    queryFn: fetchPrices,
    refetchInterval: 60000,
    staleTime: 30000,
  });

  return { prices, isLoading, lastUpdated: dataUpdatedAt ? new Date(dataUpdatedAt) : null };
}
