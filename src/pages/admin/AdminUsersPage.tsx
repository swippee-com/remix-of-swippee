import { AdminLayout } from "@/components/layout/AdminLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

const users = [
  { id: "1", name: "Ram Sharma", email: "ram@example.com", role: "user", kyc: "approved" as const, trades: 14, joined: "Jan 15, 2026" },
  { id: "2", name: "Sita Thapa", email: "sita@example.com", role: "user", kyc: "pending_review" as const, trades: 2, joined: "Feb 20, 2026" },
  { id: "3", name: "Hari Bahadur", email: "hari@example.com", role: "user", kyc: "not_submitted" as const, trades: 0, joined: "Mar 1, 2026" },
  { id: "4", name: "Gita KC", email: "gita@example.com", role: "user", kyc: "approved" as const, trades: 8, joined: "Feb 5, 2026" },
];

export default function AdminUsersPage() {
  return (
    <AdminLayout>
      <PageHeader title="Users" description="Manage all registered users." />
      <div className="mt-6 flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search users..." />
        </div>
      </div>
      <div className="mt-4 rounded-lg border bg-card shadow-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="border-b bg-muted/50">
            <th className="px-6 py-3 text-left font-medium text-muted-foreground">Name</th>
            <th className="px-6 py-3 text-left font-medium text-muted-foreground">Email</th>
            <th className="px-6 py-3 text-left font-medium text-muted-foreground">Role</th>
            <th className="px-6 py-3 text-left font-medium text-muted-foreground">KYC</th>
            <th className="px-6 py-3 text-left font-medium text-muted-foreground">Trades</th>
            <th className="px-6 py-3 text-left font-medium text-muted-foreground">Joined</th>
          </tr></thead>
          <tbody className="divide-y">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-muted/30 transition-colors cursor-pointer">
                <td className="px-6 py-4 font-medium">{u.name}</td>
                <td className="px-6 py-4 text-muted-foreground">{u.email}</td>
                <td className="px-6 py-4 capitalize">{u.role}</td>
                <td className="px-6 py-4"><StatusBadge status={u.kyc} /></td>
                <td className="px-6 py-4">{u.trades}</td>
                <td className="px-6 py-4 text-muted-foreground">{u.joined}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
}
