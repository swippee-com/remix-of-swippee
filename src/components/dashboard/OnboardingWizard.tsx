import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Mail, Shield, CreditCard, FileText, CheckCircle, ChevronRight, PartyPopper, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useState, useEffect, useRef } from "react";
import confetti from "canvas-confetti";

interface OnboardingStep {
  key: string;
  label: string;
  description: string;
  icon: React.ElementType;
  completed: boolean;
  cta: { label: string; href?: string; action?: () => void };
}

interface OnboardingWizardProps {
  emailVerified: boolean;
  kycStatus: string;
  paymentMethodCount: number;
  quoteCount: number;
  dismissed: boolean;
  onDismiss: () => void;
}

export function OnboardingWizard({
  emailVerified,
  kycStatus,
  paymentMethodCount,
  quoteCount,
  dismissed,
  onDismiss,
}: OnboardingWizardProps) {
  const [resending, setResending] = useState(false);

  const handleResendEmail = async () => {
    setResending(true);
    const { error } = await supabase.auth.resend({ type: "signup", email: "" });
    if (error) {
      toast.error("Could not resend verification email. Please try logging out and back in.");
    } else {
      toast.success("Verification email sent! Check your inbox.");
    }
    setResending(false);
  };

  const kycDone = kycStatus === "approved" || kycStatus === "pending_review";

  const steps: OnboardingStep[] = [
    {
      key: "email",
      label: "Verify your email",
      description: "Check your inbox and click the verification link we sent you.",
      icon: Mail,
      completed: emailVerified,
      cta: { label: "Resend email", action: handleResendEmail },
    },
    {
      key: "kyc",
      label: "Complete KYC verification",
      description: "Submit your identity documents so we can verify your account.",
      icon: Shield,
      completed: kycDone,
      cta: { label: "Start KYC", href: "/dashboard/kyc" },
    },
    {
      key: "payment",
      label: "Add a payment method",
      description: "Add a bank account or digital wallet for fiat settlements.",
      icon: CreditCard,
      completed: paymentMethodCount > 0,
      cta: { label: "Add method", href: "/dashboard/payment-methods" },
    },
    {
      key: "quote",
      label: "Request your first quote",
      description: "Create a quote request to start trading crypto OTC.",
      icon: FileText,
      completed: quoteCount > 0,
      cta: { label: "New quote", href: "/dashboard/quotes/new" },
    },
  ];

  const completedCount = steps.filter((s) => s.completed).length;
  const allDone = completedCount === steps.length;
  const firedRef = useRef(false);

  useEffect(() => {
    if (allDone && !dismissed && !firedRef.current) {
      firedRef.current = true;
      const duration = 2000;
      const end = Date.now() + duration;
      const frame = () => {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0, y: 0.7 },
          colors: ["#16a34a", "#22c55e", "#4ade80"],
        });
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1, y: 0.7 },
          colors: ["#16a34a", "#22c55e", "#4ade80"],
        });
        if (Date.now() < end) requestAnimationFrame(frame);
      };
      frame();
    }
  }, [allDone, dismissed]);

  if (dismissed) return null;

  const activeIndex = steps.findIndex((s) => !s.completed);

  return (
    <Card className="relative border-primary/10">
      {allDone ? (
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-success/10">
                <PartyPopper className="h-5 w-5 text-success" />
              </div>
              <div>
                <CardTitle className="text-base">You're all set!</CardTitle>
                <p className="text-sm text-muted-foreground">Your account is fully configured. Happy trading!</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onDismiss} className="text-muted-foreground">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
      ) : (
        <>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Get started with Swippee</CardTitle>
              <span className="text-xs font-medium text-muted-foreground">{completedCount}/{steps.length} complete</span>
            </div>
            <Progress value={(completedCount / steps.length) * 100} className="mt-2 h-1.5" />
          </CardHeader>
          <CardContent className="space-y-1 pt-0">
            {steps.map((step, i) => {
              const Icon = step.icon;
              const isActive = i === activeIndex;
              return (
                <div
                  key={step.key}
                  className={cn(
                    "rounded-md px-3 py-2.5 transition-colors",
                    isActive && "bg-accent/50",
                  )}
                >
                  <div className="flex items-center gap-3">
                    {step.completed ? (
                      <CheckCircle className="h-5 w-5 shrink-0 text-success" />
                    ) : (
                      <div className={cn(
                        "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border",
                        isActive ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/30"
                      )}>
                        {isActive && <Icon className="h-3 w-3" />}
                      </div>
                    )}
                    <span className={cn(
                      "text-sm font-medium",
                      step.completed && "text-muted-foreground line-through",
                    )}>
                      {step.label}
                    </span>
                  </div>
                  {isActive && (
                    <div className="mt-2 ml-8">
                      <p className="text-xs text-muted-foreground">{step.description}</p>
                      {step.cta.href ? (
                        <Button asChild size="sm" className="mt-2 h-8 text-xs">
                          <Link to={step.cta.href}>
                            {step.cta.label} <ChevronRight className="ml-1 h-3 w-3" />
                          </Link>
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          className="mt-2 h-8 text-xs"
                          onClick={step.cta.action}
                          disabled={resending}
                        >
                          {resending ? "Sending…" : step.cta.label}
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </CardContent>
        </>
      )}
    </Card>
  );
}
