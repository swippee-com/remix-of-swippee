import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CreditCard, Plus, Star, Trash2 } from "lucide-react";
import { BRAND } from "@/config/brand";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import type { Database } from "@/integrations/supabase/types";

type PaymentMethodType = Database["public"]["Enums"]["payment_method_type"];

interface FormState {
  label: string;
  payment_type: PaymentMethodType;
  account_holder_name: string;
  bank_name: string;
  account_number: string;
  wallet_id: string;
  notes: string;
}

const emptyForm: FormState = { label: "", payment_type: "bank_transfer", account_holder_name: "", bank_name: "", account_number: "", wallet_id: "", notes: "" };

export default function PaymentMethodsPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const set = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const { data: methods = [], isLoading } = useQuery({
    queryKey: ["user-payment-methods"],
    queryFn: async () => {
      const { data, error } = await supabase.from("payment_methods").select("*").eq("user_id", user!.id).order("is_default", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        user_id: user!.id, label: form.label, payment_type: form.payment_type, account_holder_name: form.account_holder_name,
        bank_name: form.bank_name || null, account_number: form.account_number || null, wallet_id: form.wallet_id || null, notes: form.notes || null,
      };
      if (editId) { const { error } = await supabase.from("payment_methods").update(payload).eq("id", editId); if (error) throw error; }
      else { const { error } = await supabase.from("payment_methods").insert(payload); if (error) throw error; }
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["user-payment-methods"] }); setModalOpen(false); setEditId(null); setForm(emptyForm); toast({ title: editId ? "Payment method updated" : "Payment method added" }); },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("payment_methods").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["user-payment-methods"] }); setDeleteId(null); toast({ title: "Payment method removed" }); },
  });

  const setDefaultMutation = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from("payment_methods").update({ is_default: false }).eq("user_id", user!.id);
      const { error } = await supabase.from("payment_methods").update({ is_default: true }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["user-payment-methods"] }); toast({ title: "Default payment method updated" }); },
  });

  const openEdit = (m: any) => {
    setForm({ label: m.label, payment_type: m.payment_type, account_holder_name: m.account_holder_name, bank_name: m.bank_name || "", account_number: m.account_number || "", wallet_id: m.wallet_id || "", notes: m.notes || "" });
    setEditId(m.id); setModalOpen(true);
  };

  const isWallet = ["esewa", "khalti"].includes(form.payment_type);

  return (
    <DashboardLayout>
      <PageHeader title={t("pm.title")} description={t("pm.description")}>
        <Button onClick={() => { setForm(emptyForm); setEditId(null); setModalOpen(true); }}><Plus className="mr-1 h-4 w-4" /> {t("pm.addMethod")}</Button>
      </PageHeader>

      {isLoading ? (
        <div className="flex justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>
      ) : methods.length === 0 ? (
        <EmptyState icon={<CreditCard className="mx-auto h-10 w-10" />} title={t("pm.noMethods")} description={t("pm.noMethodsDesc")} action={<Button onClick={() => setModalOpen(true)}>{t("pm.addPaymentMethod")}</Button>} className="mt-6" />
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {methods.map((m) => (
            <div key={m.id} className="rounded-lg border bg-card p-5 shadow-card">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  {BRAND.paymentLogos[m.payment_type] ? (
                    <img src={BRAND.paymentLogos[m.payment_type]} alt={m.payment_type} className="h-5 w-5 rounded object-contain" />
                  ) : (
                    <CreditCard className="h-5 w-5 text-muted-foreground" />
                  )}
                  <span className="font-medium text-sm">{m.label}</span>
                </div>
                {m.is_default && <Star className="h-4 w-4 text-warning fill-warning" />}
              </div>
              <div className="mt-3 space-y-1 text-sm text-muted-foreground">
                <p className="capitalize">{m.payment_type.replace("_", " ")}</p>
                <p>{m.account_holder_name}</p>
                {m.bank_name && <p>{m.bank_name} • {m.account_number}</p>}
                {m.wallet_id && <p>{t("pm.wallet")}: {m.wallet_id}</p>}
              </div>
              <div className="mt-4 flex gap-2">
                <Button variant="outline" size="sm" onClick={() => openEdit(m)}>{t("pm.edit")}</Button>
                {!m.is_default && <Button variant="ghost" size="sm" onClick={() => setDefaultMutation.mutate(m.id)}>{t("pm.setDefault")}</Button>}
                <Button variant="ghost" size="sm" className="text-destructive" onClick={() => setDeleteId(m.id)}><Trash2 className="h-3 w-3" /></Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={modalOpen} onOpenChange={(o) => { if (!o) { setModalOpen(false); setEditId(null); } }}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editId ? t("pm.editMethod") : t("pm.addMethodTitle")}</DialogTitle></DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(); }} className="space-y-4">
            <div><label className="text-sm font-medium">{t("pm.label")} *</label><Input className="mt-1" value={form.label} onChange={(e) => set("label", e.target.value)} placeholder="e.g. Main Bank Account" required /></div>
            <div>
              <label className="text-sm font-medium">{t("pm.type")} *</label>
              <Select value={form.payment_type} onValueChange={(v) => set("payment_type", v)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{BRAND.paymentMethods.map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    <span className="flex items-center gap-2">
                      {BRAND.paymentLogos[p.value] && <img src={BRAND.paymentLogos[p.value]} alt={p.label} className="h-4 w-4 rounded object-contain" />}
                      {p.label}
                    </span>
                  </SelectItem>
                ))}</SelectContent>
              </Select>
            </div>
            <div><label className="text-sm font-medium">{t("pm.accountHolderName")} *</label><Input className="mt-1" value={form.account_holder_name} onChange={(e) => set("account_holder_name", e.target.value)} required /></div>
            {!isWallet && (
              <>
                <div><label className="text-sm font-medium">{t("pm.bankName")}</label><Input className="mt-1" value={form.bank_name} onChange={(e) => set("bank_name", e.target.value)} /></div>
                <div><label className="text-sm font-medium">{t("pm.accountNumber")}</label><Input className="mt-1" value={form.account_number} onChange={(e) => set("account_number", e.target.value)} /></div>
              </>
            )}
            {isWallet && (
              <div><label className="text-sm font-medium">{t("pm.walletIdPhone")}</label><Input className="mt-1" value={form.wallet_id} onChange={(e) => set("wallet_id", e.target.value)} /></div>
            )}
            <DialogFooter><Button type="submit" disabled={saveMutation.isPending}>{saveMutation.isPending ? t("pm.saving") : t("pm.save")}</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(o) => { if (!o) setDeleteId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>{t("pm.deleteTitle")}</AlertDialogTitle><AlertDialogDescription>{t("pm.deleteDesc")}</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("pm.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteId && deleteMutation.mutate(deleteId)}>{t("pm.delete")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
