import { PublicLayout } from "@/components/layout/PublicLayout";
import { BRAND } from "@/config/brand";
import { usePageMeta } from "@/hooks/use-page-meta";

export default function RefundPolicy() {
  usePageMeta(
    "Refund & Cancellation Policy — Swippee",
    "Swippee's refund and cancellation policy for OTC crypto trades in Nepal."
  );
  return (
    <PublicLayout>
      <div className="container max-w-3xl py-16 md:py-24">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Refund & Cancellation Policy</h1>
        <p className="text-sm text-muted-foreground mb-8">Last updated: March 14, 2026</p>

        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-6 text-sm leading-relaxed text-muted-foreground">
          <section>
            <h2 className="text-lg font-semibold text-foreground">1. Quote Cancellation</h2>
            <p>You may cancel a quote request at any time before accepting a quote. Once a quote is accepted, the trade is considered binding.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">2. Trade Cancellation</h2>
            <p>Trades may only be cancelled before settlement begins. Once payment has been made or crypto has been transferred, trades cannot be reversed.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">3. Refund Eligibility</h2>
            <p>Refunds are considered on a case-by-case basis for:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Overpayments due to user error</li>
              <li>Failed settlements due to system errors</li>
              <li>Duplicate transactions</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">4. Non-Refundable Items</h2>
            <p>Trading fees, network fees, and completed settlements are non-refundable. Market price differences between the time of trade and refund request are not eligible for refund.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">5. Refund Process</h2>
            <p>To request a refund, open a support ticket with your trade ID and reason. Refunds are processed within 7–14 business days via the original payment method.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">6. Disputes</h2>
            <p>If you believe a trade was settled incorrectly, raise a dispute through the trade detail page within 48 hours of settlement. Our team will investigate and respond within 5 business days.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">7. Contact</h2>
            <p>For refund inquiries, contact <a href={`mailto:${BRAND.supportEmail}`} className="text-foreground underline">{BRAND.supportEmail}</a>.</p>
          </section>
        </div>
      </div>
    </PublicLayout>
  );
}
