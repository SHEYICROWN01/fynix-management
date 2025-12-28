import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import {
  Plus,
  Edit,
  Check,
  Users,
  Building2,
  Zap,
} from "lucide-react";
import { useState } from "react";

const plans = [
  {
    id: "basic",
    name: "Basic",
    price: 450,
    description: "For small credit unions and cooperatives",
    features: [
      "Up to 50 users",
      "Basic savings management",
      "Standard loan products",
      "Email support",
      "Monthly reports",
    ],
    subscribers: 28,
    revenue: "$12,600",
  },
  {
    id: "professional",
    name: "Professional",
    price: 890,
    description: "For growing financial institutions",
    features: [
      "Up to 200 users",
      "Advanced savings & investments",
      "Custom loan products",
      "Priority support",
      "Real-time analytics",
      "API access",
    ],
    subscribers: 45,
    revenue: "$40,050",
    popular: true,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: null,
    description: "For large-scale operations",
    features: [
      "Unlimited users",
      "Full platform access",
      "Custom integrations",
      "Dedicated support",
      "SLA guarantee",
      "White-label options",
      "Compliance tools",
    ],
    subscribers: 45,
    revenue: "$156,000",
  },
];

const activeSubscriptions = [
  {
    tenant: "Acme Financial Corp",
    plan: "Enterprise",
    status: "active" as const,
    users: 156,
    billingCycle: "Annual",
    nextBilling: "Dec 15, 2024",
    amount: "$29,400",
  },
  {
    tenant: "Metro Credit Union",
    plan: "Enterprise",
    status: "active" as const,
    users: 234,
    billingCycle: "Annual",
    nextBilling: "Nov 02, 2024",
    amount: "$38,400",
  },
  {
    tenant: "TechStart Bank",
    plan: "Professional",
    status: "trial" as const,
    users: 42,
    billingCycle: "Monthly",
    nextBilling: "Apr 14, 2024",
    amount: "$890",
  },
  {
    tenant: "Summit Cooperative",
    plan: "Professional",
    status: "active" as const,
    users: 89,
    billingCycle: "Monthly",
    nextBilling: "Mar 22, 2024",
    amount: "$890",
  },
  {
    tenant: "Pine State Bank",
    plan: "Basic",
    status: "active" as const,
    users: 45,
    billingCycle: "Monthly",
    nextBilling: "Apr 08, 2024",
    amount: "$450",
  },
];

export default function Plans() {
  const [isEditPlanOpen, setIsEditPlanOpen] = useState(false);

  return (
    <DashboardLayout title="Plans & Subscriptions">
      <div className="space-y-6 animate-fade-in">
        <Tabs defaultValue="plans" className="space-y-6">
          <TabsList className="bg-muted">
            <TabsTrigger value="plans">Subscription Plans</TabsTrigger>
            <TabsTrigger value="subscriptions">Active Subscriptions</TabsTrigger>
            <TabsTrigger value="trials">Trial Management</TabsTrigger>
          </TabsList>

          <TabsContent value="plans" className="space-y-6">
            {/* Plans Grid */}
            <div className="grid gap-6 lg:grid-cols-3">
              {plans.map((plan) => (
                <div
                  key={plan.id}
                  className={`relative rounded-lg border bg-card p-6 ${
                    plan.popular ? "border-primary shadow-md" : "border-border"
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">
                        Most Popular
                      </span>
                    </div>
                  )}
                  <div className="mb-4 flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-semibold">{plan.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {plan.description}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsEditPlanOpen(true)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="mb-6">
                    {plan.price ? (
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-bold">${plan.price}</span>
                        <span className="text-muted-foreground">/month</span>
                      </div>
                    ) : (
                      <span className="text-3xl font-bold">Custom</span>
                    )}
                  </div>

                  <ul className="mb-6 space-y-3">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 text-success" />
                        {feature}
                      </li>
                    ))}
                  </ul>

                  <div className="border-t border-border pt-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subscribers</span>
                      <span className="font-medium">{plan.subscribers}</span>
                    </div>
                    <div className="mt-2 flex justify-between text-sm">
                      <span className="text-muted-foreground">Monthly Revenue</span>
                      <span className="font-medium text-success">{plan.revenue}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Add New Plan Button */}
            <Button variant="outline" className="w-full">
              <Plus className="mr-2 h-4 w-4" />
              Create New Plan
            </Button>
          </TabsContent>

          <TabsContent value="subscriptions" className="space-y-6">
            {/* Summary */}
            <div className="grid gap-4 md:grid-cols-3">
              <div className="flex items-center gap-4 rounded-lg border border-border bg-card p-4">
                <div className="rounded-lg bg-primary/10 p-3">
                  <Building2 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-semibold">118</p>
                  <p className="text-sm text-muted-foreground">Active Subscriptions</p>
                </div>
              </div>
              <div className="flex items-center gap-4 rounded-lg border border-border bg-card p-4">
                <div className="rounded-lg bg-success/10 p-3">
                  <Zap className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-2xl font-semibold">$208,650</p>
                  <p className="text-sm text-muted-foreground">Monthly Recurring</p>
                </div>
              </div>
              <div className="flex items-center gap-4 rounded-lg border border-border bg-card p-4">
                <div className="rounded-lg bg-warning/10 p-3">
                  <Users className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <p className="text-2xl font-semibold">4,892</p>
                  <p className="text-sm text-muted-foreground">Total Users</p>
                </div>
              </div>
            </div>

            {/* Subscriptions Table */}
            <div className="rounded-lg border border-border bg-card">
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Tenant</th>
                      <th>Plan</th>
                      <th>Status</th>
                      <th>Users</th>
                      <th>Billing Cycle</th>
                      <th>Next Billing</th>
                      <th className="text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeSubscriptions.map((sub) => (
                      <tr key={sub.tenant}>
                        <td className="font-medium">{sub.tenant}</td>
                        <td>{sub.plan}</td>
                        <td>
                          <StatusBadge status={sub.status} />
                        </td>
                        <td className="text-muted-foreground">{sub.users}</td>
                        <td className="text-muted-foreground">{sub.billingCycle}</td>
                        <td className="text-muted-foreground">{sub.nextBilling}</td>
                        <td className="text-right font-medium">{sub.amount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="trials" className="space-y-6">
            <div className="rounded-lg border border-border bg-card p-6">
              <h3 className="mb-4 text-lg font-semibold">Trial Settings</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between rounded-lg border border-border p-4">
                  <div>
                    <p className="font-medium">Enable Trial Period</p>
                    <p className="text-sm text-muted-foreground">
                      Allow new tenants to start with a free trial
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between rounded-lg border border-border p-4">
                  <div>
                    <p className="font-medium">Trial Duration</p>
                    <p className="text-sm text-muted-foreground">
                      Default trial period for new tenants
                    </p>
                  </div>
                  <span className="text-sm font-medium">14 days</span>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-border p-4">
                  <div>
                    <p className="font-medium">Auto-convert to Paid</p>
                    <p className="text-sm text-muted-foreground">
                      Automatically start billing after trial ends
                    </p>
                  </div>
                  <Switch />
                </div>
              </div>
            </div>

            {/* Active Trials */}
            <div className="rounded-lg border border-border bg-card">
              <div className="border-b border-border p-6">
                <h3 className="text-lg font-semibold">Active Trials</h3>
                <p className="text-sm text-muted-foreground">
                  Tenants currently on trial period
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Tenant</th>
                      <th>Trial Plan</th>
                      <th>Started</th>
                      <th>Days Remaining</th>
                      <th className="text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="font-medium">TechStart Bank</td>
                      <td>Professional</td>
                      <td className="text-muted-foreground">Feb 28, 2024</td>
                      <td>
                        <span className="rounded-full bg-warning/10 px-2 py-1 text-xs font-medium text-warning">
                          5 days left
                        </span>
                      </td>
                      <td className="text-right">
                        <Button variant="ghost" size="sm">
                          Convert to Paid
                        </Button>
                      </td>
                    </tr>
                    <tr>
                      <td className="font-medium">Horizon Finance Group</td>
                      <td>Professional</td>
                      <td className="text-muted-foreground">Mar 22, 2024</td>
                      <td>
                        <span className="rounded-full bg-success/10 px-2 py-1 text-xs font-medium text-success">
                          12 days left
                        </span>
                      </td>
                      <td className="text-right">
                        <Button variant="ghost" size="sm">
                          Convert to Paid
                        </Button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Edit Plan Dialog */}
        <Dialog open={isEditPlanOpen} onOpenChange={setIsEditPlanOpen}>
          <DialogContent className="bg-card sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Plan</DialogTitle>
              <DialogDescription>
                Update plan details and pricing
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="planName">Plan Name</Label>
                <Input id="planName" defaultValue="Professional" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="planPrice">Monthly Price ($)</Label>
                <Input id="planPrice" type="number" defaultValue="890" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="planDesc">Description</Label>
                <Input
                  id="planDesc"
                  defaultValue="For growing financial institutions"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditPlanOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => setIsEditPlanOpen(false)}>Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
