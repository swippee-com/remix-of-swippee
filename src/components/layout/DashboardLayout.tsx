import { Link, useLocation, useNavigate } from "react-router-dom";
import { BRAND } from "@/config/brand";
import { userNavItems } from "@/config/navigation";
import { cn } from "@/lib/utils";
import { LogOut, Menu, X, Sun, Moon, Globe, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NotificationBell } from "@/components/shared/NotificationBell";
import { useState } from "react";
import { useTheme } from "@/hooks/use-theme";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { AnnouncementBanner } from "@/components/shared/AnnouncementBanner";
import { AdBanner } from "@/components/ads/AdBanner";
import { SidebarAd } from "@/components/ads/SidebarAd";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();
  const { resolvedTheme, setTheme } = useTheme();
  const { locale, setLocale, t } = useLanguage();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const initials = profile?.full_name
    ? profile.full_name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "U";

  const ALLOWED_FROZEN_PATHS = ["/dashboard", "/dashboard/settings", "/dashboard/support"];
  const isFrozen = profile?.is_frozen ?? false;

  const NavContent = () => (
    <nav className="flex-1 space-y-1 px-3 py-4">
      {userNavItems.map((item) => {
        const Icon = item.icon;
        const active = location.pathname === item.href;
        const isRestricted = isFrozen && !ALLOWED_FROZEN_PATHS.includes(item.href);
        return (
          <Link
            key={item.href}
            to={isRestricted ? "#" : item.href}
            onClick={(e) => {
              if (isRestricted) {
                e.preventDefault();
                return;
              }
              setSidebarOpen(false);
            }}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              active ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
              isRestricted && "opacity-30 blur-[0.5px] pointer-events-auto cursor-not-allowed hover:bg-transparent hover:text-muted-foreground"
            )}
            aria-disabled={isRestricted}
          >
            <Icon className="h-4 w-4" />
            {t(item.labelKey)}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen bg-muted/20">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r bg-card lg:flex">
        <div className="flex h-16 items-center border-b px-6">
          <Link to="/dashboard" className="text-lg font-bold tracking-tight">{BRAND.name}</Link>
        </div>
        <NavContent />
        <div className="border-t p-3">
          <Button variant="ghost" className="w-full justify-start gap-2 text-muted-foreground" onClick={handleSignOut}>
            <LogOut className="h-4 w-4" /> {t("nav.signOut")}
          </Button>
        </div>
      </aside>

      {/* Mobile sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-foreground/20" onClick={() => setSidebarOpen(false)} />
          <aside className="fixed inset-y-0 left-0 w-60 flex-col border-r bg-card flex">
            <div className="flex h-16 items-center justify-between border-b px-6">
              <span className="text-lg font-bold">{BRAND.name}</span>
              <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(false)}><X className="h-4 w-4" /></Button>
            </div>
            <NavContent />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="lg:pl-60">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background/95 px-4 backdrop-blur lg:px-8">
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>
          <div className="hidden lg:block" />
          <div className="flex items-center gap-2">
            {/* Language toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLocale(locale === "en" ? "ne" : "en")}
              aria-label="Toggle language"
              className="text-xs font-bold"
            >
              {locale === "en" ? "ने" : "EN"}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
              aria-label="Toggle theme"
            >
              {resolvedTheme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <NotificationBell />
            <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-xs font-medium text-primary-foreground">
              {initials}
            </div>
          </div>
        </header>
        <main className="p-4 lg:p-8">
          {profile?.is_frozen && (
            <div className="mb-4 flex items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              <ShieldAlert className="h-5 w-5 shrink-0" />
              <p className="font-medium">This account is currently frozen. You cannot perform any transactions. Please contact support.</p>
            </div>
          )}
          <AnnouncementBanner />
          {children}
        </main>
      </div>
    </div>
  );
}
