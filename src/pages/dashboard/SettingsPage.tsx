import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

export default function SettingsPage() {
  return (
    <DashboardLayout>
      <PageHeader title="Settings" description="Manage your account settings." />
      <div className="mt-6 max-w-2xl space-y-8">
        <section className="rounded-lg border bg-card p-6 shadow-card">
          <h2 className="font-semibold">Profile</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div><label className="text-sm font-medium">Full Name</label><Input className="mt-1" defaultValue="John Doe" /></div>
            <div><label className="text-sm font-medium">Email</label><Input className="mt-1" type="email" defaultValue="john@example.com" disabled /></div>
            <div><label className="text-sm font-medium">Phone</label><Input className="mt-1" defaultValue="+977 984XXXXXXX" /></div>
            <div><label className="text-sm font-medium">Country</label><Input className="mt-1" defaultValue="Nepal" /></div>
            <div>
              <label className="text-sm font-medium">Timezone</label>
              <Select defaultValue="asia_kathmandu">
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="asia_kathmandu">Asia/Kathmandu (UTC+5:45)</SelectItem>
                  <SelectItem value="asia_kolkata">Asia/Kolkata (UTC+5:30)</SelectItem>
                  <SelectItem value="utc">UTC</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="mt-4"><Button>Save Changes</Button></div>
        </section>

        <section className="rounded-lg border bg-card p-6 shadow-card">
          <h2 className="font-semibold">Security</h2>
          <div className="mt-4 space-y-4">
            <div><label className="text-sm font-medium">Current Password</label><Input className="mt-1" type="password" /></div>
            <div><label className="text-sm font-medium">New Password</label><Input className="mt-1" type="password" /></div>
            <div><label className="text-sm font-medium">Confirm New Password</label><Input className="mt-1" type="password" /></div>
            <Button>Update Password</Button>
          </div>
          <Separator className="my-6" />
          <div>
            <h3 className="font-medium">Two-Factor Authentication</h3>
            <p className="mt-1 text-sm text-muted-foreground">Add an extra layer of security to your account.</p>
            <Button variant="outline" className="mt-3" disabled>Coming Soon</Button>
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}
