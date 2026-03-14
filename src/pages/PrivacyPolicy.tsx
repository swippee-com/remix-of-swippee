import { PublicLayout } from "@/components/layout/PublicLayout";
import { BRAND } from "@/config/brand";
import { usePageMeta } from "@/hooks/use-page-meta";

export default function PrivacyPolicy() {
  usePageMeta(
    "Privacy Policy — Swippee",
    "Swippee's privacy policy. Learn how we protect your personal data and KYC information for crypto trading in Nepal."
  );
  return (
    <PublicLayout>
      <div className="container max-w-3xl py-16 md:py-24">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Privacy Policy</h1>
        <p className="text-sm text-muted-foreground mb-8">Last updated: March 14, 2026</p>

        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-6 text-sm leading-relaxed text-muted-foreground">
          <section>
            <h2 className="text-lg font-semibold text-foreground">1. Information We Collect</h2>
            <p>We collect personal information you provide during registration and KYC verification, including your name, email, phone number, address, date of birth, and identity documents. We also collect usage data, device information, and IP addresses.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">2. How We Use Your Information</h2>
            <p>We use your information to provide and improve our services, verify your identity, process trades, comply with legal obligations, prevent fraud, and communicate with you about your account.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">3. Data Sharing</h2>
            <p>We do not sell your personal data. We may share information with regulatory authorities as required by law, payment processors to facilitate transactions, and service providers who assist our operations under strict confidentiality agreements.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">4. Data Security</h2>
            <p>We implement industry-standard security measures including encryption, secure servers, and access controls. However, no method of transmission over the internet is 100% secure.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">5. Data Retention</h2>
            <p>We retain personal data for as long as your account is active and as required by applicable regulations. KYC records are kept for a minimum of 5 years after account closure as required by AML regulations.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">6. Your Rights</h2>
            <p>You have the right to access, correct, or request deletion of your personal data, subject to legal and regulatory requirements. Contact us to exercise these rights.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">7. Cookies</h2>
            <p>We use essential cookies for authentication and session management. We do not use third-party tracking cookies.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">8. Changes to This Policy</h2>
            <p>We may update this policy periodically. We will notify you of significant changes via email or in-app notification.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">9. Contact</h2>
            <p>For privacy-related inquiries, email <a href={`mailto:${BRAND.supportEmail}`} className="text-foreground underline">{BRAND.supportEmail}</a>.</p>
          </section>
        </div>
      </div>
    </PublicLayout>
  );
}
