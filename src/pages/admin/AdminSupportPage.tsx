import { AdminLayout } from "@/components/layout/AdminLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MessageSquare, Send, ArrowLeft } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";
import type { Database } from "@/integrations/supabase/types";

type TicketStatus = Database["public"]["Enums"]["support_ticket_status"];

export default function AdminSupportPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [isInternal, setIsInternal] = useState(false);

  const { data: tickets = [], isLoading } = useQuery({
    queryKey: ["admin-support-tickets"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("support_tickets")
        .select("*")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      const userIds = [...new Set(data.map((t) => t.user_id))];
      const { data: profiles } = await supabase.from("profiles").select("id, full_name, email").in("id", userIds);
      const map = Object.fromEntries((profiles || []).map((p) => [p.id, p]));
      return data.map((t) => ({ ...t, profile: map[t.user_id] || null }));
    },
  });

  const selectedTicket = tickets.find((t) => t.id === selectedTicketId);

  const { data: messages = [] } = useQuery({
    queryKey: ["admin-support-messages", selectedTicketId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("support_messages")
        .select("*")
        .eq("ticket_id", selectedTicketId!)
        .order("created_at", { ascending: true });
      if (error) throw error;
      // Resolve sender names
      const senderIds = [...new Set(data.map((m) => m.sender_id))];
      const { data: profiles } = await supabase.from("profiles").select("id, full_name").in("id", senderIds);
      const map = Object.fromEntries((profiles || []).map((p) => [p.id, p.full_name || "Unknown"]));
      return data.map((m) => ({ ...m, senderName: map[m.sender_id] || "Unknown" }));
    },
    enabled: !!selectedTicketId,
  });

  const sendMutation = useMutation({
    mutationFn: async () => {
      if (!newMessage.trim()) throw new Error("Message cannot be empty.");
      const { error } = await supabase.from("support_messages").insert({
        ticket_id: selectedTicketId!,
        sender_id: user!.id,
        message: newMessage,
        is_internal: isInternal,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-support-messages", selectedTicketId] });
      setNewMessage("");
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const updateStatusMutation = useMutation({
    mutationFn: async (status: TicketStatus) => {
      const { error } = await supabase
        .from("support_tickets")
        .update({ status })
        .eq("id", selectedTicketId!);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-support-tickets"] });
      toast({ title: "Ticket status updated" });
    },
  });

  const filtered = tickets.filter((t: any) => statusFilter === "all" || t.status === statusFilter);

  if (selectedTicketId && selectedTicket) {
    return (
      <AdminLayout>
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" onClick={() => setSelectedTicketId(null)}><ArrowLeft className="h-4 w-4" /></Button>
          <div className="flex-1">
            <h1 className="text-lg font-semibold">{selectedTicket.subject}</h1>
            <p className="text-sm text-muted-foreground">{(selectedTicket as any).profile?.full_name || "—"} • {(selectedTicket as any).profile?.email || ""}</p>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={selectedTicket.status} />
            <Select value={selectedTicket.status} onValueChange={(v) => updateStatusMutation.mutate(v as TicketStatus)}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="pending_user">Pending User</SelectItem>
                <SelectItem value="pending_admin">Pending Admin</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="rounded-lg border bg-card shadow-card">
          <div className="divide-y max-h-[50vh] overflow-y-auto">
            {messages.length === 0 ? (
              <p className="px-6 py-8 text-center text-sm text-muted-foreground">No messages yet.</p>
            ) : (
              messages.map((m: any) => (
                <div key={m.id} className={`px-6 py-4 ${m.is_internal ? "bg-warning/5 border-l-2 border-warning" : m.sender_id === selectedTicket.user_id ? "" : "bg-muted/30"}`}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium">{m.senderName}</span>
                      {m.is_internal && <span className="text-[10px] bg-warning/20 text-warning px-1.5 py-0.5 rounded font-medium">Internal</span>}
                    </div>
                    <span className="text-xs text-muted-foreground">{format(new Date(m.created_at), "PPp")}</span>
                  </div>
                  <p className="text-sm whitespace-pre-wrap">{m.message}</p>
                </div>
              ))
            )}
          </div>
          <div className="border-t p-4 space-y-2">
            <form onSubmit={(e) => { e.preventDefault(); sendMutation.mutate(); }} className="flex gap-2">
              <Input placeholder="Type a reply..." value={newMessage} onChange={(e) => setNewMessage(e.target.value)} className="flex-1" />
              <Button type="submit" size="icon" disabled={sendMutation.isPending}><Send className="h-4 w-4" /></Button>
            </form>
            <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
              <input type="checkbox" checked={isInternal} onChange={(e) => setIsInternal(e.target.checked)} className="rounded" />
              Internal note (not visible to user)
            </label>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <PageHeader title="Support Tickets" description="Manage user support requests." />
      <div className="mt-6 flex items-center gap-3">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="pending_user">Pending User</SelectItem>
            <SelectItem value="pending_admin">Pending Admin</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>
      ) : (
        <div className="mt-4 rounded-lg border bg-card shadow-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b bg-muted/50">
              <th className="px-6 py-3 text-left font-medium text-muted-foreground">User</th>
              <th className="px-6 py-3 text-left font-medium text-muted-foreground">Subject</th>
              <th className="px-6 py-3 text-left font-medium text-muted-foreground">Category</th>
              <th className="px-6 py-3 text-left font-medium text-muted-foreground">Status</th>
              <th className="px-6 py-3 text-left font-medium text-muted-foreground">Updated</th>
              <th className="px-6 py-3 text-left font-medium text-muted-foreground">Actions</th>
            </tr></thead>
            <tbody className="divide-y">
              {filtered.map((t: any) => (
                <tr key={t.id} className="hover:bg-muted/30 transition-colors cursor-pointer" onClick={() => setSelectedTicketId(t.id)}>
                  <td className="px-6 py-4">{t.profile?.full_name || "—"}</td>
                  <td className="px-6 py-4 font-medium">{t.subject}</td>
                  <td className="px-6 py-4">{t.category || "—"}</td>
                  <td className="px-6 py-4"><StatusBadge status={t.status} /></td>
                  <td className="px-6 py-4 text-muted-foreground">{format(new Date(t.updated_at), "PP")}</td>
                  <td className="px-6 py-4"><Button variant="ghost" size="sm"><MessageSquare className="h-3 w-3 mr-1" /> Reply</Button></td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">No tickets found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </AdminLayout>
  );
}
