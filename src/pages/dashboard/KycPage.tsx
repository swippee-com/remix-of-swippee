import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, CheckCircle } from "lucide-react";
import { useState } from "react";

const kycStatus = "not_submitted" as const;

export default function KycPage() {
  const [submitted, setSubmitted] = useState(false);

  if (kycStatus === "approved") {
    return (
      <DashboardLayout>
        <PageHeader title="KYC Verification" />
        <div className="mt-6 flex flex-col items-center justify-center rounded-lg border bg-card p-12 text-center shadow-card">
          <CheckCircle className="h-12 w-12 text-success" />
          <h2 className="mt-4 text-xl font-semibold">KYC Approved</h2>
          <p className="mt-2 text-sm text-muted-foreground">Your identity has been verified. You can now trade.</p>
        </div>
      </DashboardLayout>
    );
  }

  if (submitted) {
    return (
      <DashboardLayout>
        <PageHeader title="KYC Verification" />
        <div className="mt-6 flex flex-col items-center justify-center rounded-lg border bg-card p-12 text-center shadow-card">
          <div className="h-12 w-12 rounded-full bg-warning/10 flex items-center justify-center">
            <Upload className="h-6 w-6 text-warning" />
          </div>
          <h2 className="mt-4 text-xl font-semibold">Under Review</h2>
          <p className="mt-2 text-sm text-muted-foreground">Your KYC submission is being reviewed. We'll notify you once it's processed.</p>
          <StatusBadge status="pending_review" className="mt-4" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <PageHeader title="KYC Verification" description="Complete identity verification to start trading." />
      <form className="mt-6 space-y-8" onSubmit={(e) => { e.preventDefault(); setSubmitted(true); }}>
        <section className="rounded-lg border bg-card p-6 shadow-card">
          <h2 className="font-semibold">Personal Information</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div><label className="text-sm font-medium">Full Legal Name *</label><Input className="mt-1" placeholder="As on your ID" required /></div>
            <div><label className="text-sm font-medium">Date of Birth *</label><Input className="mt-1" type="date" required /></div>
            <div><label className="text-sm font-medium">Country *</label><Input className="mt-1" placeholder="Nepal" required /></div>
            <div><label className="text-sm font-medium">Nationality *</label><Input className="mt-1" placeholder="Nepali" required /></div>
            <div><label className="text-sm font-medium">Phone Number *</label><Input className="mt-1" type="tel" placeholder="+977..." required /></div>
            <div><label className="text-sm font-medium">Occupation *</label><Input className="mt-1" placeholder="Your occupation" required /></div>
          </div>
        </section>

        <section className="rounded-lg border bg-card p-6 shadow-card">
          <h2 className="font-semibold">Address</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2"><label className="text-sm font-medium">Address Line 1 *</label><Input className="mt-1" required /></div>
            <div className="sm:col-span-2"><label className="text-sm font-medium">Address Line 2</label><Input className="mt-1" /></div>
            <div><label className="text-sm font-medium">City *</label><Input className="mt-1" required /></div>
            <div><label className="text-sm font-medium">Postal Code</label><Input className="mt-1" /></div>
          </div>
        </section>

        <section className="rounded-lg border bg-card p-6 shadow-card">
          <h2 className="font-semibold">Financial Information</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium">Source of Funds *</label>
              <Select><SelectTrigger className="mt-1"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="salary">Salary/Employment</SelectItem>
                  <SelectItem value="business">Business Income</SelectItem>
                  <SelectItem value="investments">Investments</SelectItem>
                  <SelectItem value="savings">Savings</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Expected Monthly Volume *</label>
              <Select><SelectTrigger className="mt-1"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Under $1,000</SelectItem>
                  <SelectItem value="medium">$1,000 – $10,000</SelectItem>
                  <SelectItem value="high">$10,000 – $50,000</SelectItem>
                  <SelectItem value="very_high">Over $50,000</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </section>

        <section className="rounded-lg border bg-card p-6 shadow-card">
          <h2 className="font-semibold">Identity Documents</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium">ID Type *</label>
              <Select><SelectTrigger className="mt-1"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="passport">Passport</SelectItem>
                  <SelectItem value="drivers_license">Driver's License</SelectItem>
                  <SelectItem value="national_id">National ID</SelectItem>
                  <SelectItem value="citizenship">Citizenship Certificate</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><label className="text-sm font-medium">ID Number *</label><Input className="mt-1" required /></div>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border-2 border-dashed bg-muted/30 p-6 text-center">
              <Upload className="mx-auto h-6 w-6 text-muted-foreground" />
              <p className="mt-2 text-sm font-medium">ID Front *</p>
              <p className="text-xs text-muted-foreground">JPG, PNG, PDF up to 5MB</p>
              <input type="file" className="mt-2 text-xs" accept="image/*,.pdf" />
            </div>
            <div className="rounded-lg border-2 border-dashed bg-muted/30 p-6 text-center">
              <Upload className="mx-auto h-6 w-6 text-muted-foreground" />
              <p className="mt-2 text-sm font-medium">ID Back *</p>
              <p className="text-xs text-muted-foreground">JPG, PNG, PDF up to 5MB</p>
              <input type="file" className="mt-2 text-xs" accept="image/*,.pdf" />
            </div>
            <div className="rounded-lg border-2 border-dashed bg-muted/30 p-6 text-center">
              <Upload className="mx-auto h-6 w-6 text-muted-foreground" />
              <p className="mt-2 text-sm font-medium">Selfie with ID *</p>
              <p className="text-xs text-muted-foreground">Hold your ID next to your face</p>
              <input type="file" className="mt-2 text-xs" accept="image/*" />
            </div>
            <div className="rounded-lg border-2 border-dashed bg-muted/30 p-6 text-center">
              <Upload className="mx-auto h-6 w-6 text-muted-foreground" />
              <p className="mt-2 text-sm font-medium">Proof of Address</p>
              <p className="text-xs text-muted-foreground">Optional — utility bill, bank statement</p>
              <input type="file" className="mt-2 text-xs" accept="image/*,.pdf" />
            </div>
          </div>
        </section>

        <div className="flex justify-end">
          <Button type="submit" variant="hero">Submit KYC</Button>
        </div>
      </form>
    </DashboardLayout>
  );
}
