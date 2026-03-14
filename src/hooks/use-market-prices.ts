import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type Currency = "usd" | "npr";

const FALLBACK_NPR_RATE = 147.64;

async function fetchNprRate(): Promise<number> {
  try {
    const { data, error } = await supabase.functions.invoke("forex-rate");
    if (error || !data?.success) throw new Error("Failed");
    return data.buy as number;
  } catch {
    console.warn("Using fallback NPR rate");
    return FALLBACK_NPR_RATE;
  }
}

export interface MarketPrice {
  id: string;
  asset: string;
  symbol: string;
  image: string;
  price: number;
  change24h: number;
  marketCap: number;
  rank: number;
}

interface CoinGeckoMarket {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  price_change_percentage_24h: number | null;
  market_cap: number;
  market_cap_rank: number;
}

async function fetchPrices(): Promise<MarketPrice[]> {
  const res = await fetch(
    "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=12&page=1&sparkline=false&price_change_percentage=24h"
  );
  if (!res.ok) throw new Error("Failed to fetch prices");
  const data: CoinGeckoMarket[] = await res.json();

  return data.map((coin) => ({
    id: coin.id,
    asset: coin.name,
    symbol: coin.symbol.toUpperCase(),
    image: coin.image,
    price: coin.current_price ?? 0,
    change24h: coin.price_change_percentage_24h ?? 0,
    marketCap: coin.market_cap ?? 0,
    rank: coin.market_cap_rank ?? 0,
  }));
}

export function convertPrice(usdPrice: number, currency: Currency, nprRate: number): number {
  return currency === "npr" ? usdPrice * nprRate : usdPrice;
}

export function currencySymbol(currency: Currency): string {
  return currency === "npr" ? "रू" : "$";
}

export function useNprRate() {
  const { data: rate = FALLBACK_NPR_RATE } = useQuery({
    queryKey: ["npr-rate"],
    queryFn: fetchNprRate,
    refetchInterval: 300000, // refresh every 5 min
    staleTime: 120000,
  });
  return rate;
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
