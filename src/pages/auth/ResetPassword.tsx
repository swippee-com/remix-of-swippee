import { PublicLayout } from "@/components/layout/PublicLayout";
import { BRAND } from "@/config/brand";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isRecovery, setIsRecovery] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Listen for the PASSWORD_RECOVERY event
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setIsRecovery(true);
      }
    });

    // Also check URL hash for recovery token
    const hash = window.location.hash;
    if (hash.includes("type=recovery")) {
      setIsRecovery(true);
    }

    return () => subscription.unsubscribe();
  }, []);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast({ title: "Passwords don't match", variant: "destructive" });
      return;
    }

    if (password.length < 6) {
      toast({ title: "Password must be at least 6 characters", variant: "destructive" });
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.updateUser({ password });

    setLoading(false);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }

    toast({ title: "Password updated successfully!" });
    navigate("/dashboard", { replace: true });
  };

  if (!isRecovery) {
    return (
      <PublicLayout>
      <div className="flex flex-1 items-center justify-center py-16 px-4">
        <div className="w-full max-w-sm text-center space-y-4">
          <p className="text-sm text-muted-foreground">
            This page is for resetting your password via the link sent to your email.
          </p>
          <Link to="/auth/forgot-password" className="text-sm text-primary hover:underline">
            Request a password reset
          </Link>
        </div>
      </div>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
    <div className="flex flex-1 items-center justify-center py-16 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center">
          <Link to="/" className="text-2xl font-bold tracking-tight">{BRAND.name}</Link>
          <p className="mt-2 text-sm text-muted-foreground">Set your new password</p>
        </div>
        <form className="mt-8 space-y-4" onSubmit={handleReset}>
          <div>
            <label className="text-sm font-medium">New Password</label>
            <Input
              className="mt-1"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>
          <div>
            <label className="text-sm font-medium">Confirm New Password</label>
            <Input
              className="mt-1"
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>
          <Button className="w-full" type="submit" disabled={loading}>
            {loading ? "Updating…" : "Update Password"}
          </Button>
        </form>
      </div>
    </div>
    </PublicLayout>
  );
}
