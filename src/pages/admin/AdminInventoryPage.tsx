import { AdminLayout } from "@/components/layout/AdminLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";
import { Package, AlertTriangle, Plus, Save } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type InventoryBalance = Database["public"]["Tables"]["inventory_balances"]["Row"];
type CryptoAsset = Database["public"]["Enums"]["crypto_asset"];
type CryptoNetwork = Database["public"]["Enums"]["crypto_network"];

const ASSETS: CryptoAsset[] = ["USDT", "USDC", "BTC", "ETH"];
const NETWORKS: CryptoNetwork[] = ["TRC20", "ERC20", "BEP20", "Polygon"];

export default function AdminInventoryPage() {
  const queryClient = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);

  const { data: inventory = [], isLoading } = useQuery({
    queryKey: ["admin-inventory"],
    queryFn: async () => {
      const { data, error } = await supabase.from("inventory_balances").select("*").order("asset").order("network");
      if (error) throw error;
      return data;
    },
  });

  const lowStock = inventory.filter((i) => i.is_enabled && Number(i.available_amount) < Number(i.low_threshold));

  return (
    <AdminLayout>
      <PageHeader title="Inventory" description="Track crypto inventory and manage routes.">
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="h-3 w-3 mr-1" /> Add Route</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Inventory Route</DialogTitle></DialogHeader>
            <AddInventoryForm onSuccess={() => { setAddOpen(false); queryClient.invalidateQueries({ queryKey: ["admin-inventory"] }); }} />
          </DialogContent>
        </Dialog>
      </PageHeader>

      {lowStock.length > 0 && (
        <div className="mt-4 rounded-lg border border-warning/50 bg-warning/5 p-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-warning">Low Stock Warning</p>
            <p className="text-xs text-muted-foreground mt-1">
              {lowStock.map((i) => `${i.asset}/${i.network}`).join(", ")} — below threshold
            </p>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>
      ) : (
        <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {inventory.map((item) => (
            <InventoryCard key={item.id} item={item} />
          ))}
          {inventory.length === 0 && (
            <p className="col-span-full text-center text-muted-foreground py-12">No inventory routes configured.</p>
          )}
        </div>
      )}
    </AdminLayout>
  );
}

function InventoryCard({ item }: { item: InventoryBalance }) {
  const queryClient = useQueryClient();
  const [available, setAvailable] = useState(String(item.available_amount));
  const [reserved, setReserved] = useState(String(item.reserved_amount));
  const [threshold, setThreshold] = useState(String(item.low_threshold));
  const [enabled, setEnabled] = useState(item.is_enabled);

  const isLow = enabled && Number(available) < Number(threshold);

  const mutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("inventory_balances").update({
        available_amount: Number(available),
        reserved_amount: Number(reserved),
        low_threshold: Number(threshold),
        is_enabled: enabled,
      }).eq("id", item.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-inventory"] });
      toast({ title: "Inventory updated" });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  return (
    <Card className={isLow ? "border-warning/50" : ""}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Package className="h-4 w-4" />
            {item.asset}
            <Badge variant="secondary">{item.network}</Badge>
          </CardTitle>
          <Switch checked={enabled} onCheckedChange={setEnabled} />
        </div>
        {!enabled && <p className="text-xs text-muted-foreground">Route disabled</p>}
        {isLow && <p className="text-xs text-warning flex items-center gap-1"><AlertTriangle className="h-3 w-3" /> Low stock</p>}
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="rounded bg-muted/50 p-2 text-center">
            <p className="text-xs text-muted-foreground">Available</p>
            <p className="font-semibold">{Number(available).toFixed(4)}</p>
          </div>
          <div className="rounded bg-muted/50 p-2 text-center">
            <p className="text-xs text-muted-foreground">Reserved</p>
            <p className="font-semibold">{Number(reserved).toFixed(4)}</p>
          </div>
        </div>
        <div>
          <Label className="text-xs">Available</Label>
          <Input type="number" step="0.0001" value={available} onChange={(e) => setAvailable(e.target.value)} className="mt-1" />
        </div>
        <div>
          <Label className="text-xs">Reserved</Label>
          <Input type="number" step="0.0001" value={reserved} onChange={(e) => setReserved(e.target.value)} className="mt-1" />
        </div>
        <div>
          <Label className="text-xs">Low Threshold</Label>
          <Input type="number" step="0.0001" value={threshold} onChange={(e) => setThreshold(e.target.value)} className="mt-1" />
        </div>
        <Button size="sm" className="w-full" onClick={() => mutation.mutate()} disabled={mutation.isPending}>
          <Save className="h-3 w-3 mr-1" /> {mutation.isPending ? "Saving…" : "Save"}
        </Button>
      </CardContent>
    </Card>
  );
}

function AddInventoryForm({ onSuccess }: { onSuccess: () => void }) {
  const [asset, setAsset] = useState<CryptoAsset>("USDT");
  const [network, setNetwork] = useState<CryptoNetwork>("TRC20");
  const [available, setAvailable] = useState("0");
  const [threshold, setThreshold] = useState("0");

  const mutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("inventory_balances").insert({
        asset, network, available_amount: Number(available), low_threshold: Number(threshold),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Route added" });
      onSuccess();
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Asset</Label>
          <Select value={asset} onValueChange={(v) => setAsset(v as CryptoAsset)}>
            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>{ASSETS.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div>
          <Label>Network</Label>
          <Select value={network} onValueChange={(v) => setNetwork(v as CryptoNetwork)}>
            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>{NETWORKS.map((n) => <SelectItem key={n} value={n}>{n}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>
      <div>
        <Label>Available Amount</Label>
        <Input type="number" step="0.0001" value={available} onChange={(e) => setAvailable(e.target.value)} className="mt-1" />
      </div>
      <div>
        <Label>Low Threshold</Label>
        <Input type="number" step="0.0001" value={threshold} onChange={(e) => setThreshold(e.target.value)} className="mt-1" />
      </div>
      <Button className="w-full" onClick={() => mutation.mutate()} disabled={mutation.isPending}>
        {mutation.isPending ? "Adding…" : "Add Route"}
      </Button>
    </div>
  );
}
