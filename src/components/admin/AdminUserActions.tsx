import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { CheckCircle, XCircle, MessageSquare, ShieldAlert, ShieldCheck, UserX, UserCheck, Plus, X } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];
type KycStatus = Database["public"]["Enums"]["kyc_status"];

interface AdminUserActionsProps {
  userId: string;
  roles: AppRole[];
  kycStatus: KycStatus | null;
  kycId: string | null;
  isFrozen: boolean;
}

export function AdminUserActions({ userId, roles, kycStatus, kycId, isFrozen }: AdminUserActionsProps) {
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();

  // KYC action state
  const [kycAction, setKycAction] = useState<"approve" | "reject" | "request_info" | null>(null);
  const [adminNotes, setAdminNotes] = useState("");

  // Role management state
  const [roleToAdd, setRoleToAdd] = useState<AppRole>("admin");

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-user-detail", userId] });
    queryClient.invalidateQueries({ queryKey: ["admin-user-kyc", userId] });
    queryClient.invalidateQueries({ queryKey: ["admin-user-roles", userId] });
    queryClient.invalidateQueries({ queryKey: ["admin-users"] });
  };

  // KYC mutation
  const kycMutation = useMutation({
    mutationFn: async ({ status }: { status: KycStatus }) => {
      if (!kycId) throw new Error("No KYC submission found");
      const { error } = await supabase
        .from("kyc_submissions")
        .update({
          status,
          admin_notes: adminNotes || null,
          reviewed_by: currentUser!.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", kycId);
      if (error) throw error;
      await supabase.from("audit_logs").insert({
        action: `kyc_${status}`,
        actor_user_id: currentUser!.id,
        actor_role: "admin",
        target_type: "kyc_submission",
        target_id: kycId,
        metadata: { admin_notes: adminNotes || null },
      });
      // Notify user
      await supabase.from("notifications").insert({
        user_id: userId,
        type: "kyc_update" as const,
        title: status === "approved" ? "KYC Approved" : status === "rejected" ? "KYC Rejected" : "KYC: More Info Needed",
        message: status === "approved"
          ? "Your identity verification has been approved."
          : status === "rejected"
          ? `Your KYC has been rejected.${adminNotes ? " Reason: " + adminNotes : ""}`
          : `Additional information is needed for your KYC.${adminNotes ? " Details: " + adminNotes : ""}`,
        link: "/dashboard/kyc",
      });
    },
    onSuccess: () => {
      invalidateAll();
      setKycAction(null);
      setAdminNotes("");
      toast({ title: "KYC updated successfully" });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  // Role mutations
  const addRoleMutation = useMutation({
    mutationFn: async (role: AppRole) => {
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
      invalidateAll();
      toast({ title: "Role assigned" });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const removeRoleMutation = useMutation({
    mutationFn: async (role: AppRole) => {
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
      invalidateAll();
      toast({ title: "Role removed" });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  // Freeze/unfreeze mutation
  const freezeMutation = useMutation({
    mutationFn: async (freeze: boolean) => {
      const { error } = await supabase
        .from("profiles")
        .update({ is_frozen: freeze } as any)
        .eq("id", userId);
      if (error) throw error;
      await supabase.from("audit_logs").insert({
        action: freeze ? "account_frozen" : "account_unfrozen",
        actor_user_id: currentUser!.id,
        actor_role: "admin",
        target_type: "user",
        target_id: userId,
        metadata: {},
      });
      await supabase.from("notifications").insert({
        user_id: userId,
        type: "system" as const,
        title: freeze ? "Account Frozen" : "Account Restored",
        message: freeze
          ? "Your account has been frozen. Please contact support for assistance."
          : "Your account has been restored. You can now use all features.",
      });
    },
    onSuccess: () => {
      invalidateAll();
      toast({ title: isFrozen ? "Account unfrozen" : "Account frozen" });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const handleKycConfirm = () => {
    if (!kycAction) return;
    const statusMap: Record<string, KycStatus> = {
      approve: "approved",
      reject: "rejected",
      request_info: "needs_more_info",
    };
    kycMutation.mutate({ status: statusMap[kycAction] });
  };

  return (
    <>
      <Card className="border-dashed">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Admin Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* KYC Actions */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">KYC Verification</h4>
            {!kycId ? (
              <p className="text-sm text-muted-foreground">No KYC submission yet.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                <div className="flex items-center gap-2 mr-2">
                  <span className="text-xs text-muted-foreground">Current:</span>
                  <StatusBadge status={kycStatus || "not_submitted"} />
                </div>
                {kycStatus !== "approved" && (
                  <Button variant="success" size="sm" onClick={() => setKycAction("approve")}>
                    <CheckCircle className="mr-1 h-3.5 w-3.5" /> Approve
                  </Button>
                )}
                {kycStatus !== "rejected" && (
                  <Button variant="destructive" size="sm" onClick={() => setKycAction("reject")}>
                    <XCircle className="mr-1 h-3.5 w-3.5" /> Reject
                  </Button>
                )}
                <Button variant="outline" size="sm" onClick={() => setKycAction("request_info")}>
                  <MessageSquare className="mr-1 h-3.5 w-3.5" /> Request Info
                </Button>
              </div>
            )}
          </div>

          {/* Role Management */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">Roles</h4>
            <div className="flex flex-wrap gap-2 items-center">
              {roles.map((r) => (
                <div key={r} className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary capitalize">
                  {r}
                  {r !== "user" && (
                    <button
                      onClick={() => removeRoleMutation.mutate(r)}
                      className="ml-0.5 text-destructive hover:text-destructive/80"
                      disabled={removeRoleMutation.isPending}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
              ))}
              <div className="flex items-center gap-1.5">
                <Select value={roleToAdd} onValueChange={(v) => setRoleToAdd(v as AppRole)}>
                  <SelectTrigger className="h-7 w-28 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="compliance">Compliance</SelectItem>
                    <SelectItem value="user">User</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 px-2"
                  disabled={roles.includes(roleToAdd) || addRoleMutation.isPending}
                  onClick={() => addRoleMutation.mutate(roleToAdd)}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>

          {/* Freeze Account */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">Account Status</h4>
            {isFrozen ? (
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-destructive/10 px-3 py-1 text-xs font-medium text-destructive">
                  <ShieldAlert className="h-3.5 w-3.5" /> Account Frozen
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => freezeMutation.mutate(false)}
                  disabled={freezeMutation.isPending}
                >
                  <UserCheck className="mr-1 h-3.5 w-3.5" /> Unfreeze Account
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-success/10 px-3 py-1 text-xs font-medium text-success">
                  <ShieldCheck className="h-3.5 w-3.5" /> Active
                </span>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => freezeMutation.mutate(true)}
                  disabled={freezeMutation.isPending}
                >
                  <UserX className="mr-1 h-3.5 w-3.5" /> Freeze Account
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* KYC Action Dialog */}
      <Dialog open={!!kycAction} onOpenChange={(open) => { if (!open) { setKycAction(null); setAdminNotes(""); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {kycAction === "approve" && "Approve KYC"}
              {kycAction === "reject" && "Reject KYC"}
              {kycAction === "request_info" && "Request More Info"}
            </DialogTitle>
          </DialogHeader>
          <div>
            <label className="text-sm font-medium">Notes {kycAction !== "approve" && "*"}</label>
            <Textarea
              className="mt-1"
              placeholder={kycAction === "reject" ? "Reason for rejection..." : kycAction === "request_info" ? "What info is needed..." : "Optional notes..."}
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setKycAction(null); setAdminNotes(""); }}>Cancel</Button>
            <Button
              variant={kycAction === "reject" ? "destructive" : kycAction === "approve" ? "success" : "default"}
              onClick={handleKycConfirm}
              disabled={kycMutation.isPending || (kycAction !== "approve" && !adminNotes.trim())}
            >
              {kycMutation.isPending ? "Saving…" : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
