

# Live Chat Widget

## What We're Building
A floating chat widget (bottom-right bubble) available on all dashboard pages. Users can start a quick live chat or continue an existing open ticket — all powered by the existing `support_tickets` + `support_messages` tables with realtime subscriptions. No new database tables needed.

## How It Works

1. **Floating button** — A `MessageCircle` icon button fixed to the bottom-right corner of every dashboard page. Shows an unread indicator dot when there are new admin replies.

2. **Chat popover** — Clicking opens a compact chat panel (~380px wide, ~500px tall) with:
   - If no open ticket: a quick "Start a conversation" form (subject + first message, category defaults to "other")
   - If open ticket(s) exist: shows the most recent open ticket's messages in a chat-bubble style, with a text input at the bottom
   - A link to "View all tickets" that navigates to `/dashboard/support`

3. **Realtime messages** — Subscribe to `support_messages` changes filtered by the active ticket ID using the existing `useRealtimeInvalidation` hook so new admin replies appear instantly.

4. **Unread indicator** — Track whether the latest message on the user's most recent open ticket is from someone other than the user (i.e., an admin reply). Show a red dot on the chat bubble.

## Components

### `src/components/chat/LiveChatWidget.tsx`
- Fixed position button + popover panel
- Uses `useAuth` to get user ID
- Queries `support_tickets` for the user's most recent open/pending ticket
- Queries `support_messages` for that ticket
- Realtime subscription on `support_messages` filtered by `ticket_id=eq.{id}`
- Send message mutation (same as existing support page)
- Create ticket mutation for new conversations
- Auto-scrolls to bottom on new messages

### `src/components/layout/DashboardLayout.tsx`
- Import and render `<LiveChatWidget />` inside the layout so it appears on every dashboard page

## Technical Details

- **No DB migration needed** — reuses `support_tickets` and `support_messages` tables with existing RLS policies
- **Enable realtime** on `support_messages` table via migration: `ALTER PUBLICATION supabase_realtime ADD TABLE public.support_messages;`
- Chat bubbles styled differently for user (right-aligned, primary bg) vs admin (left-aligned, muted bg)
- Widget hidden when on `/dashboard/support` to avoid redundancy
- Mobile responsive: on small screens the popover expands to near-full-width

