import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle, Circle, LogIn, Phone, Shield, CreditCard, Wallet } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

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
      passed: false, // checked dynamically below
      href: "/dashboard/kyc",
      cta: "Complete KYC",
    },
    {
      key: "payment",
      label: side === "buy" ? "Add a payment method" : "Add a payout address",
      icon: side === "buy" ? CreditCard : Wallet,
      passed: false,
      href: side === "buy" ? "/dashboard/payment-methods" : "/dashboard/payout-addresses",
      cta: side === "buy" ? "Add Payment Method" : "Add Payout Address",
    },
  ];

  // Find first incomplete step
  const firstIncomplete = steps.find((s) => !s.passed);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Complete Setup to Trade</DialogTitle>
          <DialogDescription>
            A few steps are needed before you can place an order.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
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
      </DialogContent>
    </Dialog>
  );
}
