import { AdminLayout } from "@/components/layout/AdminLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Eye, CheckCircle, XCircle, Truck } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useRealtimeInvalidation } from "@/hooks/use-realtime";
import { toast } from "@/hooks/use-toast";
import type { Database } from "@/integrations/supabase/types";

type OrderStatus = Database["public"]["Enums"]["order_status"];

const TAB_FILTERS: Record<string, OrderStatus[]> = {
  all: [],
  new: ["draft", "rate_locked"],
  awaiting_payment: ["awaiting_payment"],
  proof_uploaded: ["payment_proof_uploaded"],
  manual_review: ["manual_review", "under_review"],
  settlement: ["approved_for_settlement", "settlement_in_progress"],
  completed: ["completed"],
  cancelled: ["cancelled", "expired", "rejected"],
};

export default function AdminOrdersPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const keys = useMemo(() => [["admin-orders"]], []);
  useRealtimeInvalidation("orders", keys);

  const [tab, setTab] = useState("all");
  const [search, setSearch] = useState("");

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => {
      const { data, error } = await supabase.from("orders").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      const userIds = [...new Set(data.map((o) => o.user_id))];
      if (userIds.length === 0) return data.map((o) => ({ ...o, profile: null }));
      const { data: profiles } = await supabase.from("profiles").select("id, full_name, email").in("id", userIds);
      const map = Object.fromEntries((profiles || []).map((p) => [p.id, p]));
      return data.map((o) => ({ ...o, profile: map[o.user_id] || null }));
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ orderId, oldStatus, newStatus }: { orderId: string; oldStatus: OrderStatus; newStatus: OrderStatus }) => {
      const { error } = await supabase.from("orders").update({ status: newStatus }).eq("id", orderId);
      if (error) throw error;
      await supabase.from("order_status_history").insert({
        order_id: orderId,
        old_status: oldStatus,
        new_status: newStatus,
        actor_id: user!.id,
        actor_role: "admin",
      });
      await supabase.from("audit_logs").insert({
        action: "order_status_update",
        actor_user_id: user!.id,
        actor_role: "admin",
        target_type: "order",
        target_id: orderId,
        metadata: { from: oldStatus, to: newStatus },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      toast({ title: "Order updated" });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const filtered = orders.filter((o: any) => {
    const statuses = TAB_FILTERS[tab];
    if (statuses && statuses.length > 0 && !statuses.includes(o.status)) return false;
    if (search) {
      const s = search.toLowerCase();
      const name = o.profile?.full_name?.toLowerCase() || "";
      if (!name.includes(s) && !o.asset.toLowerCase().includes(s) && !o.id.includes(s)) return false;
    }
    return true;
  });

  const counts = (statuses: OrderStatus[]) =>
    statuses.length === 0 ? orders.length : orders.filter((o: any) => statuses.includes(o.status)).length;

  return (
    <AdminLayout>
      <PageHeader title="Orders" description="Manage instant orders and their lifecycle." />

      <div className="mt-6">
        <Tabs value={tab} onValueChange={setTab}>
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <TabsList className="flex-wrap h-auto">
              {Object.entries(TAB_FILTERS).map(([key, statuses]) => (
                <TabsTrigger key={key} value={key} className="capitalize text-xs">
                  {key.replace(/_/g, " ")} ({counts(statuses)})
                </TabsTrigger>
              ))}
            </TabsList>
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input className="pl-9" placeholder="Search orders..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>
          ) : (
            <div className="rounded-lg border bg-card shadow-card overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">User</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Side</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Asset</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Rate</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Pay (NPR)</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Receive</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Date</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filtered.map((o: any) => (
                    <tr key={o.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">{o.profile?.full_name || "—"}</td>
                      <td className="px-4 py-3 capitalize">{o.side}</td>
                      <td className="px-4 py-3">{o.asset}/{o.network}</td>
                      <td className="px-4 py-3">{Number(o.final_rate_npr).toLocaleString()}</td>
                      <td className="px-4 py-3">{Number(o.total_pay_npr).toLocaleString()}</td>
                      <td className="px-4 py-3">{Number(o.total_receive_crypto).toFixed(6)}</td>
                      <td className="px-4 py-3"><StatusBadge status={o.status} /></td>
                      <td className="px-4 py-3 text-muted-foreground">{format(new Date(o.created_at), "PP")}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="sm" asChild>
                            <Link to={`/admin/orders/${o.id}`}><Eye className="h-3 w-3" /></Link>
                          </Button>
                          {o.status === "payment_proof_uploaded" && (
                            <Button variant="ghost" size="sm" onClick={() => updateStatus.mutate({ orderId: o.id, oldStatus: o.status, newStatus: "under_review" })} title="Review">
                              <CheckCircle className="h-3 w-3 text-primary" />
                            </Button>
                          )}
                          {(o.status === "under_review" || o.status === "manual_review") && (
                            <Button variant="ghost" size="sm" onClick={() => updateStatus.mutate({ orderId: o.id, oldStatus: o.status, newStatus: "approved_for_settlement" })} title="Approve">
                              <CheckCircle className="h-3 w-3 text-success" />
                            </Button>
                          )}
                          {o.status === "settlement_in_progress" && (
                            <Button variant="ghost" size="sm" onClick={() => updateStatus.mutate({ orderId: o.id, oldStatus: o.status, newStatus: "completed" })} title="Mark Settled">
                              <Truck className="h-3 w-3 text-success" />
                            </Button>
                          )}
                          {!["completed", "cancelled", "expired", "rejected"].includes(o.status) && (
                            <Button variant="ghost" size="sm" onClick={() => updateStatus.mutate({ orderId: o.id, oldStatus: o.status, newStatus: "cancelled" })} title="Cancel">
                              <XCircle className="h-3 w-3 text-destructive" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr><td colSpan={9} className="px-4 py-12 text-center text-muted-foreground">No orders found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </Tabs>
      </div>
    </AdminLayout>
  );
}
