import { AdminLayout } from "@/components/layout/AdminLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

export default function AdminUsersPage() {
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [kycFilter, setKycFilter] = useState("all");
  const [roleModal, setRoleModal] = useState<{ userId: string; name: string; currentRoles: AppRole[] } | null>(null);
  const [selectedRole, setSelectedRole] = useState<AppRole>("user");

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      // Fetch profiles
      const { data: profiles, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;

      const userIds = profiles.map((p) => p.id);

      // Fetch roles
      const { data: roles } = await supabase
        .from("user_roles")
        .select("user_id, role")
        .in("user_id", userIds);
      const roleMap: Record<string, AppRole[]> = {};
      (roles || []).forEach((r) => {
        if (!roleMap[r.user_id]) roleMap[r.user_id] = [];
        roleMap[r.user_id].push(r.role);
      });

      // Fetch KYC statuses
      const { data: kycs } = await supabase
        .from("kyc_submissions")
        .select("user_id, status")
        .in("user_id", userIds);
      const kycMap: Record<string, string> = {};
      (kycs || []).forEach((k) => { kycMap[k.user_id] = k.status; });

      // Fetch trade counts
      const { data: trades } = await supabase
        .from("otc_trades")
        .select("user_id")
        .in("user_id", userIds);
      const tradeCount: Record<string, number> = {};
      (trades || []).forEach((t) => { tradeCount[t.user_id] = (tradeCount[t.user_id] || 0) + 1; });

      return profiles.map((p) => ({
        ...p,
        roles: roleMap[p.id] || ["user"],
        kyc: kycMap[p.id] || "not_submitted",
        trades: tradeCount[p.id] || 0,
      }));
    },
  });

  const addRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: AppRole }) => {
      const { error } = await supabase.from("user_roles").insert({ user_id: userId, role });
      if (error) throw error;
      await supabase.from("audit_logs").insert({
        action: "role_assigned",
        actor_user_id: currentUser!.id,
        actor_role: "admin",
        target_type: "user",
        target_id: userId,
        metadata: { role },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      setRoleModal(null);
      toast({ title: "Role assigned" });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const removeRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: AppRole }) => {
      const { error } = await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", role);
      if (error) throw error;
      await supabase.from("audit_logs").insert({
        action: "role_removed",
        actor_user_id: currentUser!.id,
        actor_role: "admin",
        target_type: "user",
        target_id: userId,
        metadata: { role },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      setRoleModal(null);
      toast({ title: "Role removed" });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const filtered = users.filter((u: any) => {
    if (kycFilter !== "all" && u.kyc !== kycFilter) return false;
    if (search) {
      const s = search.toLowerCase();
      if (!(u.full_name || "").toLowerCase().includes(s) && !(u.email || "").toLowerCase().includes(s)) return false;
    }
    return true;
  });

  return (
    <AdminLayout>
      <PageHeader title="Users" description="Manage all registered users." />
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search users..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={kycFilter} onValueChange={setKycFilter}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All KYC</SelectItem>
            <SelectItem value="not_submitted">Not Submitted</SelectItem>
            <SelectItem value="pending_review">Pending Review</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>
      ) : (
        <div className="mt-4 rounded-lg border bg-card shadow-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b bg-muted/50">
              <th className="px-6 py-3 text-left font-medium text-muted-foreground">Name</th>
              <th className="px-6 py-3 text-left font-medium text-muted-foreground">Email</th>
              <th className="px-6 py-3 text-left font-medium text-muted-foreground">Roles</th>
              <th className="px-6 py-3 text-left font-medium text-muted-foreground">KYC</th>
              <th className="px-6 py-3 text-left font-medium text-muted-foreground">Trades</th>
              <th className="px-6 py-3 text-left font-medium text-muted-foreground">Joined</th>
              <th className="px-6 py-3 text-left font-medium text-muted-foreground">Actions</th>
            </tr></thead>
            <tbody className="divide-y">
              {filtered.map((u: any) => (
                <tr key={u.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-6 py-4 font-medium">{u.full_name || "—"}</td>
                  <td className="px-6 py-4 text-muted-foreground">{u.email || "—"}</td>
                  <td className="px-6 py-4">
                    <div className="flex gap-1 flex-wrap">
                      {u.roles.map((r: string) => (
                        <span key={r} className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary capitalize">{r}</span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4"><StatusBadge status={u.kyc} /></td>
                  <td className="px-6 py-4">{u.trades}</td>
                  <td className="px-6 py-4 text-muted-foreground">{format(new Date(u.created_at), "PP")}</td>
                  <td className="px-6 py-4">
                    <Button variant="ghost" size="sm" onClick={() => setRoleModal({ userId: u.id, name: u.full_name || u.email || "User", currentRoles: u.roles })}>
                      Manage Roles
                    </Button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="px-6 py-12 text-center text-muted-foreground">No users found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={!!roleModal} onOpenChange={(o) => { if (!o) setRoleModal(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Manage Roles — {roleModal?.name}</DialogTitle></DialogHeader>
          {roleModal && (
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium mb-2">Current Roles:</p>
                <div className="flex gap-2 flex-wrap">
                  {roleModal.currentRoles.map((r) => (
                    <div key={r} className="flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-sm capitalize">
                      {r}
                      {r !== "user" && (
                        <button
                          onClick={() => removeRoleMutation.mutate({ userId: roleModal.userId, role: r })}
                          className="ml-1 text-destructive hover:text-destructive/80 font-bold"
                        >×</button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-sm font-medium mb-2">Add Role:</p>
                <div className="flex gap-2">
                  <Select value={selectedRole} onValueChange={(v) => setSelectedRole(v as AppRole)}>
                    <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="compliance">Compliance</SelectItem>
                      <SelectItem value="user">User</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    size="sm"
                    disabled={roleModal.currentRoles.includes(selectedRole) || addRoleMutation.isPending}
                    onClick={() => addRoleMutation.mutate({ userId: roleModal.userId, role: selectedRole })}
                  >
                    Add
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
