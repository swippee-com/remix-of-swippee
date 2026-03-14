import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useMutation } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { toast } from "@/hooks/use-toast";
import { TwoFactorSetup } from "@/components/security/TwoFactorSetup";
import { ActiveSessions } from "@/components/security/ActiveSessions";
import { LoginHistory } from "@/components/security/LoginHistory";
import { RateLimitIndicator } from "@/components/security/RateLimitIndicator";
import { useTheme, Theme } from "@/hooks/use-theme";
import { Sun, Moon, Monitor } from "lucide-react";

export default function SettingsPage() {
  const { profile, user, refreshProfile } = useAuth();
  const { theme, setTheme } = useTheme();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [country, setCountry] = useState("");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || "");
      setPhone(profile.phone || "");
      setCountry(profile.country || "");
    }
  }, [profile]);

  const profileMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: fullName,
          phone: phone || null,
          country: country || null,
        })
        .eq("id", user!.id);
      if (error) throw error;
    },
    onSuccess: async () => {
      await refreshProfile();
      toast({ title: "Profile updated" });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const passwordMutation = useMutation({
    mutationFn: async () => {
      if (newPassword.length < 6) throw new Error("Password must be at least 6 characters.");
      if (newPassword !== confirmPassword) throw new Error("Passwords do not match.");
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
    },
    onSuccess: () => {
      setNewPassword("");
      setConfirmPassword("");
      toast({ title: "Password updated" });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  return (
    <DashboardLayout>
      <PageHeader title="Settings" description="Manage your account settings." />
      <div className="mt-6 max-w-2xl space-y-8">
        {/* Appearance Section */}
        <section className="rounded-lg border bg-card p-6 shadow-card">
          <h2 className="font-semibold">Appearance</h2>
          <p className="mt-1 text-sm text-muted-foreground">Choose your preferred theme.</p>
          <div className="mt-4 flex gap-2">
            {([
              { value: "light" as Theme, label: "Light", icon: Sun },
              { value: "dark" as Theme, label: "Dark", icon: Moon },
              { value: "system" as Theme, label: "System", icon: Monitor },
            ]).map(({ value, label, icon: Icon }) => (
              <Button
                key={value}
                variant={theme === value ? "default" : "outline"}
                size="sm"
                onClick={() => setTheme(value)}
                className="gap-2"
              >
                <Icon className="h-4 w-4" />
                {label}
              </Button>
            ))}
          </div>
        </section>

        {/* Profile Section */}
        <section className="rounded-lg border bg-card p-6 shadow-card">
          <h2 className="font-semibold">Profile</h2>
          <form onSubmit={(e) => { e.preventDefault(); profileMutation.mutate(); }} className="mt-4 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium">Full Name</label>
                <Input className="mt-1" value={fullName} onChange={(e) => setFullName(e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-medium">Email</label>
                <Input className="mt-1" type="email" value={user?.email || ""} disabled />
              </div>
              <div>
                <label className="text-sm font-medium">Phone</label>
                <Input className="mt-1" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-medium">Country</label>
                <Input className="mt-1" value={country} onChange={(e) => setCountry(e.target.value)} />
              </div>
            </div>
            <Button type="submit" disabled={profileMutation.isPending}>
              {profileMutation.isPending ? "Saving…" : "Save Changes"}
            </Button>
          </form>
        </section>

        {/* Security Section */}
        <section className="rounded-lg border bg-card p-6 shadow-card">
          <h2 className="font-semibold">Security</h2>

          {/* Password */}
          <form onSubmit={(e) => { e.preventDefault(); passwordMutation.mutate(); }} className="mt-4 space-y-4">
            <div>
              <label className="text-sm font-medium">New Password</label>
              <Input className="mt-1" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Min 6 characters" />
            </div>
            <div>
              <label className="text-sm font-medium">Confirm New Password</label>
              <Input className="mt-1" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
            </div>
            <Button type="submit" disabled={passwordMutation.isPending}>
              {passwordMutation.isPending ? "Updating…" : "Update Password"}
            </Button>
          </form>

          <Separator className="my-6" />

          {/* Two-Factor Authentication */}
          <TwoFactorSetup />
        </section>

        {/* Active Sessions */}
        <section className="rounded-lg border bg-card p-6 shadow-card">
          <h2 className="mb-4 font-semibold">Active Sessions</h2>
          <ActiveSessions />
        </section>

        {/* Login History */}
        <section className="rounded-lg border bg-card p-6 shadow-card">
          <h2 className="mb-4 font-semibold">Login History</h2>
          <LoginHistory />
        </section>

        {/* Rate Limiting */}
        <section className="rounded-lg border bg-card p-6 shadow-card">
          <h2 className="mb-4 font-semibold">Usage</h2>
          <RateLimitIndicator />
        </section>
      </div>
    </DashboardLayout>
  );
}
