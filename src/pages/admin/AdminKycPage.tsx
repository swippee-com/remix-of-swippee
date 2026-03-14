import { AdminLayout } from "@/components/layout/AdminLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Eye, CheckCircle, XCircle, MessageSquare, ArrowLeft, FileText, Image as ImageIcon } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import type { Database } from "@/integrations/supabase/types";

type KycStatus = Database["public"]["Enums"]["kyc_status"];

export default function AdminKycPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedKyc, setSelectedKyc] = useState<any>(null);
  const [viewingDoc, setViewingDoc] = useState<{ url: string; name: string; type: string } | null>(null);
  const [actionType, setActionType] = useState<"approve" | "reject" | "request_info" | null>(null);
  const [adminNotes, setAdminNotes] = useState("");

  const { data: kycQueue = [], isLoading } = useQuery({
    queryKey: ["admin-kyc-queue"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("kyc_submissions")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      // Fetch profiles separately
      const userIds = [...new Set(data.map((k) => k.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .in("id", userIds);
      const profileMap = Object.fromEntries((profiles || []).map((p) => [p.id, p]));
      return data.map((k) => ({ ...k, profile: profileMap[k.user_id] || null }));
    },
  });

  const { data: kycDocs = [] } = useQuery({
    queryKey: ["admin-kyc-docs", selectedKyc?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("kyc_documents")
        .select("*")
        .eq("kyc_submission_id", selectedKyc!.id);
      if (error) throw error;
      return data;
    },
    enabled: !!selectedKyc,
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: KycStatus }) => {
      const { error } = await supabase
        .from("kyc_submissions")
        .update({
          status,
          admin_notes: adminNotes || null,
          reviewed_by: user!.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", id);
      if (error) throw error;
      // Audit log
      await supabase.from("audit_logs").insert({
        action: `kyc_${status}`,
        actor_user_id: user!.id,
        actor_role: "admin",
        target_type: "kyc_submission",
        target_id: id,
        metadata: { admin_notes: adminNotes || null },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-kyc-queue"] });
      setActionType(null);
      setSelectedKyc(null);
      setAdminNotes("");
      toast({ title: "KYC updated successfully" });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const handleAction = () => {
    if (!selectedKyc || !actionType) return;
    const statusMap: Record<string, KycStatus> = {
      approve: "approved",
      reject: "rejected",
      request_info: "needs_more_info",
    };
    updateMutation.mutate({ id: selectedKyc.id, status: statusMap[actionType] });
  };

  const filtered = kycQueue.filter((k) => statusFilter === "all" || k.status === statusFilter);

  const openDoc = async (filePath: string, fileName: string) => {
    const { data, error } = await supabase.storage
      .from("kyc-documents")
      .createSignedUrl(filePath, 300); // 5 min expiry
    if (error || !data?.signedUrl) {
      toast({ title: "Error", description: "Could not load document.", variant: "destructive" });
      return;
    }
    const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(fileName);
    setViewingDoc({ url: data.signedUrl, name: fileName, type: isImage ? "image" : "other" });
  };

  return (
    <AdminLayout>
      <PageHeader title="KYC Queue" description="Review and process KYC submissions." />
      <div className="mt-6 flex items-center gap-3">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="pending_review">Pending Review</SelectItem>
            <SelectItem value="needs_more_info">Needs More Info</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : filtered.length === 0 ? (
        <p className="mt-8 text-center text-muted-foreground">No KYC submissions found.</p>
      ) : (
        <div className="mt-4 space-y-4">
          {filtered.map((kyc) => (
            <div key={kyc.id} className="rounded-lg border bg-card p-6 shadow-card">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold">{kyc.profile?.full_name || "Unknown"}</h3>
                    <StatusBadge status={kyc.status} />
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {kyc.profile?.email || "—"} • Submitted {format(new Date(kyc.created_at), "PP")}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Source of Funds: {kyc.source_of_funds} • ID: {kyc.id_type} ({kyc.id_number})
                  </p>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Button variant="outline" size="sm" onClick={() => setSelectedKyc(kyc)}>
                    <Eye className="mr-1 h-3 w-3" /> Review
                  </Button>
                  {kyc.status !== "approved" && (
                    <Button variant="success" size="sm" onClick={() => { setSelectedKyc(kyc); setActionType("approve"); }}>
                      <CheckCircle className="mr-1 h-3 w-3" /> Approve
                    </Button>
                  )}
                  {kyc.status !== "rejected" && (
                    <Button variant="destructive" size="sm" onClick={() => { setSelectedKyc(kyc); setActionType("reject"); }}>
                      <XCircle className="mr-1 h-3 w-3" /> Reject
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" onClick={() => { setSelectedKyc(kyc); setActionType("request_info"); }}>
                    <MessageSquare className="mr-1 h-3 w-3" /> Request Info
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Review Dialog */}
      <Dialog open={!!selectedKyc && !actionType} onOpenChange={(open) => { if (!open) setSelectedKyc(null); }}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>KYC Details — {selectedKyc?.profile?.full_name}</DialogTitle>
          </DialogHeader>
          {selectedKyc && (
            <div className="space-y-4 text-sm">
              <div className="grid gap-2 sm:grid-cols-2">
                <p><span className="font-medium">Full Name:</span> {selectedKyc.full_legal_name}</p>
                <p><span className="font-medium">DOB:</span> {selectedKyc.date_of_birth}</p>
                <p><span className="font-medium">Phone:</span> {selectedKyc.phone}</p>
                <p><span className="font-medium">Nationality:</span> {selectedKyc.nationality}</p>
                <p><span className="font-medium">Occupation:</span> {selectedKyc.occupation}</p>
                <p><span className="font-medium">Source of Funds:</span> {selectedKyc.source_of_funds}</p>
                <p><span className="font-medium">ID Type:</span> {selectedKyc.id_type}</p>
                <p><span className="font-medium">ID Number:</span> {selectedKyc.id_number}</p>
                <p className="sm:col-span-2"><span className="font-medium">Address:</span> {selectedKyc.address_line_1}, {selectedKyc.city}, {selectedKyc.country}</p>
              </div>
              {kycDocs.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Documents</h4>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {kycDocs.map((doc) => (
                      <a
                        key={doc.id}
                        href={getDocUrl(doc.file_path)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-lg border p-3 hover:bg-muted/50 transition-colors"
                      >
                        <p className="font-medium text-xs capitalize">{doc.document_type.replace(/_/g, " ")}</p>
                        <p className="text-xs text-muted-foreground truncate">{doc.file_name}</p>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Action Dialog */}
      <Dialog open={!!actionType} onOpenChange={(open) => { if (!open) { setActionType(null); setAdminNotes(""); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === "approve" && "Approve KYC"}
              {actionType === "reject" && "Reject KYC"}
              {actionType === "request_info" && "Request More Info"}
            </DialogTitle>
          </DialogHeader>
          <div>
            <label className="text-sm font-medium">Notes {actionType !== "approve" && "*"}</label>
            <Textarea
              className="mt-1"
              placeholder={actionType === "reject" ? "Reason for rejection..." : actionType === "request_info" ? "What info is needed..." : "Optional notes..."}
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setActionType(null); setAdminNotes(""); }}>Cancel</Button>
            <Button
              variant={actionType === "reject" ? "destructive" : actionType === "approve" ? "success" : "default"}
              onClick={handleAction}
              disabled={updateMutation.isPending || (actionType !== "approve" && !adminNotes.trim())}
            >
              {updateMutation.isPending ? "Saving…" : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
