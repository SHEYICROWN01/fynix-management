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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  PiggyBank,
  Landmark,
  TrendingUp,
  TrendingDown,
  Activity,
  MapPin,
  Phone,
  Mail,
  Globe,
  FileText,
  Download,
  Receipt,
  BarChart3,
  Clock,
  X,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Extended tenant data with detailed information
const tenantsData = [
  {
    id: "1",
    name: "Acme Financial Corp",
    email: "admin@acmefinancial.com",
    phone: "+234 803 123 4567",
    address: "15 Marina Road, Lagos Island, Lagos",
    website: "www.acmefinancial.com",
    registrationNumber: "RC-123456",
    status: "active" as const,
    plan: "Enterprise",
    users: 156,
    monthlyRevenue: "₦2,450,000",
    billingStatus: "paid" as const,
    createdAt: "Jan 15, 2024",
    // Detailed metrics
    totalCustomers: 12450,
    activeCustomers: 11230,
    totalSavings: 458000000,
    totalLoans: 325000000,
    totalInvestments: 89000000,
    transactionsThisMonth: 45600,
    avgTransactionValue: 25000,
    lastActivityDate: "2024-03-25",
    superAdmin: {
      name: "Adebayo Johnson",
      email: "adebayo.j@acmefinancial.com",
      lastLogin: "2024-03-25 14:30",
    },
    usageMetrics: {
      apiCalls: 125000,
      storageUsed: "45 GB",
      activeLogins: 89,
      peakUsers: 134,
    },
    invoices: [
      { id: "INV-001", date: "Mar 01, 2024", amount: 2450000, status: "paid" as const, period: "March 2024" },
      { id: "INV-002", date: "Feb 01, 2024", amount: 2450000, status: "paid" as const, period: "February 2024" },
      { id: "INV-003", date: "Jan 01, 2024", amount: 2350000, status: "paid" as const, period: "January 2024" },
    ],
  },
  {
    id: "2",
    name: "TechStart Bank",
    email: "ops@techstart.io",
    phone: "+234 815 987 6543",
    address: "Block C, Tech Hub, Victoria Island, Lagos",
    website: "www.techstart.io",
    registrationNumber: "RC-789012",
    status: "trial" as const,
    plan: "Professional",
    users: 42,
    monthlyRevenue: "₦0",
    billingStatus: "pending" as const,
    createdAt: "Feb 28, 2024",
    totalCustomers: 850,
    activeCustomers: 720,
    totalSavings: 12500000,
    totalLoans: 8000000,
    totalInvestments: 2500000,
    transactionsThisMonth: 3200,
    avgTransactionValue: 15000,
    lastActivityDate: "2024-03-24",
    superAdmin: {
      name: "Chinedu Okafor",
      email: "chinedu@techstart.io",
      lastLogin: "2024-03-24 09:15",
    },
    usageMetrics: {
      apiCalls: 8500,
      storageUsed: "2.5 GB",
      activeLogins: 28,
      peakUsers: 35,
    },
    invoices: [],
  },
  {
    id: "3",
    name: "Metro Credit Union",
    email: "system@metrocredit.org",
    phone: "+234 708 456 7890",
    address: "45 Awolowo Way, Ikeja, Lagos",
    website: "www.metrocredit.org",
    registrationNumber: "RC-345678",
    status: "active" as const,
    plan: "Enterprise",
    users: 234,
    monthlyRevenue: "₦3,200,000",
    billingStatus: "paid" as const,
    createdAt: "Dec 02, 2023",
    totalCustomers: 28900,
    activeCustomers: 25400,
    totalSavings: 1250000000,
    totalLoans: 890000000,
    totalInvestments: 320000000,
    transactionsThisMonth: 89500,
    avgTransactionValue: 45000,
    lastActivityDate: "2024-03-25",
    superAdmin: {
      name: "Funke Adeyemi",
      email: "funke.a@metrocredit.org",
      lastLogin: "2024-03-25 16:45",
    },
    usageMetrics: {
      apiCalls: 285000,
      storageUsed: "125 GB",
      activeLogins: 156,
      peakUsers: 210,
    },
    invoices: [
      { id: "INV-101", date: "Mar 01, 2024", amount: 3200000, status: "paid" as const, period: "March 2024" },
      { id: "INV-102", date: "Feb 01, 2024", amount: 3200000, status: "paid" as const, period: "February 2024" },
      { id: "INV-103", date: "Jan 01, 2024", amount: 3100000, status: "paid" as const, period: "January 2024" },
    ],
  },
  {
    id: "4",
    name: "Coastal Savings Bank",
    email: "it@coastalsavings.com",
    phone: "+234 809 234 5678",
    address: "12 Beach Road, Lekki Phase 1, Lagos",
    website: "www.coastalsavings.com",
    registrationNumber: "RC-567890",
    status: "suspended" as const,
    plan: "Basic",
    users: 18,
    monthlyRevenue: "₦0",
    billingStatus: "overdue" as const,
    createdAt: "Mar 10, 2024",
    totalCustomers: 1250,
    activeCustomers: 0,
    totalSavings: 45000000,
    totalLoans: 22000000,
    totalInvestments: 8000000,
    transactionsThisMonth: 0,
    avgTransactionValue: 0,
    lastActivityDate: "2024-03-15",
    superAdmin: {
      name: "Emeka Nwosu",
      email: "emeka@coastalsavings.com",
      lastLogin: "2024-03-15 11:20",
    },
    usageMetrics: {
      apiCalls: 0,
      storageUsed: "8 GB",
      activeLogins: 0,
      peakUsers: 15,
    },
    invoices: [
      { id: "INV-201", date: "Mar 01, 2024", amount: 150000, status: "overdue" as const, period: "March 2024" },
      { id: "INV-202", date: "Feb 01, 2024", amount: 150000, status: "overdue" as const, period: "February 2024" },
    ],
  },
  {
    id: "5",
    name: "Summit Cooperative",
    email: "admin@summitcoop.org",
    phone: "+234 812 345 6789",
    address: "88 Mountain View, Abuja",
    website: "www.summitcoop.org",
    registrationNumber: "RC-901234",
    status: "active" as const,
    plan: "Professional",
    users: 89,
    monthlyRevenue: "₦890,000",
    billingStatus: "paid" as const,
    createdAt: "Nov 22, 2023",
    totalCustomers: 5600,
    activeCustomers: 4800,
    totalSavings: 185000000,
    totalLoans: 125000000,
    totalInvestments: 45000000,
    transactionsThisMonth: 15600,
    avgTransactionValue: 32000,
    lastActivityDate: "2024-03-25",
    superAdmin: {
      name: "Grace Obi",
      email: "grace@summitcoop.org",
      lastLogin: "2024-03-25 08:00",
    },
    usageMetrics: {
      apiCalls: 48000,
      storageUsed: "28 GB",
      activeLogins: 67,
      peakUsers: 82,
    },
    invoices: [
      { id: "INV-301", date: "Mar 01, 2024", amount: 890000, status: "paid" as const, period: "March 2024" },
      { id: "INV-302", date: "Feb 01, 2024", amount: 890000, status: "paid" as const, period: "February 2024" },
    ],
  },
  {
    id: "6",
    name: "Valley Credit Services",
    email: "support@valleycs.com",
    phone: "+234 805 678 9012",
    address: "200 Valley Road, Port Harcourt",
    website: "www.valleycs.com",
    registrationNumber: "RC-234567",
    status: "active" as const,
    plan: "Enterprise",
    users: 312,
    monthlyRevenue: "₦4,100,000",
    billingStatus: "paid" as const,
    createdAt: "Oct 15, 2023",
    totalCustomers: 42000,
    activeCustomers: 38500,
    totalSavings: 2100000000,
    totalLoans: 1450000000,
    totalInvestments: 580000000,
    transactionsThisMonth: 125000,
    avgTransactionValue: 55000,
    lastActivityDate: "2024-03-25",
    superAdmin: {
      name: "Yakubu Ibrahim",
      email: "yakubu@valleycs.com",
      lastLogin: "2024-03-25 17:30",
    },
    usageMetrics: {
      apiCalls: 425000,
      storageUsed: "210 GB",
      activeLogins: 245,
      peakUsers: 298,
    },
    invoices: [
      { id: "INV-401", date: "Mar 01, 2024", amount: 4100000, status: "paid" as const, period: "March 2024" },
      { id: "INV-402", date: "Feb 01, 2024", amount: 4100000, status: "paid" as const, period: "February 2024" },
      { id: "INV-403", date: "Jan 01, 2024", amount: 3950000, status: "paid" as const, period: "January 2024" },
    ],
  },
  {
    id: "7",
    name: "Horizon Finance Group",
    email: "admin@horizonfg.com",
    phone: "+234 818 901 2345",
    address: "55 Horizon Plaza, Ibadan",
    website: "www.horizonfg.com",
    registrationNumber: "RC-678901",
    status: "trial" as const,
    plan: "Professional",
    users: 28,
    monthlyRevenue: "₦0",
    billingStatus: "pending" as const,
    createdAt: "Mar 22, 2024",
    totalCustomers: 320,
    activeCustomers: 285,
    totalSavings: 5500000,
    totalLoans: 2800000,
    totalInvestments: 950000,
    transactionsThisMonth: 890,
    avgTransactionValue: 12000,
    lastActivityDate: "2024-03-25",
    superAdmin: {
      name: "Bola Adesanya",
      email: "bola@horizonfg.com",
      lastLogin: "2024-03-25 10:45",
    },
    usageMetrics: {
      apiCalls: 2500,
      storageUsed: "850 MB",
      activeLogins: 18,
      peakUsers: 24,
    },
    invoices: [],
  },
  {
    id: "8",
    name: "Pine State Bank",
    email: "ops@pinestatebank.com",
    phone: "+234 802 567 8901",
    address: "10 Pine Avenue, Calabar",
    website: "www.pinestatebank.com",
    registrationNumber: "RC-012345",
    status: "active" as const,
    plan: "Basic",
    users: 45,
    monthlyRevenue: "₦450,000",
    billingStatus: "due" as const,
    createdAt: "Jan 08, 2024",
    totalCustomers: 2800,
    activeCustomers: 2450,
    totalSavings: 78000000,
    totalLoans: 52000000,
    totalInvestments: 18000000,
    transactionsThisMonth: 6800,
    avgTransactionValue: 22000,
    lastActivityDate: "2024-03-24",
    superAdmin: {
      name: "Tunde Bakare",
      email: "tunde@pinestatebank.com",
      lastLogin: "2024-03-24 15:20",
    },
    usageMetrics: {
      apiCalls: 18500,
      storageUsed: "12 GB",
      activeLogins: 32,
      peakUsers: 40,
    },
    invoices: [
      { id: "INV-501", date: "Mar 01, 2024", amount: 450000, status: "due" as const, period: "March 2024" },
      { id: "INV-502", date: "Feb 01, 2024", amount: 450000, status: "paid" as const, period: "February 2024" },
    ],
  },
];

// Helper function to format currency
function formatNaira(amount: number): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount).replace("NGN", "₦");
}

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
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [isUsageDialogOpen, setIsUsageDialogOpen] = useState(false);
  const [isInvoicesDialogOpen, setIsInvoicesDialogOpen] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<string | null>(null);
  const [selectedTenantData, setSelectedTenantData] = useState<typeof tenantsData[0] | null>(null);
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
                          <DropdownMenuItem onClick={() => {
                            setSelectedTenantData(tenant);
                            setIsDetailsDialogOpen(true);
                          }}>View Details</DropdownMenuItem>
                          <DropdownMenuItem>Edit Tenant</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => {
                            setSelectedTenantData(tenant);
                            setIsUsageDialogOpen(true);
                          }}>View Usage</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => {
                            setSelectedTenantData(tenant);
                            setIsInvoicesDialogOpen(true);
                          }}>View Invoices</DropdownMenuItem>
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

        {/* Tenant Details Dialog */}
        <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
          <DialogContent className="bg-card sm:max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <div>
                  <DialogTitle className="text-xl">{selectedTenantData?.name}</DialogTitle>
                  <DialogDescription className="flex items-center gap-2 mt-1">
                    <StatusBadge status={selectedTenantData?.status || "active"} />
                    <span>•</span>
                    <span>{selectedTenantData?.plan} Plan</span>
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            {selectedTenantData && (
              <Tabs defaultValue="overview" className="mt-4">
                <TabsList className="mb-4">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="financials">Financials</TabsTrigger>
                  <TabsTrigger value="company">Company Info</TabsTrigger>
                  <TabsTrigger value="admin">Super Admin</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-6">
                  {/* Key Metrics */}
                  <div className="grid gap-4 md:grid-cols-4">
                    <div className="rounded-lg border border-border bg-muted/30 p-4">
                      <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-primary/10 p-2">
                          <Users className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-2xl font-semibold">{selectedTenantData.totalCustomers.toLocaleString()}</p>
                          <p className="text-xs text-muted-foreground">Total Customers</p>
                        </div>
                      </div>
                      <div className="mt-2 flex items-center gap-1 text-xs text-success">
                        <TrendingUp className="h-3 w-3" />
                        <span>{selectedTenantData.activeCustomers.toLocaleString()} active</span>
                      </div>
                    </div>

                    <div className="rounded-lg border border-border bg-muted/30 p-4">
                      <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-success/10 p-2">
                          <PiggyBank className="h-4 w-4 text-success" />
                        </div>
                        <div>
                          <p className="text-2xl font-semibold">{formatNaira(selectedTenantData.totalSavings)}</p>
                          <p className="text-xs text-muted-foreground">Total Savings</p>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-lg border border-border bg-muted/30 p-4">
                      <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-warning/10 p-2">
                          <Landmark className="h-4 w-4 text-warning" />
                        </div>
                        <div>
                          <p className="text-2xl font-semibold">{formatNaira(selectedTenantData.totalLoans)}</p>
                          <p className="text-xs text-muted-foreground">Total Loans</p>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-lg border border-border bg-muted/30 p-4">
                      <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-info/10 p-2">
                          <TrendingUp className="h-4 w-4 text-info" />
                        </div>
                        <div>
                          <p className="text-2xl font-semibold">{formatNaira(selectedTenantData.totalInvestments)}</p>
                          <p className="text-xs text-muted-foreground">Total Investments</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Activity Stats */}
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="rounded-lg border border-border bg-card p-4">
                      <h4 className="text-sm font-medium text-muted-foreground mb-3">Monthly Activity</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Transactions</span>
                          <span className="font-semibold">{selectedTenantData.transactionsThisMonth.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Avg. Transaction Value</span>
                          <span className="font-semibold">{formatNaira(selectedTenantData.avgTransactionValue)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Active Users</span>
                          <span className="font-semibold">{selectedTenantData.users}</span>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-lg border border-border bg-card p-4">
                      <h4 className="text-sm font-medium text-muted-foreground mb-3">Platform Usage</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm">API Calls</span>
                          <span className="font-semibold">{selectedTenantData.usageMetrics.apiCalls.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Storage Used</span>
                          <span className="font-semibold">{selectedTenantData.usageMetrics.storageUsed}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Peak Concurrent Users</span>
                          <span className="font-semibold">{selectedTenantData.usageMetrics.peakUsers}</span>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-lg border border-border bg-card p-4">
                      <h4 className="text-sm font-medium text-muted-foreground mb-3">Billing Summary</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Current Plan</span>
                          <span className="font-semibold">{selectedTenantData.plan}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Monthly Revenue</span>
                          <span className="font-semibold">{selectedTenantData.monthlyRevenue}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Billing Status</span>
                          <BillingStatusBadge status={selectedTenantData.billingStatus} />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Timeline */}
                  <div className="rounded-lg border border-border bg-card p-4">
                    <h4 className="text-sm font-medium text-muted-foreground mb-3">Timeline</h4>
                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="flex items-center gap-3">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Created</p>
                          <p className="text-sm font-medium">{selectedTenantData.createdAt}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Activity className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Last Activity</p>
                          <p className="text-sm font-medium">{selectedTenantData.lastActivityDate}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Admin Last Login</p>
                          <p className="text-sm font-medium">{selectedTenantData.superAdmin.lastLogin}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="financials" className="space-y-6">
                  {/* Financial Overview */}
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-lg border border-border bg-card p-6">
                      <h4 className="font-medium mb-4">Assets Under Management</h4>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center py-2 border-b border-border">
                          <div className="flex items-center gap-2">
                            <PiggyBank className="h-4 w-4 text-success" />
                            <span>Total Savings</span>
                          </div>
                          <span className="font-semibold text-lg">{formatNaira(selectedTenantData.totalSavings)}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-border">
                          <div className="flex items-center gap-2">
                            <Landmark className="h-4 w-4 text-warning" />
                            <span>Active Loans</span>
                          </div>
                          <span className="font-semibold text-lg">{formatNaira(selectedTenantData.totalLoans)}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-border">
                          <div className="flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-info" />
                            <span>Investments</span>
                          </div>
                          <span className="font-semibold text-lg">{formatNaira(selectedTenantData.totalInvestments)}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 font-semibold">
                          <span>Total AUM</span>
                          <span className="text-xl text-primary">
                            {formatNaira(selectedTenantData.totalSavings + selectedTenantData.totalLoans + selectedTenantData.totalInvestments)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-lg border border-border bg-card p-6">
                      <h4 className="font-medium mb-4">Transaction Metrics</h4>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center py-2 border-b border-border">
                          <span>Monthly Transactions</span>
                          <span className="font-semibold">{selectedTenantData.transactionsThisMonth.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-border">
                          <span>Average Transaction Value</span>
                          <span className="font-semibold">{formatNaira(selectedTenantData.avgTransactionValue)}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-border">
                          <span>Est. Monthly Volume</span>
                          <span className="font-semibold">
                            {formatNaira(selectedTenantData.transactionsThisMonth * selectedTenantData.avgTransactionValue)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center py-2">
                          <span>Platform Revenue</span>
                          <span className="font-semibold text-success">{selectedTenantData.monthlyRevenue}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Recent Invoices */}
                  <div className="rounded-lg border border-border bg-card">
                    <div className="p-4 border-b border-border">
                      <h4 className="font-medium">Recent Invoices</h4>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>Invoice ID</th>
                            <th>Period</th>
                            <th>Date</th>
                            <th>Amount</th>
                            <th>Status</th>
                            <th className="text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedTenantData.invoices.length > 0 ? (
                            selectedTenantData.invoices.map((invoice) => (
                              <tr key={invoice.id}>
                                <td className="font-mono text-sm">{invoice.id}</td>
                                <td>{invoice.period}</td>
                                <td className="text-muted-foreground">{invoice.date}</td>
                                <td className="font-semibold">{formatNaira(invoice.amount)}</td>
                                <td><BillingStatusBadge status={invoice.status} /></td>
                                <td className="text-right">
                                  <Button variant="ghost" size="sm">
                                    <Download className="h-4 w-4" />
                                  </Button>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={6} className="text-center py-8 text-muted-foreground">
                                No invoices generated yet
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="company" className="space-y-6">
                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="rounded-lg border border-border bg-card p-6 space-y-4">
                      <h4 className="font-medium">Company Information</h4>
                      <div className="space-y-3">
                        <div className="flex items-start gap-3">
                          <Building2 className="h-4 w-4 text-muted-foreground mt-0.5" />
                          <div>
                            <p className="text-xs text-muted-foreground">Organization Name</p>
                            <p className="font-medium">{selectedTenantData.name}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                          <div>
                            <p className="text-xs text-muted-foreground">Registration Number</p>
                            <p className="font-medium">{selectedTenantData.registrationNumber}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <CreditCard className="h-4 w-4 text-muted-foreground mt-0.5" />
                          <div>
                            <p className="text-xs text-muted-foreground">Subscription Plan</p>
                            <p className="font-medium">{selectedTenantData.plan}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-lg border border-border bg-card p-6 space-y-4">
                      <h4 className="font-medium">Contact Details</h4>
                      <div className="space-y-3">
                        <div className="flex items-start gap-3">
                          <Mail className="h-4 w-4 text-muted-foreground mt-0.5" />
                          <div>
                            <p className="text-xs text-muted-foreground">Email Address</p>
                            <p className="font-medium">{selectedTenantData.email}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <Phone className="h-4 w-4 text-muted-foreground mt-0.5" />
                          <div>
                            <p className="text-xs text-muted-foreground">Phone Number</p>
                            <p className="font-medium">{selectedTenantData.phone}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <Globe className="h-4 w-4 text-muted-foreground mt-0.5" />
                          <div>
                            <p className="text-xs text-muted-foreground">Website</p>
                            <p className="font-medium">{selectedTenantData.website}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                          <div>
                            <p className="text-xs text-muted-foreground">Address</p>
                            <p className="font-medium">{selectedTenantData.address}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="admin" className="space-y-6">
                  <div className="rounded-lg border border-border bg-card p-6">
                    <div className="flex items-start gap-4">
                      <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                        <Users className="h-8 w-8 text-primary" />
                      </div>
                      <div className="flex-1 space-y-4">
                        <div>
                          <h4 className="text-lg font-semibold">{selectedTenantData.superAdmin.name}</h4>
                          <p className="text-sm text-muted-foreground">Super Administrator</p>
                        </div>
                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{selectedTenantData.superAdmin.email}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">Last login: {selectedTenantData.superAdmin.lastLogin}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-lg border border-warning/30 bg-warning/5 p-4">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="h-5 w-5 text-warning mt-0.5" />
                      <div>
                        <p className="font-medium text-sm">Admin Account Actions</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          You can reset the admin password or transfer admin rights to another user from here.
                        </p>
                        <div className="flex gap-2 mt-3">
                          <Button variant="outline" size="sm">Reset Password</Button>
                          <Button variant="outline" size="sm">Transfer Admin Rights</Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            )}

            <DialogFooter className="mt-4">
              <Button variant="outline" onClick={() => setIsDetailsDialogOpen(false)}>
                Close
              </Button>
              <Button onClick={() => {
                setIsDetailsDialogOpen(false);
                setIsUsageDialogOpen(true);
              }}>
                <BarChart3 className="mr-2 h-4 w-4" />
                View Usage
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Usage Dialog */}
        <Dialog open={isUsageDialogOpen} onOpenChange={setIsUsageDialogOpen}>
          <DialogContent className="bg-card sm:max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Platform Usage - {selectedTenantData?.name}</DialogTitle>
              <DialogDescription>
                Detailed usage metrics and resource consumption
              </DialogDescription>
            </DialogHeader>

            {selectedTenantData && (
              <div className="space-y-6 py-4">
                {/* Usage Summary Cards */}
                <div className="grid gap-4 md:grid-cols-4">
                  <div className="rounded-lg border border-border bg-muted/30 p-4 text-center">
                    <BarChart3 className="h-6 w-6 text-primary mx-auto mb-2" />
                    <p className="text-2xl font-bold">{selectedTenantData.usageMetrics.apiCalls.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">API Calls</p>
                  </div>
                  <div className="rounded-lg border border-border bg-muted/30 p-4 text-center">
                    <Activity className="h-6 w-6 text-success mx-auto mb-2" />
                    <p className="text-2xl font-bold">{selectedTenantData.usageMetrics.activeLogins}</p>
                    <p className="text-xs text-muted-foreground">Active Sessions</p>
                  </div>
                  <div className="rounded-lg border border-border bg-muted/30 p-4 text-center">
                    <Users className="h-6 w-6 text-warning mx-auto mb-2" />
                    <p className="text-2xl font-bold">{selectedTenantData.usageMetrics.peakUsers}</p>
                    <p className="text-xs text-muted-foreground">Peak Users</p>
                  </div>
                  <div className="rounded-lg border border-border bg-muted/30 p-4 text-center">
                    <FileText className="h-6 w-6 text-info mx-auto mb-2" />
                    <p className="text-2xl font-bold">{selectedTenantData.usageMetrics.storageUsed}</p>
                    <p className="text-xs text-muted-foreground">Storage Used</p>
                  </div>
                </div>

                {/* Resource Usage Breakdown */}
                <div className="rounded-lg border border-border bg-card">
                  <div className="p-4 border-b border-border">
                    <h4 className="font-medium">Resource Usage Breakdown</h4>
                  </div>
                  <div className="p-4 space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>API Calls (Monthly)</span>
                        <span className="font-medium">{selectedTenantData.usageMetrics.apiCalls.toLocaleString()} / 500,000</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary rounded-full transition-all"
                          style={{ width: `${Math.min((selectedTenantData.usageMetrics.apiCalls / 500000) * 100, 100)}%` }}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Storage</span>
                        <span className="font-medium">{selectedTenantData.usageMetrics.storageUsed} / 500 GB</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-success rounded-full transition-all"
                          style={{ width: `${Math.min((parseFloat(selectedTenantData.usageMetrics.storageUsed) / 500) * 100, 100)}%` }}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Concurrent Users</span>
                        <span className="font-medium">{selectedTenantData.usageMetrics.activeLogins} / {selectedTenantData.users}</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-warning rounded-full transition-all"
                          style={{ width: `${(selectedTenantData.usageMetrics.activeLogins / selectedTenantData.users) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Activity Summary */}
                <div className="rounded-lg border border-border bg-card">
                  <div className="p-4 border-b border-border">
                    <h4 className="font-medium">Activity Summary</h4>
                  </div>
                  <div className="p-4">
                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="text-center py-4">
                        <p className="text-3xl font-bold text-primary">{selectedTenantData.transactionsThisMonth.toLocaleString()}</p>
                        <p className="text-sm text-muted-foreground">Transactions This Month</p>
                      </div>
                      <div className="text-center py-4 border-x border-border">
                        <p className="text-3xl font-bold text-success">{selectedTenantData.activeCustomers.toLocaleString()}</p>
                        <p className="text-sm text-muted-foreground">Active Customers</p>
                      </div>
                      <div className="text-center py-4">
                        <p className="text-3xl font-bold text-warning">{formatNaira(selectedTenantData.avgTransactionValue)}</p>
                        <p className="text-sm text-muted-foreground">Avg Transaction Value</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsUsageDialogOpen(false)}>
                Close
              </Button>
              <Button variant="outline" onClick={() => {
                toast({
                  title: "Report Downloaded",
                  description: "Usage report has been downloaded successfully.",
                });
              }}>
                <Download className="mr-2 h-4 w-4" />
                Download Report
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Invoices Dialog */}
        <Dialog open={isInvoicesDialogOpen} onOpenChange={setIsInvoicesDialogOpen}>
          <DialogContent className="bg-card sm:max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Invoices - {selectedTenantData?.name}</DialogTitle>
              <DialogDescription>
                View and manage billing invoices
              </DialogDescription>
            </DialogHeader>

            {selectedTenantData && (
              <div className="space-y-6 py-4">
                {/* Billing Summary */}
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="rounded-lg border border-border bg-muted/30 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <CreditCard className="h-4 w-4 text-primary" />
                      <span className="text-sm text-muted-foreground">Current Plan</span>
                    </div>
                    <p className="text-xl font-semibold">{selectedTenantData.plan}</p>
                  </div>
                  <div className="rounded-lg border border-border bg-muted/30 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Receipt className="h-4 w-4 text-success" />
                      <span className="text-sm text-muted-foreground">Monthly Amount</span>
                    </div>
                    <p className="text-xl font-semibold">{selectedTenantData.monthlyRevenue}</p>
                  </div>
                  <div className="rounded-lg border border-border bg-muted/30 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Activity className="h-4 w-4 text-warning" />
                      <span className="text-sm text-muted-foreground">Billing Status</span>
                    </div>
                    <BillingStatusBadge status={selectedTenantData.billingStatus} />
                  </div>
                </div>

                {/* Invoice List */}
                <div className="rounded-lg border border-border bg-card">
                  <div className="p-4 border-b border-border flex justify-between items-center">
                    <h4 className="font-medium">Invoice History</h4>
                    <Button size="sm">
                      <Plus className="mr-2 h-4 w-4" />
                      Generate Invoice
                    </Button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Invoice ID</th>
                          <th>Billing Period</th>
                          <th>Issue Date</th>
                          <th>Amount</th>
                          <th>Status</th>
                          <th className="text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedTenantData.invoices.length > 0 ? (
                          selectedTenantData.invoices.map((invoice) => (
                            <tr key={invoice.id}>
                              <td className="font-mono text-sm">{invoice.id}</td>
                              <td>{invoice.period}</td>
                              <td className="text-muted-foreground">{invoice.date}</td>
                              <td className="font-semibold">{formatNaira(invoice.amount)}</td>
                              <td><BillingStatusBadge status={invoice.status} /></td>
                              <td className="text-right">
                                <div className="flex justify-end gap-1">
                                  <Button variant="ghost" size="sm" onClick={() => {
                                    toast({
                                      title: "Invoice Preview",
                                      description: `Viewing invoice ${invoice.id}`,
                                    });
                                  }}>
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  <Button variant="ghost" size="sm" onClick={() => {
                                    toast({
                                      title: "Download Started",
                                      description: `Downloading ${invoice.id}.pdf`,
                                    });
                                  }}>
                                    <Download className="h-4 w-4" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={6} className="text-center py-12">
                              <Receipt className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
                              <p className="font-medium">No invoices yet</p>
                              <p className="text-sm text-muted-foreground mt-1">
                                {selectedTenantData.status === "trial" 
                                  ? "This tenant is currently on a trial period" 
                                  : "No invoices have been generated"}
                              </p>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Invoice Notes */}
                {selectedTenantData.billingStatus === "overdue" && (
                  <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
                      <div>
                        <p className="font-medium text-sm">Payment Overdue</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          This tenant has overdue invoices. Consider sending a payment reminder or suspending the account.
                        </p>
                        <div className="flex gap-2 mt-3">
                          <Button variant="outline" size="sm">Send Reminder</Button>
                          <Button variant="destructive" size="sm">Suspend Account</Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsInvoicesDialogOpen(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}