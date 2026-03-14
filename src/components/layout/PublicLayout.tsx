import { Link, useLocation } from "react-router-dom";
import { BRAND } from "@/config/brand";
import { publicNavItems } from "@/config/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { AdBanner } from "@/components/ads/AdBanner";

export function PublicLayout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

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
            <Button variant="ghost" asChild><Link to="/auth/login">Sign In</Link></Button>
            <Button asChild><Link to="/auth/signup">Get Started</Link></Button>
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
              <Button variant="outline" className="w-full" asChild><Link to="/auth/login">Sign In</Link></Button>
              <Button className="w-full" asChild><Link to="/auth/signup">Get Started</Link></Button>
            </div>
          </div>
        )}
      </header>
      <main className="flex-1">{children}</main>
      <AdBanner placement="public_footer" className="container py-4" />
      <footer className="border-t bg-muted/30">
        <div className="container py-8 text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} {BRAND.name}. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
