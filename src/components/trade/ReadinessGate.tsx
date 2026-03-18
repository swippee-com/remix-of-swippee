import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, Circle, LogIn, Phone, Shield, CreditCard, Wallet } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

interface ReadinessGateProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  side: "buy" | "sell";
}

interface GateStep {
  key: string;
  label: string;
  icon: typeof LogIn;
  passed: boolean;
  href: string;
  cta: string;
}

export function ReadinessGate({ open, onOpenChange, side }: ReadinessGateProps) {
  const { user, profile } = useAuth();
  const isMobile = useIsMobile();

  const { data: kycApproved = false } = useQuery({
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
    enabled: open && !!user,
  });

  const { data: hasPaymentMethod = false } = useQuery({
    queryKey: ["readiness-payment", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("payment_methods")
        .select("id")
        .eq("user_id", user!.id)
        .limit(1);
      return (data?.length ?? 0) > 0;
    },
    enabled: open && !!user,
  });

  const { data: hasPayoutAddress = false } = useQuery({
    queryKey: ["readiness-payout", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("payout_addresses")
        .select("id")
        .eq("user_id", user!.id)
        .limit(1);
      return (data?.length ?? 0) > 0;
    },
    enabled: open && !!user,
  });

  const steps: GateStep[] = [
    {
      key: "auth",
      label: "Sign in to your account",
      icon: LogIn,
      passed: !!user,
      href: "/auth/login",
      cta: "Sign In",
    },
    {
      key: "phone",
      label: "Verify your phone number",
      icon: Phone,
      passed: !!profile?.phone_verified,
      href: "/dashboard/settings",
      cta: "Verify Phone",
    },
    {
      key: "kyc",
      label: "Complete KYC verification",
      icon: Shield,
      passed: kycApproved,
      href: "/dashboard/kyc",
      cta: "Complete KYC",
    },
    {
      key: "payment",
      label: "Add a payment method",
      icon: CreditCard,
      passed: hasPaymentMethod,
      href: "/dashboard/payment-methods",
      cta: "Add Payment Method",
    },
    ...(side === "sell"
      ? [
          {
            key: "payout",
            label: "Add a payout address",
            icon: Wallet,
            passed: hasPayoutAddress,
            href: "/dashboard/payout-addresses",
            cta: "Add Payout Address",
          },
        ]
      : []),
  ];

  const completedCount = steps.filter((s) => s.passed).length;
  const progressPercent = Math.round((completedCount / steps.length) * 100);
  const firstIncomplete = steps.find((s) => !s.passed);

  const content = (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">{completedCount} of {steps.length} complete</span>
          <span className="font-medium text-primary">{progressPercent}%</span>
        </div>
        <Progress value={progressPercent} className="h-2" />
      </div>
      <div className="space-y-3">
        {steps.map((step) => (
          <div
            key={step.key}
            className={cn(
              "flex items-center gap-3 rounded-lg border p-3",
              step.passed ? "border-success/30 bg-success/5" : "border-border"
            )}
          >
            {step.passed ? (
              <CheckCircle className="h-5 w-5 text-success shrink-0" />
            ) : (
              <Circle className="h-5 w-5 text-muted-foreground shrink-0" />
            )}
            <span className={cn("text-sm flex-1", step.passed && "text-muted-foreground line-through")}>
              {step.label}
            </span>
            {!step.passed && step === firstIncomplete && (
              <Button size="sm" variant="default" asChild className="h-7 text-xs">
                <Link to={step.href} onClick={() => onOpenChange(false)}>
                  {step.cta}
                </Link>
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Complete Setup to Trade</DrawerTitle>
            <DrawerDescription>
              A few steps are needed before you can place an order.
            </DrawerDescription>
          </DrawerHeader>
          <div className="px-4 pb-6">
            {content}
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Complete Setup to Trade</DialogTitle>
          <DialogDescription>
            A few steps are needed before you can place an order.
          </DialogDescription>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
}
