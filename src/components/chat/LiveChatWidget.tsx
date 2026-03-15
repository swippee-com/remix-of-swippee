import { useState, useEffect, useRef, useMemo } from "react";
import { useLocation, Link } from "react-router-dom";
import { MessageCircle, X, Send, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRealtimeInvalidation } from "@/hooks/use-realtime";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export function LiveChatWidget() {
  const { user } = useAuth();
  const location = useLocation();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [newSubject, setNewSubject] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const prevMessageCountRef = useRef(0);

  const isOnSupportPage = location.pathname.startsWith("/dashboard/support");
  const userId = user?.id;

  // Fetch user's most recent open/pending ticket
  const { data: activeTicket } = useQuery({
    queryKey: ["chat-active-ticket", userId],
    queryFn: async () => {
      const { data } = await supabase
        .from("support_tickets")
        .select("*")
        .eq("user_id", userId!)
        .in("status", ["open", "pending_user", "pending_admin"])
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      return data;
    },
    enabled: !!userId,
  });

  const activeTicketId = activeTicket?.id;

  // Fetch messages for active ticket
  const { data: messages = [] } = useQuery({
    queryKey: ["chat-messages", activeTicketId],
    queryFn: async () => {
      if (!activeTicketId) return [];
      const { data } = await supabase
        .from("support_messages")
        .select("*")
        .eq("ticket_id", activeTicketId)
        .eq("is_internal", false)
        .order("created_at", { ascending: true });
      return data ?? [];
    },
    enabled: !!activeTicketId,
  });

  // Realtime keys — stable reference
  const realtimeKeys = useMemo(
    () => [["chat-messages", activeTicketId ?? ""], ["chat-active-ticket", userId ?? ""]],
    [activeTicketId, userId]
  );

  useRealtimeInvalidation(
    "support_messages",
    realtimeKeys,
    activeTicketId ? `ticket_id=eq.${activeTicketId}` : undefined
  );

  // Unread: last message not from user
  const hasUnread =
    messages.length > 0 && messages[messages.length - 1].sender_id !== userId;

  // Auto-scroll on new messages
  useEffect(() => {
    if (open && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, open]);

  // Send message mutation
  const sendMutation = useMutation({
    mutationFn: async (msg: string) => {
      if (!activeTicketId || !userId) throw new Error("No active ticket");
      const { error } = await supabase.from("support_messages").insert({
        ticket_id: activeTicketId,
        sender_id: userId,
        message: msg,
        is_internal: false,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setMessage("");
      queryClient.invalidateQueries({ queryKey: ["chat-messages"] });
    },
    onError: () => toast.error("Failed to send message"),
  });

  // Create ticket mutation
  const createMutation = useMutation({
    mutationFn: async ({ subject, msg }: { subject: string; msg: string }) => {
      if (!userId) throw new Error("Not authenticated");
      const { data: ticket, error: tErr } = await supabase
        .from("support_tickets")
        .insert({ user_id: userId, subject, category: "general" })
        .select("id")
        .single();
      if (tErr || !ticket) throw tErr;

      const { error: mErr } = await supabase.from("support_messages").insert({
        ticket_id: ticket.id,
        sender_id: userId,
        message: msg,
        is_internal: false,
      });
      if (mErr) throw mErr;
      return ticket;
    },
    onSuccess: () => {
      setNewSubject("");
      setNewMessage("");
      queryClient.invalidateQueries({ queryKey: ["chat-active-ticket"] });
      queryClient.invalidateQueries({ queryKey: ["chat-messages"] });
    },
    onError: () => toast.error("Failed to create conversation"),
  });

  const handleSend = () => {
    const trimmed = message.trim();
    if (!trimmed) return;
    sendMutation.mutate(trimmed);
  };

  const handleCreate = () => {
    const sub = newSubject.trim();
    const msg = newMessage.trim();
    if (!sub || !msg) return;
    createMutation.mutate({ subject: sub, msg });
  };

  // Don't render on support page or if not logged in
  if (isOnSupportPage || !userId) return null;

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-all",
          "bg-primary text-primary-foreground hover:bg-primary/90",
          open && "scale-0 opacity-0 pointer-events-none"
        )}
        aria-label="Open live chat"
      >
        <MessageCircle className="h-6 w-6" />
        {hasUnread && !open && (
          <span className="absolute -right-0.5 -top-0.5 h-3.5 w-3.5 rounded-full border-2 border-background bg-destructive" />
        )}
      </button>

      {/* Chat panel */}
      {open && (
        <div
          className={cn(
            "fixed bottom-6 right-6 z-50 flex flex-col rounded-xl border bg-card shadow-xl",
            "w-[calc(100vw-3rem)] max-w-[380px] h-[min(500px,calc(100vh-6rem))]"
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b px-4 py-3">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-primary" />
              <span className="font-semibold text-sm">Live Chat</span>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {activeTicket ? (
            <>
              {/* Messages */}
              <ScrollArea className="flex-1 px-4 py-3" ref={scrollRef}>
                <p className="mb-3 text-xs text-muted-foreground text-center">
                  {activeTicket.subject}
                </p>
                <div className="space-y-2">
                  {messages.map((m) => {
                    const isUser = m.sender_id === userId;
                    return (
                      <div
                        key={m.id}
                        className={cn("flex", isUser ? "justify-end" : "justify-start")}
                      >
                        <div
                          className={cn(
                            "max-w-[80%] rounded-lg px-3 py-2 text-sm",
                            isUser
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-muted-foreground"
                          )}
                        >
                          {m.message}
                          <div
                            className={cn(
                              "mt-1 text-[10px] opacity-60",
                              isUser ? "text-right" : "text-left"
                            )}
                          >
                            {new Date(m.created_at).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>

              {/* Input */}
              <div className="border-t px-3 py-2">
                <form
                  className="flex gap-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSend();
                  }}
                >
                  <Input
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Type a message…"
                    className="h-9 text-sm"
                    disabled={sendMutation.isPending}
                  />
                  <Button
                    type="submit"
                    size="icon"
                    className="h-9 w-9 shrink-0"
                    disabled={!message.trim() || sendMutation.isPending}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
                <Link
                  to="/dashboard/support"
                  className="mt-2 flex items-center justify-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setOpen(false)}
                >
                  View all tickets <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </>
          ) : (
            /* New conversation form */
            <div className="flex flex-1 flex-col p-4">
              <p className="text-sm text-muted-foreground mb-4">
                Start a conversation and our team will respond shortly.
              </p>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium">Subject</label>
                  <Input
                    value={newSubject}
                    onChange={(e) => setNewSubject(e.target.value)}
                    placeholder="How can we help?"
                    className="mt-1 h-9 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium">Message</label>
                  <Textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Describe your issue…"
                    rows={4}
                    className="mt-1 text-sm"
                  />
                </div>
                <Button
                  className="w-full"
                  onClick={handleCreate}
                  disabled={!newSubject.trim() || !newMessage.trim() || createMutation.isPending}
                >
                  {createMutation.isPending ? "Sending…" : "Start Chat"}
                </Button>
              </div>
              <Link
                to="/dashboard/support"
                className="mt-auto flex items-center justify-center gap-1 pt-4 text-xs text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => setOpen(false)}
              >
                View all tickets <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          )}
        </div>
      )}
    </>
  );
}
