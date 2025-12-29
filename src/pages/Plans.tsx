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
import { Textarea } from "@/components/ui/textarea";
import {
  Plus,
  Edit,
  Check,
  Users,
  Building2,
  Zap,
  Trash2,
  X,
} from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

const plans = [
  {
    id: "basic",
    name: "Basic",
    basePrice: 150000,
    pricePerUser: 5000,
    description: "For small credit unions and cooperatives",
    features: [
      "Up to 50 users",
      "Basic savings management",
      "Standard loan products",
      "Email support",
      "Monthly reports",
    ],
    trialDays: 14,
    subscribers: 28,
    revenue: "₦12,600,000",
    isActive: true,
  },
  {
    id: "professional",
    name: "Professional",
    basePrice: 350000,
    pricePerUser: 8000,
    description: "For growing financial institutions",
    features: [
      "Up to 200 users",
      "Advanced savings & investments",
      "Custom loan products",
      "Priority support",
      "Real-time analytics",
      "API access",
    ],
    trialDays: 14,
    subscribers: 45,
    revenue: "₦40,050,000",
    popular: true,
    isActive: true,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    basePrice: null,
    pricePerUser: null,
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
    trialDays: 30,
    subscribers: 45,
    revenue: "₦156,000,000",
    isActive: true,
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
    amount: "₦29,400,000",
  },
  {
    tenant: "Metro Credit Union",
    plan: "Enterprise",
    status: "active" as const,
    users: 234,
    billingCycle: "Annual",
    nextBilling: "Nov 02, 2024",
    amount: "₦38,400,000",
  },
  {
    tenant: "TechStart Bank",
    plan: "Professional",
    status: "trial" as const,
    users: 42,
    billingCycle: "Monthly",
    nextBilling: "Apr 14, 2024",
    amount: "₦890,000",
  },
  {
    tenant: "Summit Cooperative",
    plan: "Professional",
    status: "active" as const,
    users: 89,
    billingCycle: "Monthly",
    nextBilling: "Mar 22, 2024",
    amount: "₦890,000",
  },
  {
    tenant: "Pine State Bank",
    plan: "Basic",
    status: "active" as const,
    users: 45,
    billingCycle: "Monthly",
    nextBilling: "Apr 08, 2024",
    amount: "₦450,000",
  },
];

const planTenants = {
  basic: [
    { name: "Pine State Bank", users: 45, revenue: "₦450,000" },
    { name: "Coastal Savings Bank", users: 18, revenue: "₦450,000" },
  ],
  professional: [
    { name: "Summit Cooperative", users: 89, revenue: "₦890,000" },
    { name: "TechStart Bank", users: 42, revenue: "₦890,000" },
    { name: "Horizon Finance Group", users: 28, revenue: "₦890,000" },
  ],
  enterprise: [
    { name: "Acme Financial Corp", users: 156, revenue: "₦2,450,000" },
    { name: "Metro Credit Union", users: 234, revenue: "₦3,200,000" },
    { name: "Valley Credit Services", users: 312, revenue: "₦4,100,000" },
  ],
};

export default function Plans() {
  const { toast } = useToast();
  const [isEditPlanOpen, setIsEditPlanOpen] = useState(false);
  const [isCreatePlanOpen, setIsCreatePlanOpen] = useState(false);
  const [isViewTenantsOpen, setIsViewTenantsOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<typeof plans[0] | null>(null);
  const [newFeature, setNewFeature] = useState("");
  
  const [planForm, setPlanForm] = useState({
    name: "",
    basePrice: "",
    pricePerUser: "",
    description: "",
    features: [] as string[],
    trialDays: "14",
    isActive: true,
  });

  const handleAddFeature = () => {
    if (newFeature.trim()) {
      setPlanForm({
        ...planForm,
        features: [...planForm.features, newFeature.trim()],
      });
      setNewFeature("");
    }
  };

  const handleRemoveFeature = (index: number) => {
    setPlanForm({
      ...planForm,
      features: planForm.features.filter((_, i) => i !== index),
    });
  };

  const handleCreatePlan = () => {
    toast({
      title: "Plan created",
      description: `${planForm.name} plan has been created successfully.`,
    });
    setIsCreatePlanOpen(false);
    setPlanForm({
      name: "",
      basePrice: "",
      pricePerUser: "",
      description: "",
      features: [],
      trialDays: "14",
      isActive: true,
    });
  };

  const formatPrice = (price: number | null) => {
    if (price === null) return "Custom";
    return `₦${price.toLocaleString()}`;
  };

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
                      onClick={() => {
                        setSelectedPlan(plan);
                        setIsEditPlanOpen(true);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="mb-4">
                    {plan.basePrice !== null ? (
                      <div className="space-y-1">
                        <div className="flex items-baseline gap-1">
                          <span className="text-3xl font-bold">{formatPrice(plan.basePrice)}</span>
                          <span className="text-muted-foreground">/month</span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          + {formatPrice(plan.pricePerUser)}/active user
                        </p>
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

                  <div className="border-t border-border pt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subscribers</span>
                      <span className="font-medium">{plan.subscribers}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Monthly Revenue</span>
                      <span className="font-medium text-success">{plan.revenue}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Trial Period</span>
                      <span className="font-medium">{plan.trialDays} days</span>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-4"
                    onClick={() => {
                      setSelectedPlan(plan);
                      setIsViewTenantsOpen(true);
                    }}
                  >
                    <Building2 className="mr-2 h-4 w-4" />
                    View Tenants ({plan.subscribers})
                  </Button>
                </div>
              ))}
            </div>

            {/* Add New Plan Button */}
            <Button variant="outline" className="w-full" onClick={() => setIsCreatePlanOpen(true)}>
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
                  <p className="text-2xl font-semibold">₦208.6M</p>
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

        {/* Create Plan Dialog */}
        <Dialog open={isCreatePlanOpen} onOpenChange={setIsCreatePlanOpen}>
          <DialogContent className="bg-card sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Plan</DialogTitle>
              <DialogDescription>
                Define a new subscription plan with pricing and features
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="planName">Plan Name *</Label>
                  <Input
                    id="planName"
                    placeholder="e.g. Premium"
                    value={planForm.name}
                    onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="trialDays">Trial Duration (days)</Label>
                  <Input
                    id="trialDays"
                    type="number"
                    placeholder="14"
                    value={planForm.trialDays}
                    onChange={(e) => setPlanForm({ ...planForm, trialDays: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="basePrice">Monthly Base Price (₦) *</Label>
                  <Input
                    id="basePrice"
                    type="number"
                    placeholder="e.g. 250000"
                    value={planForm.basePrice}
                    onChange={(e) => setPlanForm({ ...planForm, basePrice: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pricePerUser">Price Per Active User (₦)</Label>
                  <Input
                    id="pricePerUser"
                    type="number"
                    placeholder="e.g. 6000"
                    value={planForm.pricePerUser}
                    onChange={(e) => setPlanForm({ ...planForm, pricePerUser: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="planDesc">Description</Label>
                <Textarea
                  id="planDesc"
                  placeholder="Brief description of this plan"
                  value={planForm.description}
                  onChange={(e) => setPlanForm({ ...planForm, description: e.target.value })}
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label>Included Features</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add a feature"
                    value={newFeature}
                    onChange={(e) => setNewFeature(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddFeature()}
                  />
                  <Button type="button" variant="outline" onClick={handleAddFeature}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {planForm.features.length > 0 && (
                  <div className="space-y-2 mt-2">
                    {planForm.features.map((feature, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between rounded-md bg-muted px-3 py-2 text-sm"
                      >
                        <div className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-success" />
                          {feature}
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => handleRemoveFeature(index)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border p-4">
                <div>
                  <p className="font-medium text-sm">Active</p>
                  <p className="text-xs text-muted-foreground">
                    Make this plan available for new subscriptions
                  </p>
                </div>
                <Switch
                  checked={planForm.isActive}
                  onCheckedChange={(checked) => setPlanForm({ ...planForm, isActive: checked })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreatePlanOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreatePlan}>Create Plan</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Plan Dialog */}
        <Dialog open={isEditPlanOpen} onOpenChange={setIsEditPlanOpen}>
          <DialogContent className="bg-card sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Plan</DialogTitle>
              <DialogDescription>
                Update plan details and pricing
              </DialogDescription>
            </DialogHeader>
            {selectedPlan && (
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="editPlanName">Plan Name</Label>
                  <Input id="editPlanName" defaultValue={selectedPlan.name} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="editBasePrice">Base Price (₦)</Label>
                    <Input
                      id="editBasePrice"
                      type="number"
                      defaultValue={selectedPlan.basePrice || ""}
                      placeholder="Custom pricing"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="editPricePerUser">Per User (₦)</Label>
                    <Input
                      id="editPricePerUser"
                      type="number"
                      defaultValue={selectedPlan.pricePerUser || ""}
                      placeholder="N/A"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editPlanDesc">Description</Label>
                  <Input
                    id="editPlanDesc"
                    defaultValue={selectedPlan.description}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editTrialDays">Trial Duration (days)</Label>
                  <Input
                    id="editTrialDays"
                    type="number"
                    defaultValue={selectedPlan.trialDays}
                  />
                </div>
                <div className="flex items-center justify-between rounded-lg border border-border p-4">
                  <div>
                    <p className="font-medium text-sm">Active</p>
                    <p className="text-xs text-muted-foreground">
                      Available for new subscriptions
                    </p>
                  </div>
                  <Switch defaultChecked={selectedPlan.isActive} />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button
                variant="outline"
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Deactivate
              </Button>
              <Button variant="outline" onClick={() => setIsEditPlanOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => setIsEditPlanOpen(false)}>Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* View Tenants on Plan Dialog */}
        <Dialog open={isViewTenantsOpen} onOpenChange={setIsViewTenantsOpen}>
          <DialogContent className="bg-card sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {selectedPlan?.name} Plan Subscribers
              </DialogTitle>
              <DialogDescription>
                {selectedPlan?.subscribers} tenants on this plan
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              {selectedPlan && planTenants[selectedPlan.id as keyof typeof planTenants] && (
                <div className="space-y-3">
                  {planTenants[selectedPlan.id as keyof typeof planTenants].map((tenant) => (
                    <div
                      key={tenant.name}
                      className="flex items-center justify-between rounded-lg border border-border p-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                          <Building2 className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{tenant.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {tenant.users} users
                          </p>
                        </div>
                      </div>
                      <span className="font-medium text-sm text-success">
                        {tenant.revenue}/mo
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsViewTenantsOpen(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}