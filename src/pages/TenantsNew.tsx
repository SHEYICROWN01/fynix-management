import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import type { CreateTenantData, Tenant, Module, TenantModule, TenantBranding, ApiError } from "@/lib/api";
import { toast as showToast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Search,
  Plus,
  Building2,
  Loader2,
  RefreshCw,
  ArrowRight,
  ArrowLeft,
  Eye,
  EyeOff,
  Check,
  Copy,
  AlertTriangle,
  X,
  MoreHorizontal,
  Mail,
  Phone,
  MapPin,
  Globe,
  Calendar,
  Database,
  Users,
  PiggyBank,
  Landmark,
  TrendingUp,
  Activity,
  Clock,
  Download,
  FileText,
  CreditCard,
  Package,
  CheckCircle2,
  XCircle,
  Palette,
  Upload,
  ImageIcon,
  BarChart3,
} from "lucide-react"; export default function TenantsNew() {
  // API Data State
  const navigate = useNavigate();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [isLoadingTenants, setIsLoadingTenants] = useState(true);
  const [pagination, setPagination] = useState({
    total: 0,
    per_page: 10,
    current_page: 1,
    last_page: 1,
  });

  // UI State
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isCredentialsDialogOpen, setIsCredentialsDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [creationStep, setCreationStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string[]>>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Modules State
  const [availableModules, setAvailableModules] = useState<Module[]>([]);
  const [selectedModules, setSelectedModules] = useState<number[]>([]);
  const [subscriptionType, setSubscriptionType] = useState<"monthly" | "yearly">("monthly");
  const [isLoadingModules, setIsLoadingModules] = useState(false);

  // Module Management State
  const [isManageModulesDialogOpen, setIsManageModulesDialogOpen] = useState(false);
  const [tenantModules, setTenantModules] = useState<TenantModule[]>([]);
  const [isLoadingTenantModules, setIsLoadingTenantModules] = useState(false);
  const [modulesToAdd, setModulesToAdd] = useState<number[]>([]);
  const [addModuleSubscriptionType, setAddModuleSubscriptionType] = useState<"monthly" | "yearly">("monthly");

  // Branding State
  const DEFAULT_COLORS = {
    primary_color: "#0A2540",
    secondary_color: "#00A8A8",
    accent_color: "#4F9CF9",
    background_color: "#F5F7FA",
  };
  const [brandingLogo, setBrandingLogo] = useState<File | null>(null);
  const [brandingLogoPreview, setBrandingLogoPreview] = useState<string | null>(null);
  const [brandingColors, setBrandingColors] = useState({ ...DEFAULT_COLORS });
  const [colorHexInputs, setColorHexInputs] = useState({ ...DEFAULT_COLORS });

  // Form state - API compatible
  const [newTenant, setNewTenant] = useState<CreateTenantData>({
    name: "",
    slug: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    country: "NG",
    institution_prefix: "",
    admin_name: "",
    admin_email: "",
    admin_password: "",
    modules: [], // ✨ Initialize with empty modules array
  });

  const [createdTenant, setCreatedTenant] = useState<{
    name: string;
    subdomain: string;
    database: string;
    admin_email: string;
    institution_code: string;
  } | null>(null);

  // Fetch tenants from API
  const fetchTenants = async (page = 1, search = "") => {
    try {
      setIsLoadingTenants(true);
      const params: Record<string, unknown> = {
        page,
        per_page: 10,
      };

      if (search) {
        params.search = search;
      }

      const response = await api.listTenants(params);

      if (response.success) {
        setTenants(response.data);
        setPagination(response.pagination);
      }
    } catch (error: unknown) {
      console.error("Error fetching tenants:", error);
      const apiErr = error as ApiError;
      showToast.error("Failed to load tenants", {
        description: apiErr.message || "Please try again later",
      });
    } finally {
      setIsLoadingTenants(false);
    }
  };

  // Fetch modules from API
  const fetchModules = async () => {
    try {
      setIsLoadingModules(true);
      const response = await api.listModules();
      // Filter only active modules
      const activeModules = response.data.filter((module: Module) => module.is_active);
      setAvailableModules(activeModules);
    } catch (error) {
      console.error("Error fetching modules:", error);
      showToast.error("Failed to load modules");
      // Set mock data for demo
      setAvailableModules([
        {
          id: 1,
          name: "Savings",
          slug: "savings",
          description: "Complete savings account management",
          price_monthly: 50000,
          price_yearly: 500000,
          is_active: true,
          created_at: "",
          updated_at: "",
        },
        {
          id: 2,
          name: "Loans",
          slug: "loans",
          description: "Loan origination and tracking",
          price_monthly: 75000,
          price_yearly: 750000,
          is_active: true,
          created_at: "",
          updated_at: "",
        },
        {
          id: 3,
          name: "Investment",
          slug: "investment",
          description: "Investment portfolio management",
          price_monthly: 60000,
          price_yearly: 600000,
          is_active: true,
          created_at: "",
          updated_at: "",
        },
        {
          id: 4,
          name: "Cooperatives",
          slug: "cooperatives",
          description: "Cooperative society management",
          price_monthly: 45000,
          price_yearly: 450000,
          is_active: true,
          created_at: "",
          updated_at: "",
        },
        {
          id: 5,
          name: "Assets Loan",
          slug: "assets-loan",
          description: "Asset-backed loan management",
          price_monthly: 55000,
          price_yearly: 550000,
          is_active: true,
          created_at: "",
          updated_at: "",
        },
      ]);
    } finally {
      setIsLoadingModules(false);
    }
  };

  // Load tenants on mount
  useEffect(() => {
    fetchTenants();
    fetchModules();
  }, []);

  // Search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchTenants(1, searchQuery);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Handle form input change
  const handleInputChange = (field: keyof CreateTenantData, value: string) => {
    setNewTenant((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (formErrors[field]) {
      setFormErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // Validate step 1
  const validateStep1 = () => {
    const errors: string[] = [];

    if (!newTenant.name) errors.push("Organization name is required");
    if (!newTenant.slug) errors.push("Slug/Subdomain is required");
    if (!newTenant.email) errors.push("Contact email is required");
    if (!newTenant.country) errors.push("Country is required");

    // Validate institution prefix
    if (!newTenant.institution_prefix) {
      errors.push("Institution code prefix is required");
    } else if (!/^[a-zA-Z0-9]+$/.test(newTenant.institution_prefix)) {
      errors.push("Institution prefix can only contain letters and numbers (no spaces or symbols)");
    } else if (newTenant.institution_prefix.length < 2) {
      errors.push("Institution prefix must be at least 2 characters");
    } else if (newTenant.institution_prefix.length > 10) {
      errors.push("Institution prefix must not exceed 10 characters");
    }

    // Validate slug format
    if (newTenant.slug && !/^[a-z0-9_-]+$/.test(newTenant.slug)) {
      errors.push("Slug can only contain lowercase letters, numbers, hyphens, and underscores");
    }

    // Validate slug length
    if (newTenant.slug && newTenant.slug.length < 3) {
      errors.push("Slug must be at least 3 characters long");
    }

    if (newTenant.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newTenant.email)) {
      errors.push("Invalid email format");
    }

    if (errors.length > 0) {
      showToast.error("Validation Error", {
        description: errors.join(". "),
      });
      return false;
    }

    return true;
  };

  // Validate step 2
  const validateStep2 = () => {
    const errors: string[] = [];

    if (!newTenant.admin_name) errors.push("Admin name is required");
    if (!newTenant.admin_email) errors.push("Admin email is required");
    if (!newTenant.admin_password) errors.push("Admin password is required");

    if (newTenant.admin_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newTenant.admin_email)) {
      errors.push("Invalid admin email format");
    }

    if (newTenant.admin_password && newTenant.admin_password.length < 8) {
      errors.push("Password must be at least 8 characters");
    }

    if (errors.length > 0) {
      showToast.error("Validation Error", {
        description: errors.join(". "),
      });
      return false;
    }

    return true;
  };

  // Module selection handlers
  const handleModuleToggle = (moduleId: number) => {
    setSelectedModules((prev) =>
      prev.includes(moduleId)
        ? prev.filter((id) => id !== moduleId)
        : [...prev, moduleId]
    );
  };

  const handleSelectAllModules = () => {
    setSelectedModules(availableModules.map((m) => m.id));
  };

  const handleDeselectAllModules = () => {
    setSelectedModules([]);
  };

  // Calculate total cost
  const calculateTotalCost = () => {
    const selectedModuleObjects = availableModules.filter((m) =>
      selectedModules.includes(m.id)
    );
    return selectedModuleObjects.reduce((total, module) => {
      return total + (subscriptionType === "monthly" ? module.price_monthly : module.price_yearly);
    }, 0);
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Fetch tenant modules
  const fetchTenantModules = async (tenantId: number) => {
    try {
      setIsLoadingTenantModules(true);
      const response = await api.getTenantModules(tenantId);
      setTenantModules(response.data || []);
    } catch (error) {
      console.error("Error fetching tenant modules:", error);
      // Set mock data for demo
      setTenantModules([
        {
          id: 1,
          module_id: 1,
          module_name: "Savings",
          module_slug: "savings",
          module_description: "Complete savings account management",
          price_at_subscription: 50000,
          subscription_type: "monthly",
          activated_at: "2024-01-15T10:00:00Z",
          is_active: true,
        },
        {
          id: 2,
          module_id: 2,
          module_name: "Loans",
          module_slug: "loans",
          module_description: "Loan origination and tracking",
          price_at_subscription: 75000,
          subscription_type: "monthly",
          activated_at: "2024-01-15T10:00:00Z",
          is_active: true,
        },
      ]);
    } finally {
      setIsLoadingTenantModules(false);
    }
  };

  // Toggle tenant module status
  const handleToggleTenantModule = async (moduleId: number) => {
    if (!selectedTenant) return;

    try {
      await api.toggleTenantModule(selectedTenant.id, moduleId);
      showToast.success("Module status updated");
      fetchTenantModules(selectedTenant.id);
    } catch (error) {
      console.error("Error toggling module:", error);
      showToast.error("Failed to update module status");
    }
  };

  // Add modules to tenant
  const handleAddModulesToTenant = async () => {
    if (!selectedTenant || modulesToAdd.length === 0) {
      showToast.error("Please select at least one module");
      return;
    }

    try {
      for (const moduleId of modulesToAdd) {
        await api.addModuleToTenant(selectedTenant.id, {
          module_id: moduleId,
          subscription_type: addModuleSubscriptionType,
        });
      }
      showToast.success(`${modulesToAdd.length} module(s) added successfully`);
      setModulesToAdd([]);
      setIsManageModulesDialogOpen(false);
      fetchTenantModules(selectedTenant.id);
    } catch (error) {
      console.error("Error adding modules:", error);
      showToast.error("Failed to add modules");
    }
  };

  // Open manage modules dialog
  const openManageModulesDialog = (tenant: Tenant) => {
    setSelectedTenant(tenant);
    fetchTenantModules(tenant.id);
    setIsManageModulesDialogOpen(true);
  };

  // Handle next step
  const handleNextStep = () => {
    if (creationStep === 1 && validateStep1()) {
      setCreationStep(2);
    } else if (creationStep === 2 && validateStep2()) {
      setCreationStep(3);
    }
  };

  // Handle previous step
  const handlePrevStep = () => {
    if (creationStep > 1) {
      setCreationStep(creationStep - 1);
    }
  };

  // Handle create tenant
  const handleCreateTenant = async () => {
    if (!validateStep2()) return;

    // Validate modules selection
    if (selectedModules.length === 0) {
      showToast.error("Please select at least one module");
      return;
    }

    setIsSubmitting(true);
    setFormErrors({});
    setApiError(null);

    try {
      // ✨ Format modules according to backend API requirements
      const formattedModules = selectedModules.map(moduleId => ({
        module_id: moduleId,
        subscription_type: subscriptionType,
      }));

      // Create tenant data with modules and branding in correct format
      const tenantDataWithModules: CreateTenantData = {
        ...newTenant,
        modules: formattedModules,
        // Branding fields
        logo: brandingLogo || undefined,
        primary_color: brandingColors.primary_color,
        secondary_color: brandingColors.secondary_color,
        accent_color: brandingColors.accent_color,
        background_color: brandingColors.background_color,
      };

      const response = await api.createTenant(tenantDataWithModules);

      // Backend returns { status: 'success', ... } OR { success: true, ... }
      if (response.success || (response as unknown as Record<string, unknown>).status === 'success') {
        const {
          institution_code,
          tenant,
          database,
          subdomain_url,
          admin_credentials,
          modules,
          subscription_summary
        } = response.data;

        // Store created tenant info
        setCreatedTenant({
          name: tenant.name,
          subdomain: subdomain_url,
          database: database,
          admin_email: admin_credentials.email,
          institution_code: institution_code,
        });

        // Show success message with subscription details
        showToast.success("Tenant Created Successfully! 🎉", {
          description: `${tenant.name} with ${subscription_summary.total_modules} module(s) - Total: ₦${subscription_summary.total_cost.toLocaleString()}`,
          duration: 6000,
        });

        // Reset form
        setNewTenant({
          name: "",
          slug: "",
          email: "",
          phone: "",
          address: "",
          city: "",
          state: "",
          country: "NG",
          institution_prefix: "",
          admin_name: "",
          admin_email: "",
          admin_password: "",
          modules: [],
        });
        setSelectedModules([]);
        setSubscriptionType("monthly");
        setBrandingLogo(null);
        setBrandingLogoPreview(null);
        setBrandingColors({ ...DEFAULT_COLORS });
        setColorHexInputs({ ...DEFAULT_COLORS });

        // Close create dialog and show credentials
        setIsCreateDialogOpen(false);
        setCreationStep(1);
        setIsCredentialsDialogOpen(true);

        // Refresh tenant list
        await fetchTenants();
      }
    } catch (error: unknown) {
      console.error("Tenant creation error (full):", JSON.stringify(error, null, 2));
      const apiErr = error as ApiError;

      // Handle validation errors from backend (422)
      if (apiErr.errors) {
        setFormErrors(apiErr.errors);

        // Build a readable list of all validation messages
        const allMessages = Object.entries(apiErr.errors as Record<string, string[]>)
          .flatMap(([field, messages]) =>
            messages.map((msg) => `• ${field}: ${msg}`)
          )
          .join("\n");

        const errorSummary = `${apiErr.message || "Validation failed"}\n${allMessages}`;
        setApiError(errorSummary);

        showToast.error(apiErr.message || "Validation failed", {
          description: allMessages || "Please check the form and try again",
          duration: 10000,
        });
      } else {
        const msg = apiErr.message || "Please check the form and try again";
        setApiError(msg);
        showToast.error("Failed to create tenant", {
          description: msg,
          duration: 8000,
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Copy credentials to clipboard
  const handleCopyCredentials = () => {
    if (!createdTenant) return;

    const text = `Organization: ${createdTenant.name}\nInstitution Code: ${createdTenant.institution_code}\nSubdomain: ${createdTenant.subdomain}\nDatabase: ${createdTenant.database}\nAdmin Email: ${createdTenant.admin_email}\nPassword: (sent via email)`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    showToast.success("Copied to clipboard!");

    setTimeout(() => setCopied(false), 2000);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <DashboardLayout title= "Tenants Management" >
    <div className="space-y-6" >
      {/* Header */ }
      < div className = "flex items-center justify-between" >
        <div>
        <h1 className="text-3xl font-bold" > Tenants Management </h1>
          < p className = "text-muted-foreground mt-1" >
            Manage all client organizations and subscriptions
              </p>
              </div>
              < Button onClick = {() => setIsCreateDialogOpen(true)
} size = "lg" >
  <Plus className="mr-2 h-4 w-4" />
    New Tenant
      </Button>
      </div>

{/* Stats Cards */ }
<div className="grid gap-4 md:grid-cols-4" >
  <div className="rounded-lg border bg-card p-4" >
    <div className="flex items-center gap-3" >
      <div className="rounded-lg bg-primary/10 p-2" >
        <Building2 className="h-5 w-5 text-primary" />
          </div>
          < div >
          <p className="text-2xl font-semibold" > { pagination.total } </p>
            < p className = "text-sm text-muted-foreground" > Total Tenants </p>
              </div>
              </div>
              </div>

              < div className = "rounded-lg border bg-card p-4" >
                <div className="flex items-center gap-3" >
                  <div className="rounded-lg bg-success/10 p-2" >
                    <Check className="h-5 w-5 text-success" />
                      </div>
                      < div >
                      <p className="text-2xl font-semibold" >
                        { tenants.filter((t) => t.status === "active").length }
                        </p>
                        < p className = "text-sm text-muted-foreground" > Active </p>
                          </div>
                          </div>
                          </div>

                          < div className = "rounded-lg border bg-card p-4" >
                            <div className="flex items-center gap-3" >
                              <div className="rounded-lg bg-warning/10 p-2" >
                                <AlertTriangle className="h-5 w-5 text-warning" />
                                  </div>
                                  < div >
                                  <p className="text-2xl font-semibold" >
                                    { tenants.filter((t) => t.status === "suspended").length }
                                    </p>
                                    < p className = "text-sm text-muted-foreground" > Suspended </p>
                                      </div>
                                      </div>
                                      </div>

                                      < div className = "rounded-lg border bg-card p-4" >
                                        <div className="flex items-center gap-3" >
                                          <div className="rounded-lg bg-destructive/10 p-2" >
                                            <X className="h-5 w-5 text-destructive" />
                                              </div>
                                              < div >
                                              <p className="text-2xl font-semibold" >
                                                { tenants.filter((t) => t.status === "cancelled").length }
                                                </p>
                                                < p className = "text-sm text-muted-foreground" > Cancelled </p>
                                                  </div>
                                                  </div>
                                                  </div>
                                                  </div>

{/* Search and Filter */ }
<div className="flex items-center gap-4" >
  <div className="relative flex-1" >
    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
              placeholder="Search tenants..."
value = { searchQuery }
onChange = {(e) => setSearchQuery(e.target.value)}
className = "pl-10"
  />
  </div>
  < Button
variant = "outline"
onClick = {() => fetchTenants(pagination.current_page, searchQuery)}
disabled = { isLoadingTenants }
  >
  <RefreshCw className={ `h-4 w-4 mr-2 ${isLoadingTenants ? "animate-spin" : ""}` } />
Refresh
  </Button>
  </div>

{/* Tenants Table */ }
<div className="rounded-lg border bg-card" >
  <div className="overflow-x-auto" >
    <table className="w-full" >
      <thead>
      <tr className="border-b" >
        <th className="px-4 py-3 text-left text-sm font-medium" > Organization </th>
          < th className = "px-4 py-3 text-left text-sm font-medium" > Status </th>
            < th className = "px-4 py-3 text-left text-sm font-medium" > Subdomain </th>
              < th className = "px-4 py-3 text-left text-sm font-medium" > Contact </th>
                < th className = "px-4 py-3 text-left text-sm font-medium" > Country </th>
                  < th className = "px-4 py-3 text-left text-sm font-medium" > Created </th>
                    < th className = "px-4 py-3 text-right text-sm font-medium" > Actions </th>
                      </tr>
                      </thead>
                      <tbody>
{
  isLoadingTenants ? (
    <tr>
    <td colSpan= { 7} className = "px-4 py-12 text-center" >
      <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
        <p className="text-sm text-muted-foreground mt-2" > Loading tenants...</p>
          </td>
          </tr>
            ) : tenants.length === 0 ? (
    <tr>
    <td colSpan= { 7} className = "px-4 py-12 text-center" >
      <Building2 className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
        <p className="font-medium" > No tenants found </p>
          < p className = "text-sm text-muted-foreground mt-1" >
          {
            searchQuery
            ? "Try adjusting your search criteria"
              : "Get started by creating your first tenant"
          }
            </p>
            </td>
            </tr>
            ) : (
    tenants.map((tenant) => (
      <tr key= { tenant.id } className = "border-b last:border-0 hover:bg-muted/50" >
      <td className="px-4 py-3" >
    <div>
    <p className="font-medium" > { tenant.name } </p>
    < p className = "text-sm text-muted-foreground" > { tenant.slug } </p>
    </div>
    </td>
    < td className = "px-4 py-3" >
    <StatusBadge status={ tenant.status } />
    </td>
    < td className = "px-4 py-3" >
    <code className="text-xs bg-muted px-2 py-1 rounded" >
    { tenant.subdomain }
    </code>
    </td>
    < td className = "px-4 py-3" >
    <div>
    <p className="text-sm" > { tenant.contact_email } </p>
                      {
        tenant.contact_phone && (
          <p className="text-xs text-muted-foreground"> { tenant.contact_phone } </p>
                      )}
</div>
  </td>
  < td className = "px-4 py-3 text-sm" > { tenant.country } </td>
    < td className = "px-4 py-3 text-sm text-muted-foreground" >
      { formatDate(tenant.created_at) }
      </td>
      < td className = "px-4 py-3 text-right" >
        <DropdownMenu>
        <DropdownMenuTrigger asChild >
        <Button variant="ghost" size = "sm" >
          <MoreHorizontal className="h-4 w-4" />
            </Button>
            </DropdownMenuTrigger>
            < DropdownMenuContent align = "end" >
              <DropdownMenuLabel>Actions </DropdownMenuLabel>
              < DropdownMenuSeparator />
              <DropdownMenuItem
                          onClick={
  () => {
    setSelectedTenant(tenant);
    fetchTenantModules(tenant.id);
    setIsDetailsDialogOpen(true);
  }
}
                        >
  <Eye className="mr-2 h-4 w-4" />
    View Details
      </DropdownMenuItem>
      < DropdownMenuItem
onClick = { () => navigate(`/tenants/${tenant.id}/dashboard`) }
>
  <BarChart3 className="mr-2 h-4 w-4" />
    View Dashboard
      </DropdownMenuItem>
      < DropdownMenuItem disabled >
        Edit Tenant
          </DropdownMenuItem>
          < DropdownMenuSeparator />
          <DropdownMenuItem className="text-destructive" disabled >
            Suspend Tenant
              </DropdownMenuItem>
              </DropdownMenuContent>
              </DropdownMenu>
              </td>
              </tr>
              ))
            )}
</tbody>
  </table>
  </div>

{/* Pagination */ }
{
  !isLoadingTenants && tenants.length > 0 && (
    <div className="flex items-center justify-between border-t px-4 py-3" >
      <p className="text-sm text-muted-foreground" >
        Showing { pagination.from || 0 } to { pagination.to || 0 } of { pagination.total } tenants
          </p>
          < div className = "flex items-center gap-2" >
            <Button
                  variant="outline"
  size = "sm"
  onClick = {() => fetchTenants(pagination.current_page - 1, searchQuery)
}
disabled = { pagination.current_page === 1 }
  >
  Previous
  </Button>
  < span className = "text-sm" >
    Page { pagination.current_page } of { pagination.last_page }
</span>
  < Button
variant = "outline"
size = "sm"
onClick = {() => fetchTenants(pagination.current_page + 1, searchQuery)}
disabled = { pagination.current_page === pagination.last_page }
  >
  Next
  </Button>
  </div>
  </div>
          )}
</div>
  </div>

{/* Create Tenant Dialog */ }
<Dialog open={ isCreateDialogOpen } onOpenChange = {(open) => {
  setIsCreateDialogOpen(open);
  if (!open) {
    setApiError(null);
    setFormErrors({});
    setCreationStep(1);
    setBrandingLogo(null);
    setBrandingLogoPreview(null);
    setBrandingColors({ ...DEFAULT_COLORS });
    setColorHexInputs({ ...DEFAULT_COLORS });
  }
}} >
  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" >
    <DialogHeader>
    <DialogTitle>Create New Tenant </DialogTitle>
      <DialogDescription>
              Step { creationStep } of 3: {
  creationStep === 1 ? "Organization Details" :
    creationStep === 2 ? "Admin User Setup" :
      "Select Modules & Pricing"
}
</DialogDescription>
  </DialogHeader>

{/* API Error Banner - shown when backend returns an error */ }
{
  apiError && (
    <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4" >
      <div className="flex items-start gap-3" >
        <AlertTriangle className="h-5 w-5 text-destructive mt-0.5 shrink-0" />
          <div className="flex-1 min-w-0" >
            <p className="text-sm font-semibold text-destructive" > Submission Failed </p>
              < pre className = "text-xs text-destructive/80 mt-1 whitespace-pre-wrap font-sans" > { apiError } </pre>
                </div>
                < button
  type = "button"
  onClick = {() => setApiError(null)
}
className = "text-destructive/60 hover:text-destructive"
  >
  <X className="h-4 w-4" />
    </button>
    </div>
    </div>
)}

{/* Step Progress */ }
<div className="flex items-center gap-2 mb-4" >
  <div className={ `h-2 flex-1 rounded ${creationStep >= 1 ? "bg-primary" : "bg-muted"}` } />
    < div className = {`h-2 flex-1 rounded ${creationStep >= 2 ? "bg-primary" : "bg-muted"}`} />
      < div className = {`h-2 flex-1 rounded ${creationStep >= 3 ? "bg-primary" : "bg-muted"}`} />
        </div>

{/* Step 1: Organization Details */ }
{
  creationStep === 1 && (
    <div className="space-y-4" >
      <div>
      <Label htmlFor="name" >
        Organization Name < span className = "text-destructive" >* </span>
          </Label>
          < Input
  id = "name"
  value = { newTenant.name }
  onChange = {(e) => {
    handleInputChange("name", e.target.value);
    // Auto-generate slug if slug is empty
    if (!newTenant.slug && e.target.value) {
      const autoSlug = e.target.value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      handleInputChange("slug", autoSlug);
    }
  }
}
placeholder = "e.g., Access Bank PLC"
  />
{
  formErrors.name && (
    <p className="text-sm text-destructive mt-1"> { formErrors.name[0] } </p>
                  )
}
  </div>

  < div >
  <Label htmlFor="slug" >
    Slug / Subdomain < span className = "text-destructive" >* </span>
      </Label>
      < Input
id = "slug"
value = { newTenant.slug }
onChange = {(e) => {
  // Only allow lowercase letters, numbers, underscores, and hyphens
  const value = e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, '');
  handleInputChange("slug", value);
}}
placeholder = "e.g., access-bank or access_bank"
  />
  <p className="text-xs text-muted-foreground mt-1" >
    This will be used for subdomain and database name.Use lowercase letters, numbers, hyphens, or underscores only.
                  </p>
{
  newTenant.slug && (
    <div className="mt-2 space-y-1" >
      <p className="text-xs" >
        <span className="text-muted-foreground" > Subdomain: </span>{" "}
          < code className = "text-xs bg-muted px-1 py-0.5 rounded" >
            https://{newTenant.slug.replace(/_/g, '-')}.fynixcobanking.com
  </code>
    </p>
    < p className = "text-xs" >
      <span className="text-muted-foreground" > Database: </span>{" "}
        < code className = "text-xs bg-muted px-1 py-0.5 rounded" >
          fynix_tenant_{ newTenant.slug.replace(/-/g, '_') }
  </code>
    </p>
    </div>
                  )
}
{
  formErrors.slug && (
    <p className="text-sm text-destructive mt-1" > { formErrors.slug[0] } </p>
                  )
}
</div>

  < div >
  <Label htmlFor="email" >
    Contact Email < span className = "text-destructive" >* </span>
      </Label>
      < Input
id = "email"
type = "email"
value = { newTenant.email }
onChange = {(e) => handleInputChange("email", e.target.value)}
placeholder = "contact@organization.com"
  />
{
  formErrors.email && (
    <p className="text-sm text-destructive mt-1"> { formErrors.email[0] } </p>
                  )
}
  </div>

  < div >
  <Label htmlFor="institution_prefix" >
    Institution Code Prefix < span className = "text-destructive" >* </span>
      </Label>
      < div className = "relative" >
        <Input
                id="institution_prefix"
value = { newTenant.institution_prefix }
onChange = {(e) => {
  const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "");
  handleInputChange("institution_prefix", value);
}}
placeholder = "e.g. FYN, ABC, LAP"
maxLength = { 10}
className = "uppercase"
  />
{
  newTenant.institution_prefix && (
    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-mono">
      { newTenant.institution_prefix } - NG -????
      </div>
            )
}
  </div>
  < p className = "text-xs text-muted-foreground mt-1" >
    2–10 characters, letters and numbers only.We'll generate the full code automatically (e.g.{" "}
{ newTenant.institution_prefix ? `${newTenant.institution_prefix}-NG-XXXX` : "FYN-NG-73A9" }).
</p>
{
  formErrors.institution_prefix && (
    <p className="text-sm text-destructive mt-1" > { formErrors.institution_prefix[0] } </p>
        )
}
</div>

  < div className = "grid grid-cols-2 gap-4" >
    <div>
    <Label htmlFor="phone" > Phone </Label>
      < Input
id = "phone"
value = { newTenant.phone }
onChange = {(e) => handleInputChange("phone", e.target.value)}
placeholder = "+234..."
  />
  </div>

  < div >
  <Label htmlFor="country" >
    Country < span className = "text-destructive" >* </span>
      </Label>
      < Select
value = { newTenant.country }
onValueChange = {(value) => handleInputChange("country", value)}
                  >
  <SelectTrigger>
  <SelectValue />
  </SelectTrigger>
  < SelectContent >
  <SelectItem value="NG" > Nigeria </SelectItem>
    < SelectItem value = "GH" > Ghana </SelectItem>
      < SelectItem value = "KE" > Kenya </SelectItem>
        < SelectItem value = "ZA" > South Africa </SelectItem>
          < SelectItem value = "US" > United States </SelectItem>
            < SelectItem value = "GB" > United Kingdom </SelectItem>
              </SelectContent>
              </Select>
              </div>
              </div>

              < div >
              <Label htmlFor="address" > Address </Label>
                < Input
id = "address"
value = { newTenant.address }
onChange = {(e) => handleInputChange("address", e.target.value)}
placeholder = "Street address"
  />
  </div>

  < div className = "grid grid-cols-2 gap-4" >
    <div>
    <Label htmlFor="city" > City </Label>
      < Input
id = "city"
value = { newTenant.city }
onChange = {(e) => handleInputChange("city", e.target.value)}
placeholder = "City"
  />
  </div>

  < div >
  <Label htmlFor="state" > State </Label>
    < Input
id = "state"
value = { newTenant.state }
onChange = {(e) => handleInputChange("state", e.target.value)}
placeholder = "State"
  />
  </div>
  </div>

{/* ── Branding Section ── */ }
<div className="rounded-xl border bg-muted/30 overflow-hidden" >
  <div className="px-4 py-3 border-b flex items-center gap-2 bg-muted/50" >
    <Palette className="h-4 w-4 text-primary" />
      <p className="text-sm font-semibold" > Branding & Logo </p>
        < span className = "text-xs text-muted-foreground ml-auto" > Optional </span>
          </div>
          < div className = "p-4 space-y-5" >

            {/* Logo Upload */ }
            < div >
            <Label className="text-sm" > Institution Logo </Label>
              < p className = "text-xs text-muted-foreground mb-2" > JPEG, PNG, GIF, SVG, WEBP — max 2 MB.If not uploaded, initials will be shown.</p>
                < div className = "flex items-start gap-4" >
                  {/* Preview box */ }
                  < div className = "h-20 w-20 rounded-xl border-2 border-dashed border-border flex items-center justify-center shrink-0 overflow-hidden bg-background" >
                    {
                      brandingLogoPreview?(
                <img src = { brandingLogoPreview } alt = "Logo preview" className = "h-full w-full object-contain p-1" />
              ): (
                          <ImageIcon className = "h-7 w-7 text-muted-foreground/50" />
              )}
</div>
  < div className = "flex-1 space-y-2" >
    <label
                htmlFor="branding_logo"
className = "flex items-center gap-2 cursor-pointer rounded-lg border border-border bg-background hover:bg-accent px-4 py-2.5 text-sm font-medium transition-colors w-fit"
  >
  <Upload className="h-4 w-4" />
    { brandingLogo? "Change Logo": "Upload Logo" }
    < input
id = "branding_logo"
type = "file"
accept = "image/jpeg,image/png,image/gif,image/svg+xml,image/webp"
className = "hidden"
onChange = {(e) => {
  const file = e.target.files?.[0] || null;
  if (file) {
    if (file.size > 2 * 1024 * 1024) {
      showToast.error("Logo must not exceed 2MB.");
      return;
    }
    setBrandingLogo(file);
    const reader = new FileReader();
    reader.onload = (ev) => setBrandingLogoPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  }
}}
                />
  </label>
{
  brandingLogo && (
    <button
                  type="button"
  onClick = {() => { setBrandingLogo(null); setBrandingLogoPreview(null); }
}
className = "flex items-center gap-1.5 text-xs text-destructive hover:underline"
  >
  <X className="h-3 w-3" /> Remove
    </button>
              )}
{
  brandingLogo && (
    <p className="text-xs text-muted-foreground" > { brandingLogo.name }({(brandingLogo.size / 1024).toFixed(1)} KB)</p>
              )}
</div>
  </div>
  </div>

{/* Color Pickers */ }
<div>
  <Label className="text-sm mb-2 block" > Brand Colors </Label>
    < div className = "grid grid-cols-1 sm:grid-cols-2 gap-3" >
      {(
        [
          { key: "primary_color", label: "Primary Color", hint: "Headers, buttons, nav bar" },
          { key: "secondary_color", label: "Secondary Color", hint: "Icons, highlights" },
          { key: "accent_color", label: "Accent Color", hint: "CTAs, links, active states" },
          { key: "background_color", label: "Background Color", hint: "Page/screen background" },
        ] as Array<{ key: keyof typeof brandingColors; label: string; hint: string }>
      ).map(({ key, label, hint }) => (
        <div key= { key } className = "rounded-lg border bg-background p-3 space-y-2" >
        <div className="flex items-center justify-between" >
      <div>
      <p className="text-xs font-semibold" > { label } </p>
      < p className = "text-[10px] text-muted-foreground" > { hint } </p>
      </div>
                  {/* Native color picker swatch */ }
        < label className = "cursor-pointer" title = {`Pick ${label}`}>
      <div
                      className="h-9 w-9 rounded-lg border-2 border-border shadow-sm cursor-pointer hover:scale-110 transition-transform overflow-hidden"
                      style = {{ backgroundColor: brandingColors[key] }}
                    />
        < input
                      type = "color"
                      value = { brandingColors[key]}
                      className = "sr-only"
                      onChange = {(e) => {
        const val = e.target.value;
        setBrandingColors(prev => ({ ...prev, [key]: val }));
setColorHexInputs(prev => ({ ...prev, [key]: val }));
                      }}
                    />
  </label>
  </div>
{/* Hex text input */ }
<div className="flex items-center gap-2" >
  <div className="h-5 w-5 rounded shrink-0" style = {{ backgroundColor: brandingColors[key] }} />
    < Input
value = { colorHexInputs[key]}
maxLength = { 7}
placeholder = "#000000"
className = "h-8 text-xs font-mono uppercase flex-1"
onChange = {(e) => {
  const raw = e.target.value;
  setColorHexInputs(prev => ({ ...prev, [key]: raw }));
  // Apply only when it's a valid 4 or 7-char hex
  if (/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(raw)) {
    setBrandingColors(prev => ({ ...prev, [key]: raw }));
  }
}}
onBlur = {() => {
  // Reset to last valid color if input is invalid
  if (!/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(colorHexInputs[key])) {
    setColorHexInputs(prev => ({ ...prev, [key]: brandingColors[key] }));
  }
}}
                  />
  </div>
  </div>
            ))}
</div>
  </div>

{/* Brand Preview */ }
<div className="rounded-xl overflow-hidden border" >
  <div className="px-3 py-2 bg-muted/40 border-b flex items-center gap-1.5" >
    <div className="h-2 w-2 rounded-full bg-muted-foreground/40" />
      <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide" > Live Preview </p>
        </div>
        < div className = "p-4" style = {{ backgroundColor: brandingColors.background_color }}>
          <div
              className="rounded-lg px-4 py-3 flex items-center gap-3"
style = {{ backgroundColor: brandingColors.primary_color }}
            >
  <div className="h-8 w-8 rounded-lg bg-white/20 flex items-center justify-center overflow-hidden shrink-0" >
  {
    brandingLogoPreview?(
                  <img src = { brandingLogoPreview } alt = "Logo" className = "h-full w-full object-contain" />
                ): (
        <span className = "text-white font-bold text-xs">{newTenant.name ? newTenant.name.slice(0, 2).toUpperCase() : "FX"
  } </span>
                )}
</div>
  < div className = "flex-1 min-w-0" >
    <p className="text-white font-semibold text-sm truncate" > { newTenant.name || "Institution Name" } </p>
      < p className = "text-xs" style = {{ color: brandingColors.secondary_color }}> { newTenant.slug || "subdomain" }.fynixcobanking.com </p>
        </div>
        < div
className = "rounded-md px-3 py-1 text-xs font-semibold text-white shrink-0"
style = {{ backgroundColor: brandingColors.accent_color }}
              >
  Login
  </div>
  </div>
  </div>
  </div>

  </div>
  </div>
  </div>
          )}

{/* Step 2: Admin User */ }
{
  creationStep === 2 && (
    <div className="space-y-4" >
      <div>
      <Label htmlFor="admin_name" >
        Admin Name < span className = "text-destructive" >* </span>
          </Label>
          < Input
  id = "admin_name"
  value = { newTenant.admin_name }
  onChange = {(e) => handleInputChange("admin_name", e.target.value)
}
placeholder = "Full name"
  />
{
  formErrors.admin_name && (
    <p className="text-sm text-destructive mt-1"> { formErrors.admin_name[0] } </p>
                )
}
  </div>

  < div >
  <Label htmlFor="admin_email" >
    Admin Email < span className = "text-destructive" >* </span>
      </Label>
      < Input
id = "admin_email"
type = "email"
value = { newTenant.admin_email }
onChange = {(e) => handleInputChange("admin_email", e.target.value)}
placeholder = "admin@organization.com"
  />
{
  formErrors.admin_email && (
    <p className="text-sm text-destructive mt-1"> { formErrors.admin_email[0] } </p>
                )
}
  </div>

  < div >
  <Label htmlFor="admin_password" >
    Admin Password < span className = "text-destructive" >* </span>
      </Label>
      < div className = "relative" >
        <Input
                    id="admin_password"
type = { showPassword? "text": "password" }
value = { newTenant.admin_password }
onChange = {(e) => handleInputChange("admin_password", e.target.value)}
placeholder = "Min. 8 characters"
  />
  <button
                    type="button"
onClick = {() => setShowPassword(!showPassword)}
className = "absolute right-3 top-1/2 -translate-y-1/2"
  >
  {
    showPassword?(
                      <EyeOff className = "h-4 w-4 text-muted-foreground" />
                    ): (
        <Eye className = "h-4 w-4 text-muted-foreground" />
                    )}
</button>
  </div>
{
  formErrors.admin_password && (
    <p className="text-sm text-destructive mt-1" > { formErrors.admin_password[0] } </p>
                )
}
</div>
  </div>
          )}

{/* Step 3: Select Modules */ }
{
  creationStep === 3 && (
    <div className="space-y-6" >
      {/* Subscription Type Selection */ }
      < div className = "space-y-3" >
        <Label>Subscription Type </Label>
          < div className = "grid grid-cols-2 gap-3" >
            <button
          type="button"
  onClick = {() => setSubscriptionType("monthly")
}
className = {`p-4 rounded-lg border-2 transition-all ${subscriptionType === "monthly"
  ? "border-primary bg-primary/5"
  : "border-border hover:border-primary/50"
  }`}
        >
  <div className="text-left" >
    <p className="font-semibold" > Monthly </p>
      < p className = "text-sm text-muted-foreground" > Pay every month </p>
        </div>
        </button>
        < button
type = "button"
onClick = {() => setSubscriptionType("yearly")}
className = {`p-4 rounded-lg border-2 transition-all ${subscriptionType === "yearly"
  ? "border-primary bg-primary/5"
  : "border-border hover:border-primary/50"
  }`}
        >
  <div className="text-left" >
    <p className="font-semibold" > Yearly </p>
      < p className = "text-sm text-success" > Save up to 17 % </p>
        </div>
        </button>
        </div>
        </div>

{/* Module Selection */ }
<div className="space-y-3" >
  <div className="flex items-center justify-between" >
    <Label>Select Modules < span className = "text-destructive" >* </span></Label >
      <div className="flex gap-2" >
        <Button
            type="button"
variant = "ghost"
size = "sm"
onClick = { handleSelectAllModules }
  >
  Select All
    </Button>
    < Button
type = "button"
variant = "ghost"
size = "sm"
onClick = { handleDeselectAllModules }
  >
  Clear All
    </Button>
    </div>
    </div>

{
  isLoadingModules ? (
    <div className= "flex items-center justify-center py-8" >
    <Loader2 className="h-6 w-6 animate-spin" />
      </div>
      ) : (
    <div className= "space-y-2 max-h-[300px] overflow-y-auto border rounded-lg p-4" >
    {
      availableModules.map((module) => (
        <div
              key= { module.id }
              className = "flex items-start space-x-3 p-3 rounded-lg border hover:bg-accent transition-colors"
        >
        <Checkbox
                checked={ selectedModules.includes(module.id) }
                onCheckedChange = {() => handleModuleToggle(module.id)}
  className = "mt-1"
    />
    <div className="flex-1" >
      <div className="flex items-center justify-between" >
        <p className="font-medium" > { module.name } </p>
          < p className = "text-sm font-semibold" >
          {
            formatCurrency(
              subscriptionType === "monthly"
            ? module.price_monthly
            : module.price_yearly
                    )
}
<span className="text-xs text-muted-foreground" >
                      /{subscriptionType === "monthly" ? "mo" : "yr"}
  </span>
  </p>
  </div>
  < p className = "text-sm text-muted-foreground mt-1" >
    { module.description }
    </p>
{
  subscriptionType === "yearly" && (
    <p className="text-xs text-success mt-1" >
      Save { formatCurrency(module.price_monthly * 12 - module.price_yearly) } yearly
        </p>
                )
}
</div>
  </div>
          ))}
</div>
      )}
</div>

{/* Cost Summary */ }
{
  selectedModules.length > 0 && (
    <div className="rounded-lg border bg-accent/50 p-4 space-y-2" >
      <div className="flex justify-between items-center" >
        <span className="text-sm text-muted-foreground" > Selected Modules </span>
          < span className = "text-sm font-medium" > { selectedModules.length } </span>
            </div>
            < div className = "flex justify-between items-center pt-2 border-t" >
              <span className="font-semibold" > Total Cost </span>
                < div className = "text-right" >
                  <p className="text-2xl font-bold text-primary" >
                    { formatCurrency(calculateTotalCost())
}
</p>
  < p className = "text-xs text-muted-foreground" >
    per { subscriptionType === "monthly" ? "month" : "year" }
</p>
  </div>
  </div>
  </div>
    )}
</div>
)}

<DialogFooter>
  <div className="flex justify-between w-full" >
    <Button
                variant="outline"
onClick = { creationStep === 1 ? () => setIsCreateDialogOpen(false) : handlePrevStep}
              >
  { creationStep === 1 ? "Cancel" : <><ArrowLeft className="mr-2 h-4 w-4" /> Back </>}
</Button>

{
  creationStep < 3 ? (
    <Button onClick= { handleNextStep } >
    Next < ArrowRight className = "ml-2 h-4 w-4" />
      </Button>
              ) : (
    <Button onClick= { handleCreateTenant } disabled = { isSubmitting } >
    {
      isSubmitting?(
                    <>
      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Creating...
  </>
                  ) : (
    <>Create Tenant </>
                  )
}
</Button>
              )}
</div>
  </DialogFooter>
  </DialogContent>
  </Dialog>

{/* Credentials Dialog */ }
<Dialog open={ isCredentialsDialogOpen } onOpenChange = { setIsCredentialsDialogOpen } >
  <DialogContent>
  <DialogHeader>
  <DialogTitle>Tenant Created Successfully! 🎉</DialogTitle>
    <DialogDescription>
              Here are the details for the new tenant
  </DialogDescription>
  </DialogHeader>

          { createdTenant && (
    <div className= "space-y-4" >
      {/* Institution Code - Prominent Display */ }
      < div className = "rounded-lg border-2 border-primary/30 bg-primary/5 p-4" >
        <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-1" > Institution Code </p>
          < div className = "flex items-center justify-between gap-3" >
            <code className="text-2xl font-bold tracking-widest text-primary font-mono" >
              { createdTenant.institution_code }
              </code>
              < button
type = "button"
onClick = {() => {
  navigator.clipboard.writeText(createdTenant.institution_code);
  showToast.success("Institution code copied!");
}}
className = "flex items-center gap-1 rounded-md border border-primary/30 bg-background px-2 py-1 text-xs text-primary hover:bg-primary/10 transition-colors"
  >
  <Copy className="h-3 w-3" />
    Copy
    </button>
    </div>
    < p className = "text-xs text-muted-foreground mt-1" >
      This is the permanent identifier for this institution.Keep it safe.
                </p>
        </div>

        < div className = "rounded-lg bg-muted p-4 space-y-3" >
          <div>
          <p className="text-sm text-muted-foreground" > Organization </p>
            < p className = "font-medium" > { createdTenant.name } </p>
              </div>

              < div >
              <p className="text-sm text-muted-foreground" > Subdomain </p>
                < p className = "font-mono text-sm" > { createdTenant.subdomain } </p>
                  </div>

                  < div >
                  <p className="text-sm text-muted-foreground" > Database </p>
                    < p className = "font-mono text-sm" > { createdTenant.database } </p>
                      </div>

                      < div >
                      <p className="text-sm text-muted-foreground" > Admin Email </p>
                        < p className = "font-medium" > { createdTenant.admin_email } </p>
                          </div>

                          < div >
                          <p className="text-sm text-muted-foreground" > Password </p>
                            < p className = "text-sm italic text-muted-foreground" > Sent to admin email </p>
                              </div>
                              </div>

                              < Button onClick = { handleCopyCredentials } variant = "outline" className = "w-full" >
                              {
                                copied?(
                  <>
                                <Check className="mr-2 h-4 w-4 text-success" />
                                  Copied!
                                  </>
                ) : (
  <>
  <Copy className= "mr-2 h-4 w-4" />
  Copy All Details
    </>
                )}
</Button>
  </div>
          )}

<DialogFooter>
  <Button onClick={ () => setIsCredentialsDialogOpen(false) }> Done </Button>
    </DialogFooter>
    </DialogContent>
    </Dialog>

{/* Tenant Details Dialog */ }
<Dialog open={ isDetailsDialogOpen } onOpenChange = { setIsDetailsDialogOpen } >
  <DialogContent className="max-w-5xl max-h-[92vh] overflow-y-auto p-0 gap-0" >
    { selectedTenant && (
      <>
      {/* Hero Header */ }
      < div
          className = "relative bg-gradient-to-br from-primary via-primary/90 to-indigo-700 px-6 pt-6 pb-5 rounded-t-lg overflow-hidden"
style = {
  selectedTenant.branding ? {
    background: `linear-gradient(135deg, ${selectedTenant.branding.primary_color} 0%, ${selectedTenant.branding.accent_color} 100%)`,
  } : undefined
}
  >
  <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-white/5" />
    <div className="absolute -bottom-6 -left-6 h-28 w-28 rounded-full bg-white/5" />
      <div className="relative flex items-start justify-between gap-4" >
        <div className="flex items-center gap-4" >
          <div className="h-14 w-14 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center shrink-0 shadow-lg overflow-hidden" >
            {(selectedTenant.logo || selectedTenant.logo_url || selectedTenant.branding?.logo_thumb_url) ? (
              <img
                    src= { selectedTenant.logo || selectedTenant.branding?.logo_thumb_url || selectedTenant.logo_url || "" }
                    alt = { selectedTenant.name }
className = "h-full w-full object-contain p-1"
onError = {(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                  />
                ) : (
  <span className= "text-xl font-bold text-white" > { selectedTenant.name.slice(0, 2).toUpperCase() } </span>
                )}
</div>
  < div >
  <h2 className="text-xl font-bold text-white leading-tight" > { selectedTenant.name } </h2>
    < div className = "flex items-center gap-2 mt-1" >
      <code className="text-xs bg-white/15 text-white/90 px-2 py-0.5 rounded font-mono" > { selectedTenant.slug } </code>
        < span className = "text-white/40" > { "\u2022"} </span>
          < span className = "text-xs text-white/70" > { selectedTenant.country } </span>
            </div>
            </div>
            </div>
            < div className = "flex items-center gap-3 shrink-0" >
              <span className={
  `inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${selectedTenant.status === "active"
    ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
    : selectedTenant.status === "suspended"
      ? "bg-amber-500/20 text-amber-300 border-amber-500/30"
      : "bg-red-500/20 text-red-300 border-red-500/30"
    }`
}>
  <span className={
  `h-1.5 w-1.5 rounded-full ${selectedTenant.status === "active" ? "bg-emerald-400" :
    selectedTenant.status === "suspended" ? "bg-amber-400" : "bg-red-400"
    }`
} />
{ selectedTenant.status.charAt(0).toUpperCase() + selectedTenant.status.slice(1) }
</span>
  </div>
  </div>
  < div className = "relative mt-5 grid grid-cols-2 md:grid-cols-4 gap-3" >
    <div className="col-span-2 md:col-span-1 rounded-xl bg-white/10 backdrop-blur border border-white/20 px-4 py-3" >
      <p className="text-[10px] font-semibold uppercase tracking-widest text-white/60 mb-1" > Institution Code </p>
        < div className = "flex items-center justify-between gap-2" >
          <code className="text-lg font-bold text-white font-mono tracking-wider" >
            { selectedTenant.institution_code || "\u2014" }
            </code>
{
  selectedTenant.institution_code && (
    <button
                    onClick={ () => { navigator.clipboard.writeText(selectedTenant.institution_code); showToast.success("Institution code copied!"); } }
  className = "rounded-md p-1.5 bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-colors"
    >
    <Copy className="h-3.5 w-3.5" />
      </button>
                )
}
</div>
  </div>
  < div className = "rounded-xl bg-white/10 backdrop-blur border border-white/20 px-4 py-3" >
    <p className="text-[10px] font-semibold uppercase tracking-widest text-white/60 mb-1" > Subdomain </p>
      < p className = "text-sm font-semibold text-white truncate" > { selectedTenant.subdomain } </p>
        </div>
        < div className = "rounded-xl bg-white/10 backdrop-blur border border-white/20 px-4 py-3" >
          <p className="text-[10px] font-semibold uppercase tracking-widest text-white/60 mb-1" > Modules </p>
            < p className = "text-sm font-semibold text-white" > { tenantModules.length } subscribed </p>
              </div>
              < div className = "rounded-xl bg-white/10 backdrop-blur border border-white/20 px-4 py-3" >
                <p className="text-[10px] font-semibold uppercase tracking-widest text-white/60 mb-1" > Member Since </p>
                  < p className = "text-sm font-semibold text-white" > { formatDate(selectedTenant.created_at) } </p>
                    </div>
                    </div>
                    </div>

{/* Tabs */ }
<div className="px-6 pb-6" >
  <Tabs defaultValue="overview" className = "w-full" >
    <TabsList className="mt-5 mb-5 h-10 bg-muted/60 p-1 rounded-lg" >
      <TabsTrigger value="overview" className = "rounded-md text-xs font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm" >
        <Activity className="h-3.5 w-3.5 mr-1.5" /> Overview
          </TabsTrigger>
          < TabsTrigger value = "modules" className = "rounded-md text-xs font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm" >
            <Package className="h-3.5 w-3.5 mr-1.5" /> Modules
              </TabsTrigger>
              < TabsTrigger value = "company" className = "rounded-md text-xs font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm" >
                <Building2 className="h-3.5 w-3.5 mr-1.5" /> Company
                  </TabsTrigger>
                  < TabsTrigger value = "branding" className = "rounded-md text-xs font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm" >
                    <Palette className="h-3.5 w-3.5 mr-1.5" /> Branding
                      </TabsTrigger>
                      < TabsTrigger value = "admin" className = "rounded-md text-xs font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm" >
                        <Users className="h-3.5 w-3.5 mr-1.5" /> Admin
                          </TabsTrigger>
                          </TabsList>

{/* Overview */ }
<TabsContent value="overview" className = "space-y-5 mt-0" >
  {
    selectedTenant.suspension_reason && (
      <div className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3">
        <AlertTriangle className="h-5 w-5 text-destructive mt-0.5 shrink-0" />
          < div >
          <p className="text-sm font-semibold text-destructive"> Account Suspended</ p >
  <p className="text-sm text-muted-foreground mt-0.5" > { selectedTenant.suspension_reason } </p>
{
  selectedTenant.suspended_at && (
    <p className="text-xs text-muted-foreground mt-1" > Suspended on { formatDate(selectedTenant.suspended_at) } </p>
                    )
}
</div>
  </div>
              )}
<div className="grid grid-cols-2 md:grid-cols-4 gap-3" >
  <div className="rounded-xl border bg-card p-4" >
    <div className="flex items-center gap-2 mb-1" >
      <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center" >
        <Package className="h-4 w-4 text-primary" />
          </div>
          < span className = "text-xs text-muted-foreground font-medium" > Active Modules </span>
            </div>
            < p className = "text-2xl font-bold" > { tenantModules.filter(m => m.is_active).length } </p>
              < p className = "text-xs text-muted-foreground" > of { tenantModules.length } total </p>
                </div>
                < div className = "rounded-xl border bg-card p-4" >
                  <div className="flex items-center gap-2 mb-1" >
                    <div className="h-7 w-7 rounded-lg bg-success/10 flex items-center justify-center" >
                      <TrendingUp className="h-4 w-4 text-success" />
                        </div>
                        < span className = "text-xs text-muted-foreground font-medium" > Monthly Cost </span>
                          </div>
                          < p className = "text-xl font-bold text-success" >
                            { formatCurrency(tenantModules.filter(m => m.is_active && m.subscription_type === "monthly").reduce((s, m) => s + m.price_at_subscription, 0)) }
                            </p>
                            < p className = "text-xs text-muted-foreground" > active subscriptions </p>
                              </div>
                              < div className = "rounded-xl border bg-card p-4" >
                                <div className="flex items-center gap-2 mb-1" >
                                  <div className="h-7 w-7 rounded-lg bg-blue-500/10 flex items-center justify-center" >
                                    <Globe className="h-4 w-4 text-blue-500" />
                                      </div>
                                      < span className = "text-xs text-muted-foreground font-medium" > Subdomain </span>
                                        </div>
                                        < p className = "text-sm font-semibold truncate" > { selectedTenant.subdomain } </p>
                                          < p className = "text-xs text-muted-foreground" >.fynixcobanking.com </p>
                                            </div>
                                            < div className = "rounded-xl border bg-card p-4" >
                                              <div className="flex items-center gap-2 mb-1" >
                                                <div className="h-7 w-7 rounded-lg bg-warning/10 flex items-center justify-center" >
                                                  <Calendar className="h-4 w-4 text-warning" />
                                                    </div>
                                                    < span className = "text-xs text-muted-foreground font-medium" > Last Updated </span>
                                                      </div>
                                                      < p className = "text-sm font-semibold" > { formatDate(selectedTenant.updated_at) } </p>
                                                        < p className = "text-xs text-muted-foreground" > record updated </p>
                                                          </div>
                                                          </div>
                                                          < div className = "rounded-xl border bg-card overflow-hidden" >
                                                            <div className="px-5 py-3 border-b bg-muted/30 flex items-center gap-2" >
                                                              <CreditCard className="h-4 w-4 text-primary" />
                                                                <h3 className="text-sm font-semibold" > Identity & amp; Access </h3>
                                                                  </div>
                                                                  < div className = "p-5 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4" >
                                                                    <div className="flex items-start gap-3" >
                                                                      <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5" >
                                                                        <CreditCard className="h-4 w-4 text-primary" />
                                                                          </div>
                                                                          < div >
                                                                          <p className="text-xs text-muted-foreground font-medium" > Institution Code </p>
                                                                            < code className = "text-base font-bold font-mono text-foreground" > { selectedTenant.institution_code || "Not assigned" } </code>
                                                                              </div>
                                                                              </div>
                                                                              < div className = "flex items-start gap-3" >
                                                                                <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0 mt-0.5" >
                                                                                  <Globe className="h-4 w-4 text-blue-500" />
                                                                                    </div>
                                                                                    < div >
                                                                                    <p className="text-xs text-muted-foreground font-medium" > Subdomain URL </p>
                                                                                      < p className = "text-sm font-semibold" > { "https://"}{ selectedTenant.subdomain.replace(/_/g, "-") } { ".fynixcobanking.com" } </p>
                                                                                        </div>
                                                                                        </div>
                                                                                        < div className = "flex items-start gap-3" >
                                                                                          <div className="h-8 w-8 rounded-lg bg-violet-500/10 flex items-center justify-center shrink-0 mt-0.5" >
                                                                                            <FileText className="h-4 w-4 text-violet-500" />
                                                                                              </div>
                                                                                              < div >
                                                                                              <p className="text-xs text-muted-foreground font-medium" > Slug / Identifier </p>
                                                                                                < code className = "text-sm font-mono" > { selectedTenant.slug } </code>
                                                                                                  </div>
                                                                                                  </div>
                                                                                                  < div className = "flex items-start gap-3" >
                                                                                                    <div className="h-8 w-8 rounded-lg bg-success/10 flex items-center justify-center shrink-0 mt-0.5" >
                                                                                                      <Calendar className="h-4 w-4 text-success" />
                                                                                                        </div>
                                                                                                        < div >
                                                                                                        <p className="text-xs text-muted-foreground font-medium" > Created </p>
                                                                                                          < p className = "text-sm font-semibold" > { formatDate(selectedTenant.created_at) } </p>
                                                                                                            </div>
                                                                                                            </div>
                                                                                                            </div>
                                                                                                            </div>
                                                                                                            < div className = "rounded-xl border bg-card overflow-hidden" >
                                                                                                              <div className="px-5 py-3 border-b bg-muted/30 flex items-center gap-2" >
                                                                                                                <Mail className="h-4 w-4 text-primary" />
                                                                                                                  <h3 className="text-sm font-semibold" > Contact Information </h3>
                                                                                                                    </div>
                                                                                                                    < div className = "p-5 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4" >
                                                                                                                      <div className="flex items-start gap-3" >
                                                                                                                        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5" >
                                                                                                                          <Mail className="h-4 w-4 text-primary" />
                                                                                                                            </div>
                                                                                                                            < div >
                                                                                                                            <p className="text-xs text-muted-foreground font-medium" > Email Address </p>
                                                                                                                              < p className = "text-sm font-semibold" > { selectedTenant.contact_email || "Not provided" } </p>
                                                                                                                                </div>
                                                                                                                                </div>
                                                                                                                                < div className = "flex items-start gap-3" >
                                                                                                                                  <div className="h-8 w-8 rounded-lg bg-success/10 flex items-center justify-center shrink-0 mt-0.5" >
                                                                                                                                    <Phone className="h-4 w-4 text-success" />
                                                                                                                                      </div>
                                                                                                                                      < div >
                                                                                                                                      <p className="text-xs text-muted-foreground font-medium" > Phone Number </p>
                                                                                                                                        < p className = "text-sm font-semibold" > { selectedTenant.contact_phone || "Not provided" } </p>
                                                                                                                                          </div>
                                                                                                                                          </div>
{
  (selectedTenant.address || selectedTenant.city) && (
    <div className="flex items-start gap-3 md:col-span-2" >
      <div className="h-8 w-8 rounded-lg bg-warning/10 flex items-center justify-center shrink-0 mt-0.5" >
        <MapPin className="h-4 w-4 text-warning" />
          </div>
          < div >
          <p className="text-xs text-muted-foreground font-medium" > Address </p>
            < p className = "text-sm font-semibold" >
              { [selectedTenant.address, selectedTenant.city, selectedTenant.state, selectedTenant.country].filter(Boolean).join(", ") }
              </p>
              </div>
              </div>
                  )
}
</div>
  </div>
  </TabsContent>

{/* Modules */ }
<TabsContent value="modules" className = "space-y-4 mt-0" >
  <div className="flex items-center justify-between" >
    <div>
    <h3 className="text-base font-semibold" > Subscribed Modules </h3>
      < p className = "text-xs text-muted-foreground mt-0.5" > { tenantModules.filter(m => m.is_active).length } active of { tenantModules.length } total </p>
        </div>
        < Button onClick = {() => setIsManageModulesDialogOpen(true)} size = "sm" >
          <Plus className="mr-2 h-3.5 w-3.5" /> Add Modules
            </Button>
            </div>
{
  isLoadingTenantModules ? (
    <div className= "flex flex-col items-center justify-center py-12 gap-3" >
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground" > Loading modules...</p>
        </div>
              ) : tenantModules.length === 0 ? (
    <div className= "flex flex-col items-center justify-center py-12 border rounded-xl bg-muted/20 gap-3" >
    <div className="h-14 w-14 rounded-2xl bg-muted flex items-center justify-center" >
      <Package className="h-7 w-7 text-muted-foreground" />
        </div>
        < div className = "text-center" >
          <p className="font-medium" > No modules yet </p>
            < p className = "text-sm text-muted-foreground mt-1" > Add modules to enable features for this tenant </p>
              </div>
              < Button onClick = {() => setIsManageModulesDialogOpen(true)
} size = "sm" >
  <Plus className="mr-2 h-3.5 w-3.5" /> Add Modules
    </Button>
    </div>
              ) : (
  <>
  <div className= "grid gap-3 md:grid-cols-2" >
  {
    tenantModules.map((module) => (
      <div key= { module.id } className = {`rounded-xl border p-4 transition-all ${module.is_active ? "bg-card hover:border-primary/40 hover:shadow-sm" : "bg-muted/30 opacity-60"}`} >
  <div className="flex items-start justify-between gap-3" >
    <div className="flex items-center gap-3 flex-1 min-w-0" >
      <div className={ `h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${module.is_active ? "bg-primary/10" : "bg-muted"}` }>
        <Package className={ `h-5 w-5 ${module.is_active ? "text-primary" : "text-muted-foreground"}` } />
          </div>
          < div className = "min-w-0 flex-1" >
            <div className="flex items-center gap-2 flex-wrap" >
              <h4 className="font-semibold text-sm" > { module.module_name } </h4>
{
  module.is_active ? (
    <span className= "inline-flex items-center gap-1 text-[10px] font-semibold bg-success/10 text-success px-2 py-0.5 rounded-full" >
    <span className="h-1.5 w-1.5 rounded-full bg-success" /> Active
      </span>
                                ) : (
    <span className= "inline-flex items-center gap-1 text-[10px] font-semibold bg-muted text-muted-foreground px-2 py-0.5 rounded-full" > Disabled </span>
                                )
}
</div>
{
  module.module_description && (
    <p className="text-xs text-muted-foreground mt-0.5 truncate" > { module.module_description } </p>
                              )
}
</div>
  </div>
  < DropdownMenu >
  <DropdownMenuTrigger asChild >
  <Button variant="ghost" size = "sm" className = "h-8 w-8 p-0 shrink-0" >
    <MoreHorizontal className="h-4 w-4" />
      </Button>
      </DropdownMenuTrigger>
      < DropdownMenuContent align = "end" >
        <DropdownMenuLabel>Actions </DropdownMenuLabel>
        < DropdownMenuSeparator />
        <DropdownMenuItem onClick={ () => handleToggleTenantModule(module.module_id) }>
          {
            module.is_active ? (
              <><XCircle className= "mr-2 h-4 w-4" /> Disable Module</>
                                ) : (
  <><CheckCircle2 className= "mr-2 h-4 w-4" /> Enable Module </>
                                )}
</DropdownMenuItem>
  </DropdownMenuContent>
  </DropdownMenu>
  </div>
  < div className = "mt-3 pt-3 border-t grid grid-cols-3 gap-2 text-center" >
    <div>
    <p className="text-xs text-muted-foreground" > Price </p>
      < p className = "text-sm font-bold text-primary" > { formatCurrency(module.price_at_subscription) } </p>
        </div>
        < div >
        <p className="text-xs text-muted-foreground" > Billing </p>
          < p className = "text-sm font-semibold capitalize" > { module.subscription_type } </p>
            </div>
            < div >
            <p className="text-xs text-muted-foreground" > Since </p>
              < p className = "text-sm font-semibold" > { new Date(module.activated_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "2-digit" }) } </p>
                </div>
                </div>
{
  module.deactivated_at && (
    <div className="mt-2 text-xs text-muted-foreground flex items-center gap-1" >
      <XCircle className="h-3 w-3" />
        Disabled on { new Date(module.deactivated_at).toLocaleDateString() }
  </div>
                        )
}
</div>
                    ))}
</div>
  < div className = "rounded-xl border bg-gradient-to-r from-primary/5 to-indigo-500/5 p-5 flex items-center justify-between" >
    <div className="flex items-center gap-3" >
      <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center" >
        <TrendingUp className="h-5 w-5 text-primary" />
          </div>
          < div >
          <p className="text-sm font-semibold" > Total Subscription Cost </p>
            < p className = "text-xs text-muted-foreground" > { tenantModules.filter(m => m.is_active).length } active module(s) </p>
              </div>
              </div>
              < div className = "text-right" >
                <p className="text-2xl font-bold text-primary" >
                  { formatCurrency(tenantModules.filter(m => m.is_active && m.subscription_type === "monthly").reduce((s, m) => s + m.price_at_subscription, 0)) }
                  </p>
                  < p className = "text-xs text-muted-foreground" > per month </p>
                    </div>
                    </div>
                    </>
              )}
</TabsContent>

{/* Company */ }
<TabsContent value="company" className = "space-y-4 mt-0" >
  <div className="grid gap-4 md:grid-cols-2" >
    <div className="rounded-xl border bg-card overflow-hidden" >
      <div className="px-5 py-3 border-b bg-muted/30 flex items-center gap-2" >
        <Building2 className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold" > Organization </h3>
            </div>
            < div className = "p-5 space-y-4" >
              <div className="flex items-start gap-3" >
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0" >
                  <Building2 className="h-4 w-4 text-primary" />
                    </div>
                    < div >
                    <p className="text-xs text-muted-foreground" > Organization Name </p>
                      < p className = "text-sm font-semibold" > { selectedTenant.name } </p>
                        </div>
                        </div>
                        < div className = "flex items-start gap-3" >
                          <div className="h-8 w-8 rounded-lg bg-violet-500/10 flex items-center justify-center shrink-0" >
                            <CreditCard className="h-4 w-4 text-violet-500" />
                              </div>
                              < div >
                              <p className="text-xs text-muted-foreground" > Institution Code </p>
                                < code className = "text-sm font-bold font-mono" > { selectedTenant.institution_code || "Not assigned" } </code>
                                  </div>
                                  </div>
                                  < div className = "flex items-start gap-3" >
                                    <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0" >
                                      <Globe className="h-4 w-4 text-blue-500" />
                                        </div>
                                        < div >
                                        <p className="text-xs text-muted-foreground" > Subdomain </p>
                                          < p className = "text-sm font-semibold" > { selectedTenant.subdomain } </p>
                                            </div>
                                            </div>
                                            < div className = "flex items-start gap-3" >
                                              <div className="h-8 w-8 rounded-lg bg-success/10 flex items-center justify-center shrink-0" >
                                                <Calendar className="h-4 w-4 text-success" />
                                                  </div>
                                                  < div >
                                                  <p className="text-xs text-muted-foreground" > Date Created </p>
                                                    < p className = "text-sm font-semibold" > { formatDate(selectedTenant.created_at) } </p>
                                                      </div>
                                                      </div>
                                                      </div>
                                                      </div>
                                                      < div className = "rounded-xl border bg-card overflow-hidden" >
                                                        <div className="px-5 py-3 border-b bg-muted/30 flex items-center gap-2" >
                                                          <Mail className="h-4 w-4 text-primary" />
                                                            <h3 className="text-sm font-semibold" > Contact Details </h3>
                                                              </div>
                                                              < div className = "p-5 space-y-4" >
                                                                <div className="flex items-start gap-3" >
                                                                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0" >
                                                                    <Mail className="h-4 w-4 text-primary" />
                                                                      </div>
                                                                      < div >
                                                                      <p className="text-xs text-muted-foreground" > Email Address </p>
                                                                        < p className = "text-sm font-semibold" > { selectedTenant.contact_email || "Not provided" } </p>
                                                                          </div>
                                                                          </div>
                                                                          < div className = "flex items-start gap-3" >
                                                                            <div className="h-8 w-8 rounded-lg bg-success/10 flex items-center justify-center shrink-0" >
                                                                              <Phone className="h-4 w-4 text-success" />
                                                                                </div>
                                                                                < div >
                                                                                <p className="text-xs text-muted-foreground" > Phone Number </p>
                                                                                  < p className = "text-sm font-semibold" > { selectedTenant.contact_phone || "Not provided" } </p>
                                                                                    </div>
                                                                                    </div>
                                                                                    < div className = "flex items-start gap-3" >
                                                                                      <div className="h-8 w-8 rounded-lg bg-warning/10 flex items-center justify-center shrink-0" >
                                                                                        <MapPin className="h-4 w-4 text-warning" />
                                                                                          </div>
                                                                                          < div >
                                                                                          <p className="text-xs text-muted-foreground" > Location </p>
                                                                                            < p className = "text-sm font-semibold" >
                                                                                              { [selectedTenant.city, selectedTenant.state, selectedTenant.country].filter(Boolean).join(", ") || "Not provided" }
                                                                                              </p>
{
  selectedTenant.address && (
    <p className="text-xs text-muted-foreground mt-0.5" > { selectedTenant.address } </p>
                        )
}
</div>
  </div>
  </div>
  </div>
  </div>
  </TabsContent>

{/* Admin */ }
<TabsContent value="admin" className = "space-y-4 mt-0" >
  <div className="rounded-xl border bg-card overflow-hidden" >
    <div className="bg-gradient-to-r from-primary/5 to-indigo-500/5 px-5 py-4 border-b" >
      <div className="flex items-center gap-4" >
        <div className="h-14 w-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0" >
          <Users className="h-7 w-7 text-primary" />
            </div>
            < div >
            <h3 className="font-semibold text-base" > { selectedTenant.contact_name || "Admin User" } </h3>
              < p className = "text-sm text-muted-foreground" > Super Administrator </p>
                < div className = "flex items-center gap-3 mt-2 flex-wrap" >
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground" >
                    <Mail className="h-3.5 w-3.5" /> { selectedTenant.contact_email }
                      </span>
{
  selectedTenant.contact_phone && (
    <span className="flex items-center gap-1.5 text-xs text-muted-foreground" >
      <Phone className="h-3.5 w-3.5" /> { selectedTenant.contact_phone }
        </span>
                        )
}
</div>
  </div>
  </div>
  </div>
  < div className = "p-5 grid grid-cols-2 gap-4" >
    <div>
    <p className="text-xs text-muted-foreground" > Account Created </p>
      < p className = "text-sm font-semibold mt-0.5" > { formatDate(selectedTenant.created_at) } </p>
        </div>
        < div >
        <p className="text-xs text-muted-foreground" > Last Updated </p>
          < p className = "text-sm font-semibold mt-0.5" > { new Date(selectedTenant.updated_at).toLocaleString() } </p>
            </div>
            </div>
            </div>
            < div className = "rounded-xl border border-warning/30 bg-warning/5 p-5" >
              <div className="flex items-start gap-3" >
                <AlertTriangle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
                  <div className="flex-1" >
                    <p className="text-sm font-semibold mb-1" > Admin Account Actions </p>
                      < p className = "text-sm text-muted-foreground mb-4" >
                        Manage admin credentials and access for this tenant administrator account.
                    </p>
                          < div className = "flex gap-2 flex-wrap" >
                            <Button variant="outline" size = "sm" >
                              <CreditCard className="mr-2 h-3.5 w-3.5" /> Reset Password
                                </Button>
                                < Button variant = "outline" size = "sm" >
                                  <Users className="mr-2 h-3.5 w-3.5" /> Transfer Admin
                                    </Button>
                                    </div>
                                    </div>
                                    </div>
                                    </div>
                                    </TabsContent>

{/* Branding */ }
<TabsContent value="branding" className = "space-y-5 mt-0" >
  {
    selectedTenant.branding ? (
      <>
      {/* Logo section */ }
      < div className="rounded-xl border bg-card overflow-hidden" >
      <div className="px-5 py-3 border-b bg-muted/30 flex items-center gap-2">
        <ImageIcon className="h-4 w-4 text-primary" />
          < h3 className="text-sm font-semibold" > Logo </h3>
          </div>
          < div className="p-5 flex items-center gap-6" >
          <div className="flex gap-5">
            <div>
            <p className="text-xs text-muted-foreground mb-2"> Full Logo</ p >
  {(selectedTenant.logo || selectedTenant.logo_url) ? (
    <div className= "h-20 w-20 rounded-xl border bg-muted/30 flex items-center justify-center overflow-hidden" >
<img
                                src={ selectedTenant.logo || selectedTenant.logo_url || "" }
alt = "Full logo"
className = "h-full w-full object-contain p-1"
  />
  </div>
                          ) : (
  <div className= "h-20 w-20 rounded-xl border bg-muted/30 flex flex-col items-center justify-center gap-1" >
  <ImageIcon className="h-6 w-6 text-muted-foreground/40" />
    <p className="text-[10px] text-muted-foreground" > No logo </p>
      </div>
                          )}
</div>
  < div >
  <p className="text-xs text-muted-foreground mb-2" > Thumbnail </p>
{
  selectedTenant.branding.logo_thumb_url ? (
    <div className= "h-20 w-20 rounded-xl border bg-muted/30 flex items-center justify-center overflow-hidden" >
    <img
                                src={ selectedTenant.branding.logo_thumb_url }
  alt = "Logo thumbnail"
  className = "h-full w-full object-contain p-1"
    />
    </div>
                          ) : (
    <div className= "h-20 w-20 rounded-xl border bg-muted/30 flex flex-col items-center justify-center gap-1" >
    <ImageIcon className="h-6 w-6 text-muted-foreground/40" />
      <p className="text-[10px] text-muted-foreground" > No thumb </p>
        </div>
                          )
}
</div>
  </div>
  < div className = "flex-1 space-y-1" >
    {(selectedTenant.logo || selectedTenant.logo_url) && (
      <div>
      <p className="text-xs text-muted-foreground" > Full URL </p>
        < p className = "text-xs font-mono break-all text-foreground/80" > { selectedTenant.logo || selectedTenant.logo_url } </p>
          </div>
                        )}
{
  selectedTenant.branding.logo_thumb_url && (
    <div className="mt-2" >
      <p className="text-xs text-muted-foreground" > Thumb URL </p>
        < p className = "text-xs font-mono break-all text-foreground/80" > { selectedTenant.branding.logo_thumb_url } </p>
          </div>
                        )
}
</div>
  </div>
  </div>

{/* Color palette */ }
<div className="rounded-xl border bg-card overflow-hidden" >
  <div className="px-5 py-3 border-b bg-muted/30 flex items-center gap-2" >
    <Palette className="h-4 w-4 text-primary" />
      <h3 className="text-sm font-semibold" > Color Palette </h3>
        </div>
        < div className = "p-5 grid grid-cols-2 md:grid-cols-4 gap-4" >
          {
            [
              { label: "Primary", key: "primary_color" as const, hint: "Headers, nav, buttons" },
              { label: "Secondary", key: "secondary_color" as const, hint: "Icons, highlights" },
              { label: "Accent", key: "accent_color" as const, hint: "CTAs, links, active" },
              { label: "Background", key: "background_color" as const, hint: "Page background" },
                      ].map(({ label, key, hint }) => (
                <div key= { key } className = "space-y-2" >
                <div
                            className="h-16 w-full rounded-xl border shadow-sm"
                            style = {{ backgroundColor: selectedTenant.branding![key] }}
          />
          <div>
          <p className="text-xs font-semibold" > { label } </p>
            < p className = "text-[10px] text-muted-foreground" > { hint } </p>
              < div className = "flex items-center gap-1.5 mt-1" >
                <code className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded" > { selectedTenant.branding![key] } </code>
                  < button
onClick = {() => { navigator.clipboard.writeText(selectedTenant.branding![key]); showToast.success(`${label} color copied!`); }}
className = "rounded p-1 hover:bg-muted transition-colors"
title = {`Copy ${label.toLowerCase()} color`}
                              >
  <Copy className="h-3 w-3 text-muted-foreground" />
    </button>
    </div>
    </div>
    </div>
                      ))}
</div>
  </div>

{/* Live brand preview */ }
<div className="rounded-xl border overflow-hidden" >
  <div className="px-5 py-3 border-b bg-muted/30 flex items-center gap-2" >
    <Activity className="h-4 w-4 text-primary" />
      <h3 className="text-sm font-semibold" > Brand Preview </h3>
        < span className = "text-[10px] text-muted-foreground ml-auto" > How the app looks to users </span>
          </div>
          < div className = "p-4" style = {{ backgroundColor: selectedTenant.branding.background_color }}>
            <div
                        className="rounded-xl px-5 py-4 flex items-center gap-4 shadow-md"
style = {{ backgroundColor: selectedTenant.branding.primary_color }}
                      >
  <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center overflow-hidden shrink-0" >
    {(selectedTenant.logo || selectedTenant.branding.logo_thumb_url) ? (
      <img
                              src= { selectedTenant.branding.logo_thumb_url || selectedTenant.logo || "" }
                              alt = "Logo"
className = "h-full w-full object-contain"
  />
                          ) : (
  <span className= "text-white font-bold text-sm" > { selectedTenant.name.slice(0, 2).toUpperCase() } </span>
                          )}
</div>
  < div className = "flex-1 min-w-0" >
    <p className="font-bold text-white truncate" > { selectedTenant.name } </p>
      < p className = "text-xs truncate" style = {{ color: selectedTenant.branding.secondary_color }}>
        { selectedTenant.subdomain }.fynixcobanking.com
        </p>
        </div>
        < div
className = "rounded-lg px-4 py-1.5 text-xs font-bold text-white shrink-0"
style = {{ backgroundColor: selectedTenant.branding.accent_color }}
                        >
  Dashboard
  </div>
  </div>
  < div className = "mt-3 grid grid-cols-3 gap-2" >
  {
    ["Savings", "Loans", "Reports"].map((item) => (
      <div
                            key= { item }
                            className = "rounded-lg px-3 py-2 text-xs font-medium text-center"
                            style = {{ backgroundColor: selectedTenant.branding!.secondary_color + "20", color: selectedTenant.branding!.secondary_color }}
    >
    { item }
    </div>
                        ))}
</div>
  </div>
  </div>
  </>
              ) : (
  <div className= "flex flex-col items-center justify-center py-16 gap-3 rounded-xl border bg-muted/20" >
  <div className="h-14 w-14 rounded-2xl bg-muted flex items-center justify-center" >
    <Palette className="h-7 w-7 text-muted-foreground" />
      </div>
      < div className = "text-center" >
        <p className="font-medium" > No branding configured </p>
          < p className = "text-sm text-muted-foreground mt-1" > This tenant is using the default platform branding.</p>
            </div>
            < div className = "flex items-center gap-3 mt-2" >
            {
              ["#0A2540", "#00A8A8", "#4F9CF9", "#F5F7FA"].map((color) => (
                <div key= { color } className = "h-8 w-8 rounded-lg border shadow-sm" style = {{ backgroundColor: color }} title = { color } />
                    ))}
</div>
  < p className = "text-xs text-muted-foreground" > Default colors applied </p>
    </div>
              )}
</TabsContent>
  </Tabs>
  </div>

{/* Footer */ }
<div className="flex items-center justify-between gap-3 px-6 py-4 border-t bg-muted/20 rounded-b-lg" >
  <p className="text-xs text-muted-foreground" >
    { "Tenant ID: "} < code className = "font-mono" > { "#"}{ selectedTenant.id } </code>
{
  selectedTenant.institution_code && (
    <span>{ " \u00b7 Code: "} < code className = "font-mono font-semibold" > { selectedTenant.institution_code } < /code></span >
    )
}
</p>
  < div className = "flex gap-2" >
    <Button variant="outline" size = "sm" onClick = {() => setIsDetailsDialogOpen(false)}> Close </Button>
      < Button variant = "outline" size = "sm" onClick = {() => { setIsDetailsDialogOpen(false); navigate(`/tenants/${selectedTenant.id}/dashboard`); }}>
        <BarChart3 className="mr-2 h-3.5 w-3.5" /> View Dashboard
          </Button>
          < Button size = "sm" onClick = {() => { setIsDetailsDialogOpen(false); openManageModulesDialog(selectedTenant); }}>
            <Plus className="mr-2 h-3.5 w-3.5" /> Manage Modules
              </Button>
              </div>
              </div>
              </>
    )}
</DialogContent>
  </Dialog>

{/* Add Modules Dialog */ }
<Dialog open={ isManageModulesDialogOpen } onOpenChange = { setIsManageModulesDialogOpen } >
  <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" >
    <DialogHeader>
    <DialogTitle>Add Modules to Tenant </DialogTitle>
      <DialogDescription>
                                Select additional modules to add to { selectedTenant?.name }
</DialogDescription>
  </DialogHeader>

  < div className = "space-y-6 py-4" >
    {/* Subscription Type Selector */ }
    < div className = "space-y-3" >
      <Label>Subscription Type </Label>
        < Select
value = { addModuleSubscriptionType }
onValueChange = {(value: "monthly" | "yearly") =>
setAddModuleSubscriptionType(value)
                                    }
                                >
  <SelectTrigger>
  <SelectValue />
  </SelectTrigger>
  < SelectContent >
  <SelectItem value="monthly" > Monthly Billing </SelectItem>
    < SelectItem value = "yearly" >
      Yearly Billing(Save 17 %)
        </SelectItem>
        </SelectContent>
        </Select>
        </div>

{/* Available Modules List */ }
<div className="space-y-3" >
  <Label>Available Modules </Label>
{
  availableModules.length === 0 ? (
    <div className= "text-center py-8 border rounded-lg" >
    <Package className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
      <p className="text-sm text-muted-foreground" >
        Loading available modules...
  </p>
    </div>
                                ) : (
    <div className= "grid gap-3" >
    {
      availableModules
                                            .filter(
        (module) =>
          !tenantModules.some((tm) => tm.module_id === module.id)
      )
        .map((module) => {
          const isSelected = modulesToAdd.includes(module.id);
          const price =
            addModuleSubscriptionType === "yearly"
              ? module.yearly_price
              : module.monthly_price;

          return (
            <div
                                                        key= { module.id }
          className = {`rounded-lg border p-4 cursor-pointer transition-colors ${isSelected
            ? "border-primary bg-primary/5"
            : "hover:border-primary/50"
            }`
        }
                                                        onClick = {() => {
          setModulesToAdd((prev) =>
          prev.includes(module.id)
            ? prev.filter((id) => id !== module.id)
            : [...prev, module.id]
        );
    }
}
                                                    >
  <div className="flex items-start gap-4" >
    <Checkbox
                                                                checked={ isSelected }
onCheckedChange = {() => {
  setModulesToAdd((prev) =>
    prev.includes(module.id)
      ? prev.filter((id) => id !== module.id)
      : [...prev, module.id]
  );
}}
onClick = {(e) => e.stopPropagation()}
                                                            />
  < div className = "flex-1" >
    <div className="flex items-center justify-between mb-2" >
      <div className="flex items-center gap-2" >
        <Package className="h-5 w-5 text-primary" />
          <h4 className="font-semibold" > { module.name } </h4>
            </div>
            < div className = "text-right" >
              <p className="text-lg font-bold text-primary" >
                { formatCurrency(price) }
                </p>
                < p className = "text-xs text-muted-foreground" >
                  per { addModuleSubscriptionType === "yearly" ? "year" : "month" }
</p>
  </div>
  </div>
{
  module.description && (
    <p className="text-sm text-muted-foreground" >
      { module.description }
      </p>
                                                                )
}
{
  addModuleSubscriptionType === "yearly" && (
    <Badge variant="secondary" className = "mt-2" >
      Save {
    formatCurrency(
      module.monthly_price * 12 - module.yearly_price
    )
  } { " " }
  annually
    </Badge>
                                                                )
}
</div>
  </div>
  </div>
                                                );
                                            })}

{/* No modules available message */ }
{
  availableModules.filter(
    (module) =>
      !tenantModules.some((tm) => tm.module_id === module.id)
  ).length === 0 && (
      <div className="text-center py-8 border rounded-lg" >
        <CheckCircle2 className="h-12 w-12 mx-auto mb-2 text-success" />
          <p className="text-sm text-muted-foreground" >
            All available modules are already subscribed
              </p>
              </div>
                                        )
}
</div>
                                )}
</div>

{/* Cost Summary */ }
{
  modulesToAdd.length > 0 && (
    <div className="rounded-lg border bg-accent/50 p-4" >
      <div className="flex justify-between items-center mb-3" >
        <p className="font-semibold" > New Modules Summary </p>
          < Badge > { modulesToAdd.length } selected </Badge>
            </div>
            < div className = "space-y-2" >
            {
              modulesToAdd.map((moduleId) => {
                const module = availableModules.find((m) => m.id === moduleId);
                if (!module) return null;
                const price =
                  addModuleSubscriptionType === "yearly"
                    ? module.yearly_price
                    : module.monthly_price;
                return (
                  <div
                                                    key= { moduleId }
                className = "flex justify-between text-sm"
                  >
                  <span>{ module.name } </span>
                  < span className = "font-medium" >
                    { formatCurrency(price) }
                    </span>
                    </div>
                                            );
            })
}
<div className="border-t pt-2 mt-2" >
  <div className="flex justify-between items-center" >
    <div>
    <p className="font-semibold" > Additional Cost </p>
      < p className = "text-xs text-muted-foreground" >
        per { addModuleSubscriptionType === "yearly" ? "year" : "month" }
</p>
  </div>
  < p className = "text-xl font-bold text-primary" >
  {
    formatCurrency(
      modulesToAdd.reduce((sum, moduleId) => {
        const module = availableModules.find(
          (m) => m.id === moduleId
        );
        if (!module) return sum;
        return (
          sum +
          (addModuleSubscriptionType === "yearly"
            ? module.yearly_price
            : module.monthly_price)
        );
      }, 0)
                                                    )
  }
    </p>
    </div>
    </div>
    </div>
    </div>
                            )}
</div>

  < DialogFooter >
  <Button
                                variant="outline"
onClick = {() => {
  setIsManageModulesDialogOpen(false);
  setModulesToAdd([]);
}}
                            >
  Cancel
  </Button>
  < Button
onClick = { handleAddModulesToTenant }
disabled = { modulesToAdd.length === 0 }
  >
  <Plus className="mr-2 h-4 w-4" />
    Add { modulesToAdd.length } Module{ modulesToAdd.length !== 1 ? "s" : "" }
</Button>
  </DialogFooter>
  </DialogContent>
  </Dialog>

  </DashboardLayout>
  );
}



