import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

interface ReadinessStep {
  key: string;
  label: string;
  passed: boolean;
  href: string;
  cta: string;
}

interface UseTradeReadinessResult {
  allReady: boolean;
  steps: ReadinessStep[];
  isLoading: boolean;
}

export function useTradeReadiness(side: "buy" | "sell"): UseTradeReadinessResult {
  const { user, profile } = useAuth();

  const { data: kycApproved = false, isLoading: kycLoading } = useQuery({
    queryKey: ["readiness-kyc", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("kyc_submissions")
        .select("id")
        .eq("user_id", user!.id)
        .eq("status", "approved")
        .limit(1);
      return (data?.length ?? 0) > 0;
    },
    enabled: !!user,
  });

  const { data: hasPaymentMethod = false, isLoading: pmLoading } = useQuery({
    queryKey: ["readiness-payment", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("payment_methods")
        .select("id")
        .eq("user_id", user!.id)
        .limit(1);
      return (data?.length ?? 0) > 0;
    },
    enabled: !!user,
  });

  const { data: hasPayoutAddress = false, isLoading: payoutLoading } = useQuery({
    queryKey: ["readiness-payout", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("payout_addresses")
        .select("id")
        .eq("user_id", user!.id)
        .limit(1);
      return (data?.length ?? 0) > 0;
    },
    enabled: !!user && side === "buy",
  });

  const steps: ReadinessStep[] = [
    {
      key: "auth",
      label: "Sign in to your account",
      passed: !!user,
      href: "/auth/login",
      cta: "Sign In",
    },
    {
      key: "phone",
      label: "Verify your phone number",
      passed: !!profile?.phone_verified,
      href: "/dashboard/settings",
      cta: "Verify Phone",
    },
    {
      key: "kyc",
      label: "Complete KYC verification",
      passed: kycApproved,
      href: "/dashboard/kyc",
      cta: "Complete KYC",
    },
    {
      key: "payment",
      label: "Add a payment method",
      passed: hasPaymentMethod,
      href: "/dashboard/payment-methods",
      cta: "Add Payment Method",
    },
    ...(side === "buy"
      ? [
          {
            key: "payout",
            label: "Add your crypto wallet address (to receive crypto)",
            passed: hasPayoutAddress,
            href: "/dashboard/payout-addresses",
            cta: "Add Wallet Address",
          },
        ]
      : []),
  ];

  const allReady = steps.every((s) => s.passed);
  const isLoading = kycLoading || pmLoading || (side === "buy" && payoutLoading);

  return { allReady, steps, isLoading };
}
