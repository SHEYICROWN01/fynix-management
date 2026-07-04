import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast as showToast } from "sonner";
import { api, type Module, type CreateModuleData } from "@/lib/api";
import { getErrorMessage } from "@/lib/utils";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Package,
  DollarSign,
  CheckCircle2,
  XCircle,
  Loader2,
  Save,
  Power,
  RefreshCw,
} from "lucide-react";

export default function Modules() {
  const [modules, setModules] = useState<Module[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState<CreateModuleData>({
    name: "",
    description: "",
    monthly_price: 0,
    yearly_price: 0,
    is_active: true,
  });

  const fetchModules = async () => {
    setIsLoading(true);
    try {
      const response = await api.listModules({ search: searchQuery || undefined, per_page: 100 });
      const raw = response as any;
      const modulesArray: Module[] = Array.isArray(raw.data)
        ? raw.data
        : Array.isArray(raw.data?.data)
        ? raw.data.data
        : [];
      setModules(modulesArray);
    } catch (error: unknown) {
      showToast.error(getErrorMessage(error) || "Failed to load modules");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchModules(); }, []);

  const handleCreateModule = async () => {
    if (!formData.name || !formData.description) { showToast.error("Please fill in all required fields"); return; }
    if (formData.monthly_price <= 0 || formData.yearly_price <= 0) { showToast.error("Prices must be greater than 0"); return; }
    if (formData.yearly_price >= formData.monthly_price * 12) { showToast.error("Yearly price must be less than monthly price × 12"); return; }
    setIsSaving(true);
    try {
      const response = await api.createModule(formData);
      showToast.success(response.message || "Module created successfully");
      setIsCreateDialogOpen(false);
      resetForm();
      fetchModules();
    } catch (error: unknown) {
      showToast.error(getErrorMessage(error) || "Failed to create module");
    } finally { setIsSaving(false); }
  };

  const handleUpdateModule = async () => {
    if (!selectedModule) return;
    setIsSaving(true);
    try {
      const response = await api.updateModule(selectedModule.id, formData);
      showToast.success(response.message || "Module updated successfully");
      setIsEditDialogOpen(false);
      setSelectedModule(null);
      resetForm();
      fetchModules();
    } catch (error: unknown) {
      showToast.error(getErrorMessage(error) || "Failed to update module");
    } finally { setIsSaving(false); }
  };

  const handleDeleteModule = async (module: Module) => {
    if (!confirm(`Delete "${module.name}" module?`)) return;
    try {
      const response = await api.deleteModule(module.id);
      showToast.success(response.message || "Module deleted");
      fetchModules();
    } catch (error: unknown) {
      showToast.error(getErrorMessage(error) || "Failed to delete module");
    }
  };

  const handleToggleStatus = async (module: Module) => {
    try {
      const response = await api.toggleModuleStatus(module.id);
      showToast.success(response.message || `Module ${!module.is_active ? "activated" : "deactivated"}`);
      fetchModules();
    } catch (error: unknown) {
      showToast.error(getErrorMessage(error) || "Failed to update module status");
    }
  };

  const openEditDialog = (module: Module) => {
    setSelectedModule(module);
    setFormData({ name: module.name, description: module.description, monthly_price: module.monthly_price, yearly_price: module.yearly_price, is_active: module.is_active });
    setIsEditDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({ name: "", description: "", monthly_price: 0, yearly_price: 0, is_active: true });
  };

  const filteredModules = modules.filter((m) =>
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const fmt = (amount: number) =>
    new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", minimumFractionDigits: 0 }).format(amount);

  const stats = {
    total: modules.length,
    active: modules.filter((m) => m.is_active).length,
    inactive: modules.filter((m) => !m.is_active).length,
    revenue: modules.reduce((s, m) => s + m.monthly_price, 0),
  };

  return (
    <DashboardLayout title="Modules Management">
      <div className="space-y-5">

        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-widest font-medium text-muted-foreground/70">
              QuovaTech BOC · Platform
            </p>
            <h1 className="text-2xl font-bold tracking-tight text-foreground mt-0.5">Modules Management</h1>
            <p className="text-[13px] text-muted-foreground mt-0.5">
              {stats.total} module{stats.total !== 1 ? "s" : ""} · {stats.active} active
            </p>
          </div>
          <Button size="sm" className="gap-1.5 self-start sm:self-auto" onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="h-3.5 w-3.5" />
            New Module
          </Button>
        </div>

        {/* KPI Cards */}
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 mb-3">
              <Package className="h-4 w-4 text-primary" />
            </div>
            <p className="text-[26px] font-bold tracking-tight text-foreground leading-none">{stats.total}</p>
            <p className="text-[12px] text-muted-foreground mt-1">Total Modules</p>
          </div>

          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 mb-3">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <p className="text-[26px] font-bold tracking-tight text-foreground leading-none">{stats.active}</p>
            <p className="text-[12px] text-muted-foreground mt-1">Active Modules</p>
          </div>

          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-rose-500/10 mb-3">
              <XCircle className="h-4 w-4 text-rose-600 dark:text-rose-400" />
            </div>
            <p className="text-[26px] font-bold tracking-tight text-foreground leading-none">{stats.inactive}</p>
            <p className="text-[12px] text-muted-foreground mt-1">Inactive Modules</p>
          </div>

          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10 mb-3">
              <DollarSign className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
            <p className="text-[22px] font-bold tracking-tight text-foreground leading-none">{fmt(stats.revenue)}</p>
            <p className="text-[12px] text-muted-foreground mt-1">Total Monthly Value</p>
          </div>
        </div>

        {/* Search */}
        <div className="flex items-center gap-2">
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search modules..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 text-[13px]"
            />
          </div>
          <Button variant="outline" size="sm" className="h-9 w-9 p-0" onClick={fetchModules} disabled={isLoading}>
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
          </Button>
        </div>

        {/* Table */}
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Module
                </th>
                <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Description
                </th>
                <th className="px-5 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Monthly
                </th>
                <th className="px-5 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Yearly
                </th>
                <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Status
                </th>
                <th className="px-5 py-3 w-28" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
                    <p className="text-[13px] text-muted-foreground mt-2">Loading modules...</p>
                  </td>
                </tr>
              ) : filteredModules.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted mx-auto mb-2">
                      <Package className="h-7 w-7 text-muted-foreground/50" />
                    </div>
                    <p className="text-[13px] font-medium text-foreground">
                      {searchQuery ? "No modules match your search" : "No modules yet"}
                    </p>
                    {!searchQuery && (
                      <Button size="sm" className="mt-3 gap-1.5" onClick={() => setIsCreateDialogOpen(true)}>
                        <Plus className="h-3.5 w-3.5" /> New Module
                      </Button>
                    )}
                  </td>
                </tr>
              ) : (
                filteredModules.map((module) => (
                  <tr key={module.id} className="group hover:bg-muted/30 transition-colors">
                    {/* Module name + slug */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                          <Package className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-[13px] font-semibold text-foreground leading-tight">{module.name}</p>
                          <p className="text-[11px] text-muted-foreground font-mono">{module.slug}</p>
                        </div>
                      </div>
                    </td>

                    {/* Description */}
                    <td className="px-5 py-4 max-w-xs">
                      <p className="text-[12px] text-muted-foreground truncate">{module.description}</p>
                    </td>

                    {/* Monthly price */}
                    <td className="px-5 py-4 text-right">
                      <span className="text-[13px] font-semibold text-foreground font-mono">{fmt(module.monthly_price)}</span>
                    </td>

                    {/* Yearly price + savings */}
                    <td className="px-5 py-4 text-right">
                      <div>
                        <span className="text-[13px] font-semibold text-foreground font-mono">{fmt(module.yearly_price)}</span>
                        {module.yearly_savings_percentage > 0 && (
                          <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium mt-0.5">
                            Save {module.yearly_savings_percentage}%
                          </p>
                        )}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-5 py-4">
                      {module.is_active ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-muted border border-border px-2.5 py-1 text-[11px] font-semibold text-muted-foreground">
                          <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40" />
                          Inactive
                        </span>
                      )}
                    </td>

                    {/* Actions — inline, hover-reveal */}
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-0.5 opacity-0 group-hover:opacity-100 transition-all duration-150">
                        <button
                          title="Edit Module"
                          onClick={() => openEditDialog(module)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                        >
                          <Edit className="h-[15px] w-[15px]" />
                        </button>
                        <button
                          title={module.is_active ? "Deactivate" : "Activate"}
                          onClick={() => handleToggleStatus(module)}
                          className={[
                            "flex h-8 w-8 items-center justify-center rounded-lg transition-colors",
                            module.is_active
                              ? "text-amber-500 hover:bg-amber-500/10"
                              : "text-emerald-600 hover:bg-emerald-500/10",
                          ].join(" ")}
                        >
                          <Power className="h-[15px] w-[15px]" />
                        </button>
                        <button
                          title="Delete Module"
                          onClick={() => handleDeleteModule(module)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                        >
                          <Trash2 className="h-[15px] w-[15px]" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {!isLoading && filteredModules.length > 0 && (
            <div className="border-t border-border px-5 py-3 bg-muted/20">
              <p className="text-[12px] text-muted-foreground">
                Showing <span className="font-medium text-foreground">{filteredModules.length}</span> of{" "}
                <span className="font-medium text-foreground">{modules.length}</span> modules
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── Create Module Dialog ──────────────────────────────────────────── */}
      <Dialog open={isCreateDialogOpen} onOpenChange={(open) => { setIsCreateDialogOpen(open); if (!open) resetForm(); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create New Module</DialogTitle>
            <DialogDescription>Add a module that tenants can subscribe to.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-1">
            <div className="space-y-1.5">
              <Label htmlFor="name">Module Name <span className="text-destructive">*</span></Label>
              <Input id="name" placeholder="e.g., Savings" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" placeholder="Describe what this module does..." value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} />
            </div>
            <div className="grid gap-4 grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="monthly_price">Monthly Price (₦)</Label>
                <Input id="monthly_price" type="number" placeholder="50000" value={formData.monthly_price || ""} onChange={(e) => setFormData({ ...formData, monthly_price: parseFloat(e.target.value) || 0 })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="yearly_price">Yearly Price (₦)</Label>
                <Input id="yearly_price" type="number" placeholder="498000" value={formData.yearly_price || ""} onChange={(e) => setFormData({ ...formData, yearly_price: parseFloat(e.target.value) || 0 })} />
                {formData.monthly_price > 0 && formData.yearly_price > 0 && (
                  <p className="text-[11px] text-emerald-600 dark:text-emerald-400">
                    Saves {Math.round(((formData.monthly_price * 12 - formData.yearly_price) / (formData.monthly_price * 12)) * 100)}% yearly
                  </p>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsCreateDialogOpen(false); resetForm(); }}>Cancel</Button>
            <Button onClick={handleCreateModule} disabled={isSaving} className="gap-1.5">
              {isSaving ? <><Loader2 className="h-4 w-4 animate-spin" /> Creating...</> : <><Save className="h-4 w-4" /> Create Module</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Edit Module Dialog ────────────────────────────────────────────── */}
      <Dialog open={isEditDialogOpen} onOpenChange={(open) => { setIsEditDialogOpen(open); if (!open) { setSelectedModule(null); resetForm(); } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Module</DialogTitle>
            <DialogDescription>Update module information and pricing.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-1">
            <div className="space-y-1.5">
              <Label htmlFor="edit-name">Module Name <span className="text-destructive">*</span></Label>
              <Input id="edit-name" placeholder="e.g., Savings" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea id="edit-description" placeholder="Describe what this module does..." value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} />
            </div>
            <div className="grid gap-4 grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="edit-monthly">Monthly Price (₦)</Label>
                <Input id="edit-monthly" type="number" value={formData.monthly_price || ""} onChange={(e) => setFormData({ ...formData, monthly_price: parseFloat(e.target.value) || 0 })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="edit-yearly">Yearly Price (₦)</Label>
                <Input id="edit-yearly" type="number" value={formData.yearly_price || ""} onChange={(e) => setFormData({ ...formData, yearly_price: parseFloat(e.target.value) || 0 })} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsEditDialogOpen(false); setSelectedModule(null); resetForm(); }}>Cancel</Button>
            <Button onClick={handleUpdateModule} disabled={isSaving} className="gap-1.5">
              {isSaving ? <><Loader2 className="h-4 w-4 animate-spin" /> Updating...</> : <><Save className="h-4 w-4" /> Save Changes</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
