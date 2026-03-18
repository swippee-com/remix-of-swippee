import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { SupportedAsset, SupportedNetwork } from "@/config/brand";

export type TradeSide = "buy" | "sell";
export type AmountType = "npr" | "crypto";
export type PricingState = "idle" | "calculating" | "priced" | "locking" | "locked" | "expired" | "error";

export interface PricingData {
  asset: string;
  network: string | null;
  side: TradeSide;
  crypto_usd_price: number;
  usd_npr_rate: number;
  final_rate_npr: number;
  fees_npr: number;
  total_pay_npr: number;
  total_receive_crypto: number;
  requires_manual_review: boolean;
  pricing_config_id: string;
  min_order_npr: number;
  max_auto_order_npr: number;
}

export interface RateLockData {
  id: string;
  expires_at: string;
  final_rate_npr: number;
  fees_npr: number;
  total_pay: number;
  total_receive: number;
  seconds_remaining: number;
}

interface UseTradePricingParams {
  asset: SupportedAsset;
  network: SupportedNetwork;
  side: TradeSide;
  amount: number;
  amountType: AmountType;
  paymentMethod?: string;
}

export function useTradePricing(params: UseTradePricingParams) {
  const { asset, network, side, amount, amountType, paymentMethod } = params;
  const [state, setState] = useState<PricingState>("idle");
  const [pricing, setPricing] = useState<PricingData | null>(null);
  const [rateLock, setRateLock] = useState<RateLockData | null>(null);
  const [countdown, setCountdown] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const refreshRef = useRef<ReturnType<typeof setInterval>>();
  const countdownRef = useRef<ReturnType<typeof setInterval>>();

  const fetchPricing = useCallback(async () => {
    if (!amount || amount <= 0) {
      setState("idle");
      setPricing(null);
      return;
    }

    setState("calculating");
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke("calculate-price", {
        body: { asset, network, side, amount, amount_type: amountType, payment_method: paymentMethod },
      });

      if (fnError) throw new Error(fnError.message);
      if (!data?.success) throw new Error(data?.error || "Pricing failed");

      setPricing(data.pricing);
      setState("priced");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Pricing failed");
      setState("error");
    }
  }, [asset, network, side, amount, amountType, paymentMethod]);

  // Debounced fetch on input changes
  useEffect(() => {
    // Reset lock state on param change
    setRateLock(null);
    setCountdown(0);
    if (countdownRef.current) clearInterval(countdownRef.current);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(fetchPricing, 600);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [fetchPricing]);

  // Auto-refresh every 30s when priced
  useEffect(() => {
    if (refreshRef.current) clearInterval(refreshRef.current);

    if (state === "priced" && amount > 0) {
      refreshRef.current = setInterval(fetchPricing, 30000);
    }

    return () => {
      if (refreshRef.current) clearInterval(refreshRef.current);
    };
  }, [state, fetchPricing, amount]);

  // Countdown timer for rate lock
  useEffect(() => {
    if (countdownRef.current) clearInterval(countdownRef.current);

    if (state === "locked" && countdown > 0) {
      countdownRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            setState("expired");
            setRateLock(null);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [state, countdown]);

  const lockRate = useCallback(async () => {
    if (!pricing) return;

    setState("locking");
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke("lock-rate", {
        body: {
          asset,
          network,
          side,
          payment_method: paymentMethod || null,
          amount_input_type: amountType,
          amount_input_value: amount,
        },
      });

      if (fnError) throw new Error(fnError.message);
      if (!data?.success) throw new Error(data?.error || "Rate lock failed");

      setRateLock(data.rate_lock);
      setCountdown(data.rate_lock.seconds_remaining);
      setState("locked");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Rate lock failed");
      setState("error");
    }
  }, [pricing, asset, network, side, paymentMethod, amountType, amount]);

  const refreshRate = useCallback(() => {
    setState("idle");
    setRateLock(null);
    setCountdown(0);
    fetchPricing();
  }, [fetchPricing]);

  return {
    state,
    pricing,
    rateLock,
    countdown,
    error,
    lockRate,
    refreshRate,
  };
}
