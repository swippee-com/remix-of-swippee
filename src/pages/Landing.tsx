import { PublicLayout } from "@/components/layout/PublicLayout";
import { BRAND } from "@/config/brand";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, Shield, Clock, Wallet, CheckCircle, LayoutDashboard } from "lucide-react";
import { motion } from "framer-motion";
import { SponsorStrip } from "@/components/ads/SponsorStrip";
import { useAuth } from "@/contexts/AuthContext";

const features = [
  { icon: Shield, title: "KYC Verified", description: "All users are verified before trading. Your security is our priority." },
  { icon: Clock, title: "Quote-Based Trading", description: "Request a quote and get competitive rates within minutes from our desk." },
  { icon: Wallet, title: "Multi-Asset Support", description: `Trade ${BRAND.supportedAssets.join(", ")} with seamless settlement.` },
  { icon: CheckCircle, title: "Manual Settlement", description: "Every trade is settled manually with full audit trail and transparency." },
];

const steps = [
  { step: "01", title: "Create Account", description: "Sign up and complete KYC verification to start trading." },
  { step: "02", title: "Request a Quote", description: "Tell us what you want to buy or sell and the amount." },
  { step: "03", title: "Accept & Settle", description: "Accept your quote, make payment, and receive settlement." },
];

export default function LandingPage() {
  return (
    <PublicLayout>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="container py-24 md:py-32">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mx-auto max-w-3xl text-center"
          >
            <div className="mb-4 inline-flex items-center rounded-full border bg-muted px-4 py-1.5 text-xs font-medium text-muted-foreground">
              Trusted OTC Crypto Desk
            </div>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
              Buy & Sell Crypto{" "}
              <span className="block text-muted-foreground">With Confidence</span>
            </h1>
            <p className="mt-6 text-lg text-muted-foreground text-balance">
              {BRAND.description}
            </p>
            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Button variant="hero" asChild>
                <Link to="/auth/signup">Get Started <ArrowRight className="ml-1 h-4 w-4" /></Link>
              </Button>
              <Button variant="hero-outline" asChild>
                <Link to="/how-it-works">How It Works</Link>
              </Button>
            </div>
          </motion.div>
        </div>
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-muted/50 via-background to-background" />
      </section>

      {/* Features */}
      <section className="border-t bg-muted/20">
        <div className="container py-20">
          <h2 className="text-center text-2xl font-semibold tracking-tight">Why {BRAND.name}?</h2>
          <p className="mx-auto mt-2 max-w-lg text-center text-muted-foreground">A professional OTC desk built for trust and transparency.</p>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="rounded-lg border bg-card p-6 shadow-card"
              >
                <f.icon className="h-8 w-8 text-primary" />
                <h3 className="mt-4 font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{f.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <SponsorStrip />

      {/* Steps */}
      <section className="border-t">
        <div className="container py-20">
          <h2 className="text-center text-2xl font-semibold tracking-tight">How It Works</h2>
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {steps.map((s, i) => (
              <div key={i} className="text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
                  {s.step}
                </div>
                <h3 className="mt-4 font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{s.description}</p>
              </div>
            ))}
          </div>
          <div className="mt-12 text-center">
            <Button variant="hero" asChild>
              <Link to="/auth/signup">Start Trading <ArrowRight className="ml-1 h-4 w-4" /></Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Supported Assets */}
      <section className="border-t bg-muted/20">
        <div className="container py-16 text-center">
          <h2 className="text-2xl font-semibold tracking-tight">Supported Assets</h2>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            {BRAND.supportedAssets.map((asset) => (
              <div key={asset} className="rounded-lg border bg-card px-6 py-4 shadow-card">
                <span className="text-lg font-semibold">{asset}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t">
        <div className="container py-20 text-center">
          <h2 className="text-2xl font-semibold tracking-tight">Ready to Trade?</h2>
          <p className="mt-2 text-muted-foreground">Join {BRAND.name} and start trading crypto securely.</p>
          <div className="mt-6 flex justify-center gap-3">
            <Button variant="hero" asChild><Link to="/auth/signup">Get Started</Link></Button>
            <Button variant="hero-outline" asChild><Link to="/support">Contact Support</Link></Button>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
