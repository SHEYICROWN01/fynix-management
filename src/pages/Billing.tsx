import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { MetricCard } from "@/components/ui/MetricCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DollarSign,
  TrendingUp,
  AlertTriangle,
  Download,
  Search,
  Filter,
  CreditCard,
  Receipt,
  ArrowUpRight,
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
  { month: "Aug", revenue: 52000 },
  { month: "Sep", revenue: 55000 },
  { month: "Oct", revenue: 58000 },
  { month: "Nov", revenue: 62000 },
  { month: "Dec", revenue: 65000 },
  { month: "Jan", revenue: 68000 },
  { month: "Feb", revenue: 71000 },
  { month: "Mar", revenue: 68420 },
];

const recentPayments = [
  {
    tenant: "Acme Financial Corp",
    amount: "$2,450.00",
    status: "paid" as const,
    method: "Credit Card",
    date: "Mar 15, 2024",
    invoice: "INV-2024-0342",
  },
  {
    tenant: "Metro Credit Union",
    amount: "$3,200.00",
    status: "paid" as const,
    method: "Bank Transfer",
    date: "Mar 14, 2024",
    invoice: "INV-2024-0341",
  },
  {
    tenant: "Coastal Savings Bank",
    amount: "$450.00",
    status: "failed" as const,
    method: "Credit Card",
    date: "Mar 12, 2024",
    invoice: "INV-2024-0340",
  },
  {
    tenant: "Summit Cooperative",
    amount: "$890.00",
    status: "paid" as const,
    method: "Credit Card",
    date: "Mar 11, 2024",
    invoice: "INV-2024-0339",
  },
  {
    tenant: "Pine State Bank",
    amount: "$450.00",
    status: "pending" as const,
    method: "Bank Transfer",
    date: "Mar 10, 2024",
    invoice: "INV-2024-0338",
  },
  {
    tenant: "Valley Credit Services",
    amount: "$4,100.00",
    status: "paid" as const,
    method: "Bank Transfer",
    date: "Mar 08, 2024",
    invoice: "INV-2024-0337",
  },
];

const failedPayments = [
  {
    tenant: "Coastal Savings Bank",
    amount: "$450.00",
    reason: "Card declined",
    attempts: 2,
    lastAttempt: "Mar 12, 2024",
  },
  {
    tenant: "Horizon Finance Group",
    amount: "$890.00",
    reason: "Insufficient funds",
    attempts: 1,
    lastAttempt: "Mar 10, 2024",
  },
];

export default function Billing() {
  return (
    <DashboardLayout title="Billing & Revenue">
      <div className="space-y-6 animate-fade-in">
        {/* Metrics */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="Monthly Revenue"
            value="$68,420"
            change="+12.5% from last month"
            changeType="positive"
            icon={DollarSign}
          />
          <MetricCard
            title="Annual Revenue"
            value="$721,840"
            change="On track for $850k"
            changeType="positive"
            icon={TrendingUp}
          />
          <MetricCard
            title="Failed Payments"
            value="2"
            change="$1,340 outstanding"
            changeType="negative"
            icon={AlertTriangle}
          />
          <MetricCard
            title="Avg Revenue/Tenant"
            value="$580"
            change="+5.2% this quarter"
            changeType="positive"
            icon={CreditCard}
          />
        </div>

        {/* Revenue Chart */}
        <div className="rounded-lg border border-border bg-card p-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Revenue Analytics</h3>
              <p className="text-sm text-muted-foreground">
                Monthly recurring revenue over time
              </p>
            </div>
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Export Report
            </Button>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueByMonth}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 91%)" />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 12, fill: "hsl(220, 9%, 46%)" }}
                  axisLine={{ stroke: "hsl(220, 13%, 91%)" }}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: "hsl(220, 9%, 46%)" }}
                  axisLine={{ stroke: "hsl(220, 13%, 91%)" }}
                  tickFormatter={(value) => `$${value / 1000}k`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(0, 0%, 100%)",
                    border: "1px solid hsl(220, 13%, 91%)",
                    borderRadius: "8px",
                  }}
                  formatter={(value: number) => [`$${value.toLocaleString()}`, "Revenue"]}
                />
                <Bar
                  dataKey="revenue"
                  fill="hsl(234, 89%, 54%)"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <Tabs defaultValue="payments" className="space-y-6">
          <TabsList className="bg-muted">
            <TabsTrigger value="payments">Payment History</TabsTrigger>
            <TabsTrigger value="failed">Failed Payments</TabsTrigger>
            <TabsTrigger value="invoices">Invoices</TabsTrigger>
          </TabsList>

          <TabsContent value="payments" className="space-y-4">
            <div className="rounded-lg border border-border bg-card">
              <div className="flex flex-col gap-4 border-b border-border p-6 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input placeholder="Search payments..." className="w-64 pl-9" />
                  </div>
                  <Button variant="outline" size="sm">
                    <Filter className="mr-2 h-4 w-4" />
                    Filters
                  </Button>
                </div>
                <Button variant="outline" size="sm">
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </Button>
              </div>
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Tenant</th>
                      <th>Invoice</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Method</th>
                      <th>Date</th>
                      <th className="text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentPayments.map((payment) => (
                      <tr key={payment.invoice}>
                        <td className="font-medium">{payment.tenant}</td>
                        <td className="text-muted-foreground">{payment.invoice}</td>
                        <td className="font-medium">{payment.amount}</td>
                        <td>
                          <StatusBadge status={payment.status} />
                        </td>
                        <td className="text-muted-foreground">{payment.method}</td>
                        <td className="text-muted-foreground">{payment.date}</td>
                        <td className="text-right">
                          <Button variant="ghost" size="sm">
                            <Receipt className="mr-2 h-4 w-4" />
                            View
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="failed" className="space-y-4">
            <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                <div>
                  <p className="font-medium text-destructive">
                    {failedPayments.length} failed payments require attention
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Total outstanding: $1,340.00
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-border bg-card">
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Tenant</th>
                      <th>Amount</th>
                      <th>Reason</th>
                      <th>Attempts</th>
                      <th>Last Attempt</th>
                      <th className="text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {failedPayments.map((payment) => (
                      <tr key={payment.tenant}>
                        <td className="font-medium">{payment.tenant}</td>
                        <td className="font-medium text-destructive">
                          {payment.amount}
                        </td>
                        <td className="text-muted-foreground">{payment.reason}</td>
                        <td className="text-muted-foreground">{payment.attempts}</td>
                        <td className="text-muted-foreground">{payment.lastAttempt}</td>
                        <td className="text-right">
                          <Button size="sm" className="mr-2">
                            Retry
                          </Button>
                          <Button variant="outline" size="sm">
                            Contact
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="invoices" className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input placeholder="Search invoices..." className="w-64 pl-9" />
                </div>
              </div>
              <Button>
                <ArrowUpRight className="mr-2 h-4 w-4" />
                Generate Invoice
              </Button>
            </div>

            <div className="rounded-lg border border-border bg-card p-8 text-center">
              <Receipt className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-semibold">Invoice Management</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                View, download, and send invoices to tenants. Generate custom invoices
                for manual billing adjustments.
              </p>
              <Button className="mt-4" variant="outline">
                View All Invoices
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
