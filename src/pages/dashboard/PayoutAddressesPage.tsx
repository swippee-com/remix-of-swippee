import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Wallet, Plus, Trash2, ShieldCheck, Link as LinkIcon } from "lucide-react";
import { BRAND } from "@/config/brand";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import type { Database } from "@/integrations/supabase/types";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { useAccount, useDisconnect } from "wagmi";
import { networkToChainId } from "@/config/wagmi";
import { Badge } from "@/components/ui/badge";

type CryptoAsset = Database["public"]["Enums"]["crypto_asset"];
type CryptoNetwork = Database["public"]["Enums"]["crypto_network"];

interface FormState {
  label: string;
  asset: CryptoAsset | "";
  network: CryptoNetwork | "";
  address: string;
  destination_tag: string;
}

const emptyForm: FormState = { label: "", asset: "", network: "", address: "", destination_tag: "" };

export default function PayoutAddressesPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const set = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const { openConnectModal } = useConnectModal();
  const { address: connectedAddress, isConnected, chain } = useAccount();
  const { disconnect } = useDisconnect();
  const [verifyingId, setVerifyingId] = useState<string | null>(null);

  const { data: addresses = [], isLoading } = useQuery({
    queryKey: ["user-payout-addresses"],
    queryFn: async () => {
      const { data, error } = await supabase.from("payout_addresses").select("*").eq("user_id", user!.id).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!form.asset || !form.network) throw new Error("Asset and network are required.");
      const payload = {
        user_id: user!.id,
        label: form.label,
        asset: form.asset as CryptoAsset,
        network: form.network as CryptoNetwork,
        address: form.address,
        destination_tag: form.destination_tag || null,
        ...(editId ? { is_verified: false } : {}),
      };
      if (editId) {
        const { error } = await supabase.from("payout_addresses").update(payload).eq("id", editId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("payout_addresses").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-payout-addresses"] });
      setModalOpen(false);
      setEditId(null);
      setForm(emptyForm);
      toast({ title: editId ? "Address updated" : "Address added" });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("payout_addresses").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-payout-addresses"] });
      setDeleteId(null);
      toast({ title: "Address removed" });
    },
  });

  const verifyMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("payout_addresses").update({ is_verified: true }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-payout-addresses"] });
      setVerifyingId(null);
      disconnect();
      toast({ title: "Address verified", description: "Wallet ownership confirmed." });
    },
    onError: (err: any) => toast({ title: "Verification failed", description: err.message, variant: "destructive" }),
  });

  // After wallet connects, check if the connected address matches the one being verified
  const handleVerifyClick = (addressRecord: typeof addresses[0]) => {
    const chainId = networkToChainId[addressRecord.network];
    if (chainId === null) {
      toast({ title: "Cannot verify", description: "TRC20 (Tron) addresses cannot be verified via wallet connection. Only EVM networks are supported.", variant: "destructive" });
      return;
    }
    if (addressRecord.is_verified) {
      toast({ title: "Already verified" });
      return;
    }
    setVerifyingId(addressRecord.id);
    if (isConnected) {
      // Already connected — check match immediately
      checkAndVerify(addressRecord);
    } else {
      openConnectModal?.();
    }
  };

  const checkAndVerify = (addressRecord: typeof addresses[0]) => {
    if (!connectedAddress) return;
    if (connectedAddress.toLowerCase() === addressRecord.address.toLowerCase()) {
      verifyMutation.mutate(addressRecord.id);
    } else {
      toast({
        title: "Address mismatch",
        description: `Connected wallet (${connectedAddress.slice(0, 6)}…${connectedAddress.slice(-4)}) doesn't match the payout address. Please connect the correct wallet.`,
        variant: "destructive",
      });
      setVerifyingId(null);
      disconnect();
    }
  };

  // Effect: when wallet connects while verifying, auto-check
  const pendingAddress = verifyingId ? addresses.find((a) => a.id === verifyingId) : null;
  if (pendingAddress && isConnected && connectedAddress && !verifyMutation.isPending) {
    // Use setTimeout to avoid state update during render
    setTimeout(() => checkAndVerify(pendingAddress), 100);
  }

  const openEdit = (a: any) => {
    setForm({ label: a.label, asset: a.asset, network: a.network, address: a.address, destination_tag: a.destination_tag || "" });
    setEditId(a.id);
    setModalOpen(true);
  };

  const canVerify = (network: string) => networkToChainId[network] !== null;

  return (
    <DashboardLayout>
      <PageHeader title="Payout Addresses" description="Manage your crypto receiving addresses.">
        <Button onClick={() => { setForm(emptyForm); setEditId(null); setModalOpen(true); }}><Plus className="mr-1 h-4 w-4" /> Add Address</Button>
      </PageHeader>

      {isLoading ? (
        <div className="flex justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>
      ) : addresses.length === 0 ? (
        <EmptyState icon={<Wallet className="mx-auto h-10 w-10" />} title="No payout addresses" description="Add wallet addresses for receiving crypto." className="mt-6" />
      ) : (
        <div className="mt-6 rounded-lg border bg-card shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b bg-muted/50">
                <th className="px-6 py-3 text-left font-medium text-muted-foreground">Label</th>
                <th className="px-6 py-3 text-left font-medium text-muted-foreground">Asset</th>
                <th className="px-6 py-3 text-left font-medium text-muted-foreground">Network</th>
                <th className="px-6 py-3 text-left font-medium text-muted-foreground">Address</th>
                <th className="px-6 py-3 text-left font-medium text-muted-foreground">Status</th>
                <th className="px-6 py-3 text-left font-medium text-muted-foreground">Actions</th>
              </tr></thead>
              <tbody className="divide-y">
                {addresses.map((a) => (
                  <tr key={a.id} className="hover:bg-muted/30">
                    <td className="px-6 py-4 font-medium">{a.label}</td>
                    <td className="px-6 py-4">{a.asset}</td>
                    <td className="px-6 py-4">{a.network}</td>
                    <td className="px-6 py-4 font-mono text-xs max-w-[200px] truncate">{a.address}</td>
                    <td className="px-6 py-4">
                      {(a as any).is_verified ? (
                        <Badge variant="default" className="bg-green-600 hover:bg-green-700 text-white gap-1">
                          <ShieldCheck className="h-3 w-3" /> Verified
                        </Badge>
                      ) : canVerify(a.network) ? (
                        <Badge variant="outline" className="text-muted-foreground">Unverified</Badge>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground">N/A</Badge>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        {!(a as any).is_verified && canVerify(a.network) && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1"
                            onClick={() => handleVerifyClick(a)}
                            disabled={verifyMutation.isPending && verifyingId === a.id}
                          >
                            <LinkIcon className="h-3 w-3" />
                            {verifyMutation.isPending && verifyingId === a.id ? "Verifying…" : "Verify"}
                          </Button>
                        )}
                        <Button variant="ghost" size="sm" onClick={() => openEdit(a)}>Edit</Button>
                        <Button variant="ghost" size="sm" className="text-destructive" onClick={() => setDeleteId(a.id)}><Trash2 className="h-3 w-3" /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Dialog open={modalOpen} onOpenChange={(o) => { if (!o) { setModalOpen(false); setEditId(null); } }}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editId ? "Edit" : "Add"} Payout Address</DialogTitle></DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(); }} className="space-y-4">
            <div><label className="text-sm font-medium">Label *</label><Input className="mt-1" value={form.label} onChange={(e) => set("label", e.target.value)} placeholder="e.g. Main USDT TRC20" required /></div>
            <div>
              <label className="text-sm font-medium">Asset *</label>
              <Select value={form.asset} onValueChange={(v) => set("asset", v)}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>{BRAND.supportedAssets.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Network *</label>
              <Select value={form.network} onValueChange={(v) => set("network", v)}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>{BRAND.supportedNetworks.map((n) => <SelectItem key={n} value={n}>{n}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><label className="text-sm font-medium">Address *</label><Input className="mt-1" value={form.address} onChange={(e) => set("address", e.target.value)} placeholder="Wallet address" required /></div>
            <div><label className="text-sm font-medium">Destination Tag / Memo</label><Input className="mt-1" value={form.destination_tag} onChange={(e) => set("destination_tag", e.target.value)} placeholder="Optional" /></div>
            <DialogFooter><Button type="submit" disabled={saveMutation.isPending}>{saveMutation.isPending ? "Saving…" : "Save"}</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(o) => { if (!o) setDeleteId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Delete address?</AlertDialogTitle><AlertDialogDescription>This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteId && deleteMutation.mutate(deleteId)}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
