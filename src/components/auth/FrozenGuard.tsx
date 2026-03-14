import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Wraps dashboard routes that should be blocked when account is frozen.
 * Allowed routes when frozen: /dashboard, /dashboard/settings, /dashboard/support
 */
const ALLOWED_FROZEN_PATHS = ["/dashboard", "/dashboard/settings", "/dashboard/support"];

export function FrozenGuard({ children }: { children: React.ReactNode }) {
  const { profile } = useAuth();
  const location = useLocation();

  if (profile?.is_frozen && !ALLOWED_FROZEN_PATHS.includes(location.pathname)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
