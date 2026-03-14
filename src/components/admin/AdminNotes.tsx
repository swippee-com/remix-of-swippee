import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import { StickyNote, Send, Trash2 } from "lucide-react";

interface AdminNotesProps {
  targetId: string;
  targetType?: string;
}

export function AdminNotes({ targetId, targetType = "user" }: AdminNotesProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [newNote, setNewNote] = useState("");

  const { data: notes = [], isLoading } = useQuery({
    queryKey: ["admin-notes", targetType, targetId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admin_notes")
        .select("*")
        .eq("target_id", targetId)
        .eq("target_type", targetType)
        .order("created_at", { ascending: false });
      if (error) throw error;
      // Fetch author names
      const authorIds = [...new Set(data.map((n) => n.created_by))];
      if (authorIds.length === 0) return data.map((n) => ({ ...n, author_name: null }));
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .in("id", authorIds);
      const map = Object.fromEntries((profiles || []).map((p) => [p.id, p.full_name || p.email || "Admin"]));
      return data.map((n) => ({ ...n, author_name: map[n.created_by] || "Admin" }));
    },
    enabled: !!targetId,
  });

  const addMutation = useMutation({
    mutationFn: async (note: string) => {
      const { error } = await supabase.from("admin_notes").insert({
        target_id: targetId,
        target_type: targetType,
        note,
        created_by: user!.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-notes", targetType, targetId] });
      setNewNote("");
      toast({ title: "Note added" });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (noteId: string) => {
      const { error } = await supabase.from("admin_notes").delete().eq("id", noteId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-notes", targetType, targetId] });
      toast({ title: "Note deleted" });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const handleSubmit = () => {
    const trimmed = newNote.trim();
    if (!trimmed || trimmed.length > 2000) return;
    addMutation.mutate(trimmed);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <StickyNote className="h-4 w-4" /> Internal Notes
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add note form */}
        <div className="flex gap-2">
          <Textarea
            placeholder="Add an internal note about this user..."
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            rows={2}
            maxLength={2000}
            className="flex-1 resize-none"
          />
          <Button
            size="sm"
            className="self-end"
            disabled={!newNote.trim() || addMutation.isPending}
            onClick={handleSubmit}
          >
            <Send className="h-3.5 w-3.5" />
          </Button>
        </div>

        {/* Notes list */}
        {isLoading ? (
          <div className="flex justify-center py-4">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : notes.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-4">No internal notes yet.</p>
        ) : (
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {notes.map((note: any) => (
              <div key={note.id} className="rounded-md border bg-muted/30 p-3 text-sm group relative">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-primary">{note.author_name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{format(new Date(note.created_at), "PPp")}</span>
                    {note.created_by === user?.id && (
                      <button
                        onClick={() => deleteMutation.mutate(note.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive/80"
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                </div>
                <p className="whitespace-pre-wrap text-muted-foreground">{note.note}</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
