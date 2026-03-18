import { PublicLayout } from "@/components/layout/PublicLayout";
import { BRAND } from "@/config/brand";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { UserPlus, Shield, FileText, ArrowLeftRight, CreditCard, CheckCircle } from "lucide-react";
import { usePageMeta } from "@/hooks/use-page-meta";

const steps = [
  { icon: UserPlus, title: "1. Sign Up", description: "Create your account with email and password." },
  { icon: Shield, title: "2. Complete KYC", description: "Submit your identity documents for verification." },
  { icon: FileText, title: "3. Choose Asset & Amount", description: "Select the crypto you want to buy or sell and enter your amount." },
  { icon: ArrowLeftRight, title: "4. Lock Your Rate", description: "Get a live rate and lock it in for a limited time." },
  { icon: CreditCard, title: "5. Make Payment", description: "Complete payment via bank transfer or digital wallet." },
  { icon: CheckCircle, title: "6. Settlement", description: "We process your order and you receive confirmation once settled." },
];

export default function HowItWorksPage() {
  usePageMeta(
    "How It Works — Buy & Sell Crypto in Nepal | Swippee",
    "Learn how to buy and sell crypto in Nepal with Swippee. Simple 6-step process: sign up, complete KYC, request a quote, and settle securely."
  );
  return (
    <PublicLayout>
      <div className="container py-20">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-3xl font-bold tracking-tight">How {BRAND.name} Works</h1>
          <p className="mt-4 text-muted-foreground">A simple, secure process from signup to settlement.</p>
        </div>
        <div className="mx-auto mt-16 max-w-2xl space-y-8">
          {steps.map((step, i) => (
            <div key={i} className="flex gap-5 rounded-lg border bg-card p-6 shadow-card">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-muted">
                <step.icon className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">{step.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-12 text-center">
          <Button variant="hero" asChild><Link to="/auth/signup">Get Started</Link></Button>
        </div>
      </div>
    </PublicLayout>
  );
}
