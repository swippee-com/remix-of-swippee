import { PublicLayout } from "@/components/layout/PublicLayout";
import { BRAND } from "@/config/brand";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Mail, MessageCircle } from "lucide-react";

export default function SupportPage() {
  return (
    <PublicLayout>
      <div className="container py-20">
        <div className="mx-auto max-w-2xl">
          <h1 className="text-3xl font-bold tracking-tight">Support</h1>
          <p className="mt-4 text-muted-foreground">Need help? We're here for you.</p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="flex items-start gap-4 rounded-lg border bg-card p-6 shadow-card">
              <Mail className="h-6 w-6 text-primary shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold">Email Support</h3>
                <p className="mt-1 text-sm text-muted-foreground">{BRAND.supportEmail}</p>
              </div>
            </div>
            <div className="flex items-start gap-4 rounded-lg border bg-card p-6 shadow-card">
              <MessageCircle className="h-6 w-6 text-primary shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold">In-App Support</h3>
                <p className="mt-1 text-sm text-muted-foreground">Create a ticket from your dashboard.</p>
              </div>
            </div>
          </div>

          <div className="mt-10 rounded-lg border bg-card p-6 shadow-card">
            <h2 className="font-semibold">Send us a message</h2>
            <form className="mt-4 space-y-4" onSubmit={(e) => e.preventDefault()}>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-medium">Name</label>
                  <Input className="mt-1" placeholder="Your name" />
                </div>
                <div>
                  <label className="text-sm font-medium">Email</label>
                  <Input className="mt-1" type="email" placeholder="your@email.com" />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Subject</label>
                <Input className="mt-1" placeholder="How can we help?" />
              </div>
              <div>
                <label className="text-sm font-medium">Message</label>
                <Textarea className="mt-1" rows={5} placeholder="Describe your issue or question..." />
              </div>
              <Button type="submit">Send Message</Button>
            </form>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
