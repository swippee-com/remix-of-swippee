import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, CheckCircle, AlertCircle, Clock, Pencil } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";

const emptyForm = {
  full_legal_name: "", date_of_birth: "", country: "Nepal", nationality: "Nepali",
  phone: "", occupation: "", address_line_1: "", address_line_2: "",
  city: "", postal_code: "", source_of_funds: "", expected_monthly_volume: "",
  id_type: "", id_number: "",
};

export default function KycPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);

  const { data: submission, isLoading } = useQuery({
    queryKey: ["kyc-submission", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("kyc_submissions").select("*").eq("user_id", user!.id).maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    if (editing && submission) {
      setForm({
        full_legal_name: submission.full_legal_name || "", date_of_birth: submission.date_of_birth || "",
        country: submission.country || "Nepal", nationality: submission.nationality || "Nepali",
        phone: submission.phone || "", occupation: submission.occupation || "",
        address_line_1: submission.address_line_1 || "", address_line_2: submission.address_line_2 || "",
        city: submission.city || "", postal_code: submission.postal_code || "",
        source_of_funds: submission.source_of_funds || "", expected_monthly_volume: submission.expected_monthly_volume || "",
        id_type: submission.id_type || "", id_number: submission.id_number || "",
      });
    }
  }, [editing, submission]);

  const idFrontRef = useRef<HTMLInputElement>(null);
  const idBackRef = useRef<HTMLInputElement>(null);
  const selfieRef = useRef<HTMLInputElement>(null);
  const proofRef = useRef<HTMLInputElement>(null);
  const set = (key: string, val: string) => setForm((p) => ({ ...p, [key]: val }));

  const ALLOWED_MIME_TYPES = [
    "image/jpeg", "image/png", "image/gif", "image/webp", "image/bmp",
    "application/pdf",
  ];
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return `Invalid file type "${file.type}" for ${file.name}. Only images and PDFs are allowed.`;
    }
    if (file.size > MAX_FILE_SIZE) {
      return `File ${file.name} is too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Maximum is 10MB.`;
    }
    return null;
  };

  const uploadFile = async (file: File, submissionId: string, docType: string) => {
    const validationError = validateFile(file);
    if (validationError) throw new Error(validationError);
    const ext = file.name.split(".").pop();
    const path = `${user!.id}/${submissionId}/${docType}.${ext}`;
    const { error: uploadErr } = await supabase.storage.from("kyc-documents").upload(path, file, { upsert: true, contentType: file.type });
    if (uploadErr) throw uploadErr;
    const { error: insertErr } = await supabase.from("kyc_documents").insert({ kyc_submission_id: submissionId, user_id: user!.id, document_type: docType, file_name: file.name, file_path: path });
    if (insertErr) throw insertErr;
  };

  const isResubmit = editing && !!submission;

  const submitMutation = useMutation({
    mutationFn: async () => {
      const required = ["full_legal_name", "date_of_birth", "phone", "occupation", "address_line_1", "city", "source_of_funds", "id_type", "id_number"];
      for (const key of required) { if (!(form as any)[key]) throw new Error("Please fill in all required fields."); }

      if (isResubmit) {
        const { error } = await supabase.from("kyc_submissions").update({
          ...form, expected_monthly_volume: form.expected_monthly_volume || null,
          address_line_2: form.address_line_2 || null, postal_code: form.postal_code || null, status: "pending_review" as any,
        }).eq("id", submission!.id);
        if (error) throw error;
        const idFront = idFrontRef.current?.files?.[0]; const idBack = idBackRef.current?.files?.[0];
        const selfie = selfieRef.current?.files?.[0]; const proofFile = proofRef.current?.files?.[0];
        if (idFront) await uploadFile(idFront, submission!.id, "id_front");
        if (idBack) await uploadFile(idBack, submission!.id, "id_back");
        if (selfie) await uploadFile(selfie, submission!.id, "selfie");
        if (proofFile) await uploadFile(proofFile, submission!.id, "proof_of_address");
      } else {
        const idFront = idFrontRef.current?.files?.[0]; const idBack = idBackRef.current?.files?.[0]; const selfie = selfieRef.current?.files?.[0];
        if (!idFront || !idBack || !selfie) throw new Error("Please upload all required documents.");
        const { data, error } = await supabase.from("kyc_submissions").insert({
          user_id: user!.id, ...form, expected_monthly_volume: form.expected_monthly_volume || null,
          address_line_2: form.address_line_2 || null, postal_code: form.postal_code || null,
        }).select("id").single();
        if (error) throw error;
        await uploadFile(idFront, data.id, "id_front"); await uploadFile(idBack, data.id, "id_back"); await uploadFile(selfie, data.id, "selfie");
        const proofFile = proofRef.current?.files?.[0];
        if (proofFile) await uploadFile(proofFile, data.id, "proof_of_address");
      }
    },
    onSuccess: () => { setEditing(false); queryClient.invalidateQueries({ queryKey: ["kyc-submission"] }); toast({ title: isResubmit ? "KYC resubmitted" : "KYC submitted", description: "Your documents are under review." }); },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  if (isLoading) {
    return <DashboardLayout><div className="flex justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div></DashboardLayout>;
  }

  if (submission && !editing) {
    const statusConfig: Record<string, { icon: React.ReactNode; title: string; desc: string }> = {
      approved: { icon: <CheckCircle className="h-12 w-12 text-success" />, title: t("kyc.approved"), desc: t("kyc.approvedDesc") },
      rejected: { icon: <AlertCircle className="h-12 w-12 text-destructive" />, title: t("kyc.rejected"), desc: submission.admin_notes || t("kyc.rejectedDesc") },
      needs_more_info: { icon: <AlertCircle className="h-12 w-12 text-warning" />, title: t("kyc.needsMoreInfo"), desc: submission.admin_notes || t("kyc.needsMoreInfoDesc") },
      pending_review: { icon: <Clock className="h-12 w-12 text-warning" />, title: t("kyc.underReview"), desc: t("kyc.underReviewDesc") },
    };
    const cfg = statusConfig[submission.status] || statusConfig.pending_review;
    const canEdit = submission.status === "needs_more_info";

    return (
      <DashboardLayout>
        <PageHeader title={t("kyc.title")} />
        <div className="mt-6 flex flex-col items-center justify-center rounded-lg border bg-card p-12 text-center shadow-card">
          {cfg.icon}
          <h2 className="mt-4 text-xl font-semibold">{cfg.title}</h2>
          <p className="mt-2 text-sm text-muted-foreground max-w-md">{cfg.desc}</p>
          <StatusBadge status={submission.status} className="mt-4" />
          {canEdit && (
            <Button variant="hero" className="mt-6" onClick={() => setEditing(true)}>
              <Pencil className="mr-2 h-4 w-4" /> {t("kyc.editResubmit")}
            </Button>
          )}
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <PageHeader title={t("kyc.title")} description={isResubmit ? t("kyc.resubmitDesc") : t("kyc.description")} />

      {isResubmit && submission?.admin_notes && (
        <div className="mt-4 rounded-lg border border-warning/30 bg-warning/5 p-4">
          <p className="text-sm font-medium text-warning">{t("kyc.adminFeedback")}</p>
          <p className="mt-1 text-sm text-muted-foreground">{submission.admin_notes}</p>
        </div>
      )}

      <form className="mt-6 space-y-8" onSubmit={(e) => { e.preventDefault(); submitMutation.mutate(); }}>
        <section className="rounded-lg border bg-card p-6 shadow-card">
          <h2 className="font-semibold">{t("kyc.personalInfo")}</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div><label className="text-sm font-medium">{t("kyc.fullLegalName")} *</label><Input className="mt-1" placeholder="As on your ID" value={form.full_legal_name} onChange={(e) => set("full_legal_name", e.target.value)} required /></div>
            <div><label className="text-sm font-medium">{t("kyc.dateOfBirth")} *</label><Input className="mt-1" type="date" value={form.date_of_birth} onChange={(e) => set("date_of_birth", e.target.value)} required /></div>
            <div><label className="text-sm font-medium">{t("kyc.country")} *</label><Input className="mt-1" value={form.country} onChange={(e) => set("country", e.target.value)} required /></div>
            <div><label className="text-sm font-medium">{t("kyc.nationality")} *</label><Input className="mt-1" value={form.nationality} onChange={(e) => set("nationality", e.target.value)} required /></div>
            <div><label className="text-sm font-medium">{t("kyc.phoneNumber")} *</label><Input className="mt-1" type="tel" placeholder="+977..." value={form.phone} onChange={(e) => set("phone", e.target.value)} required /></div>
            <div><label className="text-sm font-medium">{t("kyc.occupation")} *</label><Input className="mt-1" value={form.occupation} onChange={(e) => set("occupation", e.target.value)} required /></div>
          </div>
        </section>

        <section className="rounded-lg border bg-card p-6 shadow-card">
          <h2 className="font-semibold">{t("kyc.address")}</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2"><label className="text-sm font-medium">{t("kyc.addressLine1")} *</label><Input className="mt-1" value={form.address_line_1} onChange={(e) => set("address_line_1", e.target.value)} required /></div>
            <div className="sm:col-span-2"><label className="text-sm font-medium">{t("kyc.addressLine2")}</label><Input className="mt-1" value={form.address_line_2} onChange={(e) => set("address_line_2", e.target.value)} /></div>
            <div><label className="text-sm font-medium">{t("kyc.city")} *</label><Input className="mt-1" value={form.city} onChange={(e) => set("city", e.target.value)} required /></div>
            <div><label className="text-sm font-medium">{t("kyc.postalCode")}</label><Input className="mt-1" value={form.postal_code} onChange={(e) => set("postal_code", e.target.value)} /></div>
          </div>
        </section>

        <section className="rounded-lg border bg-card p-6 shadow-card">
          <h2 className="font-semibold">{t("kyc.financialInfo")}</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium">{t("kyc.sourceOfFunds")} *</label>
              <Select value={form.source_of_funds} onValueChange={(v) => set("source_of_funds", v)}>
                <SelectTrigger className="mt-1"><SelectValue placeholder={t("kyc.select")} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="salary">{t("kyc.salary")}</SelectItem>
                  <SelectItem value="business">{t("kyc.business")}</SelectItem>
                  <SelectItem value="investments">{t("kyc.investments")}</SelectItem>
                  <SelectItem value="savings">{t("kyc.savings")}</SelectItem>
                  <SelectItem value="other">{t("kyc.other")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">{t("kyc.expectedVolume")}</label>
              <Select value={form.expected_monthly_volume} onValueChange={(v) => set("expected_monthly_volume", v)}>
                <SelectTrigger className="mt-1"><SelectValue placeholder={t("kyc.select")} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">{t("kyc.volumeLow")}</SelectItem>
                  <SelectItem value="medium">{t("kyc.volumeMedium")}</SelectItem>
                  <SelectItem value="high">{t("kyc.volumeHigh")}</SelectItem>
                  <SelectItem value="very_high">{t("kyc.volumeVeryHigh")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </section>

        <section className="rounded-lg border bg-card p-6 shadow-card">
          <h2 className="font-semibold">{t("kyc.identityDocs")}</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium">{t("kyc.idType")} *</label>
              <Select value={form.id_type} onValueChange={(v) => set("id_type", v)}>
                <SelectTrigger className="mt-1"><SelectValue placeholder={t("kyc.select")} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="passport">{t("kyc.passport")}</SelectItem>
                  <SelectItem value="drivers_license">{t("kyc.driversLicense")}</SelectItem>
                  <SelectItem value="national_id">{t("kyc.nationalId")}</SelectItem>
                  <SelectItem value="citizenship">{t("kyc.citizenship")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><label className="text-sm font-medium">{t("kyc.idNumber")} *</label><Input className="mt-1" value={form.id_number} onChange={(e) => set("id_number", e.target.value)} required /></div>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border-2 border-dashed bg-muted/30 p-6 text-center">
              <Upload className="mx-auto h-6 w-6 text-muted-foreground" />
              <p className="mt-2 text-sm font-medium">{t("kyc.idFront")} {isResubmit ? t("kyc.optional") : "*"}</p>
              <p className="text-xs text-muted-foreground">{t("kyc.fileHint")}</p>
              <input ref={idFrontRef} type="file" className="mt-2 text-xs" accept="image/*,.pdf" />
            </div>
            <div className="rounded-lg border-2 border-dashed bg-muted/30 p-6 text-center">
              <Upload className="mx-auto h-6 w-6 text-muted-foreground" />
              <p className="mt-2 text-sm font-medium">{t("kyc.idBack")} {isResubmit ? t("kyc.optional") : "*"}</p>
              <p className="text-xs text-muted-foreground">{t("kyc.fileHint")}</p>
              <input ref={idBackRef} type="file" className="mt-2 text-xs" accept="image/*,.pdf" />
            </div>
            <div className="rounded-lg border-2 border-dashed bg-muted/30 p-6 text-center">
              <Upload className="mx-auto h-6 w-6 text-muted-foreground" />
              <p className="mt-2 text-sm font-medium">{t("kyc.selfieWithId")} {isResubmit ? t("kyc.optional") : "*"}</p>
              <p className="text-xs text-muted-foreground">{t("kyc.selfieHint")}</p>
              <input ref={selfieRef} type="file" className="mt-2 text-xs" accept="image/*" />
            </div>
            <div className="rounded-lg border-2 border-dashed bg-muted/30 p-6 text-center">
              <Upload className="mx-auto h-6 w-6 text-muted-foreground" />
              <p className="mt-2 text-sm font-medium">{t("kyc.proofOfAddress")}</p>
              <p className="text-xs text-muted-foreground">{t("kyc.proofOfAddressHint")}</p>
              <input ref={proofRef} type="file" className="mt-2 text-xs" accept="image/*,.pdf" />
            </div>
          </div>
        </section>

        <div className="flex justify-end gap-3">
          {isResubmit && <Button type="button" variant="outline" onClick={() => setEditing(false)}>{t("kyc.cancel")}</Button>}
          <Button type="submit" variant="hero" disabled={submitMutation.isPending}>
            {submitMutation.isPending ? t("kyc.submitting") : isResubmit ? t("kyc.resubmitKyc") : t("kyc.submitKyc")}
          </Button>
        </div>
      </form>
    </DashboardLayout>
  );
}
