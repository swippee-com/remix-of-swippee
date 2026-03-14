import { PublicLayout } from "@/components/layout/PublicLayout";
import { BRAND } from "@/config/brand";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { TotpVerifyModal } from "@/components/security/TotpVerifyModal";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [show2fa, setShow2fa] = useState(false);
  const [pendingLogin, setPendingLogin] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { session, isLoading } = useAuth();

  const from = (location.state as any)?.from?.pathname || "/dashboard";

  // Only auto-redirect if not in the middle of a login/2FA flow
  if (!isLoading && session && !show2fa && !pendingLogin) {
    return <Navigate to={from} replace />;
  }

  const completeLogin = async () => {
    supabase.functions.invoke("track-login", {
      body: { login_method: "password", session_id: session?.access_token?.slice(-12) || "" },
    });

    // Check if account is frozen
    const { data: frozenCheck } = await supabase
      .from("profiles")
      .select("is_frozen")
      .eq("id", session?.user?.id || "")
      .single();

    if (frozenCheck?.is_frozen) {
      toast({
        title: "Account Frozen",
        description: "This account is currently frozen. You cannot perform any transactions. Please contact support.",
        variant: "destructive",
      });
    } else {
      toast({ title: "Welcome back!" });
    }

    setPendingLogin(false);
    navigate(from, { replace: true });
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setPendingLogin(true);

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      toast({ title: "Login failed", description: error.message, variant: "destructive" });
      setLoading(false);
      setPendingLogin(false);
      return;
    }

    // Check if 2FA is enabled
    const { data: profileData } = await supabase
      .from("profiles")
      .select("is_2fa_enabled")
      .eq("id", data.user.id)
      .single();

    if ((profileData as any)?.is_2fa_enabled) {
      setShow2fa(true);
      setLoading(false);
      return;
    }

    // No 2FA — complete login
    supabase.functions.invoke("track-login", {
      body: { login_method: "password", session_id: data.session?.access_token?.slice(-12) || "" },
    });

    // Check if account is frozen
    const { data: frozenCheck } = await supabase
      .from("profiles")
      .select("is_frozen")
      .eq("id", data.user.id)
      .single();

    if (frozenCheck?.is_frozen) {
      toast({
        title: "Account Frozen",
        description: "This account is currently frozen. You cannot perform any transactions. Please contact support.",
        variant: "destructive",
      });
    } else {
      toast({ title: "Welcome back!" });
    }

    setPendingLogin(false);
    navigate(from, { replace: true });
  };

  const handle2faCancel = async () => {
    await supabase.auth.signOut();
    setShow2fa(false);
    setPendingLogin(false);
  };

  return (
    <PublicLayout>
    <div className="flex flex-1 items-center justify-center py-16 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center">
          <Link to="/" className="text-2xl font-bold tracking-tight">{BRAND.name}</Link>
          <p className="mt-2 text-sm text-muted-foreground">Sign in to your account</p>
        </div>
        <form className="mt-8 space-y-4" onSubmit={handleLogin}>
          <div>
            <label className="text-sm font-medium">Email</label>
            <Input
              className="mt-1"
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Password</label>
              <Link to="/auth/forgot-password" className="text-xs text-muted-foreground hover:text-foreground">
                Forgot password?
              </Link>
            </div>
            <Input
              className="mt-1"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <Button className="w-full" type="submit" disabled={loading}>
            {loading ? "Signing in…" : "Sign In"}
          </Button>
        </form>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Don't have an account?{" "}
          <Link to="/auth/signup" className="font-medium text-foreground hover:underline">Sign up</Link>
        </p>
      </div>

      <TotpVerifyModal
        open={show2fa}
        onVerified={completeLogin}
        onCancel={handle2faCancel}
      />
    </div>
    </PublicLayout>
  );
}
