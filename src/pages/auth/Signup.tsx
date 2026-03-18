import { PublicLayout } from "@/components/layout/PublicLayout";
import { BRAND } from "@/config/brand";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { PhoneVerification } from "@/components/shared/PhoneVerification";

export default function SignupPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { session, isLoading } = useAuth();

  const normalizePhone = (value: string) => {
    let digits = value.replace(/\D/g, "").replace(/^0+/, "");

    if (digits.startsWith("977") && digits.length > 10) {
      digits = digits.slice(-10);
    }

    return digits;
  };

  if (!isLoading && session) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!phoneVerified) {
      toast({ title: "Please verify your phone number first", variant: "destructive" });
      return;
    }

    if (password !== confirmPassword) {
      toast({ title: "Passwords don't match", variant: "destructive" });
      return;
    }

    if (password.length < 8) {
      toast({ title: "Password must be at least 8 characters", variant: "destructive" });
      return;
    }

    if (!/[A-Z]/.test(password) || !/[0-9]/.test(password) || !/[^A-Za-z0-9]/.test(password)) {
      toast({ title: "Password must include uppercase, number, and special character", variant: "destructive" });
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, phone: normalizePhone(phone), phone_verified: true },
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
    <PublicLayout>
    <div className="flex flex-1 items-center justify-center py-16 px-4">
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
            <label className="text-sm font-medium">Phone Number</label>
            <div className="mt-1">
              <PhoneVerification
                phone={phone}
                onPhoneChange={setPhone}
                verified={phoneVerified}
                onVerified={() => setPhoneVerified(true)}
              />
            </div>
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
          <Button className="w-full" type="submit" disabled={loading || !phoneVerified}>
            {loading ? "Creating account…" : "Create Account"}
          </Button>
        </form>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link to="/auth/login" className="font-medium text-foreground hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
    </PublicLayout>
  );
}
