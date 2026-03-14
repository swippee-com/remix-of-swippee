import { PublicLayout } from "@/components/layout/PublicLayout";
import { BRAND } from "@/config/brand";

export default function FeesPage() {
  return (
    <PublicLayout>
      <div className="container py-20">
        <div className="mx-auto max-w-2xl">
          <h1 className="text-3xl font-bold tracking-tight">Fees</h1>
          <p className="mt-4 text-muted-foreground">Transparent pricing with no hidden charges.</p>
          <div className="mt-8 space-y-6">
            <div className="rounded-lg border bg-card p-6 shadow-card">
              <h2 className="font-semibold">Trading Fees</h2>
              <p className="mt-2 text-sm text-muted-foreground">Our OTC trading fee is applied per trade and disclosed upfront in every quote. Fees vary based on trade size, asset, and market conditions.</p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="rounded-md bg-muted p-4">
                  <p className="text-sm font-medium">Standard Trades</p>
                  <p className="mt-1 text-2xl font-semibold">0.5 – 1.5%</p>
                  <p className="mt-1 text-xs text-muted-foreground">Per transaction</p>
                </div>
                <div className="rounded-md bg-muted p-4">
                  <p className="text-sm font-medium">Large Volume</p>
                  <p className="mt-1 text-2xl font-semibold">Negotiable</p>
                  <p className="mt-1 text-xs text-muted-foreground">Contact our desk</p>
                </div>
              </div>
            </div>
            <div className="rounded-lg border bg-card p-6 shadow-card">
              <h2 className="font-semibold">Network Fees</h2>
              <p className="mt-2 text-sm text-muted-foreground">Blockchain network fees are passed through at cost. The fee depends on the network used (e.g., TRC20 is typically lower than ERC20).</p>
            </div>
            <div className="rounded-lg border bg-card p-6 shadow-card">
              <h2 className="font-semibold">No Hidden Fees</h2>
              <p className="mt-2 text-sm text-muted-foreground">Every quote includes all applicable fees. What you see is what you pay. No account fees, no deposit fees, no surprise charges.</p>
            </div>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
