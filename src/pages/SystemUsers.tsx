import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { DemoDataBanner } from "@/components/ui/DemoDataBanner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  Shield,
  User,
  UserCog,
  Clock,
  Mail,
} from "lucide-react";

const systemUsers = [
  {
    id: "1",
    name: "John Doe",
    email: "john.doe@fynix.com",
    role: "Super Admin",
    status: "active",
    lastActive: "Just now",
    createdAt: "Jan 01, 2023",
  },
  {
    id: "2",
    name: "Jane Smith",
    email: "jane.smith@fynix.com",
    role: "Platform Admin",
    status: "active",
    lastActive: "2 hours ago",
    createdAt: "Mar 15, 2023",
  },
  {
    id: "3",
    name: "Sarah Johnson",
    email: "sarah.johnson@fynix.com",
    role: "Finance Admin",
    status: "active",
    lastActive: "1 day ago",
    createdAt: "Jun 22, 2023",
  },
  {
    id: "4",
    name: "Michael Chen",
    email: "michael.chen@fynix.com",
    role: "Support Admin",
    status: "active",
    lastActive: "3 hours ago",
    createdAt: "Sep 10, 2023",
  },
  {
    id: "5",
    name: "Emily Davis",
    email: "emily.davis@fynix.com",
    role: "Platform Admin",
    status: "inactive",
    lastActive: "30 days ago",
    createdAt: "Nov 05, 2023",
  },
];

const roles = [
  {
    name: "Super Admin",
    description: "Full access to all platform features",
    permissions: ["All permissions"],
    icon: Shield,
  },
  {
    name: "Platform Admin",
    description: "Manage tenants and subscriptions",
    permissions: ["Tenants", "Plans", "Analytics"],
    icon: UserCog,
  },
  {
    name: "Finance Admin",
    description: "Manage billing and revenue",
    permissions: ["Billing", "Invoices", "Reports"],
    icon: User,
  },
  {
    name: "Support Admin",
    description: "View-only access for support",
    permissions: ["View Tenants", "View Logs"],
    icon: User,
  },
];

const getRoleIcon = (role: string) => {
  switch (role) {
    case "Super Admin":
      return Shield;
    case "Platform Admin":
      return UserCog;
    default:
      return User;
  }
};

export default function SystemUsers() {
  const [isInviteOpen, setIsInviteOpen] = useState(false);

  return (
    <DashboardLayout title= "System Users" >
    <div className="space-y-6 animate-fade-in" >
      <DemoDataBanner message="Admin user accounts listed here are demo data. Connect a System Users API to manage real platform administrators." />
        {/* Summary */ }
        < div className = "grid gap-4 md:grid-cols-4" >
          <div className="flex items-center gap-4 rounded-lg border border-border bg-card p-4" >
            <div className="rounded-lg bg-primary/10 p-3" >
              <User className="h-5 w-5 text-primary" />
                </div>
                < div >
                <p className="text-2xl font-semibold" > { systemUsers.length } </p>
                  < p className = "text-sm text-muted-foreground" > Total Admins </p>
                    </div>
                    </div>
                    < div className = "flex items-center gap-4 rounded-lg border border-border bg-card p-4" >
                      <div className="rounded-lg bg-success/10 p-3" >
                        <Shield className="h-5 w-5 text-success" />
                          </div>
                          < div >
                          <p className="text-2xl font-semibold" >
                            { systemUsers.filter((u) => u.status === "active").length }
                            </p>
                            < p className = "text-sm text-muted-foreground" > Active </p>
                              </div>
                              </div>
                              < div className = "flex items-center gap-4 rounded-lg border border-border bg-card p-4" >
                                <div className="rounded-lg bg-warning/10 p-3" >
                                  <Clock className="h-5 w-5 text-warning" />
                                    </div>
                                    < div >
                                    <p className="text-2xl font-semibold" > 1 </p>
                                      < p className = "text-sm text-muted-foreground" > Pending Invite </p>
                                        </div>
                                        </div>
                                        < div className = "flex items-center gap-4 rounded-lg border border-border bg-card p-4" >
                                          <div className="rounded-lg bg-muted p-3" >
                                            <UserCog className="h-5 w-5 text-muted-foreground" />
                                              </div>
                                              < div >
                                              <p className="text-2xl font-semibold" > 4 </p>
                                                < p className = "text-sm text-muted-foreground" > Roles Defined </p>
                                                  </div>
                                                  </div>
                                                  </div>

  {/* Users Table */ }
  <div className="rounded-lg border border-border bg-card" >
    <div className="flex flex-col gap-4 border-b border-border p-6 sm:flex-row sm:items-center sm:justify-between" >
      <div className="relative" >
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search users..." className = "w-64 pl-9" />
            </div>
            < Button onClick = {() => setIsInviteOpen(true)
}>
  <Plus className="mr-2 h-4 w-4" />
    Invite Admin
      </Button>
      </div>
      < div className = "overflow-x-auto" >
        <table className="data-table" >
          <thead>
          <tr>
          <th>User </th>
          < th > Role </th>
          < th > Status </th>
          < th > Last Active </th>
            < th > Joined </th>
            < th className = "text-right" > Actions </th>
              </tr>
              </thead>
              <tbody>
{
  systemUsers.map((user) => {
    const RoleIcon = getRoleIcon(user.role);
    return (
      <tr key= { user.id } >
      <td>
      <div className="flex items-center gap-3" >
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-medium text-primary-foreground" >
        {
          user.name
            .split(" ")
            .map((n) => n[0])
            .join("")
        }
          </div>
          < div >
          <p className="font-medium" > { user.name } </p>
            < p className = "text-sm text-muted-foreground" >
              { user.email }
              </p>
              </div>
              </div>
              </td>
              < td >
              <div className="flex items-center gap-2" >
                <RoleIcon className="h-4 w-4 text-muted-foreground" />
                  <span>{ user.role } </span>
                  </div>
                  </td>
                  < td >
                  <span
                          className={
      `inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${user.status === "active"
        ? "bg-success/10 text-success"
        : "bg-muted text-muted-foreground"
      }`
    }
                        >
      <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-current" />
        { user.status === "active" ? "Active" : "Inactive" }
        </span>
        </td>
        < td className = "text-muted-foreground" > { user.lastActive } </td>
          < td className = "text-muted-foreground" > { user.createdAt } </td>
            < td className = "text-right" >
              <DropdownMenu>
              <DropdownMenuTrigger asChild >
              <Button variant="ghost" size = "sm" >
                <MoreHorizontal className="h-4 w-4" />
                  </Button>
                  </DropdownMenuTrigger>
                  < DropdownMenuContent align = "end" className = "bg-card" >
                    <DropdownMenuItem>View Profile </DropdownMenuItem>
                      < DropdownMenuItem > Edit Permissions </DropdownMenuItem>
                        < DropdownMenuItem > View Activity </DropdownMenuItem>
                          < DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive" >
                            Revoke Access
                              </DropdownMenuItem>
                              </DropdownMenuContent>
                              </DropdownMenu>
                              </td>
                              </tr>
                  );
})}
</tbody>
  </table>
  </div>
  </div>

{/* Roles Overview */ }
<div className="rounded-lg border border-border bg-card p-6" >
  <h3 className="mb-6 text-lg font-semibold" > Roles & Permissions </h3>
    < div className = "grid gap-4 md:grid-cols-2 lg:grid-cols-4" >
    {
      roles.map((role) => (
        <div
                key= { role.name }
                className = "rounded-lg border border-border bg-background p-4"
        >
        <div className="mb-3 flex items-center gap-2" >
      <role.icon className="h-5 w-5 text-primary" />
      <h4 className="font-medium" > { role.name } </h4>
      </div>
      < p className = "mb-3 text-sm text-muted-foreground" >
      { role.description }
      </p>
      < div className = "flex flex-wrap gap-1" >
      {
        role.permissions.map((permission) => (
          <span
                      key= { permission }
                      className = "rounded-full bg-muted px-2 py-0.5 text-xs"
          >
          { permission }
          </span>
        ))
    }
      </div>
      </div>
            ))}
</div>
  </div>

{/* Invite Dialog */ }
<Dialog open={ isInviteOpen } onOpenChange = { setIsInviteOpen } >
  <DialogContent className="bg-card sm:max-w-md" >
    <DialogHeader>
    <DialogTitle>Invite System Admin </DialogTitle>
      <DialogDescription>
                Send an invitation to join the admin team
  </DialogDescription>
  </DialogHeader>
  < div className = "space-y-4 py-4" >
    <div className="space-y-2" >
      <Label htmlFor="inviteEmail" > Email Address </Label>
        < div className = "relative" >
          <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
                    id="inviteEmail"
type = "email"
placeholder = "admin@fynix.com"
className = "pl-9"
  />
  </div>
  </div>
  < div className = "space-y-2" >
    <Label htmlFor="inviteRole" > Role </Label>
      < Select >
      <SelectTrigger>
      <SelectValue placeholder="Select a role" />
        </SelectTrigger>
        < SelectContent className = "bg-card" >
          <SelectItem value="platform" > Platform Admin </SelectItem>
            < SelectItem value = "finance" > Finance Admin </SelectItem>
              < SelectItem value = "support" > Support Admin </SelectItem>
                </SelectContent>
                </Select>
                </div>
                </div>
                < DialogFooter >
                <Button variant="outline" onClick = {() => setIsInviteOpen(false)}>
                  Cancel
                  </Button>
                  < Button onClick = {() => setIsInviteOpen(false)}>
                    Send Invitation
                      </Button>
                      </DialogFooter>
                      </DialogContent>
                      </Dialog>
                      </div>
                      </DashboardLayout>
  );
}
