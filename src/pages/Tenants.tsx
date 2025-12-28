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
} from "lucide-react";

const tenantsData = [
  {
    id: "1",
    name: "Acme Financial Corp",
    email: "admin@acmefinancial.com",
    status: "active" as const,
    plan: "Enterprise",
    users: 156,
    monthlyRevenue: "$2,450",
    createdAt: "Jan 15, 2024",
  },
  {
    id: "2",
    name: "TechStart Bank",
    email: "ops@techstart.io",
    status: "trial" as const,
    plan: "Professional",
    users: 42,
    monthlyRevenue: "$0",
    createdAt: "Feb 28, 2024",
  },
  {
    id: "3",
    name: "Metro Credit Union",
    email: "system@metrocredit.org",
    status: "active" as const,
    plan: "Enterprise",
    users: 234,
    monthlyRevenue: "$3,200",
    createdAt: "Dec 02, 2023",
  },
  {
    id: "4",
    name: "Coastal Savings Bank",
    email: "it@coastalsavings.com",
    status: "suspended" as const,
    plan: "Basic",
    users: 18,
    monthlyRevenue: "$0",
    createdAt: "Mar 10, 2024",
  },
  {
    id: "5",
    name: "Summit Cooperative",
    email: "admin@summitcoop.org",
    status: "active" as const,
    plan: "Professional",
    users: 89,
    monthlyRevenue: "$890",
    createdAt: "Nov 22, 2023",
  },
  {
    id: "6",
    name: "Valley Credit Services",
    email: "support@valleycs.com",
    status: "active" as const,
    plan: "Enterprise",
    users: 312,
    monthlyRevenue: "$4,100",
    createdAt: "Oct 15, 2023",
  },
  {
    id: "7",
    name: "Horizon Finance Group",
    email: "admin@horizonfg.com",
    status: "trial" as const,
    plan: "Professional",
    users: 28,
    monthlyRevenue: "$0",
    createdAt: "Mar 22, 2024",
  },
  {
    id: "8",
    name: "Pine State Bank",
    email: "ops@pinestatebank.com",
    status: "active" as const,
    plan: "Basic",
    users: 45,
    monthlyRevenue: "$450",
    createdAt: "Jan 08, 2024",
  },
];

export default function Tenants() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isNewTenantOpen, setIsNewTenantOpen] = useState(false);
  const [isSuspendDialogOpen, setIsSuspendDialogOpen] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<string | null>(null);

  const filteredTenants = tenantsData.filter((tenant) =>
    tenant.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
            <Button onClick={() => setIsNewTenantOpen(true)}>
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

        {/* New Tenant Dialog */}
        <Dialog open={isNewTenantOpen} onOpenChange={setIsNewTenantOpen}>
          <DialogContent className="bg-card sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Tenant</DialogTitle>
              <DialogDescription>
                Onboard a new organization to the platform
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="tenantName">Organization Name</Label>
                <Input id="tenantName" placeholder="Enter organization name" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="adminEmail">Admin Email</Label>
                <Input
                  id="adminEmail"
                  type="email"
                  placeholder="admin@organization.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="plan">Subscription Plan</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a plan" />
                  </SelectTrigger>
                  <SelectContent className="bg-card">
                    <SelectItem value="basic">Basic - $450/mo</SelectItem>
                    <SelectItem value="professional">
                      Professional - $890/mo
                    </SelectItem>
                    <SelectItem value="enterprise">
                      Enterprise - Custom
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsNewTenantOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={() => setIsNewTenantOpen(false)}>
                Create Tenant
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
