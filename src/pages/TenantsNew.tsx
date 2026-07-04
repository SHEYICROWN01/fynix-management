import { useState, useEffect, useMemo } from "react";
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
  ChevronDown,
  ChevronUp,
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
  ShieldOff,
  ShieldAlert,
  Ban,
  UserCheck,
} from "lucide-react";

// ─── Suspension reason categories ─────────────────────────────────────────────
const SUSPEND_CATEGORIES = [
  {
    value: "Payment Overdue",
    icon: CreditCard,
    colorClass: "text-amber-600",
    borderActive: "border-amber-400 bg-amber-50 dark:bg-amber-950/30",
    borderIdle: "border-border hover:border-amber-300",
    desc: "Unpaid invoices beyond due date",
  },
  {
    value: "Policy Violation",
    icon: AlertTriangle,
    colorClass: "text-orange-600",
    borderActive: "border-orange-400 bg-orange-50 dark:bg-orange-950/30",
    borderIdle: "border-border hover:border-orange-300",
    desc: "Terms of service breach",
  },
  {
    value: "Security Concern",
    icon: ShieldAlert,
    colorClass: "text-red-600",
    borderActive: "border-red-400 bg-red-50 dark:bg-red-950/30",
    borderIdle: "border-border hover:border-red-300",
    desc: "Suspicious activity detected",
  },
  {
    value: "Under Review",
    icon: Eye,
    colorClass: "text-blue-600",
    borderActive: "border-blue-400 bg-blue-50 dark:bg-blue-950/30",
    borderIdle: "border-border hover:border-blue-300",
    desc: "Account under investigation",
  },
  {
    value: "Other",
    icon: MoreHorizontal,
    colorClass: "text-muted-foreground",
    borderActive: "border-primary bg-primary/5",
    borderIdle: "border-border hover:border-primary/40",
    desc: "Custom reason specified below",
  },
];

export default function TenantsNew() {
  // API Data State
  const navigate = useNavigate();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [isLoadingTenants, setIsLoadingTenants] = useState(true);
  const [pagination, setPagination] = useState({
    total: 0,
    per_page: 10,
    current_page: 1,
    last_page: 1,
    from: 0,
    to: 0,
  });

  // UI State
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isCredentialsDialogOpen, setIsCredentialsDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [isSuspendDialogOpen, setIsSuspendDialogOpen] = useState(false);
  const [isReactivateDialogOpen, setIsReactivateDialogOpen] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [creationStep, setCreationStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string[]>>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Danger zone toggle (Details dialog)
  const [dangerZoneOpen, setDangerZoneOpen] = useState(false);

  // Suspension State
  const [suspendCategory, setSuspendCategory] = useState("");
  const [suspendDetails, setSuspendDetails] = useState("");
  const [suspendConfirmed, setSuspendConfirmed] = useState(false);
  const [isProcessingSuspend, setIsProcessingSuspend] = useState(false);
  const [reactivateNotes, setReactivateNotes] = useState("");

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

  // Suspend tenant
  const handleSuspendTenant = async () => {
    if (!selectedTenant || !suspendCategory) return;
    setIsProcessingSuspend(true);
    try {
      const reason = suspendDetails.trim()
        ? `${suspendCategory}: ${suspendDetails.trim()}`
        : suspendCategory;
      await api.suspendTenant(selectedTenant.id, reason);
      showToast.success(`${selectedTenant.name} has been suspended`, {
        description: "All system access has been revoked immediately.",
      });
      const updated = { ...selectedTenant, status: "suspended" as const, suspension_reason: reason, suspended_at: new Date().toISOString() };
      setTenants((prev) => prev.map((t) => (t.id === selectedTenant.id ? updated : t)));
      setSelectedTenant(updated);
      setIsSuspendDialogOpen(false);
      setSuspendCategory("");
      setSuspendDetails("");
      setSuspendConfirmed(false);
    } catch (error: unknown) {
      const apiErr = error as ApiError;
      showToast.error("Failed to suspend tenant", { description: apiErr.message });
    } finally {
      setIsProcessingSuspend(false);
    }
  };

  // Reactivate tenant
  const handleReactivateTenant = async () => {
    if (!selectedTenant) return;
    setIsProcessingSuspend(true);
    try {
      await api.reactivateTenant(selectedTenant.id);
      showToast.success(`${selectedTenant.name} has been reactivated`, {
        description: "Full system access has been restored.",
      });
      const updated = { ...selectedTenant, status: "active" as const, suspension_reason: null, suspended_at: undefined };
      setTenants((prev) => prev.map((t) => (t.id === selectedTenant.id ? updated : t)));
      setSelectedTenant(updated);
      setIsReactivateDialogOpen(false);
      setReactivateNotes("");
    } catch (error: unknown) {
      const apiErr = error as ApiError;
      showToast.error("Failed to reactivate tenant", { description: apiErr.message });
    } finally {
      setIsProcessingSuspend(false);
    }
  };

  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedRows, setSelectedRows] = useState<number[]>([]);

  const filteredTenants = useMemo(() => {
    if (statusFilter === "all") return tenants;
    return tenants.filter((t) => t.status === statusFilter);
  }, [tenants, statusFilter]);

  return (
    <DashboardLayout title="Institutions">
      {/* ── Main content ─────────────────────────────────────────────────── */}
      <div className="space-y-5">

        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-widest font-medium text-muted-foreground/70">
              QuovaTech BOC · Institutions
            </p>
            <h1 className="text-2xl font-bold tracking-tight text-foreground mt-0.5">
              Tenants Management
            </h1>
            <p className="text-[13px] text-muted-foreground mt-0.5">
              {pagination.total} institution{pagination.total !== 1 ? "s" : ""} · {tenants.filter((t) => t.status === "active").length} active
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-1.5">
              <Download className="h-3.5 w-3.5" />
              Export
            </Button>
            <Button size="sm" className="gap-1.5" onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-3.5 w-3.5" />
              New Tenant
            </Button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          {/* Total */}
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                <Building2 className="h-4 w-4 text-primary" />
              </div>
              <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                <TrendingUp className="h-3 w-3" />
                All
              </span>
            </div>
            <p className="text-[28px] font-bold tracking-tight text-foreground leading-none">{pagination.total}</p>
            <p className="text-[12px] text-muted-foreground mt-1">Total Tenants</p>
            <div className="flex items-end gap-0.5 mt-3 h-7">
              {[3,5,4,7,6,9,8,10,9,12].map((v, i) => (
                <div key={i} className="flex-1 rounded-sm bg-primary/20 dark:bg-primary/30" style={{ height: `${v * 8}%` }} />
              ))}
            </div>
          </div>

          {/* Active */}
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">Active</span>
            </div>
            <p className="text-[28px] font-bold tracking-tight text-foreground leading-none">{tenants.filter((t) => t.status === "active").length}</p>
            <p className="text-[12px] text-muted-foreground mt-1">Active Institutions</p>
            <div className="flex items-end gap-0.5 mt-3 h-7">
              {[4,6,5,8,7,9,8,11,10,12].map((v, i) => (
                <div key={i} className="flex-1 rounded-sm bg-emerald-500/20 dark:bg-emerald-500/30" style={{ height: `${v * 8}%` }} />
              ))}
            </div>
          </div>

          {/* Suspended */}
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10">
                <ShieldOff className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              </div>
              <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400">Suspended</span>
            </div>
            <p className="text-[28px] font-bold tracking-tight text-foreground leading-none">{tenants.filter((t) => t.status === "suspended").length}</p>
            <p className="text-[12px] text-muted-foreground mt-1">Suspended Tenants</p>
            <div className="flex items-end gap-0.5 mt-3 h-7">
              {[2,3,2,4,3,2,4,3,2,1].map((v, i) => (
                <div key={i} className="flex-1 rounded-sm bg-amber-500/20 dark:bg-amber-500/30" style={{ height: `${v * 15}%` }} />
              ))}
            </div>
          </div>

          {/* Cancelled */}
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-rose-500/10">
                <XCircle className="h-4 w-4 text-rose-600 dark:text-rose-400" />
              </div>
              <span className="text-[11px] font-semibold text-rose-600 dark:text-rose-400">Cancelled</span>
            </div>
            <p className="text-[28px] font-bold tracking-tight text-foreground leading-none">{tenants.filter((t) => t.status === "cancelled").length}</p>
            <p className="text-[12px] text-muted-foreground mt-1">Cancelled Tenants</p>
            <div className="flex items-end gap-0.5 mt-3 h-7">
              {[1,2,1,3,2,1,2,1,2,1].map((v, i) => (
                <div key={i} className="flex-1 rounded-sm bg-rose-500/20 dark:bg-rose-500/30" style={{ height: `${v * 18}%` }} />
              ))}
            </div>
          </div>
        </div>

        {/* Filter Tabs + Search */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* Tab pills */}
          <div className="flex items-center gap-1 rounded-lg bg-muted/60 border border-border p-1">
            {[
              { value: "all", label: "All", count: pagination.total },
              { value: "active", label: "Active", count: tenants.filter((t) => t.status === "active").length },
              { value: "pending", label: "Pending", count: tenants.filter((t) => t.status === "pending").length },
              { value: "suspended", label: "Suspended", count: tenants.filter((t) => t.status === "suspended").length },
              { value: "cancelled", label: "Cancelled", count: tenants.filter((t) => t.status === "cancelled").length },
            ].map((tab) => (
              <button
                key={tab.value}
                onClick={() => setStatusFilter(tab.value)}
                className={[
                  "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[12px] font-medium transition-all whitespace-nowrap",
                  statusFilter === tab.value
                    ? "bg-card shadow-sm text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                ].join(" ")}
              >
                {tab.label}
                {tab.count > 0 && (
                  <span className={[
                    "rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 text-[10px] font-bold",
                    statusFilter === tab.value
                      ? "bg-primary/10 text-primary"
                      : "bg-muted-foreground/10 text-muted-foreground",
                  ].join(" ")}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Search + Refresh */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search institutions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 text-[13px] w-56"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchTenants(pagination.current_page, searchQuery)}
              disabled={isLoadingTenants}
              className="h-9 w-9 p-0"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoadingTenants ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="w-10 pl-4 py-3">
                    <Checkbox
                      checked={selectedRows.length === filteredTenants.length && filteredTenants.length > 0}
                      onCheckedChange={(v) =>
                        setSelectedRows(!!v ? filteredTenants.map((t) => t.id) : [])
                      }
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Organization
                  </th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Subdomain
                  </th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Contact
                  </th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Location
                  </th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Created
                  </th>
                  <th className="px-4 py-3 w-48" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isLoadingTenants ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-16 text-center">
                      <Loader2 className="h-7 w-7 animate-spin mx-auto text-primary" />
                      <p className="text-[13px] text-muted-foreground mt-2">Loading institutions...</p>
                    </td>
                  </tr>
                ) : filteredTenants.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-16 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                          <Building2 className="h-7 w-7 text-muted-foreground/50" />
                        </div>
                        <p className="font-medium text-foreground">No institutions found</p>
                        <p className="text-[13px] text-muted-foreground">
                          {searchQuery
                            ? "Try adjusting your search or filter"
                            : statusFilter !== "all"
                            ? `No ${statusFilter} tenants at this time`
                            : "Get started by creating your first tenant"}
                        </p>
                        {!searchQuery && statusFilter === "all" && (
                          <Button size="sm" className="mt-2 gap-1.5" onClick={() => setIsCreateDialogOpen(true)}>
                            <Plus className="h-3.5 w-3.5" />
                            New Tenant
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredTenants.map((tenant) => (
                    <tr
                      key={tenant.id}
                      className={[
                        "group transition-colors hover:bg-muted/40",
                        selectedRows.includes(tenant.id) ? "bg-primary/5" : "",
                      ].join(" ")}
                    >
                      {/* Checkbox */}
                      <td className="pl-4 py-3.5">
                        <Checkbox
                          checked={selectedRows.includes(tenant.id)}
                          onCheckedChange={(v) =>
                            setSelectedRows((prev) =>
                              !!v ? [...prev, tenant.id] : prev.filter((id) => id !== tenant.id)
                            )
                          }
                        />
                      </td>

                      {/* Organization */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-[13px] font-bold text-primary uppercase">
                            {tenant.name.slice(0, 2)}
                          </div>
                          <div>
                            <p className="text-[13px] font-semibold text-foreground leading-tight">{tenant.name}</p>
                            <p className="text-[11px] text-muted-foreground">{tenant.slug}</p>
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5">
                        <div>
                          <StatusBadge status={tenant.status} />
                          {tenant.status === "suspended" && tenant.suspension_reason && (
                            <p className="text-[10px] text-amber-600 mt-0.5 max-w-[130px] truncate" title={tenant.suspension_reason}>
                              {tenant.suspension_reason}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Subdomain */}
                      <td className="px-4 py-3.5">
                        <code className="text-[11px] font-mono bg-muted px-2 py-1 rounded-md border border-border/60">
                          {tenant.subdomain}
                        </code>
                      </td>

                      {/* Contact */}
                      <td className="px-4 py-3.5">
                        <div>
                          <p className="text-[12px] text-foreground">{tenant.contact_email}</p>
                          {tenant.contact_phone && (
                            <p className="text-[11px] text-muted-foreground">{tenant.contact_phone}</p>
                          )}
                        </div>
                      </td>

                      {/* Location */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="h-3 w-3 text-muted-foreground/60 shrink-0" />
                          <span className="text-[12px] text-foreground">{tenant.country}</span>
                        </div>
                      </td>

                      {/* Created */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3 w-3 text-muted-foreground/60 shrink-0" />
                          <span className="text-[12px] text-muted-foreground">{formatDate(tenant.created_at)}</span>
                        </div>
                      </td>

                      {/* Actions — inline icon buttons, no dropdown */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center justify-end gap-0.5 opacity-0 group-hover:opacity-100 transition-all duration-150">

                          {/* View Details */}
                          <button
                            title="View Details"
                            onClick={() => {
                              setSelectedTenant(tenant);
                              fetchTenantModules(tenant.id);
                              setDangerZoneOpen(false);
                              setIsDetailsDialogOpen(true);
                            }}
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                          >
                            <Eye className="h-[15px] w-[15px]" />
                          </button>

                          {/* Dashboard */}
                          <button
                            title="View Dashboard"
                            onClick={() => navigate(`/tenants/${tenant.id}/dashboard`)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                          >
                            <BarChart3 className="h-[15px] w-[15px]" />
                          </button>

                          {/* Manage Modules */}
                          <button
                            title="Manage Modules"
                            onClick={() => openManageModulesDialog(tenant)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                          >
                            <Package className="h-[15px] w-[15px]" />
                          </button>

                          {/* Divider */}
                          <span className="mx-1 h-4 w-px bg-border" />

                          {/* Reactivate — only shown when suspended (safe action, quick access) */}
                          {tenant.status === "suspended" ? (
                            <button
                              title="Reactivate Tenant"
                              onClick={() => {
                                setSelectedTenant(tenant);
                                setIsReactivateDialogOpen(true);
                              }}
                              className="flex h-8 items-center gap-1.5 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-2.5 text-[11px] font-semibold text-emerald-600 hover:bg-emerald-500/20 transition-colors dark:text-emerald-400"
                            >
                              <UserCheck className="h-3.5 w-3.5" />
                              Reactivate
                            </button>
                          ) : (
                            /* Open full detail — primary CTA */
                            <button
                              title="Open Tenant"
                              onClick={() => {
                                setSelectedTenant(tenant);
                                fetchTenantModules(tenant.id);
                                setDangerZoneOpen(false);
                                setIsDetailsDialogOpen(true);
                              }}
                              className="flex h-8 items-center gap-1 rounded-lg bg-primary/10 border border-primary/20 px-2.5 text-[11px] font-semibold text-primary hover:bg-primary/15 transition-colors"
                            >
                              Open
                              <ArrowRight className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {!isLoadingTenants && filteredTenants.length > 0 && (
            <div className="flex items-center justify-between border-t border-border px-4 py-3 bg-muted/20">
              <p className="text-[12px] text-muted-foreground">
                Showing{" "}
                <span className="font-medium text-foreground">{pagination.from || 0}</span>
                {" "}–{" "}
                <span className="font-medium text-foreground">{pagination.to || 0}</span>
                {" "}of{" "}
                <span className="font-medium text-foreground">{pagination.total}</span>
                {" "}institutions
              </p>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1.5"
                  onClick={() => fetchTenants(pagination.current_page - 1, searchQuery)}
                  disabled={pagination.current_page === 1}
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Prev
                </Button>
                <span className="px-3 text-[12px] text-muted-foreground">
                  {pagination.current_page} / {pagination.last_page}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1.5"
                  onClick={() => fetchTenants(pagination.current_page + 1, searchQuery)}
                  disabled={pagination.current_page === pagination.last_page}
                >
                  Next
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}
        </div>

      </div>
      {/* ── Dialogs follow below (unchanged) ────────────────────────────── */}

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
<Dialog open={isDetailsDialogOpen} onOpenChange={(open) => { setIsDetailsDialogOpen(open); if (!open) setDangerZoneOpen(false); }}>
  <DialogContent className="max-w-5xl max-h-[92vh] overflow-y-auto p-0 gap-0" aria-describedby={undefined}>
    <DialogTitle className="sr-only">{selectedTenant ? `${selectedTenant.name} — Tenant Details` : "Tenant Details"}</DialogTitle>
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
    {"Tenant ID: "}<code className="font-mono">{"#"}{selectedTenant.id}</code>
{
  selectedTenant.institution_code && (
    <span>{" \u00b7 Code: "}<code className="font-mono font-semibold">{selectedTenant.institution_code}</code></span>
    )
}
</p>
  {/* ── Danger Zone ─────────────────────────────────────────────── */}
  <div className="mt-4 rounded-xl border-2 border-dashed border-destructive/25 overflow-hidden">
    <button
      type="button"
      onClick={() => setDangerZoneOpen((p) => !p)}
      className="w-full flex items-center justify-between px-4 py-3 hover:bg-destructive/5 transition-colors group/dz"
    >
      <div className="flex items-center gap-2.5">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-destructive/10">
          <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
        </div>
        <div className="text-left">
          <p className="text-[12px] font-bold text-destructive leading-tight">Sensitive Operations</p>
          <p className="text-[10px] text-destructive/60 leading-tight">Account suspension · irreversible effects</p>
        </div>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="text-[10px] uppercase tracking-widest text-destructive/50 font-semibold">
          {dangerZoneOpen ? "Lock" : "Unlock"}
        </span>
        {dangerZoneOpen
          ? <ChevronUp className="h-4 w-4 text-destructive/40" />
          : <ChevronDown className="h-4 w-4 text-destructive/40" />}
      </div>
    </button>

    {dangerZoneOpen && (
      <div className="border-t border-destructive/20 bg-destructive/[0.03] px-4 py-4 space-y-3">
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          These actions take effect immediately and cannot be undone from this screen.
          Only proceed if you have verified the reason and have authority to act.
        </p>

        {selectedTenant.status === "suspended" ? (
          <div className="flex items-center justify-between gap-4 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-4 py-3">
            <div>
              <p className="text-[13px] font-semibold text-foreground">Reactivate Tenant</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Restore full system access for all users</p>
            </div>
            <Button
              size="sm"
              className="shrink-0 bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
              onClick={() => {
                setIsDetailsDialogOpen(false);
                setDangerZoneOpen(false);
                setIsReactivateDialogOpen(true);
              }}
            >
              <UserCheck className="h-3.5 w-3.5" />
              Reactivate
            </Button>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-4 rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3">
            <div>
              <p className="text-[13px] font-semibold text-destructive">Suspend Tenant</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Immediately revoke all logins, sessions & API tokens</p>
            </div>
            <Button
              size="sm"
              variant="destructive"
              className="shrink-0 gap-1.5"
              onClick={() => {
                setIsDetailsDialogOpen(false);
                setDangerZoneOpen(false);
                setIsSuspendDialogOpen(true);
              }}
            >
              <Ban className="h-3.5 w-3.5" />
              Suspend
            </Button>
          </div>
        )}
      </div>
    )}
  </div>

  < div className = "flex gap-2 mt-4" >
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


{/* ── Suspend Tenant Dialog ───────────────────────────────────────────── */}
<Dialog
  open={isSuspendDialogOpen}
  onOpenChange={(open) => {
    if (!open) {
      setSuspendCategory("");
      setSuspendDetails("");
      setSuspendConfirmed(false);
    }
    setIsSuspendDialogOpen(open);
  }}
>
  <DialogContent className="w-[calc(100vw-2rem)] max-w-lg p-0 overflow-hidden gap-0 max-h-[90vh] flex flex-col">
    <div className="bg-gradient-to-br from-red-600 via-rose-600 to-orange-600 px-5 pt-5 pb-4 shrink-0">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 backdrop-blur border border-white/20 shadow-lg shrink-0">
          <Ban className="h-5 w-5 text-white" />
        </div>
        <div className="min-w-0">
          <DialogTitle className="text-base font-bold text-white leading-tight">
            Suspend Tenant Account
          </DialogTitle>
          <p className="text-xs text-white/70 mt-0.5 truncate">{selectedTenant?.name}</p>
        </div>
      </div>
    </div>
    <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">
      <div className="rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800 px-3 py-2.5">
        <div className="flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-xs font-semibold text-amber-800 dark:text-amber-300 mb-1">
              Immediate effect upon suspension
            </p>
            <div className="grid grid-cols-2 gap-x-3 gap-y-0.5">
              {[
                "Admin & staff logins blocked",
                "Active sessions terminated",
                "Member portal access cut",
                "All API tokens revoked",
              ].map((item) => (
                <p key={item} className="flex items-center gap-1 text-[11px] text-amber-700 dark:text-amber-400">
                  <X className="h-2.5 w-2.5 shrink-0" /> {item}
                </p>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div>
        <p className="text-sm font-semibold mb-2">
          Reason for suspension <span className="text-destructive">*</span>
        </p>
        <div className="grid grid-cols-2 gap-2">
          {SUSPEND_CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isSelected = suspendCategory === cat.value;
            return (
              <button
                key={cat.value}
                type="button"
                onClick={() => setSuspendCategory(cat.value)}
                className={`flex flex-col items-start gap-1 rounded-xl border px-3 py-2.5 text-left transition-all ${
                  isSelected ? cat.borderActive : cat.borderIdle
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <Icon className={`h-4 w-4 ${isSelected ? cat.colorClass : "text-muted-foreground"}`} />
                  {isSelected && <Check className={`h-3.5 w-3.5 ${cat.colorClass}`} />}
                </div>
                <p className={`text-xs font-semibold leading-tight ${isSelected ? cat.colorClass : "text-foreground"}`}>
                  {cat.value}
                </p>
                <p className="text-[10px] text-muted-foreground leading-tight">{cat.desc}</p>
              </button>
            );
          })}
        </div>
      </div>
      <div>
        <label className="text-sm font-semibold block mb-1.5">
          Additional details <span className="text-muted-foreground font-normal">(optional)</span>
        </label>
        <textarea
          rows={2}
          value={suspendDetails}
          onChange={(e) => setSuspendDetails(e.target.value)}
          placeholder={`e.g., "Invoice #INV-2024-041 (₦70,000) unpaid after 2 billing cycles."`}
          className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-destructive/30 focus:border-destructive resize-none"
        />
      </div>
      <label className="flex items-start gap-3 cursor-pointer group select-none">
        <Checkbox
          checked={suspendConfirmed}
          onCheckedChange={(v) => setSuspendConfirmed(!!v)}
          className="mt-0.5 border-destructive data-[state=checked]:bg-destructive data-[state=checked]:border-destructive shrink-0"
        />
        <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors leading-relaxed">
          I confirm that <span className="font-semibold text-foreground">{selectedTenant?.name}</span> will be
          suspended immediately and all access revoked.
        </span>
      </label>
    </div>
    <div className="border-t px-5 py-4 flex flex-col-reverse sm:flex-row gap-2 shrink-0">
      <Button
        variant="outline"
        onClick={() => setIsSuspendDialogOpen(false)}
        disabled={isProcessingSuspend}
        className="flex-1 sm:flex-none"
      >
        Cancel
      </Button>
      <Button
        onClick={handleSuspendTenant}
        disabled={!suspendCategory || !suspendConfirmed || isProcessingSuspend}
        className="flex-1 sm:flex-none bg-destructive hover:bg-destructive/90 text-destructive-foreground"
      >
        {isProcessingSuspend ? (
          <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Suspending...</>
        ) : (
          <><Ban className="mr-2 h-4 w-4" /> Suspend Account</>
        )}
      </Button>
    </div>
  </DialogContent>
</Dialog>

{/* ── Reactivate Tenant Dialog ──────────────────────────────────────────── */}
<Dialog
  open={isReactivateDialogOpen}
  onOpenChange={(open) => {
    if (!open) setReactivateNotes("");
    setIsReactivateDialogOpen(open);
  }}
>
  <DialogContent className="w-[calc(100vw-2rem)] max-w-md p-0 overflow-hidden gap-0 max-h-[90vh] flex flex-col">
    <div className="bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 px-5 pt-5 pb-4 shrink-0">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 backdrop-blur border border-white/20 shadow-lg shrink-0">
          <UserCheck className="h-5 w-5 text-white" />
        </div>
        <div className="min-w-0">
          <DialogTitle className="text-base font-bold text-white leading-tight">
            Reactivate Tenant Access
          </DialogTitle>
          <p className="text-xs text-white/70 mt-0.5 truncate">{selectedTenant?.name}</p>
        </div>
      </div>
    </div>
    <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">
      {selectedTenant?.suspension_reason && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800 px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-1">
            Previously suspended for
          </p>
          <p className="text-sm text-amber-800 dark:text-amber-300 font-medium">
            {selectedTenant.suspension_reason}
          </p>
          {selectedTenant.suspended_at && (
            <p className="text-xs text-amber-600/70 mt-1">
              Since {formatDate(selectedTenant.suspended_at)}
            </p>
          )}
        </div>
      )}
      <div className="rounded-xl border bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 px-4 py-3">
        <div className="flex items-start gap-2.5">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300 mb-1">
              Access restored upon reactivation
            </p>
            <div className="space-y-0.5 text-xs text-emerald-700 dark:text-emerald-400">
              {["Admin panel login enabled", "Staff and member access restored", "All subscribed modules resume"].map((item) => (
                <p key={item} className="flex items-center gap-1.5">
                  <Check className="h-3 w-3 shrink-0" /> {item}
                </p>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div>
        <label className="text-sm font-semibold block mb-1.5">
          Resolution notes <span className="text-muted-foreground font-normal">(optional)</span>
        </label>
        <textarea
          rows={3}
          value={reactivateNotes}
          onChange={(e) => setReactivateNotes(e.target.value)}
          placeholder="e.g., 'Outstanding invoice of ₦70,000 cleared on 28 Jun 2026.'"
          className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 resize-none"
        />
      </div>
    </div>
    <div className="border-t px-5 py-4 flex flex-col-reverse sm:flex-row gap-2 shrink-0">
      <Button
        variant="outline"
        onClick={() => setIsReactivateDialogOpen(false)}
        disabled={isProcessingSuspend}
        className="flex-1 sm:flex-none"
      >
        Cancel
      </Button>
      <Button
        onClick={handleReactivateTenant}
        disabled={isProcessingSuspend}
        className="flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-700 text-white"
      >
        {isProcessingSuspend ? (
          <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Reactivating...</>
        ) : (
          <><UserCheck className="mr-2 h-4 w-4" /> Reactivate Access</>
        )}
      </Button>
    </div>
  </DialogContent>
</Dialog>

  </DashboardLayout>
  );
}



