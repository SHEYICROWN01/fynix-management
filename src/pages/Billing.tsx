import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { DemoDataBanner } from "@/components/ui/DemoDataBanner";
import { MetricCard } from "@/components/ui/MetricCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Banknote,
  TrendingUp,
  AlertTriangle,
  Download,
  Search,
  Filter,
  CreditCard,
  Receipt,
  ArrowUpRight,
  FileText,
  Building2,
  Users,
  Eye,
  Send,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const revenueByMonth = [
  { month: "Aug", revenue: 52000000 },
  { month: "Sep", revenue: 55000000 },
  { month: "Oct", revenue: 58000000 },
  { month: "Nov", revenue: 62000000 },
  { month: "Dec", revenue: 65000000 },
  { month: "Jan", revenue: 68000000 },
  { month: "Feb", revenue: 71000000 },
  { month: "Mar", revenue: 68420000 },
];

const recentPayments = [
  {
    tenant: "Acme Financial Corp",
    amount: "₦2,450,000",
    status: "paid" as const,
    method: "Bank Transfer",
    date: "Mar 15, 2024",
    invoice: "INV-2024-0342",
  },
  {
    tenant: "Metro Credit Union",
    amount: "₦3,200,000",
    status: "paid" as const,
    method: "Bank Transfer",
    date: "Mar 14, 2024",
    invoice: "INV-2024-0341",
  },
  {
    tenant: "Coastal Savings Bank",
    amount: "₦450,000",
    status: "failed" as const,
    method: "Bank Transfer",
    date: "Mar 12, 2024",
    invoice: "INV-2024-0340",
  },
  {
    tenant: "Summit Cooperative",
    amount: "₦890,000",
    status: "paid" as const,
    method: "Card Payment",
    date: "Mar 11, 2024",
    invoice: "INV-2024-0339",
  },
  {
    tenant: "Pine State Bank",
    amount: "₦450,000",
    status: "pending" as const,
    method: "Bank Transfer",
    date: "Mar 10, 2024",
    invoice: "INV-2024-0338",
  },
  {
    tenant: "Valley Credit Services",
    amount: "₦4,100,000",
    status: "paid" as const,
    method: "Bank Transfer",
    date: "Mar 08, 2024",
    invoice: "INV-2024-0337",
  },
];

const failedPayments = [
  {
    tenant: "Coastal Savings Bank",
    amount: "₦450,000",
    reason: "Insufficient funds",
    attempts: 2,
    lastAttempt: "Mar 12, 2024",
  },
  {
    tenant: "Horizon Finance Group",
    amount: "₦890,000",
    reason: "Account frozen",
    attempts: 1,
    lastAttempt: "Mar 10, 2024",
  },
];

const invoices = [
  {
    id: "INV-2024-0342",
    tenant: "Acme Financial Corp",
    billingPeriod: "Mar 2024",
    plan: "Enterprise",
    activeUsers: 156,
    baseAmount: "₦500,000",
    userCharges: "₦1,950,000",
    totalAmount: "₦2,450,000",
    status: "paid" as const,
    dueDate: "Mar 15, 2024",
    paidDate: "Mar 15, 2024",
  },
  {
    id: "INV-2024-0341",
    tenant: "Metro Credit Union",
    billingPeriod: "Mar 2024",
    plan: "Enterprise",
    activeUsers: 234,
    baseAmount: "₦500,000",
    userCharges: "₦2,700,000",
    totalAmount: "₦3,200,000",
    status: "paid" as const,
    dueDate: "Mar 14, 2024",
    paidDate: "Mar 14, 2024",
  },
  {
    id: "INV-2024-0340",
    tenant: "Coastal Savings Bank",
    billingPeriod: "Mar 2024",
    plan: "Basic",
    activeUsers: 18,
    baseAmount: "₦150,000",
    userCharges: "₦300,000",
    totalAmount: "₦450,000",
    status: "overdue" as const,
    dueDate: "Mar 10, 2024",
    paidDate: null,
  },
  {
    id: "INV-2024-0339",
    tenant: "Summit Cooperative",
    billingPeriod: "Mar 2024",
    plan: "Professional",
    activeUsers: 89,
    baseAmount: "₦350,000",
    userCharges: "₦540,000",
    totalAmount: "₦890,000",
    status: "paid" as const,
    dueDate: "Mar 11, 2024",
    paidDate: "Mar 11, 2024",
  },
  {
    id: "INV-2024-0338",
    tenant: "Pine State Bank",
    billingPeriod: "Mar 2024",
    plan: "Basic",
    activeUsers: 45,
    baseAmount: "₦150,000",
    userCharges: "₦300,000",
    totalAmount: "₦450,000",
    status: "pending" as const,
    dueDate: "Mar 20, 2024",
    paidDate: null,
  },
];

const tenantUsage = [
  {
    tenant: "Acme Financial Corp",
    plan: "Enterprise",
    activeUsers: 156,
    transactions: 12450,
    storage: "45.2 GB",
    monthlyUsage: "₦2,450,000",
    billingStatus: "paid" as const,
  },
  {
    tenant: "Metro Credit Union",
    plan: "Enterprise",
    activeUsers: 234,
    transactions: 18920,
    storage: "67.8 GB",
    monthlyUsage: "₦3,200,000",
    billingStatus: "paid" as const,
  },
  {
    tenant: "Summit Cooperative",
    plan: "Professional",
    activeUsers: 89,
    transactions: 5670,
    storage: "23.4 GB",
    monthlyUsage: "₦890,000",
    billingStatus: "paid" as const,
  },
  {
    tenant: "Pine State Bank",
    plan: "Basic",
    activeUsers: 45,
    transactions: 2340,
    storage: "12.1 GB",
    monthlyUsage: "₦450,000",
    billingStatus: "due" as const,
  },
  {
    tenant: "Coastal Savings Bank",
    plan: "Basic",
    activeUsers: 18,
    transactions: 890,
    storage: "5.6 GB",
    monthlyUsage: "₦450,000",
    billingStatus: "overdue" as const,
  },
];

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
    <span className= {`status-badge ${styles[status]}`
}>
  { labels[status]}
  </span>
  );
}

export default function Billing() {
  const [isInvoiceViewOpen, setIsInvoiceViewOpen] = useState(false);
  const [isGenerateInvoiceOpen, setIsGenerateInvoiceOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<typeof invoices[0] | null>(null);

  const formatNaira = (value: number) => {
    return `₦${(value / 1000000).toFixed(1)}M`;
  };

  return (
    <DashboardLayout title= "Billing & Revenue" >
    <div className="space-y-6 animate-fade-in" >
      <DemoDataBanner message="All revenue figures, invoices, and payment records on this page are demo data. Connect a Billing API to display real financial data." />
        {/* Metrics */ }
        < div className = "grid gap-4 md:grid-cols-2 lg:grid-cols-4" >
          <MetricCard
            title="Monthly Revenue"
  value = "₦68.4M"
  change = "+12.5% from last month"
  changeType = "positive"
  icon = { Banknote }
    />
    <MetricCard
            title="Annual Revenue"
  value = "₦721.8M"
  change = "On track for ₦850M"
  changeType = "positive"
  icon = { TrendingUp }
    />
    <MetricCard
            title="Failed Payments"
  value = "2"
  change = "₦1.34M outstanding"
  changeType = "negative"
  icon = { AlertTriangle }
    />
    <MetricCard
            title="Avg Revenue/Tenant"
  value = "₦580K"
  change = "+5.2% this quarter"
  changeType = "positive"
  icon = { CreditCard }
    />
    </div>

  {/* Revenue Chart */ }
  <div className="rounded-lg border border-border bg-card p-6" >
    <div className="mb-6 flex items-center justify-between" >
      <div>
      <h3 className="text-lg font-semibold" > Revenue Analytics </h3>
        < p className = "text-sm text-muted-foreground" >
          Monthly recurring revenue over time(₦)
            </p>
            </div>
            < Button variant = "outline" size = "sm" >
              <Download className="mr-2 h-4 w-4" />
                Export Report
                  </Button>
                  </div>
                  < div className = "h-[300px]" >
                    <ResponsiveContainer width="100%" height = "100%" >
                      <BarChart data={ revenueByMonth }>
                        <CartesianGrid strokeDasharray="3 3" className = "stroke-border" />
                          <XAxis
                  dataKey="month"
  tick = {{ fontSize: 12 }
}
className = "fill-muted-foreground"
axisLine = {{ className: "stroke-border" }}
                />
  < YAxis
tick = {{ fontSize: 12 }}
className = "fill-muted-foreground"
axisLine = {{ className: "stroke-border" }}
tickFormatter = { formatNaira }
  />
  <Tooltip
                  contentStyle={
  {
    backgroundColor: "hsl(var(--card))",
      border: "1px solid hsl(var(--border))",
        borderRadius: "8px",
                  }
}
formatter = {(value: number) => [`₦${value.toLocaleString()}`, "Revenue"]}
                />
  < Bar
dataKey = "revenue"
fill = "hsl(var(--primary))"
radius = { [4, 4, 0, 0]}
  />
  </BarChart>
  </ResponsiveContainer>
  </div>
  </div>

  < Tabs defaultValue = "usage" className = "space-y-6" >
    <TabsList className="bg-muted" >
      <TabsTrigger value="usage" > Tenant Usage </TabsTrigger>
        < TabsTrigger value = "payments" > Payment History </TabsTrigger>
          < TabsTrigger value = "failed" > Failed Payments </TabsTrigger>
            < TabsTrigger value = "invoices" > Invoices </TabsTrigger>
              </TabsList>

{/* Tenant Usage Tab */ }
<TabsContent value="usage" className = "space-y-4" >
  <div className="rounded-lg border border-border bg-card" >
    <div className="flex flex-col gap-4 border-b border-border p-6 sm:flex-row sm:items-center sm:justify-between" >
      <div className="flex items-center gap-4" >
        <div className="relative" >
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search tenants..." className = "w-64 pl-9" />
              </div>
              < Button variant = "outline" size = "sm" >
                <Filter className="mr-2 h-4 w-4" />
                  Filters
                  </Button>
                  </div>
                  < Button variant = "outline" size = "sm" >
                    <Download className="mr-2 h-4 w-4" />
                      Export
                      </Button>
                      </div>
                      < div className = "overflow-x-auto" >
                        <table className="data-table" >
                          <thead>
                          <tr>
                          <th>Tenant </th>
                          < th > Plan </th>
                          < th > Active Users </th>
                            < th > Transactions </th>
                            < th > Storage </th>
                            < th > Monthly Usage </th>
                              < th > Billing Status </th>
                                < th className = "text-right" > Actions </th>
                                  </tr>
                                  </thead>
                                  <tbody>
{
  tenantUsage.map((usage) => (
    <tr key= { usage.tenant } >
    <td>
    <div className="flex items-center gap-3" >
  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10" >
  <Building2 className="h-4 w-4 text-primary" />
  </div>
  < span className = "font-medium" > { usage.tenant } </span>
  </div>
  </td>
  < td className = "text-muted-foreground" > { usage.plan } </td>
  < td >
  <div className="flex items-center gap-2" >
  <Users className="h-4 w-4 text-muted-foreground" />
  { usage.activeUsers }
  </div>
  </td>
  < td className = "text-muted-foreground" > { usage.transactions.toLocaleString() } </td>
  < td className = "text-muted-foreground" > { usage.storage } </td>
  < td className = "font-medium" > { usage.monthlyUsage } </td>
  < td >
  <BillingStatusBadge status={ usage.billingStatus } />
  </td>
  < td className = "text-right" >
  <Button variant="ghost" size = "sm" >
  View Details
  </Button>
  </td>
  </tr>
  ))
}
</tbody>
  </table>
  </div>
  </div>
  </TabsContent>

  < TabsContent value = "payments" className = "space-y-4" >
    <div className="rounded-lg border border-border bg-card" >
      <div className="flex flex-col gap-4 border-b border-border p-6 sm:flex-row sm:items-center sm:justify-between" >
        <div className="flex items-center gap-4" >
          <div className="relative" >
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search payments..." className = "w-64 pl-9" />
                </div>
                < Button variant = "outline" size = "sm" >
                  <Filter className="mr-2 h-4 w-4" />
                    Filters
                    </Button>
                    </div>
                    < Button variant = "outline" size = "sm" >
                      <Download className="mr-2 h-4 w-4" />
                        Export
                        </Button>
                        </div>
                        < div className = "overflow-x-auto" >
                          <table className="data-table" >
                            <thead>
                            <tr>
                            <th>Tenant </th>
                            < th > Invoice </th>
                            < th > Amount </th>
                            < th > Status </th>
                            < th > Method </th>
                            < th > Date </th>
                            < th className = "text-right" > Actions </th>
                              </tr>
                              </thead>
                              <tbody>
{
  recentPayments.map((payment) => (
    <tr key= { payment.invoice } >
    <td className="font-medium" > { payment.tenant } </td>
  < td className = "text-muted-foreground font-mono text-xs" > { payment.invoice } </td>
  < td className = "font-medium" > { payment.amount } </td>
  < td >
  <StatusBadge status={ payment.status } />
  </td>
  < td className = "text-muted-foreground" > { payment.method } </td>
  < td className = "text-muted-foreground" > { payment.date } </td>
  < td className = "text-right" >
  <Button variant="ghost" size = "sm" >
  <Receipt className="mr-2 h-4 w-4" />
  View
  </Button>
  </td>
  </tr>
  ))
}
</tbody>
  </table>
  </div>
  </div>
  </TabsContent>

  < TabsContent value = "failed" className = "space-y-4" >
    <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4" >
      <div className="flex items-center gap-3" >
        <AlertTriangle className="h-5 w-5 text-destructive" />
          <div>
          <p className="font-medium text-destructive" >
            { failedPayments.length } failed payments require attention
              </p>
              < p className = "text-sm text-muted-foreground" >
                Total outstanding: ₦1, 340,000
                  </p>
                  </div>
                  </div>
                  </div>

                  < div className = "rounded-lg border border-border bg-card" >
                    <div className="overflow-x-auto" >
                      <table className="data-table" >
                        <thead>
                        <tr>
                        <th>Tenant </th>
                        < th > Amount </th>
                        < th > Reason </th>
                        < th > Attempts </th>
                        < th > Last Attempt </th>
                          < th className = "text-right" > Actions </th>
                            </tr>
                            </thead>
                            <tbody>
{
  failedPayments.map((payment) => (
    <tr key= { payment.tenant } >
    <td className="font-medium" > { payment.tenant } </td>
  < td className = "font-medium text-destructive" >
  { payment.amount }
  </td>
  < td className = "text-muted-foreground" > { payment.reason } </td>
  < td className = "text-muted-foreground" > { payment.attempts } </td>
  < td className = "text-muted-foreground" > { payment.lastAttempt } </td>
  < td className = "text-right" >
  <Button size="sm" className = "mr-2" >
  Retry
  </Button>
  < Button variant = "outline" size = "sm" >
  Contact
  </Button>
  </td>
  </tr>
  ))
}
</tbody>
  </table>
  </div>
  </div>
  </TabsContent>

  < TabsContent value = "invoices" className = "space-y-4" >
    <div className="flex items-center justify-between" >
      <div className="flex items-center gap-4" >
        <div className="relative" >
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search invoices..." className = "w-64 pl-9" />
              </div>
              </div>
              < Button onClick = {() => setIsGenerateInvoiceOpen(true)}>
                <ArrowUpRight className="mr-2 h-4 w-4" />
                  Generate Invoice
                    </Button>
                    </div>

                    < div className = "rounded-lg border border-border bg-card" >
                      <div className="overflow-x-auto" >
                        <table className="data-table" >
                          <thead>
                          <tr>
                          <th>Invoice ID </th>
                            < th > Tenant </th>
                            < th > Period </th>
                            < th > Plan </th>
                            < th > Users </th>
                            < th > Total Amount </th>
                              < th > Status </th>
                              < th > Due Date </th>
                                < th className = "text-right" > Actions </th>
                                  </tr>
                                  </thead>
                                  <tbody>
{
  invoices.map((invoice) => (
    <tr key= { invoice.id } >
    <td className="font-mono text-xs text-muted-foreground" > { invoice.id } </td>
  < td className = "font-medium" > { invoice.tenant } </td>
  < td className = "text-muted-foreground" > { invoice.billingPeriod } </td>
  < td className = "text-muted-foreground" > { invoice.plan } </td>
  < td className = "text-muted-foreground" > { invoice.activeUsers } </td>
  < td className = "font-medium" > { invoice.totalAmount } </td>
  < td >
  <BillingStatusBadge status={ invoice.status } />
  </td>
  < td className = "text-muted-foreground" > { invoice.dueDate } </td>
  < td className = "text-right" >
  <div className="flex items-center justify-end gap-1" >
  <Button
                              variant="ghost"
                              size = "sm"
                              onClick = {() => {
    setSelectedInvoice(invoice);
                                setIsInvoiceViewOpen(true);
  }}
                            >
  <Eye className="h-4 w-4" />
    </Button>
    < Button variant = "ghost" size = "sm" >
      <Download className="h-4 w-4" />
        </Button>
        < Button variant = "ghost" size = "sm" >
          <Send className="h-4 w-4" />
            </Button>
            </div>
            </td>
            </tr>
                    ))}
</tbody>
  </table>
  </div>
  </div>
  </TabsContent>
  </Tabs>

{/* Invoice View Dialog */ }
<Dialog open={ isInvoiceViewOpen } onOpenChange = { setIsInvoiceViewOpen } >
  <DialogContent className="bg-card sm:max-w-lg" >
    <DialogHeader>
    <DialogTitle className="flex items-center gap-2" >
      <FileText className="h-5 w-5" />
        Invoice { selectedInvoice?.id }
</DialogTitle>
  <DialogDescription>
{ selectedInvoice?.tenant } — { selectedInvoice?.billingPeriod }
</DialogDescription>
  </DialogHeader>
{
  selectedInvoice && (
    <div className="space-y-4 py-4" >
      {/* Invoice Header */ }
      < div className = "flex items-center justify-between border-b border-border pb-4" >
        <div>
        <h3 className="text-xl font-bold text-primary" > FYNIX COBANK </h3>
          < p className = "text-xs text-muted-foreground" > Enterprise SaaS Platform </p>
            </div>
            < BillingStatusBadge status = { selectedInvoice.status } />
              </div>

  {/* Billing Details */ }
  <div className="space-y-3" >
    <div className="flex justify-between text-sm" >
      <span className="text-muted-foreground" > Tenant: </span>
        < span className = "font-medium" > { selectedInvoice.tenant } </span>
          </div>
          < div className = "flex justify-between text-sm" >
            <span className="text-muted-foreground" > Billing Period: </span>
              < span > { selectedInvoice.billingPeriod } </span>
              </div>
              < div className = "flex justify-between text-sm" >
                <span className="text-muted-foreground" > Plan: </span>
                  < span > { selectedInvoice.plan } </span>
                  </div>
                  < div className = "flex justify-between text-sm" >
                    <span className="text-muted-foreground" > Due Date: </span>
                      < span > { selectedInvoice.dueDate } </span>
                      </div>
                      </div>

  {/* Usage Summary */ }
  <div className="rounded-lg border border-border bg-muted/50 p-4 space-y-3" >
    <h4 className="font-medium text-sm" > Usage Summary </h4>
      < div className = "space-y-2 text-sm" >
        <div className="flex justify-between" >
          <span className="text-muted-foreground" > Base Plan Fee: </span>
            < span > { selectedInvoice.baseAmount } </span>
            </div>
            < div className = "flex justify-between" >
              <span className="text-muted-foreground" > Active Users({ selectedInvoice.activeUsers }): </span>
                < span > { selectedInvoice.userCharges } </span>
                </div>
                < div className = "flex justify-between border-t border-border pt-2 font-medium" >
                  <span>Total Amount: </span>
                    < span className = "text-lg" > { selectedInvoice.totalAmount } </span>
                      </div>
                      </div>
                      </div>

  {/* Currency Note */ }
  <p className="text-xs text-muted-foreground text-center" >
    All amounts are in Nigerian Naira(₦)
      </p>
      </div>
            )
}
<DialogFooter>
  <Button variant="outline" onClick = {() => setIsInvoiceViewOpen(false)}>
    Close
    </Button>
    < Button variant = "outline" >
      <Download className="mr-2 h-4 w-4" />
        Download PDF
          </Button>
          < Button >
          <Send className="mr-2 h-4 w-4" />
            Send to Tenant
              </Button>
              </DialogFooter>
              </DialogContent>
              </Dialog>

{/* Generate Invoice Dialog */ }
<Dialog open={ isGenerateInvoiceOpen } onOpenChange = { setIsGenerateInvoiceOpen } >
  <DialogContent className="bg-card sm:max-w-md" >
    <DialogHeader>
    <DialogTitle>Generate Invoice </DialogTitle>
      <DialogDescription>
                Create a new invoice for a tenant
  </DialogDescription>
  </DialogHeader>
  < div className = "space-y-4 py-4" >
  <div className= "space-y-2" >
    <Label htmlFor="tenant" > Select Tenant </Label>
      < Select >
      <SelectTrigger>
      <SelectValue placeholder="Choose a tenant" />
        </SelectTrigger>
        < SelectContent className = "bg-card" >
          <SelectItem value="acme" > Acme Financial Corp </SelectItem>
            < SelectItem value = "metro" > Metro Credit Union </SelectItem>
              < SelectItem value = "summit" > Summit Cooperative </SelectItem>
                < SelectItem value = "pine" > Pine State Bank </SelectItem>
                  </SelectContent>
                  </Select>
                  </div>
                  < div className = "space-y-2" >
                    <Label htmlFor="period" > Billing Period </Label>
                      < Select >
                      <SelectTrigger>
                      <SelectValue placeholder="Select period" />
                        </SelectTrigger>
                        < SelectContent className = "bg-card" >
                          <SelectItem value="mar-2024" > March 2024 </SelectItem>
                            < SelectItem value = "apr-2024" > April 2024 </SelectItem>
                              < SelectItem value = "may-2024" > May 2024 </SelectItem>
                                </SelectContent>
                                </Select>
                                </div>
                                < div className = "space-y-2" >
                                  <Label htmlFor="adjustment" > Manual Adjustment(₦) </Label>
                                    < Input
id = "adjustment"
type = "number"
placeholder = "0"
  />
  <p className="text-xs text-muted-foreground" >
    Add credits(negative) or additional charges(positive)
      </p>
      </div>
      < div className = "space-y-2" >
        <Label htmlFor="notes" > Invoice Notes </Label>
          < Input
id = "notes"
placeholder = "Optional notes for this invoice"
  />
  </div>
  </div>
  < DialogFooter >
  <Button variant="outline" onClick = {() => setIsGenerateInvoiceOpen(false)}>
    Cancel
    </Button>
    < Button onClick = {() => setIsGenerateInvoiceOpen(false)}>
      Generate Invoice
        </Button>
        </DialogFooter>
        </DialogContent>
        </Dialog>
        </div>
        </DashboardLayout>
  );
}