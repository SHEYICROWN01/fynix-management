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
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
    Plus,
    Search,
    MoreHorizontal,
    Edit,
    Trash2,
    Package,
    DollarSign,
    CheckCircle2,
    XCircle,
    Loader2,
    Save,
} from "lucide-react";
import { toast as showToast } from "sonner";
import { api, type Module, type CreateModuleData } from "@/lib/api";
import { getErrorMessage } from "@/lib/utils";

export default function Modules() {
    // State Management
    const [modules, setModules] = useState<Module[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [selectedModule, setSelectedModule] = useState<Module | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [totalModules, setTotalModules] = useState(0);

    // Form State
    const [formData, setFormData] = useState<CreateModuleData>({
        name: "",
        description: "",
        monthly_price: 0,
        yearly_price: 0,
        is_active: true,
    });

    // Fetch Modules
    const fetchModules = async () => {
        setIsLoading(true);
        try {
            const response = await api.listModules({
                search: searchQuery || undefined,
                per_page: 100, // Get all modules for now
            });

            setModules(response.data);
            setTotalModules(response.pagination.total);

        } catch (error: unknown) {
            console.error("Error fetching modules:", error);
            showToast.error(getErrorMessage(error) || "Failed to load modules");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchModules();
    }, []);

    // Handle Create Module
    const handleCreateModule = async () => {
        if (!formData.name || !formData.description) {
            showToast.error("Please fill in all required fields");
            return;
        }

        // Validate pricing
        if (formData.monthly_price <= 0 || formData.yearly_price <= 0) {
            showToast.error("Prices must be greater than 0");
            return;
        }

        if (formData.yearly_price >= formData.monthly_price * 12) {
            showToast.error("Yearly price must be less than monthly price × 12");
            return;
        }

        setIsSaving(true);
        try {
            const response = await api.createModule(formData);
            showToast.success(response.message || "Module created successfully");
            setIsCreateDialogOpen(false);
            resetForm();
            fetchModules();
        } catch (error: unknown) {
            console.error("Error creating module:", error);
            showToast.error(getErrorMessage(error) || "Failed to create module");
        } finally {
            setIsSaving(false);
        }
    };

    // Handle Update Module
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
            console.error("Error updating module:", error);
            showToast.error(getErrorMessage(error) || "Failed to update module");
        } finally {
            setIsSaving(false);
        }
    };

    // Handle Delete Module
    const handleDeleteModule = async (module: Module) => {
        if (!confirm(`Are you sure you want to delete "${module.name}" module?`)) {
            return;
        }

        try {
            const response = await api.deleteModule(module.id);
            showToast.success(response.message || "Module deleted successfully");
            fetchModules();
        } catch (error: unknown) {
            console.error("Error deleting module:", error);
            showToast.error(getErrorMessage(error) || "Failed to delete module");
        }
    };

    // Handle Toggle Status
    const handleToggleStatus = async (module: Module) => {
        try {
            const response = await api.toggleModuleStatus(module.id);
            showToast.success(response.message || `Module ${!module.is_active ? "activated" : "deactivated"}`);
            fetchModules();
        } catch (error: unknown) {
            console.error("Error toggling module status:", error);
            showToast.error(getErrorMessage(error) || "Failed to update module status");
        }
    };

    // Open Edit Dialog
    const openEditDialog = (module: Module) => {
        setSelectedModule(module);
        setFormData({
            name: module.name,
            description: module.description,
            monthly_price: module.monthly_price,
            yearly_price: module.yearly_price,
            is_active: module.is_active,
        });
        setIsEditDialogOpen(true);
    };

    // Reset Form
    const resetForm = () => {
        setFormData({
            name: "",
            description: "",
            monthly_price: 0,
            yearly_price: 0,
            is_active: true,
        });
    };

    // Auto-generate slug from name (slug is auto-generated by backend)
    const handleNameChange = (name: string) => {
        setFormData((prev) => ({
            ...prev,
            name,
        }));
    };

    // Filter modules by search
    const filteredModules = modules.filter((module) =>
        module.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        module.description.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Format currency
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("en-NG", {
            style: "currency",
            currency: "NGN",
            minimumFractionDigits: 0,
        }).format(amount);
    };

    // Calculate stats
    const stats = {
        total: modules.length,
        active: modules.filter((m) => m.is_active).length,
        inactive: modules.filter((m) => !m.is_active).length,
        totalRevenue: modules.reduce((sum, m) => sum + m.monthly_price, 0),
    };

    return (
        <DashboardLayout title= "Modules Management" >
        <div className="space-y-6" >
            {/* Header */ }
            < div className = "flex items-center justify-between" >
                <div>
                <h1 className="text-3xl font-bold" > Modules Management </h1>
                    < p className = "text-muted-foreground mt-1" >
                        Manage available modules for tenant subscriptions
                            </p>
                            </div>
                            < Button onClick = {() => setIsCreateDialogOpen(true)
} size = "lg" >
    <Plus className="mr-2 h-4 w-4" />
        New Module
            </Button>
            </div>

{/* Stats Cards */ }
<div className="grid gap-4 md:grid-cols-4" >
    <div className="rounded-lg border bg-card p-4" >
        <div className="flex items-center gap-3" >
            <div className="rounded-lg bg-primary/10 p-2" >
                <Package className="h-5 w-5 text-primary" />
                    </div>
                    < div >
                    <p className="text-2xl font-semibold" > { stats.total } </p>
                        < p className = "text-sm text-muted-foreground" > Total Modules </p>
                            </div>
                            </div>
                            </div>

                            < div className = "rounded-lg border bg-card p-4" >
                                <div className="flex items-center gap-3" >
                                    <div className="rounded-lg bg-success/10 p-2" >
                                        <CheckCircle2 className="h-5 w-5 text-success" />
                                            </div>
                                            < div >
                                            <p className="text-2xl font-semibold" > { stats.active } </p>
                                                < p className = "text-sm text-muted-foreground" > Active Modules </p>
                                                    </div>
                                                    </div>
                                                    </div>

                                                    < div className = "rounded-lg border bg-card p-4" >
                                                        <div className="flex items-center gap-3" >
                                                            <div className="rounded-lg bg-destructive/10 p-2" >
                                                                <XCircle className="h-5 w-5 text-destructive" />
                                                                    </div>
                                                                    < div >
                                                                    <p className="text-2xl font-semibold" > { stats.inactive } </p>
                                                                        < p className = "text-sm text-muted-foreground" > Inactive Modules </p>
                                                                            </div>
                                                                            </div>
                                                                            </div>

                                                                            < div className = "rounded-lg border bg-card p-4" >
                                                                                <div className="flex items-center gap-3" >
                                                                                    <div className="rounded-lg bg-blue-500/10 p-2" >
                                                                                        <DollarSign className="h-5 w-5 text-blue-500" />
                                                                                            </div>
                                                                                            < div >
                                                                                            <p className="text-2xl font-semibold" > { formatCurrency(stats.totalRevenue) } </p>
                                                                                                < p className = "text-sm text-muted-foreground" > Total Revenue </p>
                                                                                                    </div>
                                                                                                    </div>
                                                                                                    </div>
                                                                                                    </div>

{/* Search Bar */ }
<div className="flex items-center gap-4" >
    <div className="relative flex-1" >
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search modules..."
value = { searchQuery }
onChange = {(e) => setSearchQuery(e.target.value)}
className = "pl-10"
    />
    </div>
    </div>

{/* Modules Table */ }
<div className="rounded-lg border" >
    <Table>
    <TableHeader>
    <TableRow>
    <TableHead>Module Name </TableHead>
        < TableHead > Description </TableHead>
        < TableHead > Monthly Price </TableHead>
            < TableHead > Yearly Price </TableHead>
                < TableHead > Status </TableHead>
                < TableHead className = "text-right" > Actions </TableHead>
                    </TableRow>
                    </TableHeader>
                    <TableBody>
{
    isLoading ? (
        <TableRow>
        <TableCell colSpan= { 6} className = "text-center py-8" >
            <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                <p className="text-sm text-muted-foreground" > Loading modules...</p>
                    </TableCell>
                    </TableRow>
              ) : filteredModules.length === 0 ? (
        <TableRow>
        <TableCell colSpan= { 6} className = "text-center py-8" >
            <Package className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground" >
                    { searchQuery? "No modules found": "No modules available" }
                    </p>
                    </TableCell>
                    </TableRow>
              ) : (
        filteredModules.map((module) => (
            <TableRow key= { module.id } >
            <TableCell>
            <div className="flex items-center gap-2" >
        <Package className="h-4 w-4 text-muted-foreground" />
        <div>
        <p className="font-medium" > { module.name } </p>
        < p className = "text-xs text-muted-foreground" > { module.slug } </p>
        </div>
        </div>
        </TableCell>
        < TableCell >
        <p className="text-sm text-muted-foreground max-w-xs truncate" >
        { module.description }
        </p>
        </TableCell>
        < TableCell >
        <span className="font-medium" > { formatCurrency(module.monthly_price)} </span>
            </TableCell>
            < TableCell >
            <span className="font-medium" > { formatCurrency(module.yearly_price) } </span>
                < span className = "text-xs text-success ml-2" >
                    (Save { module.yearly_savings_percentage }%)
</span>
    </TableCell>
    <TableCell>
{
    module.is_active ? (
        <Badge variant= "default" className = "bg-success" >
            <CheckCircle2 className="mr-1 h-3 w-3" />
                Active
                </Badge>
                      ) : (
        <Badge variant= "secondary" >
        <XCircle className="mr-1 h-3 w-3" />
            Inactive
            </Badge>
                      )
}
</TableCell>
    < TableCell className = "text-right" >
        <DropdownMenu>
        <DropdownMenuTrigger asChild >
        <Button variant="ghost" size = "sm" >
            <MoreHorizontal className="h-4 w-4" />
                </Button>
                </DropdownMenuTrigger>
                < DropdownMenuContent align = "end" >
                    <DropdownMenuLabel>Actions </DropdownMenuLabel>
                    < DropdownMenuSeparator />
                    <DropdownMenuItem onClick={ () => openEditDialog(module) }>
                        <Edit className="mr-2 h-4 w-4" />
                            Edit Module
                                </DropdownMenuItem>
                                < DropdownMenuItem onClick = {() => handleToggleStatus(module)}>
                                    {
                                        module.is_active ? (
                                            <>
                                            <XCircle className= "mr-2 h-4 w-4" />
                                            Deactivate
                                            </>
                            ) : (
                                                <>
                                                <CheckCircle2 className="mr-2 h-4 w-4" />
                                                Activate
                                            </>
                                            )}
</DropdownMenuItem>
    < DropdownMenuSeparator />
    <DropdownMenuItem
                            onClick={ () => handleDeleteModule(module) }
className = "text-destructive"
    >
    <Trash2 className="mr-2 h-4 w-4" />
        Delete Module
            </DropdownMenuItem>
            </DropdownMenuContent>
            </DropdownMenu>
            </TableCell>
            </TableRow>
                ))
              )}
</TableBody>
    </Table>
    </div>

{/* Create Module Dialog */ }
<Dialog open={ isCreateDialogOpen } onOpenChange = { setIsCreateDialogOpen } >
    <DialogContent className="max-w-2xl" >
        <DialogHeader>
        <DialogTitle>Create New Module </DialogTitle>
            <DialogDescription>
                Add a new module that tenants can subscribe to
    </DialogDescription>
    </DialogHeader>

    < div className = "space-y-4" >
        <div className="grid gap-4 md:grid-cols-2" >
            <div className="space-y-2" >
                <Label htmlFor="name" >
                    Module Name < span className = "text-destructive" >* </span>
                        </Label>
                        < Input
id = "name"
placeholder = "e.g., Savings"
value = { formData.name }
onChange = {(e) => handleNameChange(e.target.value)}
                  />
    </div>

    < div className = "space-y-2" >
        <Label htmlFor="slug" >
            Slug < span className = "text-destructive" >* </span>
                </Label>
                < Input
id = "slug"
placeholder = "e.g., savings"
value = { formData.slug }
onChange = {(e) =>
setFormData({ ...formData, slug: e.target.value })
                    }
                  />
    </div>
    </div>

    < div className = "space-y-2" >
        <Label htmlFor="description" > Description </Label>
            < Textarea
id = "description"
placeholder = "Describe what this module does..."
value = { formData.description }
onChange = {(e) =>
setFormData({ ...formData, description: e.target.value })
                  }
rows = { 3}
    />
    </div>

    < div className = "grid gap-4 md:grid-cols-2" >
        <div className="space-y-2" >
            <Label htmlFor="monthly_price" > Monthly Price(₦) </Label>
                < Input
id = "monthly_price"
type = "number"
placeholder = "50000"
value = { formData.monthly_price }
onChange = {(e) =>
setFormData({
    ...formData,
    monthly_price: parseFloat(e.target.value) || 0,
})
                    }
                  />
    </div>

    < div className = "space-y-2" >
        <Label htmlFor="yearly_price" > Yearly Price(₦) </Label>
            < Input
id = "yearly_price"
type = "number"
placeholder = "498000"
value = { formData.yearly_price }
onChange = {(e) =>
setFormData({
    ...formData,
    yearly_price: parseFloat(e.target.value) || 0,
})
                    }
                  />
{
    formData.monthly_price > 0 && formData.yearly_price > 0 && (
        <p className="text-xs text-muted-foreground" >
            Yearly saves{ " " }
    {
        Math.round(
            ((formData.monthly_price * 12 - formData.yearly_price) /
                (formData.monthly_price * 12)) *
            100
        )
    }
                      % ({ formatCurrency(formData.monthly_price * 12 - formData.yearly_price) })
        </p>
                  )
}
</div>
    </div>
    </div>

    < DialogFooter >
    <Button
                variant="outline"
onClick = {() => {
    setIsCreateDialogOpen(false);
    resetForm();
}}
              >
    Cancel
    </Button>
    < Button onClick = { handleCreateModule } disabled = { isSaving } >
    {
        isSaving?(
                  <>
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Creating...
</>
                ) : (
    <>
    <Save className= "mr-2 h-4 w-4" />
    Create Module
        </>
                )}
</Button>
    </DialogFooter>
    </DialogContent>
    </Dialog>

{/* Edit Module Dialog */ }
<Dialog open={ isEditDialogOpen } onOpenChange = { setIsEditDialogOpen } >
    <DialogContent className="max-w-2xl" >
        <DialogHeader>
        <DialogTitle>Edit Module </DialogTitle>
            <DialogDescription>
                Update module information and pricing
    </DialogDescription>
    </DialogHeader>

    < div className = "space-y-4" >
        <div className="grid gap-4 md:grid-cols-2" >
            <div className="space-y-2" >
                <Label htmlFor="edit-name" >
                    Module Name < span className = "text-destructive" >* </span>
                        </Label>
                        < Input
id = "edit-name"
placeholder = "e.g., Savings"
value = { formData.name }
onChange = {(e) => handleNameChange(e.target.value)}
                  />
    </div>

    < div className = "space-y-2" >
        <Label htmlFor="edit-slug" >
            Slug < span className = "text-destructive" >* </span>
                </Label>
                < Input
id = "edit-slug"
placeholder = "e.g., savings"
value = { formData.slug }
onChange = {(e) =>
setFormData({ ...formData, slug: e.target.value })
                    }
                  />
    </div>
    </div>

    < div className = "space-y-2" >
        <Label htmlFor="edit-description" > Description </Label>
            < Textarea
id = "edit-description"
placeholder = "Describe what this module does..."
value = { formData.description }
onChange = {(e) =>
setFormData({ ...formData, description: e.target.value })
                  }
rows = { 3}
    />
    </div>

    < div className = "grid gap-4 md:grid-cols-2" >
        <div className="space-y-2" >
            <Label htmlFor="edit-price-monthly" > Monthly Price(₦) </Label>
                < Input
id = "edit-price-monthly"
type = "number"
placeholder = "50000"
value = { formData.price_monthly }
onChange = {(e) =>
setFormData({
    ...formData,
    price_monthly: parseFloat(e.target.value) || 0,
})
                    }
                  />
    </div>

    < div className = "space-y-2" >
        <Label htmlFor="edit-price-yearly" > Yearly Price(₦) </Label>
            < Input
id = "edit-price-yearly"
type = "number"
placeholder = "500000"
value = { formData.price_yearly }
onChange = {(e) =>
setFormData({
    ...formData,
    price_yearly: parseFloat(e.target.value) || 0,
})
                    }
                  />
    </div>
    </div>
    </div>

    < DialogFooter >
    <Button
                variant="outline"
onClick = {() => {
    setIsEditDialogOpen(false);
    setSelectedModule(null);
    resetForm();
}}
              >
    Cancel
    </Button>
    < Button onClick = { handleUpdateModule } disabled = { isSaving } >
    {
        isSaving?(
                  <>
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Updating...
</>
                ) : (
    <>
    <Save className= "mr-2 h-4 w-4" />
    Update Module
        </>
                )}
</Button>
    </DialogFooter>
    </DialogContent>
    </Dialog>
    </div>
    </DashboardLayout>
  );
}
