import { BRAND } from "@/config/brand";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";

export default function SignupPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/20 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center">
          <Link to="/" className="text-2xl font-bold tracking-tight">{BRAND.name}</Link>
          <p className="mt-2 text-sm text-muted-foreground">Create your account</p>
        </div>
        <form className="mt-8 space-y-4" onSubmit={(e) => e.preventDefault()}>
          <div>
            <label className="text-sm font-medium">Full Name</label>
            <Input className="mt-1" placeholder="Your full name" />
          </div>
          <div>
            <label className="text-sm font-medium">Email</label>
            <Input className="mt-1" type="email" placeholder="your@email.com" />
          </div>
          <div>
            <label className="text-sm font-medium">Password</label>
            <Input className="mt-1" type="password" placeholder="••••••••" />
          </div>
          <div>
            <label className="text-sm font-medium">Confirm Password</label>
            <Input className="mt-1" type="password" placeholder="••••••••" />
          </div>
          <Button className="w-full" asChild><Link to="/dashboard">Create Account</Link></Button>
        </form>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link to="/auth/login" className="font-medium text-foreground hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
