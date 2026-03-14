import { Link, useLocation, useNavigate } from "react-router-dom";
import { BRAND } from "@/config/brand";
import { adminNavItems } from "@/config/navigation";
import { cn } from "@/lib/utils";
import { LogOut, Menu, X, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NotificationBell } from "@/components/shared/NotificationBell";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const initials = profile?.full_name
    ? profile.full_name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "A";

  const NavContent = () => (
    <nav className="flex-1 space-y-1 px-3 py-4">
      {adminNavItems.map((item) => {
        const Icon = item.icon;
        const active = location.pathname === item.href || (item.href !== "/admin" && location.pathname.startsWith(item.href));
        return (
          <Link
            key={item.href}
            to={item.href}
            onClick={() => setSidebarOpen(false)}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              active ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}
          >
            <Icon className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen bg-muted/20">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r bg-card lg:flex">
        <div className="flex h-16 items-center gap-2 border-b px-6">
          <ShieldCheck className="h-5 w-5 text-primary" />
          <Link to="/admin" className="text-lg font-bold tracking-tight">Admin</Link>
        </div>
        <NavContent />
        <div className="border-t p-3">
          <Button variant="ghost" className="w-full justify-start gap-2 text-muted-foreground" onClick={handleSignOut}>
            <LogOut className="h-4 w-4" /> Sign Out
          </Button>
        </div>
      </aside>

      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-foreground/20" onClick={() => setSidebarOpen(false)} />
          <aside className="fixed inset-y-0 left-0 w-60 flex-col border-r bg-card flex">
            <div className="flex h-16 items-center justify-between border-b px-6">
              <span className="text-lg font-bold flex items-center gap-2"><ShieldCheck className="h-5 w-5" /> Admin</span>
              <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(false)}><X className="h-4 w-4" /></Button>
            </div>
            <NavContent />
          </aside>
        </div>
      )}

      <div className="lg:pl-60">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background/95 px-4 backdrop-blur lg:px-8">
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>
          <div className="hidden lg:block" />
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon"><Bell className="h-4 w-4" /></Button>
            <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-xs font-medium text-primary-foreground">
              {initials}
            </div>
          </div>
        </header>
        <main className="p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
