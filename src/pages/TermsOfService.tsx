import { PublicLayout } from "@/components/layout/PublicLayout";
import { BRAND } from "@/config/brand";

export default function TermsOfService() {
  return (
    <PublicLayout>
      <div className="container max-w-3xl py-16 md:py-24">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Terms of Service</h1>
        <p className="text-sm text-muted-foreground mb-8">Last updated: March 14, 2026</p>

        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-6 text-sm leading-relaxed text-muted-foreground">
          <section>
            <h2 className="text-lg font-semibold text-foreground">1. Acceptance of Terms</h2>
            <p>By accessing or using {BRAND.name} ("the Platform"), you agree to be bound by these Terms of Service. If you do not agree, do not use the Platform.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">2. Eligibility</h2>
            <p>You must be at least 18 years old and legally permitted in your jurisdiction to use cryptocurrency services. By registering, you confirm you meet these requirements.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">3. Account Registration</h2>
            <p>You must provide accurate, current, and complete information during registration. You are responsible for maintaining the confidentiality of your account credentials and for all activities under your account.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">4. KYC & Verification</h2>
            <p>All users must complete Know Your Customer (KYC) verification before trading. We reserve the right to refuse service or freeze accounts that fail verification or are flagged for suspicious activity.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">5. Trading & Settlement</h2>
            <p>{BRAND.name} operates as an OTC desk with manual settlement. Quotes are time-limited and binding once accepted. All trades are final after settlement confirmation.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">6. Fees</h2>
            <p>Fees are disclosed at the time of quoting. By accepting a quote, you agree to the fees included. Fee schedules may change; current rates are available on the Fees page.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">7. Prohibited Activities</h2>
            <p>You may not use {BRAND.name} for money laundering, terrorist financing, fraud, or any illegal activity. We monitor transactions and report suspicious activity as required by law.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">8. Limitation of Liability</h2>
            <p>{BRAND.name} is not liable for losses due to market volatility, network delays, third-party failures, or force majeure events. Use the Platform at your own risk.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">9. Account Termination</h2>
            <p>We may suspend or terminate your account at our discretion for violations of these terms, suspicious activity, or regulatory requirements.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">10. Changes to Terms</h2>
            <p>We may update these terms at any time. Continued use of the Platform after changes constitutes acceptance. Material changes will be communicated via email or in-app notification.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">11. Contact</h2>
            <p>For questions about these terms, contact us at <a href={`mailto:${BRAND.supportEmail}`} className="text-foreground underline">{BRAND.supportEmail}</a>.</p>
          </section>
        </div>
      </div>
    </PublicLayout>
  );
}
