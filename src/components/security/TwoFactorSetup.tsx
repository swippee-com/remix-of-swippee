import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Shield, ShieldCheck, ShieldOff, Copy, Check } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export function TwoFactorSetup() {
  const { profile, refreshProfile } = useAuth();
  const [step, setStep] = useState<"idle" | "qr" | "backup" | "disabling">("idle");
  const [qrUri, setQrUri] = useState("");
  const [secretKey, setSecretKey] = useState("");
  const [token, setToken] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const is2faEnabled = (profile as any)?.is_2fa_enabled === true;

  const startSetup = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("setup-2fa", {
        method: "POST",
        body: {},
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setQrUri(data.uri);
      setSecretKey(data.secret);
      setStep("qr");
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const verifyAndEnable = async () => {
    if (token.length !== 6) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("setup-2fa", {
        method: "PUT",
        body: { token, action: "enable" },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setBackupCodes(data.backup_codes || []);
      setStep("backup");
      await refreshProfile();
      toast({ title: "2FA enabled!" });
    } catch (err: any) {
      toast({ title: "Verification failed", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const disable2fa = async () => {
    if (token.length !== 6) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("setup-2fa", {
        method: "PUT",
        body: { token, action: "disable" },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setStep("idle");
      setToken("");
      await refreshProfile();
      toast({ title: "2FA disabled" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const copySecret = () => {
    navigator.clipboard.writeText(secretKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (step === "backup") {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-emerald-600" />
          <h3 className="font-medium">2FA Enabled — Save Your Backup Codes</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          Store these codes somewhere safe. Each code can only be used once.
        </p>
        <div className="grid grid-cols-2 gap-2 rounded-lg border bg-muted/30 p-4 font-mono text-sm">
          {backupCodes.map((code) => (
            <span key={code}>{code}</span>
          ))}
        </div>
        <Button variant="outline" onClick={() => { setStep("idle"); setToken(""); }}>
          Done
        </Button>
      </div>
    );
  }

  if (step === "qr") {
    return (
      <div className="space-y-4">
        <h3 className="font-medium">Set Up Two-Factor Authentication</h3>
        <p className="text-sm text-muted-foreground">
          Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.),
          or manually enter the key below.
        </p>
        <div className="flex justify-center rounded-lg border bg-background p-4">
          <img
            src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrUri)}`}
            alt="2FA QR Code"
            className="h-48 w-48"
          />
        </div>
        <div className="flex items-center gap-2">
          <code className="flex-1 rounded border bg-muted/30 px-3 py-2 text-xs break-all">
            {secretKey}
          </code>
          <Button variant="ghost" size="icon" onClick={copySecret}>
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </Button>
        </div>
        <div>
          <label className="text-sm font-medium">Enter 6-digit code from your app</label>
          <Input
            className="mt-1 max-w-48 font-mono tracking-widest"
            maxLength={6}
            value={token}
            onChange={(e) => setToken(e.target.value.replace(/\D/g, ""))}
            placeholder="000000"
          />
        </div>
        <div className="flex gap-2">
          <Button onClick={verifyAndEnable} disabled={loading || token.length !== 6}>
            {loading ? "Verifying…" : "Verify & Enable"}
          </Button>
          <Button variant="ghost" onClick={() => { setStep("idle"); setToken(""); }}>
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  if (step === "disabling") {
    return (
      <div className="space-y-4">
        <h3 className="font-medium">Disable Two-Factor Authentication</h3>
        <p className="text-sm text-muted-foreground">
          Enter a 6-digit code from your authenticator to confirm.
        </p>
        <Input
          className="max-w-48 font-mono tracking-widest"
          maxLength={6}
          value={token}
          onChange={(e) => setToken(e.target.value.replace(/\D/g, ""))}
          placeholder="000000"
        />
        <div className="flex gap-2">
          <Button variant="destructive" onClick={disable2fa} disabled={loading || token.length !== 6}>
            {loading ? "Disabling…" : "Disable 2FA"}
          </Button>
          <Button variant="ghost" onClick={() => { setStep("idle"); setToken(""); }}>
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  // Idle state
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-muted-foreground" />
          <div>
            <h3 className="font-medium">Two-Factor Authentication</h3>
            <p className="text-sm text-muted-foreground">
              Add an extra layer of security to your account.
            </p>
          </div>
        </div>
        {is2faEnabled && (
          <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">Enabled</Badge>
        )}
      </div>
      {is2faEnabled ? (
        <Button variant="outline" onClick={() => { setStep("disabling"); setToken(""); }}>
          <ShieldOff className="mr-2 h-4 w-4" />
          Disable 2FA
        </Button>
      ) : (
        <Button variant="outline" onClick={startSetup} disabled={loading}>
          <ShieldCheck className="mr-2 h-4 w-4" />
          {loading ? "Setting up…" : "Enable 2FA"}
        </Button>
      )}
    </div>
  );
}
