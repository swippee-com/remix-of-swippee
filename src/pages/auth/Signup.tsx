import { BRAND } from "@/config/brand";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";

export default function SignupPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { session, isLoading } = useAuth();

  if (!isLoading && session) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSignup = async (e: React.FormEvent) => {
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

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: window.location.origin,
      },
    });

    if (error) {
      toast({ title: "Signup failed", description: error.message, variant: "destructive" });
      setLoading(false);
      return;
    }

    toast({
      title: "Account created!",
      description: "Check your email to verify your account, or sign in now.",
    });
    navigate("/auth/login");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/20 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center">
          <Link to="/" className="text-2xl font-bold tracking-tight">{BRAND.name}</Link>
          <p className="mt-2 text-sm text-muted-foreground">Create your account</p>
        </div>
        <form className="mt-8 space-y-4" onSubmit={handleSignup}>
          <div>
            <label className="text-sm font-medium">Full Name</label>
            <Input
              className="mt-1"
              placeholder="Your full name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>
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
            <label className="text-sm font-medium">Password</label>
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
            <label className="text-sm font-medium">Confirm Password</label>
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
            {loading ? "Creating account…" : "Create Account"}
          </Button>
        </form>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link to="/auth/login" className="font-medium text-foreground hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
