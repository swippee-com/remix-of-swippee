import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { Shield } from "lucide-react";

interface TotpVerifyModalProps {
  open: boolean;
  onVerified: () => void;
  onCancel: () => void;
}

export function TotpVerifyModal({ open, onVerified, onCancel }: TotpVerifyModalProps) {
  const [token, setToken] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleVerify = async () => {
    if (token.length < 6) return;
    setLoading(true);
    setError("");

    try {
      const { data, error: fnError } = await supabase.functions.invoke("verify-2fa", {
        body: { token },
      });

      if (fnError) {
        // Edge function returned non-2xx status
        const errorMessage = fnError.message || "";
        if (errorMessage.includes("400") || errorMessage.includes("Invalid")) {
          setError("Invalid code. Please try again.");
        } else {
          setError("Verification failed. Please try again.");
        }
        return;
      }

      if (data?.error) {
        setError(data.error === "Invalid code" ? "Invalid code. Please try again." : data.error);
        return;
      }

      if (data?.valid) {
        onVerified();
      } else {
        setError("Invalid code. Please try again.");
      }
    } catch (err: any) {
      const errorMessage = err.message || "";
      if (errorMessage.includes("400") || errorMessage.includes("Invalid")) {
        setError("Invalid code. Please try again.");
      } else {
        setError("Verification failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onCancel()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Two-Factor Authentication
          </DialogTitle>
          <DialogDescription>
            Enter the 6-digit code from your authenticator app, or a backup code.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <Input
            className="text-center font-mono text-lg tracking-[0.5em]"
            maxLength={8}
            value={token}
            onChange={(e) => {
              setToken(e.target.value.replace(/[^a-zA-Z0-9]/g, ""));
              setError("");
            }}
            placeholder="000000"
            autoFocus
            onKeyDown={(e) => e.key === "Enter" && handleVerify()}
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button className="w-full" onClick={handleVerify} disabled={loading || token.length < 6}>
            {loading ? "Verifying…" : "Verify"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
