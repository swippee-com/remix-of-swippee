import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { HeadphonesIcon, Plus, Send, ArrowLeft } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { useState, useMemo } from "react";
import { toast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useRealtimeInvalidation } from "@/hooks/use-realtime";

export default function SupportDashboardPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const ticketKeys = useMemo(() => [["user-support-tickets"]], []);
  useRealtimeInvalidation("support_tickets", ticketKeys);
  const [createOpen, setCreateOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("");
  const [firstMessage, setFirstMessage] = useState("");
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");

  const { data: tickets = [], isLoading } = useQuery({
    queryKey: ["user-support-tickets"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("support_tickets")
        .select("*")
        .eq("user_id", user!.id)
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: messages = [] } = useQuery({
    queryKey: ["support-messages", selectedTicketId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("support_messages")
        .select("*")
        .eq("ticket_id", selectedTicketId!)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!selectedTicketId,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!subject.trim()) throw new Error("Subject is required.");
      const { data: ticket, error } = await supabase
        .from("support_tickets")
        .insert({ user_id: user!.id, subject, category: category || null })
        .select("id")
        .single();
      if (error) throw error;
      if (firstMessage.trim()) {
        await supabase.from("support_messages").insert({
          ticket_id: ticket.id,
          sender_id: user!.id,
          message: firstMessage,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-support-tickets"] });
      setCreateOpen(false);
      setSubject("");
      setCategory("");
      setFirstMessage("");
      toast({ title: "Ticket created" });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const sendMutation = useMutation({
    mutationFn: async () => {
      if (!newMessage.trim()) throw new Error("Message cannot be empty.");
      const { error } = await supabase.from("support_messages").insert({
        ticket_id: selectedTicketId!,
        sender_id: user!.id,
        message: newMessage,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["support-messages", selectedTicketId] });
      setNewMessage("");
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  if (selectedTicketId) {
    const ticket = tickets.find((t) => t.id === selectedTicketId);
    return (
      <DashboardLayout>
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" onClick={() => setSelectedTicketId(null)}><ArrowLeft className="h-4 w-4" /></Button>
          <div>
            <h1 className="text-lg font-semibold">{ticket?.subject || "Ticket"}</h1>
            <div className="flex items-center gap-2 mt-0.5">
              {ticket && <StatusBadge status={ticket.status} />}
              {ticket?.category && <span className="text-xs text-muted-foreground">{ticket.category}</span>}
            </div>
          </div>
        </div>

        <div className="rounded-lg border bg-card shadow-card">
          <div className="divide-y max-h-[50vh] overflow-y-auto">
            {messages.length === 0 ? (
              <p className="px-6 py-8 text-center text-sm text-muted-foreground">No messages yet.</p>
            ) : (
              messages.map((m) => (
                <div key={m.id} className={`px-6 py-4 ${m.sender_id === user!.id ? "" : "bg-muted/30"}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium">{m.sender_id === user!.id ? "You" : "Support"}</span>
                    <span className="text-xs text-muted-foreground">{format(new Date(m.created_at), "PPp")}</span>
                  </div>
                  <p className="text-sm whitespace-pre-wrap">{m.message}</p>
                </div>
              ))
            )}
          </div>
          <div className="border-t p-4">
            <form onSubmit={(e) => { e.preventDefault(); sendMutation.mutate(); }} className="flex gap-2">
              <Input
                placeholder="Type a message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                className="flex-1"
              />
              <Button type="submit" size="icon" disabled={sendMutation.isPending}>
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <PageHeader title="Support" description="Get help with your account or trades.">
        <Button onClick={() => setCreateOpen(true)}><Plus className="mr-1 h-4 w-4" /> New Ticket</Button>
      </PageHeader>

      {isLoading ? (
        <div className="flex justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>
      ) : tickets.length === 0 ? (
        <EmptyState icon={<HeadphonesIcon className="mx-auto h-10 w-10" />} title="No support tickets" description="Create a ticket if you need help." className="mt-6" />
      ) : (
        <div className="mt-6 rounded-lg border bg-card shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b bg-muted/50">
                <th className="px-6 py-3 text-left font-medium text-muted-foreground">Subject</th>
                <th className="px-6 py-3 text-left font-medium text-muted-foreground">Category</th>
                <th className="px-6 py-3 text-left font-medium text-muted-foreground">Status</th>
                <th className="px-6 py-3 text-left font-medium text-muted-foreground">Updated</th>
                <th className="px-6 py-3 text-left font-medium text-muted-foreground">Action</th>
              </tr></thead>
              <tbody className="divide-y">
                {tickets.map((t) => (
                  <tr key={t.id} className="hover:bg-muted/30 cursor-pointer" onClick={() => setSelectedTicketId(t.id)}>
                    <td className="px-6 py-4 font-medium">{t.subject}</td>
                    <td className="px-6 py-4">{t.category || "—"}</td>
                    <td className="px-6 py-4"><StatusBadge status={t.status} /></td>
                    <td className="px-6 py-4 text-muted-foreground">{format(new Date(t.updated_at), "PP")}</td>
                    <td className="px-6 py-4"><Button variant="ghost" size="sm">Open</Button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>New Support Ticket</DialogTitle></DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(); }} className="space-y-4">
            <div>
              <label className="text-sm font-medium">Subject *</label>
              <Input className="mt-1" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Brief description of your issue" required />
            </div>
            <div>
              <label className="text-sm font-medium">Category</label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="account">Account</SelectItem>
                  <SelectItem value="kyc">KYC</SelectItem>
                  <SelectItem value="trades">Trades</SelectItem>
                  <SelectItem value="payments">Payments</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Message</label>
              <Textarea className="mt-1" rows={4} value={firstMessage} onChange={(e) => setFirstMessage(e.target.value)} placeholder="Describe your issue in detail..." />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={createMutation.isPending}>{createMutation.isPending ? "Creating…" : "Create Ticket"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
