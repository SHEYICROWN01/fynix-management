import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Shield, ArrowRight } from "lucide-react";

export default function Login() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulate login
    setTimeout(() => {
      navigate("/dashboard");
    }, 1000);
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-sidebar flex-col justify-between p-12">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sidebar-primary">
              <span className="text-lg font-bold text-sidebar-primary-foreground">
                FC
              </span>
            </div>
            <span className="text-xl font-semibold text-sidebar-foreground">
              Fynix CoBank
            </span>
          </div>
        </div>

        <div className="space-y-6">
          <h1 className="text-4xl font-semibold text-sidebar-foreground leading-tight">
            System Administration
            <br />
            <span className="text-sidebar-muted">Portal</span>
          </h1>
          <p className="text-sidebar-muted max-w-md">
            Secure access to manage your multi-tenant fintech platform. Monitor
            tenants, billing, subscriptions, and system health from one central
            dashboard.
          </p>
        </div>

        <div className="flex items-center gap-2 text-sm text-sidebar-muted">
          <Shield className="h-4 w-4" />
          <span>Protected by enterprise-grade security</span>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md space-y-8 animate-fade-in">
          <div className="text-center lg:text-left">
            <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
                <span className="text-lg font-bold text-primary-foreground">
                  FC
                </span>
              </div>
              <span className="text-xl font-semibold">Fynix CoBank</span>
            </div>
            <h2 className="text-2xl font-semibold text-foreground">
              Welcome back
            </h2>
            <p className="mt-2 text-muted-foreground">
              Sign in to your admin account
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@fynixcobank.com"
                required
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link
                  to="/forgot-password"
                  className="text-sm text-primary hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                required
                className="h-11"
              />
            </div>

            <div className="flex items-center gap-2">
              <Checkbox id="remember" />
              <Label htmlFor="remember" className="text-sm font-normal">
                Keep me signed in for 30 days
              </Label>
            </div>

            <Button
              type="submit"
              className="w-full h-11"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  Signing in...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  Sign in
                  <ArrowRight className="h-4 w-4" />
                </span>
              )}
            </Button>
          </form>

          <div className="pt-4 text-center text-sm text-muted-foreground">
            <p>
              Need access?{" "}
              <a href="#" className="text-primary hover:underline">
                Contact your administrator
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
