import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Plus,
  MoreHorizontal,
  Building2,
  Users,
  CreditCard,
  Calendar,
  Filter,
  AlertTriangle,
  Copy,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Eye,
  EyeOff,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const tenantsData = [
  {
    id: "1",
    name: "Acme Financial Corp",
    email: "admin@acmefinancial.com",
    status: "active" as const,
    plan: "Enterprise",
    users: 156,
    monthlyRevenue: "₦2,450,000",
    billingStatus: "paid" as const,
    createdAt: "Jan 15, 2024",
  },
  {
    id: "2",
    name: "TechStart Bank",
    email: "ops@techstart.io",
    status: "trial" as const,
    plan: "Professional",
    users: 42,
    monthlyRevenue: "₦0",
    billingStatus: "pending" as const,
    createdAt: "Feb 28, 2024",
  },
  {
    id: "3",
    name: "Metro Credit Union",
    email: "system@metrocredit.org",
    status: "active" as const,
    plan: "Enterprise",
    users: 234,
    monthlyRevenue: "₦3,200,000",
    billingStatus: "paid" as const,
    createdAt: "Dec 02, 2023",
  },
  {
    id: "4",
    name: "Coastal Savings Bank",
    email: "it@coastalsavings.com",
    status: "suspended" as const,
    plan: "Basic",
    users: 18,
    monthlyRevenue: "₦0",
    billingStatus: "overdue" as const,
    createdAt: "Mar 10, 2024",
  },
  {
    id: "5",
    name: "Summit Cooperative",
    email: "admin@summitcoop.org",
    status: "active" as const,
    plan: "Professional",
    users: 89,
    monthlyRevenue: "₦890,000",
    billingStatus: "paid" as const,
    createdAt: "Nov 22, 2023",
  },
  {
    id: "6",
    name: "Valley Credit Services",
    email: "support@valleycs.com",
    status: "active" as const,
    plan: "Enterprise",
    users: 312,
    monthlyRevenue: "₦4,100,000",
    billingStatus: "paid" as const,
    createdAt: "Oct 15, 2023",
  },
  {
    id: "7",
    name: "Horizon Finance Group",
    email: "admin@horizonfg.com",
    status: "trial" as const,
    plan: "Professional",
    users: 28,
    monthlyRevenue: "₦0",
    billingStatus: "pending" as const,
    createdAt: "Mar 22, 2024",
  },
  {
    id: "8",
    name: "Pine State Bank",
    email: "ops@pinestatebank.com",
    status: "active" as const,
    plan: "Basic",
    users: 45,
    monthlyRevenue: "₦450,000",
    billingStatus: "due" as const,
    createdAt: "Jan 08, 2024",
  },
];

// Billing status badge component
function BillingStatusBadge({ status }: { status: "paid" | "pending" | "due" | "overdue" }) {
  const styles = {
    paid: "bg-success/10 text-success",
    pending: "bg-muted text-muted-foreground",
    due: "bg-warning/10 text-warning",
    overdue: "bg-destructive/10 text-destructive",
  };
  const labels = {
    paid: "Paid",
    pending: "Pending",
    due: "Due",
    overdue: "Overdue",
  };
  return (
    <span className={`status-badge ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}

export default function Tenants() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [isNewTenantOpen, setIsNewTenantOpen] = useState(false);
  const [isSuspendDialogOpen, setIsSuspendDialogOpen] = useState(false);
  const [isCredentialsDialogOpen, setIsCredentialsDialogOpen] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<string | null>(null);
  const [onboardingStep, setOnboardingStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  
  // Form state
  const [tenantForm, setTenantForm] = useState({
    companyName: "",
    companyEmail: "",
    companyPhone: "",
    companyAddress: "",
    plan: "",
    adminName: "",
    adminEmail: "",
    tempPassword: generatePassword(),
  });

  const [createdCredentials, setCreatedCredentials] = useState({
    email: "",
    password: "",
    companyName: "",
  });

  function generatePassword() {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%";
    let password = "";
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }

  const filteredTenants = tenantsData.filter((tenant) =>
    tenant.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleNextStep = () => {
    if (onboardingStep === 1) {
      if (!tenantForm.companyName || !tenantForm.companyEmail || !tenantForm.plan) {
        toast({
          title: "Required fields missing",
          description: "Please fill in all required company details.",
          variant: "destructive",
        });
        return;
      }
    }
    if (onboardingStep === 2) {
      if (!tenantForm.adminName || !tenantForm.adminEmail) {
        toast({
          title: "Required fields missing",
          description: "Please fill in all Super Admin details.",
          variant: "destructive",
        });
        return;
      }
    }
    setOnboardingStep((prev) => prev + 1);
  };

  const handleCreateTenant = () => {
    setCreatedCredentials({
      email: tenantForm.adminEmail,
      password: tenantForm.tempPassword,
      companyName: tenantForm.companyName,
    });
    setIsNewTenantOpen(false);
    setIsCredentialsDialogOpen(true);
    setOnboardingStep(1);
    setTenantForm({
      companyName: "",
      companyEmail: "",
      companyPhone: "",
      companyAddress: "",
      plan: "",
      adminName: "",
      adminEmail: "",
      tempPassword: generatePassword(),
    });
    toast({
      title: "Tenant created successfully",
      description: "The new tenant and Super Admin account have been created.",
    });
  };

  const handleCopyCredentials = () => {
    const text = `Email: ${createdCredentials.email}\nTemporary Password: ${createdCredentials.password}`;
    navigator.clipboard.writeText(text);
    toast({
      title: "Credentials copied",
      description: "Login credentials have been copied to clipboard.",
    });
  };

  const resetOnboarding = () => {
    setOnboardingStep(1);
    setTenantForm({
      companyName: "",
      companyEmail: "",
      companyPhone: "",
      companyAddress: "",
      plan: "",
      adminName: "",
      adminEmail: "",
      tempPassword: generatePassword(),
    });
  };

  return (
    <DashboardLayout title="Tenants Management">
      <div className="space-y-6 animate-fade-in">
        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <div className="flex items-center gap-4 rounded-lg border border-border bg-card p-4">
            <div className="rounded-lg bg-primary/10 p-3">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-semibold">127</p>
              <p className="text-sm text-muted-foreground">Total Tenants</p>
            </div>
          </div>
          <div className="flex items-center gap-4 rounded-lg border border-border bg-card p-4">
            <div className="rounded-lg bg-success/10 p-3">
              <Users className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="text-2xl font-semibold">118</p>
              <p className="text-sm text-muted-foreground">Active</p>
            </div>
          </div>
          <div className="flex items-center gap-4 rounded-lg border border-border bg-card p-4">
            <div className="rounded-lg bg-warning/10 p-3">
              <Calendar className="h-5 w-5 text-warning" />
            </div>
            <div>
              <p className="text-2xl font-semibold">5</p>
              <p className="text-sm text-muted-foreground">On Trial</p>
            </div>
          </div>
          <div className="flex items-center gap-4 rounded-lg border border-border bg-card p-4">
            <div className="rounded-lg bg-destructive/10 p-3">
              <CreditCard className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <p className="text-2xl font-semibold">4</p>
              <p className="text-sm text-muted-foreground">Suspended</p>
            </div>
          </div>
        </div>

        {/* Table Section */}
        <div className="rounded-lg border border-border bg-card">
          {/* Table Header */}
          <div className="flex flex-col gap-4 border-b border-border p-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search tenants..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-64 pl-9"
                />
              </div>
              <Button variant="outline" size="sm">
                <Filter className="mr-2 h-4 w-4" />
                Filters
              </Button>
            </div>
            <Button onClick={() => { resetOnboarding(); setIsNewTenantOpen(true); }}>
              <Plus className="mr-2 h-4 w-4" />
              New Tenant
            </Button>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Tenant</th>
                  <th>Status</th>
                  <th>Plan</th>
                  <th>Users</th>
                  <th>Billing Status</th>
                  <th>Monthly Revenue</th>
                  <th>Created</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTenants.map((tenant) => (
                  <tr key={tenant.id}>
                    <td>
                      <div>
                        <p className="font-medium">{tenant.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {tenant.email}
                        </p>
                      </div>
                    </td>
                    <td>
                      <StatusBadge status={tenant.status} />
                    </td>
                    <td className="text-muted-foreground">{tenant.plan}</td>
                    <td className="text-muted-foreground">{tenant.users}</td>
                    <td>
                      <BillingStatusBadge status={tenant.billingStatus} />
                    </td>
                    <td className="font-medium">{tenant.monthlyRevenue}</td>
                    <td className="text-muted-foreground">{tenant.createdAt}</td>
                    <td className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-card">
                          <DropdownMenuItem>View Details</DropdownMenuItem>
                          <DropdownMenuItem>Edit Tenant</DropdownMenuItem>
                          <DropdownMenuItem>View Usage</DropdownMenuItem>
                          <DropdownMenuItem>View Invoices</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem>Change Plan</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {tenant.status === "suspended" ? (
                            <DropdownMenuItem className="text-success">
                              Reactivate Tenant
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => {
                                setSelectedTenant(tenant.name);
                                setIsSuspendDialogOpen(true);
                              }}
                            >
                              Suspend Tenant
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Empty State */}
          {filteredTenants.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Building2 className="h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-semibold">No tenants found</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Try adjusting your search or filters
              </p>
            </div>
          )}
        </div>

        {/* Enhanced New Tenant Dialog - Multi-step */}
        <Dialog open={isNewTenantOpen} onOpenChange={(open) => { setIsNewTenantOpen(open); if (!open) resetOnboarding(); }}>
          <DialogContent className="bg-card sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Create New Tenant</DialogTitle>
              <DialogDescription>
                Step {onboardingStep} of 3 — {onboardingStep === 1 ? "Company Details" : onboardingStep === 2 ? "Super Admin Setup" : "Review & Confirm"}
              </DialogDescription>
            </DialogHeader>

            {/* Progress indicator */}
            <div className="flex gap-2 py-2">
              {[1, 2, 3].map((step) => (
                <div
                  key={step}
                  className={`h-1 flex-1 rounded-full transition-colors ${
                    step <= onboardingStep ? "bg-primary" : "bg-muted"
                  }`}
                />
              ))}
            </div>

            {/* Step 1: Company Details */}
            {onboardingStep === 1 && (
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="companyName">Organization Name *</Label>
                  <Input
                    id="companyName"
                    placeholder="Enter organization name"
                    value={tenantForm.companyName}
                    onChange={(e) => setTenantForm({ ...tenantForm, companyName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="companyEmail">Company Email *</Label>
                  <Input
                    id="companyEmail"
                    type="email"
                    placeholder="info@organization.com"
                    value={tenantForm.companyEmail}
                    onChange={(e) => setTenantForm({ ...tenantForm, companyEmail: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="companyPhone">Company Phone</Label>
                  <Input
                    id="companyPhone"
                    placeholder="+234 xxx xxx xxxx"
                    value={tenantForm.companyPhone}
                    onChange={(e) => setTenantForm({ ...tenantForm, companyPhone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="companyAddress">Business Address</Label>
                  <Input
                    id="companyAddress"
                    placeholder="Enter business address"
                    value={tenantForm.companyAddress}
                    onChange={(e) => setTenantForm({ ...tenantForm, companyAddress: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="plan">Subscription Plan *</Label>
                  <Select value={tenantForm.plan} onValueChange={(value) => setTenantForm({ ...tenantForm, plan: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a plan" />
                    </SelectTrigger>
                    <SelectContent className="bg-card">
                      <SelectItem value="basic">Basic — ₦150,000/mo</SelectItem>
                      <SelectItem value="professional">Professional — ₦350,000/mo</SelectItem>
                      <SelectItem value="enterprise">Enterprise — Custom Pricing</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* Step 2: Super Admin Setup */}
            {onboardingStep === 2 && (
              <div className="space-y-4 py-4">
                <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
                  <div className="flex items-start gap-3">
                    <Users className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium text-sm">Super Admin Account</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        This user will have full administrative access to the tenant's workspace.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="adminName">Admin Full Name *</Label>
                  <Input
                    id="adminName"
                    placeholder="Enter admin's full name"
                    value={tenantForm.adminName}
                    onChange={(e) => setTenantForm({ ...tenantForm, adminName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="adminEmail">Admin Email *</Label>
                  <Input
                    id="adminEmail"
                    type="email"
                    placeholder="admin@organization.com"
                    value={tenantForm.adminEmail}
                    onChange={(e) => setTenantForm({ ...tenantForm, adminEmail: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tempPassword">Temporary Password</Label>
                  <div className="relative">
                    <Input
                      id="tempPassword"
                      type={showPassword ? "text" : "password"}
                      value={tenantForm.tempPassword}
                      onChange={(e) => setTenantForm({ ...tenantForm, tempPassword: e.target.value })}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Auto-generated. The admin must change this on first login.
                  </p>
                </div>
              </div>
            )}

            {/* Step 3: Review & Confirm */}
            {onboardingStep === 3 && (
              <div className="space-y-4 py-4">
                <div className="rounded-lg border border-border bg-muted/50 p-4 space-y-3">
                  <h4 className="font-medium text-sm">Company Information</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <span className="text-muted-foreground">Organization:</span>
                    <span className="font-medium">{tenantForm.companyName}</span>
                    <span className="text-muted-foreground">Email:</span>
                    <span>{tenantForm.companyEmail}</span>
                    <span className="text-muted-foreground">Plan:</span>
                    <span className="capitalize">{tenantForm.plan}</span>
                  </div>
                </div>
                <div className="rounded-lg border border-border bg-muted/50 p-4 space-y-3">
                  <h4 className="font-medium text-sm">Super Admin</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <span className="text-muted-foreground">Name:</span>
                    <span className="font-medium">{tenantForm.adminName}</span>
                    <span className="text-muted-foreground">Email:</span>
                    <span>{tenantForm.adminEmail}</span>
                  </div>
                </div>
                <div className="rounded-lg border border-warning/30 bg-warning/5 p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-warning mt-0.5" />
                    <div>
                      <p className="font-medium text-sm">Important</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Login credentials will be shown after creation. The Super Admin should change their password on first login.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <DialogFooter className="gap-2">
              {onboardingStep > 1 && (
                <Button variant="outline" onClick={() => setOnboardingStep((prev) => prev - 1)}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
              )}
              <Button variant="outline" onClick={() => { setIsNewTenantOpen(false); resetOnboarding(); }}>
                Cancel
              </Button>
              {onboardingStep < 3 ? (
                <Button onClick={handleNextStep}>
                  Next
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button onClick={handleCreateTenant}>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Create Tenant
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Credentials Display Dialog */}
        <Dialog open={isCredentialsDialogOpen} onOpenChange={setIsCredentialsDialogOpen}>
          <DialogContent className="bg-card sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-success" />
                Tenant Created Successfully
              </DialogTitle>
              <DialogDescription>
                {createdCredentials.companyName} has been onboarded
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="rounded-lg border border-border bg-muted/50 p-4 space-y-3">
                <h4 className="font-medium text-sm">Super Admin Login Credentials</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between py-2 px-3 rounded bg-background">
                    <span className="text-muted-foreground">Email:</span>
                    <span className="font-mono">{createdCredentials.email}</span>
                  </div>
                  <div className="flex items-center justify-between py-2 px-3 rounded bg-background">
                    <span className="text-muted-foreground">Password:</span>
                    <span className="font-mono">{createdCredentials.password}</span>
                  </div>
                </div>
              </div>
              <div className="rounded-lg border border-warning/30 bg-warning/5 p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-warning mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">Security Notice</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      These credentials will be sent to the tenant. The password must be changed on first login.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={handleCopyCredentials}>
                <Copy className="mr-2 h-4 w-4" />
                Copy Credentials
              </Button>
              <Button onClick={() => setIsCredentialsDialogOpen(false)}>
                Done
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Suspend Confirmation Dialog */}
        <Dialog open={isSuspendDialogOpen} onOpenChange={setIsSuspendDialogOpen}>
          <DialogContent className="bg-card sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Suspend Tenant</DialogTitle>
              <DialogDescription>
                Are you sure you want to suspend {selectedTenant}? This will
                disable access for all users.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsSuspendDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => setIsSuspendDialogOpen(false)}
              >
                Suspend Tenant
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}