import { AdminLayout } from "@/components/layout/AdminLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { useState, useRef } from "react";
import { Plus, Trash2, BarChart3, Eye, MousePointer, Upload, Loader2 } from "lucide-react";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { format } from "date-fns";

const PLACEMENTS = [
  { value: "dashboard_banner", label: "Dashboard Banner" },
  { value: "sidebar", label: "Sidebar" },
  { value: "landing_sponsor", label: "Landing Sponsor" },
  { value: "live_prices", label: "Live Prices" },
  { value: "public_footer", label: "Public Footer" },
] as const;

interface AdForm {
  title: string;
  description: string;
  image_url: string;
  link_url: string;
  link_text: string;
  placement: string;
  priority: number;
  starts_at: string;
  ends_at: string;
}

const emptyForm: AdForm = {
  title: "",
  description: "",
  image_url: "",
  link_url: "",
  link_text: "Learn More",
  placement: "dashboard_banner",
  priority: 0,
  starts_at: new Date().toISOString().slice(0, 16),
  ends_at: "",
};

export default function AdminAdsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<AdForm>(emptyForm);
  const [editId, setEditId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: ads = [], isLoading } = useQuery({
    queryKey: ["admin-ads"],
    queryFn: async () => {
      const { data } = await supabase
        .from("ads")
        .select("*")
        .order("created_at", { ascending: false });
      return data || [];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload: any = {
        title: form.title,
        description: form.description || null,
        image_url: form.image_url || null,
        link_url: form.link_url,
        link_text: form.link_text || "Learn More",
        placement: form.placement,
        priority: form.priority,
        starts_at: new Date(form.starts_at).toISOString(),
        ends_at: form.ends_at ? new Date(form.ends_at).toISOString() : null,
      };

      if (editId) {
        const { error } = await supabase.from("ads").update(payload).eq("id", editId);
        if (error) throw error;
      } else {
        payload.created_by = user!.id;
        const { error } = await supabase.from("ads").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-ads"] });
      setOpen(false);
      setEditId(null);
      setForm(emptyForm);
      toast({ title: editId ? "Ad updated" : "Ad created" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from("ads").update({ is_active } as any).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-ads"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("ads").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-ads"] });
      toast({ title: "Ad deleted" });
    },
  });

  const openEdit = (ad: any) => {
    setEditId(ad.id);
    setForm({
      title: ad.title,
      description: ad.description || "",
      image_url: ad.image_url || "",
      link_url: ad.link_url,
      link_text: ad.link_text || "Learn More",
      placement: ad.placement,
      priority: ad.priority,
      starts_at: ad.starts_at ? new Date(ad.starts_at).toISOString().slice(0, 16) : "",
      ends_at: ad.ends_at ? new Date(ad.ends_at).toISOString().slice(0, 16) : "",
    });
    setOpen(true);
  };

  const ctr = (impressions: number, clicks: number) =>
    impressions > 0 ? ((clicks / impressions) * 100).toFixed(2) + "%" : "—";

  return (
    <AdminLayout>
      <PageHeader title="Ads & Sponsorships" description="Manage advertising placements and track performance.">
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setEditId(null); setForm(emptyForm); } }}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="mr-1 h-4 w-4" /> New Ad</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editId ? "Edit Ad" : "Create Ad"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <Label>Title *</Label>
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Description</Label>
                <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Link URL *</Label>
                  <Input value={form.link_url} onChange={(e) => setForm({ ...form, link_url: e.target.value })} placeholder="https://..." />
                </div>
                <div className="space-y-1.5">
                  <Label>CTA Text</Label>
                  <Input value={form.link_text} onChange={(e) => setForm({ ...form, link_text: e.target.value })} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Banner Image</Label>
                <div className="flex gap-2">
                  <Input
                    value={form.image_url}
                    onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                    placeholder="https://... or upload →"
                    className="flex-1"
                  />
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setUploading(true);
                      const ext = file.name.split(".").pop();
                      const path = `${crypto.randomUUID()}.${ext}`;
                      const { error } = await supabase.storage.from("ad-images").upload(path, file);
                      if (error) {
                        toast({ title: "Upload failed", description: error.message, variant: "destructive" });
                      } else {
                        const { data: urlData } = supabase.storage.from("ad-images").getPublicUrl(path);
                        setForm((f) => ({ ...f, image_url: urlData.publicUrl }));
                        toast({ title: "Image uploaded" });
                      }
                      setUploading(false);
                      e.target.value = "";
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    disabled={uploading}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  </Button>
                </div>
                {form.image_url && (
                  <img src={form.image_url} alt="Preview" className="mt-1.5 h-20 w-full rounded-md object-cover border" />
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Placement *</Label>
                  <Select value={form.placement} onValueChange={(v) => setForm({ ...form, placement: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {PLACEMENTS.map((p) => (
                        <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Priority</Label>
                  <Input type="number" value={form.priority} onChange={(e) => setForm({ ...form, priority: parseInt(e.target.value) || 0 })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Starts At</Label>
                  <Input type="datetime-local" value={form.starts_at} onChange={(e) => setForm({ ...form, starts_at: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Ends At (optional)</Label>
                  <Input type="datetime-local" value={form.ends_at} onChange={(e) => setForm({ ...form, ends_at: e.target.value })} />
                </div>
              </div>
              <Button
                className="w-full"
                disabled={!form.title || !form.link_url || saveMutation.isPending}
                onClick={() => saveMutation.mutate()}
              >
                {saveMutation.isPending ? "Saving..." : editId ? "Update Ad" : "Create Ad"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </PageHeader>

      {/* Stats summary */}
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <BarChart3 className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-2xl font-semibold">{ads.length}</p>
              <p className="text-xs text-muted-foreground">Total Ads</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Eye className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-2xl font-semibold">
                {ads.reduce((s: number, a: any) => s + (a.impression_count || 0), 0).toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground">Total Impressions</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <MousePointer className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-2xl font-semibold">
                {ads.reduce((s: number, a: any) => s + (a.click_count || 0), 0).toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground">Total Clicks</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Ads list */}
      <div className="space-y-3">
        {isLoading ? (
          <p className="text-sm text-muted-foreground py-8 text-center">Loading ads…</p>
        ) : ads.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground">
            <p className="text-sm">No ads created yet. Click "New Ad" to get started.</p>
          </div>
        ) : (
          ads.map((ad: any) => (
            <Card key={ad.id}>
              <CardContent className="flex items-center gap-4 p-4">
                {ad.image_url && (
                  <img src={ad.image_url} alt={ad.title} className="h-12 w-12 rounded-md object-cover shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm truncate">{ad.title}</span>
                    <StatusBadge status={ad.is_active ? "active" : "inactive"} />
                    <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                      {PLACEMENTS.find((p) => p.value === ad.placement)?.label || ad.placement}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">
                    {ad.link_url}
                  </p>
                  <div className="mt-1 flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Eye className="h-3 w-3" /> {(ad.impression_count || 0).toLocaleString()}</span>
                    <span className="flex items-center gap-1"><MousePointer className="h-3 w-3" /> {(ad.click_count || 0).toLocaleString()}</span>
                    <span>CTR: {ctr(ad.impression_count || 0, ad.click_count || 0)}</span>
                    {ad.ends_at && <span>Ends: {format(new Date(ad.ends_at), "MMM d, yyyy")}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Switch
                    checked={ad.is_active}
                    onCheckedChange={(v) => toggleMutation.mutate({ id: ad.id, is_active: v })}
                  />
                  <Button size="sm" variant="ghost" onClick={() => openEdit(ad)}>Edit</Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="text-destructive"
                    onClick={() => {
                      if (confirm("Delete this ad?")) deleteMutation.mutate(ad.id);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </AdminLayout>
  );
}
