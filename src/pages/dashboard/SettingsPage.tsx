import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { useMutation } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { toast } from "@/hooks/use-toast";
import { TwoFactorSetup } from "@/components/security/TwoFactorSetup";
import { ActiveSessions } from "@/components/security/ActiveSessions";
import { LoginHistory } from "@/components/security/LoginHistory";
import { RateLimitIndicator } from "@/components/security/RateLimitIndicator";
import { PhoneVerification } from "@/components/shared/PhoneVerification";
import { useTheme, Theme } from "@/hooks/use-theme";
import { Sun, Moon, Monitor, Globe } from "lucide-react";
import type { Locale } from "@/i18n";

export default function SettingsPage() {
  const { profile, user, refreshProfile } = useAuth();
  const { theme, setTheme } = useTheme();
  const { locale, setLocale, t } = useLanguage();
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
      <PageHeader title={t("settings.title")} description={t("settings.description")} />
      <div className="mt-6 space-y-8">
        {/* Top row: Language + Appearance side by side */}
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Language Section */}
          <section className="rounded-lg border bg-card p-6 shadow-card">
            <h2 className="font-semibold">{t("settings.language")}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{t("settings.languageDesc")}</p>
            <div className="mt-4 flex gap-2">
              {([
                { value: "en" as Locale, label: "English" },
                { value: "ne" as Locale, label: "नेपाली" },
              ]).map(({ value, label }) => (
                <Button
                  key={value}
                  variant={locale === value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setLocale(value)}
                  className="gap-2"
                >
                  <Globe className="h-4 w-4" />
                  {label}
                </Button>
              ))}
            </div>
          </section>

          {/* Appearance Section */}
          <section className="rounded-lg border bg-card p-6 shadow-card">
            <h2 className="font-semibold">{t("settings.appearance")}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{t("settings.appearanceDesc")}</p>
            <div className="mt-4 flex gap-2">
              {([
                { value: "light" as Theme, label: t("settings.light"), icon: Sun },
                { value: "dark" as Theme, label: t("settings.dark"), icon: Moon },
                { value: "system" as Theme, label: t("settings.system"), icon: Monitor },
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
        </div>

        {/* Profile + Security side by side */}
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Profile Section */}
          <section className="rounded-lg border bg-card p-6 shadow-card">
            <h2 className="font-semibold">{t("settings.profile")}</h2>
            <form onSubmit={(e) => { e.preventDefault(); profileMutation.mutate(); }} className="mt-4 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-medium">{t("settings.fullName")}</label>
                  <Input className="mt-1" value={fullName} onChange={(e) => setFullName(e.target.value)} />
                </div>
                <div>
                  <label className="text-sm font-medium">{t("settings.email")}</label>
                  <Input className="mt-1" type="email" value={user?.email || ""} disabled />
                </div>
                <div>
                  <label className="text-sm font-medium">{t("settings.phone")}</label>
                  <div className="mt-1">
                    <PhoneVerification
                      phone={phone}
                      onPhoneChange={setPhone}
                      verified={profile?.phone_verified ?? false}
                      onVerified={() => refreshProfile()}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">{t("settings.country")}</label>
                  <Input className="mt-1" value={country} onChange={(e) => setCountry(e.target.value)} />
                </div>
              </div>
              <Button type="submit" disabled={profileMutation.isPending}>
                {profileMutation.isPending ? t("settings.saving") : t("settings.saveChanges")}
              </Button>
            </form>
          </section>

          {/* Security Section */}
          <section className="rounded-lg border bg-card p-6 shadow-card">
            <h2 className="font-semibold">{t("settings.security")}</h2>
            <form onSubmit={(e) => { e.preventDefault(); passwordMutation.mutate(); }} className="mt-4 space-y-4">
              <div>
                <label className="text-sm font-medium">{t("settings.newPassword")}</label>
                <Input className="mt-1" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder={t("settings.minChars")} />
              </div>
              <div>
                <label className="text-sm font-medium">{t("settings.confirmPassword")}</label>
                <Input className="mt-1" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
              </div>
              <Button type="submit" disabled={passwordMutation.isPending}>
                {passwordMutation.isPending ? t("settings.updating") : t("settings.updatePassword")}
              </Button>
            </form>
            <Separator className="my-6" />
            <TwoFactorSetup />
          </section>
        </div>

        {/* Sessions + Login History side by side */}
        <div className="grid gap-8 lg:grid-cols-2">
          <section className="rounded-lg border bg-card p-6 shadow-card">
            <h2 className="mb-4 font-semibold">{t("settings.activeSessions")}</h2>
            <ActiveSessions />
          </section>

          <section className="rounded-lg border bg-card p-6 shadow-card">
            <h2 className="mb-4 font-semibold">{t("settings.loginHistory")}</h2>
            <LoginHistory />
          </section>
        </div>

        {/* Rate Limiting - full width */}
        <section className="rounded-lg border bg-card p-6 shadow-card">
          <h2 className="mb-4 font-semibold">{t("settings.usage")}</h2>
          <RateLimitIndicator />
        </section>
      </div>
    </DashboardLayout>
  );
}
