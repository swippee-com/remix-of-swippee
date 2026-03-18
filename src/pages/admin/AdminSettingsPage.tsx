import { AdminLayout } from "@/components/layout/AdminLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BRAND } from "@/config/brand";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { useState } from "react";
import { Trash2, Plus, ToggleLeft, ToggleRight } from "lucide-react";
import { StatusBadge } from "@/components/shared/StatusBadge";

export default function AdminSettingsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();

  // ---- 2FA Threshold ----
  const { data: thresholdSetting } = useQuery({
    queryKey: ["withdrawal-2fa-threshold"],
    queryFn: async () => {
      const { data } = await supabase
        .from("app_settings")
        .select("id, value")
        .eq("key", "withdrawal_2fa_threshold")
        .single();
      return data;
    },
  });

  const [thresholdAmount, setThresholdAmount] = useState<string>("");
  const currentThreshold = (thresholdSetting?.value as any)?.amount ?? 50000;

  const updateThreshold = useMutation({
    mutationFn: async () => {
      const val = parseInt(thresholdAmount) || currentThreshold;
      if (thresholdSetting?.id) {
        await supabase.from("app_settings").update({ value: { amount: val } as any, updated_by: user!.id }).eq("id", thresholdSetting.id);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["withdrawal-2fa-threshold"] });
      toast({ title: "Threshold updated" });
      setThresholdAmount("");
    },
  });

  // ---- Announcements ----
  const { data: announcements = [] } = useQuery({
    queryKey: ["admin-announcements"],
    queryFn: async () => {
      const { data } = await supabase.from("announcements").select("*").order("created_at", { ascending: false });
      return data || [];
    },
  });

  const [newTitle, setNewTitle] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [newType, setNewType] = useState<string>("info");
  const [newStartsAt, setNewStartsAt] = useState("");
  const [newEndsAt, setNewEndsAt] = useState("");

  const createAnnouncement = useMutation({
    mutationFn: async () => {
      if (!newTitle.trim()) throw new Error("Title is required.");
      const { error } = await supabase.from("announcements").insert({
        title: newTitle.trim(),
        message: newMessage.trim(),
        type: newType as any,
        starts_at: newStartsAt || new Date().toISOString(),
        ends_at: newEndsAt || null,
        created_by: user!.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-announcements"] });
      qc.invalidateQueries({ queryKey: ["active-announcements"] });
      toast({ title: "Announcement created" });
      setNewTitle("");
      setNewMessage("");
      setNewType("info");
      setNewStartsAt("");
      setNewEndsAt("");
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      await supabase.from("announcements").update({ is_active: !is_active } as any).eq("id", id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-announcements"] });
      qc.invalidateQueries({ queryKey: ["active-announcements"] });
    },
  });

  const deleteAnnouncement = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from("announcements").delete().eq("id", id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-announcements"] });
      qc.invalidateQueries({ queryKey: ["active-announcements"] });
      toast({ title: "Announcement deleted" });
    },
  });

  return (
    <AdminLayout>
      <PageHeader title="Settings" description="Platform configuration." />
      <div className="mt-6 max-w-2xl space-y-8">
        {/* Platform Settings */}
        <section className="rounded-lg border bg-card p-6 shadow-card">
          <h2 className="font-semibold">Platform Settings</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div><label className="text-sm font-medium">Platform Name</label><Input className="mt-1" defaultValue={BRAND.name} /></div>
            <div><label className="text-sm font-medium">Default Fiat Currency</label><Input className="mt-1" defaultValue={BRAND.defaultFiatCurrency} /></div>
            <div><label className="text-sm font-medium">Support Email</label><Input className="mt-1" defaultValue={BRAND.supportEmail} /></div>
            <div><label className="text-sm font-medium"><div><label className="text-sm font-medium">Rate Lock Expiry (minutes)</label><Input className="mt-1" type="number" defaultValue="30" /></div></label><Input className="mt-1" type="number" defaultValue="30" /></div>
          </div>
          <div className="mt-4"><Button>Save Settings</Button></div>
        </section>

        {/* 2FA Withdrawal Threshold */}
        <section className="rounded-lg border bg-card p-6 shadow-card">
          <h2 className="font-semibold">2FA Withdrawal Threshold</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Withdrawals at or above this amount (NPR) will require two-factor authentication.
          </p>
          <div className="mt-4 flex items-end gap-3">
            <div className="flex-1">
              <label className="text-sm font-medium">Threshold (NPR)</label>
              <Input
                className="mt-1"
                type="number"
                placeholder={currentThreshold.toLocaleString()}
                value={thresholdAmount}
                onChange={(e) => setThresholdAmount(e.target.value)}
              />
            </div>
            <Button onClick={() => updateThreshold.mutate()} disabled={updateThreshold.isPending}>
              {updateThreshold.isPending ? "Saving…" : "Update"}
            </Button>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">Current: NPR {currentThreshold.toLocaleString()}</p>
        </section>

        {/* Supported Assets / Networks */}
        <section className="rounded-lg border bg-card p-6 shadow-card">
          <h2 className="font-semibold">Supported Assets</h2>
          <p className="mt-1 text-sm text-muted-foreground">Currently: {BRAND.supportedAssets.join(", ")}</p>
          <Separator className="my-4" />
          <h2 className="font-semibold">Supported Networks</h2>
          <p className="mt-1 text-sm text-muted-foreground">Currently: {BRAND.supportedNetworks.join(", ")}</p>
        </section>

        {/* Announcements */}
        <section className="rounded-lg border bg-card p-6 shadow-card">
          <h2 className="font-semibold">System Announcements</h2>
          <p className="mt-1 text-sm text-muted-foreground">Create banners visible to all users across the platform.</p>

          {/* Create form */}
          <div className="mt-4 space-y-3 rounded-md border bg-muted/30 p-4">
            <h3 className="text-sm font-medium">New Announcement</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="text-xs font-medium">Title *</label>
                <Input className="mt-1" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Scheduled maintenance" />
              </div>
              <div>
                <label className="text-xs font-medium">Type</label>
                <Select value={newType} onValueChange={setNewType}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="info">Info</SelectItem>
                    <SelectItem value="warning">Warning</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-xs font-medium">Message</label>
              <Input className="mt-1" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="We'll be offline from 2am–4am..." />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="text-xs font-medium">Starts At</label>
                <Input className="mt-1" type="datetime-local" value={newStartsAt} onChange={(e) => setNewStartsAt(e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-medium">Ends At (optional)</label>
                <Input className="mt-1" type="datetime-local" value={newEndsAt} onChange={(e) => setNewEndsAt(e.target.value)} />
              </div>
            </div>
            <Button size="sm" onClick={() => createAnnouncement.mutate()} disabled={createAnnouncement.isPending}>
              <Plus className="mr-1 h-3.5 w-3.5" /> Create Announcement
            </Button>
          </div>

          {/* List */}
          {announcements.length > 0 && (
            <div className="mt-4 space-y-2">
              {announcements.map((a: any) => (
                <div key={a.id} className="flex items-center gap-3 rounded-md border bg-background p-3 text-sm">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{a.title}</span>
                      <StatusBadge status={a.type} />
                      {!a.is_active && <span className="text-xs text-muted-foreground">(inactive)</span>}
                    </div>
                    {a.message && <p className="mt-0.5 text-xs text-muted-foreground">{a.message}</p>}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => toggleActive.mutate({ id: a.id, is_active: a.is_active })}
                    title={a.is_active ? "Deactivate" : "Activate"}
                  >
                    {a.is_active ? <ToggleRight className="h-4 w-4 text-success" /> : <ToggleLeft className="h-4 w-4 text-muted-foreground" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive"
                    onClick={() => deleteAnnouncement.mutate(a.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </AdminLayout>
  );
}
