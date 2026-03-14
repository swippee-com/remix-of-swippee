import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, CheckCircle, AlertCircle, Clock } from "lucide-react";
import { useState, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";

export default function KycPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: submission, isLoading } = useQuery({
    queryKey: ["kyc-submission", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("kyc_submissions")
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const [form, setForm] = useState({
    full_legal_name: "",
    date_of_birth: "",
    country: "Nepal",
    nationality: "Nepali",
    phone: "",
    occupation: "",
    address_line_1: "",
    address_line_2: "",
    city: "",
    postal_code: "",
    source_of_funds: "",
    expected_monthly_volume: "",
    id_type: "",
    id_number: "",
  });

  const idFrontRef = useRef<HTMLInputElement>(null);
  const idBackRef = useRef<HTMLInputElement>(null);
  const selfieRef = useRef<HTMLInputElement>(null);
  const proofRef = useRef<HTMLInputElement>(null);

  const set = (key: string, val: string) => setForm((p) => ({ ...p, [key]: val }));

  const uploadFile = async (file: File, submissionId: string, docType: string) => {
    const ext = file.name.split(".").pop();
    const path = `${user!.id}/${submissionId}/${docType}.${ext}`;
    const { error: uploadErr } = await supabase.storage
      .from("kyc-documents")
      .upload(path, file, { upsert: true });
    if (uploadErr) throw uploadErr;

    const { error: insertErr } = await supabase.from("kyc_documents").insert({
      kyc_submission_id: submissionId,
      user_id: user!.id,
      document_type: docType,
      file_name: file.name,
      file_path: path,
    });
    if (insertErr) throw insertErr;
  };

  const submitMutation = useMutation({
    mutationFn: async () => {
      const required = ["full_legal_name", "date_of_birth", "phone", "occupation", "address_line_1", "city", "source_of_funds", "id_type", "id_number"];
      for (const key of required) {
        if (!(form as any)[key]) throw new Error(`Please fill in all required fields.`);
      }

      const idFront = idFrontRef.current?.files?.[0];
      const idBack = idBackRef.current?.files?.[0];
      const selfie = selfieRef.current?.files?.[0];
      if (!idFront || !idBack || !selfie) throw new Error("Please upload all required documents.");

      const { data, error } = await supabase
        .from("kyc_submissions")
        .insert({
          user_id: user!.id,
          ...form,
          expected_monthly_volume: form.expected_monthly_volume || null,
          address_line_2: form.address_line_2 || null,
          postal_code: form.postal_code || null,
        })
        .select("id")
        .single();
      if (error) throw error;

      await uploadFile(idFront, data.id, "id_front");
      await uploadFile(idBack, data.id, "id_back");
      await uploadFile(selfie, data.id, "selfie");

      const proofFile = proofRef.current?.files?.[0];
      if (proofFile) await uploadFile(proofFile, data.id, "proof_of_address");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kyc-submission"] });
      toast({ title: "KYC submitted", description: "Your documents are under review." });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </DashboardLayout>
    );
  }

  if (submission) {
    const statusConfig: Record<string, { icon: React.ReactNode; title: string; desc: string }> = {
      approved: {
        icon: <CheckCircle className="h-12 w-12 text-success" />,
        title: "KYC Approved",
        desc: "Your identity has been verified. You can now trade.",
      },
      rejected: {
        icon: <AlertCircle className="h-12 w-12 text-destructive" />,
        title: "KYC Rejected",
        desc: submission.admin_notes || "Your submission was rejected. Please contact support.",
      },
      needs_more_info: {
        icon: <AlertCircle className="h-12 w-12 text-warning" />,
        title: "More Information Needed",
        desc: submission.admin_notes || "Please update your submission with the requested information.",
      },
      pending_review: {
        icon: <Clock className="h-12 w-12 text-warning" />,
        title: "Under Review",
        desc: "Your KYC submission is being reviewed. We'll notify you once it's processed.",
      },
    };
    const cfg = statusConfig[submission.status] || statusConfig.pending_review;

    return (
      <DashboardLayout>
        <PageHeader title="KYC Verification" />
        <div className="mt-6 flex flex-col items-center justify-center rounded-lg border bg-card p-12 text-center shadow-card">
          {cfg.icon}
          <h2 className="mt-4 text-xl font-semibold">{cfg.title}</h2>
          <p className="mt-2 text-sm text-muted-foreground max-w-md">{cfg.desc}</p>
          <StatusBadge status={submission.status} className="mt-4" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <PageHeader title="KYC Verification" description="Complete identity verification to start trading." />
      <form className="mt-6 space-y-8" onSubmit={(e) => { e.preventDefault(); submitMutation.mutate(); }}>
        <section className="rounded-lg border bg-card p-6 shadow-card">
          <h2 className="font-semibold">Personal Information</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div><label className="text-sm font-medium">Full Legal Name *</label><Input className="mt-1" placeholder="As on your ID" value={form.full_legal_name} onChange={(e) => set("full_legal_name", e.target.value)} required /></div>
            <div><label className="text-sm font-medium">Date of Birth *</label><Input className="mt-1" type="date" value={form.date_of_birth} onChange={(e) => set("date_of_birth", e.target.value)} required /></div>
            <div><label className="text-sm font-medium">Country *</label><Input className="mt-1" value={form.country} onChange={(e) => set("country", e.target.value)} required /></div>
            <div><label className="text-sm font-medium">Nationality *</label><Input className="mt-1" value={form.nationality} onChange={(e) => set("nationality", e.target.value)} required /></div>
            <div><label className="text-sm font-medium">Phone Number *</label><Input className="mt-1" type="tel" placeholder="+977..." value={form.phone} onChange={(e) => set("phone", e.target.value)} required /></div>
            <div><label className="text-sm font-medium">Occupation *</label><Input className="mt-1" placeholder="Your occupation" value={form.occupation} onChange={(e) => set("occupation", e.target.value)} required /></div>
          </div>
        </section>

        <section className="rounded-lg border bg-card p-6 shadow-card">
          <h2 className="font-semibold">Address</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2"><label className="text-sm font-medium">Address Line 1 *</label><Input className="mt-1" value={form.address_line_1} onChange={(e) => set("address_line_1", e.target.value)} required /></div>
            <div className="sm:col-span-2"><label className="text-sm font-medium">Address Line 2</label><Input className="mt-1" value={form.address_line_2} onChange={(e) => set("address_line_2", e.target.value)} /></div>
            <div><label className="text-sm font-medium">City *</label><Input className="mt-1" value={form.city} onChange={(e) => set("city", e.target.value)} required /></div>
            <div><label className="text-sm font-medium">Postal Code</label><Input className="mt-1" value={form.postal_code} onChange={(e) => set("postal_code", e.target.value)} /></div>
          </div>
        </section>

        <section className="rounded-lg border bg-card p-6 shadow-card">
          <h2 className="font-semibold">Financial Information</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium">Source of Funds *</label>
              <Select value={form.source_of_funds} onValueChange={(v) => set("source_of_funds", v)}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="salary">Salary/Employment</SelectItem>
                  <SelectItem value="business">Business Income</SelectItem>
                  <SelectItem value="investments">Investments</SelectItem>
                  <SelectItem value="savings">Savings</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Expected Monthly Volume</label>
              <Select value={form.expected_monthly_volume} onValueChange={(v) => set("expected_monthly_volume", v)}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Under $1,000</SelectItem>
                  <SelectItem value="medium">$1,000 – $10,000</SelectItem>
                  <SelectItem value="high">$10,000 – $50,000</SelectItem>
                  <SelectItem value="very_high">Over $50,000</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </section>

        <section className="rounded-lg border bg-card p-6 shadow-card">
          <h2 className="font-semibold">Identity Documents</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium">ID Type *</label>
              <Select value={form.id_type} onValueChange={(v) => set("id_type", v)}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="passport">Passport</SelectItem>
                  <SelectItem value="drivers_license">Driver's License</SelectItem>
                  <SelectItem value="national_id">National ID</SelectItem>
                  <SelectItem value="citizenship">Citizenship Certificate</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><label className="text-sm font-medium">ID Number *</label><Input className="mt-1" value={form.id_number} onChange={(e) => set("id_number", e.target.value)} required /></div>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border-2 border-dashed bg-muted/30 p-6 text-center">
              <Upload className="mx-auto h-6 w-6 text-muted-foreground" />
              <p className="mt-2 text-sm font-medium">ID Front *</p>
              <p className="text-xs text-muted-foreground">JPG, PNG, PDF up to 5MB</p>
              <input ref={idFrontRef} type="file" className="mt-2 text-xs" accept="image/*,.pdf" />
            </div>
            <div className="rounded-lg border-2 border-dashed bg-muted/30 p-6 text-center">
              <Upload className="mx-auto h-6 w-6 text-muted-foreground" />
              <p className="mt-2 text-sm font-medium">ID Back *</p>
              <p className="text-xs text-muted-foreground">JPG, PNG, PDF up to 5MB</p>
              <input ref={idBackRef} type="file" className="mt-2 text-xs" accept="image/*,.pdf" />
            </div>
            <div className="rounded-lg border-2 border-dashed bg-muted/30 p-6 text-center">
              <Upload className="mx-auto h-6 w-6 text-muted-foreground" />
              <p className="mt-2 text-sm font-medium">Selfie with ID *</p>
              <p className="text-xs text-muted-foreground">Hold your ID next to your face</p>
              <input ref={selfieRef} type="file" className="mt-2 text-xs" accept="image/*" />
            </div>
            <div className="rounded-lg border-2 border-dashed bg-muted/30 p-6 text-center">
              <Upload className="mx-auto h-6 w-6 text-muted-foreground" />
              <p className="mt-2 text-sm font-medium">Proof of Address</p>
              <p className="text-xs text-muted-foreground">Optional — utility bill, bank statement</p>
              <input ref={proofRef} type="file" className="mt-2 text-xs" accept="image/*,.pdf" />
            </div>
          </div>
        </section>

        <div className="flex justify-end">
          <Button type="submit" variant="hero" disabled={submitMutation.isPending}>
            {submitMutation.isPending ? "Submitting…" : "Submit KYC"}
          </Button>
        </div>
      </form>
    </DashboardLayout>
  );
}
