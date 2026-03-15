import { Link, useLocation } from "react-router-dom";
import { BRAND } from "@/config/brand";
import { publicNavItems } from "@/config/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Menu, X, LayoutDashboard } from "lucide-react";
import { useState } from "react";
import { AdBanner } from "@/components/ads/AdBanner";
import { useAuth } from "@/contexts/AuthContext";
import { BackToTop } from "@/components/shared/BackToTop";

const footerLinks = {
  product: [
    { label: "How It Works", href: "/how-it-works" },
    { label: "Fees", href: "/fees" },
    { label: "Live Prices", href: "/live" },
    { label: "Support", href: "/support" },
  ],
  company: [
    { label: "About", href: "/about" },
  ],
  legal: [
    { label: "Terms of Service", href: "/terms" },
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Refund Policy", href: "/refund-policy" },
    { label: "AML & KYC Policy", href: "/aml-policy" },
  ],
};

export function PublicLayout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const { user } = useAuth();

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/" className="text-xl font-bold tracking-tight">{BRAND.name}</Link>
          <nav className="hidden md:flex items-center gap-6">
            {publicNavItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "text-sm font-medium transition-colors hover:text-foreground",
                  location.pathname === item.href ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <Button asChild><Link to="/dashboard"><LayoutDashboard className="mr-1.5 h-4 w-4" /> Dashboard</Link></Button>
            ) : (
              <>
                <Button variant="ghost" asChild><Link to="/auth/login">Sign In</Link></Button>
                <Button asChild><Link to="/auth/signup">Get Started</Link></Button>
              </>
            )}
          </div>
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
        {mobileOpen && (
          <div className="md:hidden border-t bg-background px-4 py-4 space-y-3">
            {publicNavItems.map((item) => (
              <Link key={item.href} to={item.href} className="block text-sm font-medium text-muted-foreground hover:text-foreground" onClick={() => setMobileOpen(false)}>
                {item.label}
              </Link>
            ))}
            <div className="pt-3 border-t space-y-2">
              {user ? (
                <Button className="w-full" asChild><Link to="/dashboard">Dashboard</Link></Button>
              ) : (
                <>
                  <Button variant="outline" className="w-full" asChild><Link to="/auth/login">Sign In</Link></Button>
                  <Button className="w-full" asChild><Link to="/auth/signup">Get Started</Link></Button>
                </>
              )}
            </div>
          </div>
        )}
      </header>
      <main className="flex-1">{children}</main>
      <AdBanner placement="public_footer" className="container py-4" />
      <footer className="border-t bg-muted/30">
        <div className="container py-12 md:py-16">
          <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-4">
            {/* Brand */}
            <div>
              <Link to="/" className="text-lg font-bold tracking-tight">{BRAND.name}</Link>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{BRAND.tagline}</p>
              <p className="mt-3 text-xs text-muted-foreground">{BRAND.supportEmail}</p>
            </div>

            {/* Product */}
            <div>
              <h3 className="text-sm font-semibold mb-3">Product</h3>
              <ul className="space-y-2">
                {footerLinks.product.map((link) => (
                  <li key={link.href}>
                    <Link to={link.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">{link.label}</Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Company */}
            <div>
              <h3 className="text-sm font-semibold mb-3">Company</h3>
              <ul className="space-y-2">
                {footerLinks.company.map((link) => (
                  <li key={link.href}>
                    <Link to={link.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">{link.label}</Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h3 className="text-sm font-semibold mb-3">Legal</h3>
              <ul className="space-y-2">
                {footerLinks.legal.map((link) => (
                  <li key={link.href}>
                    <Link to={link.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">{link.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-10 border-t pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} {BRAND.name}. All rights reserved.</p>
            <p className="text-xs text-muted-foreground">Cryptocurrency trading involves risk. Please trade responsibly.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
