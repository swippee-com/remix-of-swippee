import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { toast } from "sonner";
import { CheckCircle, Phone } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

interface PhoneVerificationProps {
  phone: string;
  onPhoneChange: (phone: string) => void;
  verified: boolean;
  onVerified: () => void;
  compact?: boolean;
}

export function PhoneVerification({
  phone,
  onPhoneChange,
  verified,
  onVerified,
  compact = false,
}: PhoneVerificationProps) {
  const [step, setStep] = useState<"input" | "otp">("input");
  const [otpCode, setOtpCode] = useState("");
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const handleSendOtp = async () => {
    if (!phone || phone.replace(/\D/g, "").length < 10) {
      toast.error("Enter a valid phone number");
      return;
    }
    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-phone-otp", {
        body: { phone },
      });
      if (error || data?.error) {
        toast.error(data?.error || "Failed to send OTP");
      } else {
        toast.success("Verification code sent!");
        setStep("otp");
      }
    } catch {
      toast.error("Failed to send verification code");
    }
    setSending(false);
  };

  const handleVerify = async () => {
    if (otpCode.length !== 6) return;
    setVerifying(true);
    try {
      const { data, error } = await supabase.functions.invoke("verify-phone-otp", {
        body: { phone, code: otpCode },
      });
      if (error || data?.error) {
        toast.error(data?.error || "Verification failed");
      } else {
        toast.success("Phone number verified!");
        onVerified();
        setStep("input");
        setOtpCode("");
      }
    } catch {
      toast.error("Verification failed");
    }
    setVerifying(false);
  };

  if (verified) {
    return (
      <div className={cn("flex items-center gap-2", compact && "text-sm")}>
        <Phone className="h-4 w-4 text-muted-foreground" />
        <span>{phone}</span>
        <CheckCircle className="h-4 w-4 text-success" />
        <span className="text-xs text-success font-medium">Verified</span>
      </div>
    );
  }

  if (step === "otp") {
    return (
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Enter the 6-digit code sent to <strong>{phone}</strong>
        </p>
        <InputOTP maxLength={6} value={otpCode} onChange={setOtpCode}>
          <InputOTPGroup>
            <InputOTPSlot index={0} />
            <InputOTPSlot index={1} />
            <InputOTPSlot index={2} />
            <InputOTPSlot index={3} />
            <InputOTPSlot index={4} />
            <InputOTPSlot index={5} />
          </InputOTPGroup>
        </InputOTP>
        <div className="flex gap-2">
          <Button size="sm" onClick={handleVerify} disabled={verifying || otpCode.length !== 6}>
            {verifying ? "Verifying…" : "Verify"}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => { setStep("input"); setOtpCode(""); }}>
            Change number
          </Button>
          <Button size="sm" variant="ghost" onClick={handleSendOtp} disabled={sending}>
            Resend
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input
          placeholder="98XXXXXXXX"
          value={phone}
          onChange={(e) => onPhoneChange(e.target.value)}
          className="flex-1"
        />
        <Button size="sm" onClick={handleSendOtp} disabled={sending || !phone}>
          {sending ? "Sending…" : "Send OTP"}
        </Button>
      </div>
    </div>
  );
}
