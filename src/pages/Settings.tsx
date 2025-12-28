import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Settings as SettingsIcon,
  Mail,
  Bell,
  Shield,
  Globe,
  Server,
  AlertTriangle,
} from "lucide-react";

export default function Settings() {
  return (
    <DashboardLayout title="System Settings">
      <div className="space-y-6 animate-fade-in">
        <Tabs defaultValue="general" className="space-y-6">
          <TabsList className="bg-muted">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="email">Email Templates</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-6">
            {/* Platform Settings */}
            <div className="rounded-lg border border-border bg-card p-6">
              <div className="mb-6 flex items-center gap-3">
                <div className="rounded-lg bg-primary/10 p-2">
                  <Globe className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Platform Settings</h3>
                  <p className="text-sm text-muted-foreground">
                    General configuration for the platform
                  </p>
                </div>
              </div>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="platformName">Platform Name</Label>
                  <Input id="platformName" defaultValue="Fynix CoBank" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="supportEmail">Support Email</Label>
                  <Input
                    id="supportEmail"
                    type="email"
                    defaultValue="support@fynixcobank.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timezone">Default Timezone</Label>
                  <Select defaultValue="utc">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-card">
                      <SelectItem value="utc">UTC</SelectItem>
                      <SelectItem value="est">Eastern Time (EST)</SelectItem>
                      <SelectItem value="pst">Pacific Time (PST)</SelectItem>
                      <SelectItem value="gmt">GMT</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency">Default Currency</Label>
                  <Select defaultValue="usd">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-card">
                      <SelectItem value="usd">USD ($)</SelectItem>
                      <SelectItem value="eur">EUR (€)</SelectItem>
                      <SelectItem value="gbp">GBP (£)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="mt-6 flex justify-end">
                <Button>Save Changes</Button>
              </div>
            </div>

            {/* API Settings */}
            <div className="rounded-lg border border-border bg-card p-6">
              <div className="mb-6 flex items-center gap-3">
                <div className="rounded-lg bg-primary/10 p-2">
                  <Server className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">API Configuration</h3>
                  <p className="text-sm text-muted-foreground">
                    Manage API keys and rate limits
                  </p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between rounded-lg border border-border p-4">
                  <div>
                    <p className="font-medium">Production API Key</p>
                    <p className="font-mono text-sm text-muted-foreground">
                      fc_live_••••••••••••••••
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    Rotate Key
                  </Button>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-border p-4">
                  <div>
                    <p className="font-medium">API Rate Limit</p>
                    <p className="text-sm text-muted-foreground">
                      Maximum requests per minute per tenant
                    </p>
                  </div>
                  <span className="text-sm font-medium">1000 req/min</span>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-border p-4">
                  <div>
                    <p className="font-medium">Webhook Retries</p>
                    <p className="text-sm text-muted-foreground">
                      Number of retry attempts for failed webhooks
                    </p>
                  </div>
                  <span className="text-sm font-medium">3 attempts</span>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="email" className="space-y-6">
            <div className="rounded-lg border border-border bg-card p-6">
              <div className="mb-6 flex items-center gap-3">
                <div className="rounded-lg bg-primary/10 p-2">
                  <Mail className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Email Templates</h3>
                  <p className="text-sm text-muted-foreground">
                    Customize automated email communications
                  </p>
                </div>
              </div>
              <div className="space-y-4">
                {[
                  "Welcome Email",
                  "Password Reset",
                  "Invoice Notification",
                  "Trial Expiration Warning",
                  "Subscription Confirmation",
                ].map((template) => (
                  <div
                    key={template}
                    className="flex items-center justify-between rounded-lg border border-border p-4"
                  >
                    <div>
                      <p className="font-medium">{template}</p>
                      <p className="text-sm text-muted-foreground">
                        Last updated 5 days ago
                      </p>
                    </div>
                    <Button variant="outline" size="sm">
                      Edit Template
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* SMTP Settings */}
            <div className="rounded-lg border border-border bg-card p-6">
              <h4 className="mb-4 font-semibold">SMTP Configuration</h4>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="smtpHost">SMTP Host</Label>
                  <Input id="smtpHost" defaultValue="smtp.sendgrid.net" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtpPort">Port</Label>
                  <Input id="smtpPort" defaultValue="587" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtpUser">Username</Label>
                  <Input id="smtpUser" defaultValue="apikey" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtpPass">Password</Label>
                  <Input id="smtpPass" type="password" defaultValue="••••••••" />
                </div>
              </div>
              <div className="mt-4 flex justify-end gap-3">
                <Button variant="outline">Test Connection</Button>
                <Button>Save</Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            <div className="rounded-lg border border-border bg-card p-6">
              <div className="mb-6 flex items-center gap-3">
                <div className="rounded-lg bg-primary/10 p-2">
                  <Bell className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Notification Rules</h3>
                  <p className="text-sm text-muted-foreground">
                    Configure when and how admins receive notifications
                  </p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between rounded-lg border border-border p-4">
                  <div>
                    <p className="font-medium">New Tenant Registration</p>
                    <p className="text-sm text-muted-foreground">
                      Notify when a new tenant signs up
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between rounded-lg border border-border p-4">
                  <div>
                    <p className="font-medium">Failed Payment Alerts</p>
                    <p className="text-sm text-muted-foreground">
                      Notify when a payment fails
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between rounded-lg border border-border p-4">
                  <div>
                    <p className="font-medium">Trial Expiration</p>
                    <p className="text-sm text-muted-foreground">
                      Notify 3 days before trial ends
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between rounded-lg border border-border p-4">
                  <div>
                    <p className="font-medium">Security Alerts</p>
                    <p className="text-sm text-muted-foreground">
                      Notify on suspicious activity
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between rounded-lg border border-border p-4">
                  <div>
                    <p className="font-medium">System Health Alerts</p>
                    <p className="text-sm text-muted-foreground">
                      Notify on service degradation
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="maintenance" className="space-y-6">
            <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-6">
              <div className="mb-4 flex items-center gap-3">
                <div className="rounded-lg bg-destructive/10 p-2">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-destructive">
                    Maintenance Mode
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    When enabled, all tenants will see a maintenance page
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border bg-card p-4">
                <div>
                  <p className="font-medium">Enable Maintenance Mode</p>
                  <p className="text-sm text-muted-foreground">
                    Platform will be inaccessible to tenants
                  </p>
                </div>
                <Switch />
              </div>
            </div>

            <div className="rounded-lg border border-border bg-card p-6">
              <h4 className="mb-4 font-semibold">Maintenance Message</h4>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="maintTitle">Title</Label>
                  <Input
                    id="maintTitle"
                    defaultValue="Scheduled Maintenance"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maintMessage">Message</Label>
                  <Textarea
                    id="maintMessage"
                    rows={4}
                    defaultValue="We're currently performing scheduled maintenance. We'll be back shortly. Thank you for your patience."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maintEta">Estimated Completion</Label>
                  <Input
                    id="maintEta"
                    type="datetime-local"
                  />
                </div>
              </div>
              <div className="mt-4 flex justify-end">
                <Button>Save Message</Button>
              </div>
            </div>

            {/* Danger Zone */}
            <div className="rounded-lg border border-destructive/50 bg-card p-6">
              <h4 className="mb-4 font-semibold text-destructive">Danger Zone</h4>
              <div className="space-y-4">
                <div className="flex items-center justify-between rounded-lg border border-border p-4">
                  <div>
                    <p className="font-medium">Clear All Cache</p>
                    <p className="text-sm text-muted-foreground">
                      Flush all cached data across the platform
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    Clear Cache
                  </Button>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-border p-4">
                  <div>
                    <p className="font-medium">Export All Data</p>
                    <p className="text-sm text-muted-foreground">
                      Download a complete backup of platform data
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    Export
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
