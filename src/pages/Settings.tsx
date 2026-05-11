import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Globe, Server, Mail, Bell, AlertTriangle, MessageSquare,
  Eye, EyeOff, CheckCircle2, Copy, RefreshCw, Zap, Shield,
  Link, KeyRound, Settings as SettingsIcon, Loader2, WifiOff,
  Info,
} from "lucide-react";
import { toast as showToast } from "sonner";
import { smsProviderApi, type SmsProviderConfig, type SaveSmsProviderPayload } from "@/lib/api";

// ─── Provider → default base URL map ─────────────────────────────────────────
const PROVIDER_URLS: Record<string, string> = {
  termii: "https://api.ng.termii.com/api",
  infobip: "https://api.infobip.com",
  africastalking: "https://api.africastalking.com",
  twilio: "https://api.twilio.com/2010-04-01",
  bulk_sms: "https://www.bulksmsnigeria.com/api/v2",
  multitexter: "https://app.multitexter.com/v2/app",
  other: "",
};

export default function Settings() {
  // ── General ──────────────────────────────────────────────────────────────
  const [platformName, setPlatformName] = useState("Fynix CoBank");
  const [supportEmail, setSupportEmail] = useState("support@fynixcobank.com");
  const [timezone, setTimezone] = useState("africa-lagos");
  const [isSaving, setIsSaving] = useState(false);

  // ── SMS Provider — form state ─────────────────────────────────────────────
  const [smsProvider, setSmsProvider] = useState("termii");
  const [smsApiKey, setSmsApiKey] = useState("");
  const [smsApiKeyHint, setSmsApiKeyHint] = useState<string | null>(null); // from server
  const [smsSecretKey, setSmsSecretKey] = useState("");
  const [smsSecretKeyHint, setSmsSecretKeyHint] = useState<string | null>(null);
  const [showSecretKey, setShowSecretKey] = useState(false);
  const [smsApiUrl, setSmsApiUrl] = useState("https://api.ng.termii.com/api");
  const [smsSenderId, setSmsSenderId] = useState("FynixBank");
  const [smsChannel, setSmsChannel] = useState("generic");
  const [smsWebhookUrl, setSmsWebhookUrl] = useState("");
  const [smsDefaultRate, setSmsDefaultRate] = useState("30");
  const [smsProviderCost, setSmsProviderCost] = useState("18");
  const [smsLowThreshold, setSmsLowThreshold] = useState("3000");
  const [smsMaxRetries, setSmsMaxRetries] = useState("3");
  const [smsFailureAlert, setSmsFailureAlert] = useState("2.0");
  const [maskPhones, setMaskPhones] = useState(true);
  const [require2fa, setRequire2fa] = useState(true);
  const [autoSuspend, setAutoSuspend] = useState(true);
  const [logRetention, setLogRetention] = useState("90");

  // ── SMS Provider — UI state ───────────────────────────────────────────────
  const [showApiKey, setShowApiKey] = useState(false);
  const [smsSaving, setSmsSaving] = useState(false);
  const [smsTesting, setSmsTesting] = useState(false);
  const [smsLoading, setSmsLoading] = useState(true);  // loading existing config
  const [smsLoadError, setSmsLoadError] = useState(false);
  const [smsTestPhone, setSmsTestPhone] = useState("");
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [configId, setConfigId] = useState<number | null>(null);

  // ── Load existing config on mount ────────────────────────────────────────
  useEffect(() => {
    (async () => {
      setSmsLoading(true);
      setSmsLoadError(false);
      try {
        const res = await smsProviderApi.getConfig();
        if (res.success) populateForm(res.data);
      } catch (err: unknown) {
        // 404 = not configured yet — that's fine, show empty form
        if ((err as { status?: number })?.status !== 404) {
          setSmsLoadError(true);
        }
      } finally {
        setSmsLoading(false);
      }
    })();
  }, []);

  function populateForm(d: SmsProviderConfig) {
    setConfigId(d.id);
    setSmsProvider(d.provider);
    setSmsApiUrl(d.api_base_url);
    setSmsApiKeyHint(d.api_key_hint);
    setSmsSecretKeyHint(d.secret_key_hint ?? null);
    setSmsSenderId(d.sender_id);
    setSmsChannel(d.channel);
    setSmsWebhookUrl(d.webhook_url ?? "");
    setSmsDefaultRate(parseFloat(d.default_charge_per_sms).toString());
    setSmsProviderCost(parseFloat(d.provider_cost_per_sms).toString());
    setSmsLowThreshold(d.low_balance_threshold.toString());
    setSmsMaxRetries(d.max_retries.toString());
    setSmsFailureAlert(parseFloat(d.failure_rate_alert_threshold).toString());
    setMaskPhones(d.mask_phone_numbers);
    setRequire2fa(d.require_2fa_for_key_rotation);
    setAutoSuspend(d.auto_suspend_on_depletion);
    setLogRetention(d.log_retention_days.toString());
    setLastSaved(d.updated_at);
  }

  // ── When provider changes, auto-fill base URL ─────────────────────────────
  function handleProviderChange(p: string) {
    setSmsProvider(p);
    if (PROVIDER_URLS[p]) setSmsApiUrl(PROVIDER_URLS[p]);
    setSmsApiKeyHint(null);
    setSmsApiKey("");
    setSmsSecretKey("");
    setSmsSecretKeyHint(null);
  }

  const smsMargin = () => {
    const charge = parseFloat(smsDefaultRate) || 0;
    const cost = parseFloat(smsProviderCost) || 0;
    if (charge === 0) return 0;
    return Math.round(((charge - cost) / charge) * 100);
  };

  // ── Save SMS config ───────────────────────────────────────────────────────
  const handleSaveSms = async () => {
    // API key only required for brand-new configurations
    if (!configId && !smsApiKey) {
      showToast.error("API Key is required to set up a new configuration.");
      return;
    }
    setSmsSaving(true);
    try {
      const payload: SaveSmsProviderPayload = {
        provider: smsProvider,
        api_base_url: smsApiUrl,
        sender_id: smsSenderId,
        channel: smsChannel,
        webhook_url: smsWebhookUrl || undefined,
        default_charge_per_sms: parseFloat(smsDefaultRate),
        provider_cost_per_sms: parseFloat(smsProviderCost),
        low_balance_threshold: parseInt(smsLowThreshold),
        max_retries: parseInt(smsMaxRetries),
        failure_rate_alert_threshold: parseFloat(smsFailureAlert),
        mask_phone_numbers: maskPhones,
        require_2fa_for_key_rotation: require2fa,
        auto_suspend_on_depletion: autoSuspend,
        log_retention_days: parseInt(logRetention),
      };

      // Only include api_key when the user has typed one (new config or intentional rotation)
      if (smsApiKey) payload.api_key = smsApiKey;
      if (smsSecretKey) payload.secret_key = smsSecretKey;

      const res = await smsProviderApi.saveConfig(payload);
      if (res.success) {
        populateForm(res.data);
        setSmsApiKey(""); // clear plain-text key after saving
        setSmsSecretKey(""); // clear plain-text secret after saving
        showToast.success("SMS configuration saved", {
          description: `Provider: ${res.data.provider} · Margin: ${res.data.profit_margin_percent}%`,
        });
      }
    } catch (err: unknown) {
      const e = err as { errors?: Record<string, string[]>; message?: string };
      if (e?.errors) {
        const firstError = Object.values(e.errors)[0]?.[0];
        showToast.error("Validation error", { description: firstError });
      } else {
        showToast.error("Failed to save", { description: e?.message ?? "Unexpected error occurred." });
      }
    } finally {
      setSmsSaving(false);
    }
  };

  // ── Test connection ───────────────────────────────────────────────────────
  const handleTestSms = async () => {
    if (!smsTestPhone) {
      showToast.error("Enter a test phone number first.");
      return;
    }
    if (!configId && !smsApiKey) {
      showToast.error("Save your SMS configuration first before testing.");
      return;
    }
    setSmsTesting(true);
    try {
      const res = await smsProviderApi.testConnection(smsTestPhone);
      if (res.success) {
        showToast.success("Test SMS sent!", {
          description: `Sent to ${res.data.phone} via ${res.data.provider} · ID: ${res.data.message_id}`,
        });
      }
    } catch (err: unknown) {
      const e = err as { message?: string; provider_error?: string };
      showToast.error("Test SMS failed", {
        description: e?.provider_error ?? e?.message ?? "Provider returned an error.",
      });
    } finally {
      setSmsTesting(false);
    }
  };

  const handleSaveGeneral = async () => {
    setIsSaving(true);
    await new Promise((r) => setTimeout(r, 600));
    setIsSaving(false);
    showToast.success("Settings saved", { description: "Platform settings updated." });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast.success("Copied to clipboard");
  };

  return (
    <DashboardLayout title= "System Settings" >
    <div className="space-y-6" >
      <Tabs defaultValue="general" className = "space-y-6" >
        <TabsList className="bg-muted w-full sm:w-auto" >
          <TabsTrigger value="general" > General </TabsTrigger>
            < TabsTrigger value = "sms" className = "gap-1.5" >
              <MessageSquare className="h-3.5 w-3.5" /> SMS Provider
                </TabsTrigger>
                < TabsTrigger value = "email" > Email </TabsTrigger>
                  < TabsTrigger value = "notifications" > Notifications </TabsTrigger>
                    < TabsTrigger value = "maintenance" > Maintenance </TabsTrigger>
                      </TabsList>

  {/* ══ GENERAL TAB ══════════════════════════════════════════ */ }
  <TabsContent value="general" className = "space-y-6" >
    <div className="rounded-lg border border-border bg-card p-6" >
      <div className="mb-6 flex items-center gap-3" >
        <div className="rounded-lg bg-primary/10 p-2" >
          <Globe className="h-5 w-5 text-primary" />
            </div>
            < div >
            <h3 className="text-lg font-semibold" > Platform Settings </h3>
              < p className = "text-sm text-muted-foreground" > General configuration for the platform </p>
                </div>
                </div>
                < div className = "grid gap-6 md:grid-cols-2" >
                <div className= "space-y-2" >
                  <Label htmlFor="platformName" > Platform Name </Label>
                    < Input id = "platformName" value = { platformName } onChange = {(e) => setPlatformName(e.target.value)
} />
  </div>
  < div className = "space-y-2" >
    <Label htmlFor="supportEmail" > Support Email </Label>
      < Input id = "supportEmail" type = "email" value = { supportEmail } onChange = {(e) => setSupportEmail(e.target.value)} />
        </div>
        < div className = "space-y-2" >
          <Label>Default Timezone </Label>
            < Select value = { timezone } onValueChange = { setTimezone } >
              <SelectTrigger><SelectValue /></SelectTrigger >
              <SelectContent>
              <SelectItem value="africa-lagos" > Africa / Lagos(WAT) </SelectItem>
                < SelectItem value = "utc" > UTC </SelectItem>
                  < SelectItem value = "est" > Eastern Time(EST) </SelectItem>
                    < SelectItem value = "gmt" > GMT </SelectItem>
                      </SelectContent>
                      </Select>
                      </div>
                      < div className = "space-y-2" >
                        <Label>Default Currency </Label>
                          < Select defaultValue = "ngn" >
                            <SelectTrigger><SelectValue /></SelectTrigger >
                            <SelectContent>
                            <SelectItem value="ngn" > NGN(₦) </SelectItem>
                              < SelectItem value = "usd" > USD($) </SelectItem>
                                < SelectItem value = "eur" > EUR(€) </SelectItem>
                                  < SelectItem value = "gbp" > GBP(£) </SelectItem>
                                    </SelectContent>
                                    </Select>
                                    </div>
                                    </div>
                                    < div className = "mt-6 flex justify-end" >
                                      <Button onClick={ handleSaveGeneral } disabled = { isSaving } >
                                        { isSaving?<>< Loader2 className = "h-3.5 w-3.5 mr-1.5 animate-spin" /> Saving…</> : "Save Changes"}
</Button>
  </div>
  </div>

  < div className = "rounded-lg border border-border bg-card p-6" >
    <div className="mb-6 flex items-center gap-3" >
      <div className="rounded-lg bg-primary/10 p-2" >
        <Server className="h-5 w-5 text-primary" />
          </div>
          < div >
          <h3 className="text-lg font-semibold" > API Configuration </h3>
            < p className = "text-sm text-muted-foreground" > Manage platform API keys and rate limits </p>
              </div>
              </div>
              < div className = "space-y-4" >
                <div className="flex items-center justify-between rounded-lg border border-border p-4" >
                  <div>
                  <p className="font-medium" > Production API Key </p>
                    < p className = "font-mono text-sm text-muted-foreground" > fc_live_••••••••••••••••</p>
                      </div>
                      < Button variant = "outline" size = "sm" > <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Rotate Key </Button>
                        </div>
                        < div className = "flex items-center justify-between rounded-lg border border-border p-4" >
                          <div>
                          <p className="font-medium" > API Rate Limit </p>
                            < p className = "text-sm text-muted-foreground" > Maximum requests per minute per tenant </p>
                              </div>
                              < span className = "text-sm font-medium" > 1,000 req / min </span>
                                </div>
                                < div className = "flex items-center justify-between rounded-lg border border-border p-4" >
                                  <div>
                                  <p className="font-medium" > Webhook Retries </p>
                                    < p className = "text-sm text-muted-foreground" > Number of retry attempts for failed webhooks </p>
                                      </div>
                                      < span className = "text-sm font-medium" > 3 attempts </span>
                                        </div>
                                        </div>
                                        </div>
                                        </TabsContent>

{/* ══ SMS PROVIDER TAB ═════════════════════════════════════ */ }
<TabsContent value="sms" className = "space-y-6" >

  {/* Loading state */ }
{
  smsLoading && (
    <div className="flex items-center justify-center gap-3 rounded-lg border border-border bg-card p-10" >
      <Loader2 className="h-5 w-5 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground" > Loading SMS configuration…</p>
          </div>
            )
}

{/* Load error */ }
{
  !smsLoading && smsLoadError && (
    <div className="flex items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4" >
      <WifiOff className="h-5 w-5 text-destructive shrink-0" />
        <div className="flex-1" >
          <p className="text-sm font-semibold text-destructive" > Could not load configuration </p>
            < p className = "text-xs text-muted-foreground mt-0.5" > Check your connection and try refreshing the page.</p>
              </div>
              < Button size = "sm" variant = "outline" onClick = {() => window.location.reload()
}>
  <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Retry
    </Button>
    </div>
            )}

{/* Config loaded (or fresh) */ }
{
  !smsLoading && !smsLoadError && (
    <>
    {/* Status banner — existing config */ }
                {
    configId && lastSaved && (
      <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 dark:bg-emerald-950/20 px-4 py-2.5" >
        <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <p className="text-xs text-emerald-700 dark:text-emerald-300 flex-1" >
            Configuration active — last saved { new Date(lastSaved).toLocaleString() }
    </p>
      < span className = "text-xs font-mono text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30 px-2 py-0.5 rounded-full capitalize" >
        { smsProvider }
        </span>
        </div>
                )
  }

  {/* Not yet configured */ }
  {
    !configId && (
      <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/20 px-4 py-2.5" >
        <Info className="h-4 w-4 text-amber-500 shrink-0" />
          <p className="text-xs text-amber-700 dark:text-amber-300" >
            No SMS provider configured yet.Fill in the form below and save to activate SMS functionality.
                    </p>
              </div>
                )
  }

  {/* ── Provider Credentials ─────────────────────────────── */ }
  <div className="rounded-lg border border-border bg-card p-6" >
    <div className="mb-6 flex items-center gap-3" >
      <div className="rounded-lg bg-indigo-500/10 p-2" >
        <MessageSquare className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          < div >
          <h3 className="text-lg font-semibold" > Provider Credentials </h3>
            < p className = "text-sm text-muted-foreground" > API key and endpoint for your SMS gateway </p>
              </div>
              </div>

              < div className = "grid gap-5 md:grid-cols-2" >
                {/* Provider */ }
                < div className = "space-y-2" >
                  <Label>SMS Provider </Label>
                    < Select value = { smsProvider } onValueChange = { handleProviderChange } >
                      <SelectTrigger><SelectValue /></SelectTrigger >
                      <SelectContent>
                      <SelectItem value="termii" > Termii </SelectItem>
                        < SelectItem value = "infobip" > Infobip </SelectItem>
                          < SelectItem value = "africastalking" > Africa's Talking</SelectItem>
                            < SelectItem value = "twilio" > Twilio </SelectItem>
                              < SelectItem value = "bulk_sms" > BulkSMS Nigeria </SelectItem>
                                < SelectItem value = "multitexter" > MultiTexter </SelectItem>
                                  < SelectItem value = "other" > Other / Custom </SelectItem>
                                    </SelectContent>
                                    </Select>
                                    < p className = "text-xs text-muted-foreground" > Select your SMS gateway provider </p>
                                      </div>

  {/* Channel */ }
  <div className="space-y-2" >
    <Label>SMS Channel </Label>
      < Select value = { smsChannel } onValueChange = { setSmsChannel } >
        <SelectTrigger><SelectValue /></SelectTrigger >
        <SelectContent>
        <SelectItem value="generic" > Generic(Default) </SelectItem>
          < SelectItem value = "dnd" > DND </SelectItem>
            < SelectItem value = "whatsapp" > WhatsApp </SelectItem>
              < SelectItem value = "device" > Device </SelectItem>
                </SelectContent>
                </Select>
                < p className = "text-xs text-muted-foreground" > Delivery channel for outbound messages </p>
                  </div>

                    {/* API Base URL */ }
    < div className = "space-y-2 md:col-span-2" >
      <Label htmlFor="smsApiUrl" > API Base URL </Label>
        < div className = "relative" >
          <Link className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
                          id="smsApiUrl"
  className = "pl-8 font-mono text-sm"
  placeholder = "https://api.yourprovider.com/api"
  value = { smsApiUrl }
  onChange = {(e) => setSmsApiUrl(e.target.value)
}
                        />
  </div>
  < p className = "text-xs text-muted-foreground" > The base endpoint URL provided by your SMS gateway </p>
    </div>

{/* API Key */ }
<div className="space-y-2 md:col-span-2" >
  <Label htmlFor="smsApiKey" >
    API Key / Secret Token
{
  smsApiKeyHint && (
    <span className="ml-2 font-normal text-xs text-muted-foreground" >
      (current: <span className="font-mono" > { smsApiKeyHint } </span>)
  </span>
                        )
}
</Label>
  < div className = "flex gap-2" >
    <div className="relative flex-1" >
      <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input
                            id="smsApiKey"
type = { showApiKey? "text": "password" }
className = "pl-8 font-mono text-sm pr-10"
placeholder = { smsApiKeyHint? "Leave blank to keep existing key": "Enter your API key or secret token" }
value = { smsApiKey }
onChange = {(e) => setSmsApiKey(e.target.value)}
                          />
  < button
type = "button"
onClick = {() => setShowApiKey(!showApiKey)}
className = "absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" >
  { showApiKey?<EyeOff className = "h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
</button>
  </div>
{
  smsApiKey && (
    <Button variant="outline" size = "icon" onClick = {() => copyToClipboard(smsApiKey)
} title = "Copy API key" >
  <Copy className="h-3.5 w-3.5" />
    </Button>
                        )}
</div>
  < p className = "text-xs text-muted-foreground" > Encrypted at rest · Never returned in API responses </p>
    </div>

{/* Secret Key */ }
<div className="space-y-2 md:col-span-2" >
  <Label htmlFor="smsSecretKey" >
    Secret Key
{
  smsSecretKeyHint && (
    <span className="ml-2 font-normal text-xs text-muted-foreground" >
      (current: <span className="font-mono" > { smsSecretKeyHint } </span>)
  </span>
                        )
}
<span className="ml-2 text-xs text-muted-foreground font-normal" >— required by Termii & amp; some providers </span>
  </Label>
  < div className = "flex gap-2" >
    <div className="relative flex-1" >
      <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input
                            id="smsSecretKey"
type = { showSecretKey? "text": "password" }
className = "pl-8 font-mono text-sm pr-10"
placeholder = { smsSecretKeyHint? "Leave blank to keep current secret key": "Enter your secret key (if required by provider)" }
value = { smsSecretKey }
onChange = {(e) => setSmsSecretKey(e.target.value)}
                          />
  < button
type = "button"
onClick = {() => setShowSecretKey(!showSecretKey)}
className = "absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" >
  { showSecretKey?<EyeOff className = "h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
</button>
  </div>
{
  smsSecretKey && (
    <Button variant="outline" size = "icon" onClick = {() => copyToClipboard(smsSecretKey)
} title = "Copy secret key" >
  <Copy className="h-3.5 w-3.5" />
    </Button>
                        )}
</div>
  < p className = "text-xs text-muted-foreground" > Encrypted at rest · Leave blank if your provider doesn't use a separate secret key</p>
    </div>

{/* Sender ID */ }
<div className="space-y-2" >
  <Label htmlFor="smsSenderId" > Sender ID / From Name </Label>
    < Input
id = "smsSenderId"
placeholder = "e.g. FynixBank"
value = { smsSenderId }
onChange = {(e) => setSmsSenderId(e.target.value)}
maxLength = { 11}
  />
  <p className="text-xs text-muted-foreground" > Max 11 characters — must be registered with your provider </p>
    </div>

{/* Webhook */ }
<div className="space-y-2" >
  <Label htmlFor="smsWebhook" > Delivery Report Webhook URL </Label>
    < div className = "relative" >
      <Link className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input
                          id="smsWebhook"
className = "pl-8 font-mono text-sm"
placeholder = "https://ourapi.fynixcobanking.com/api/webhooks/sms"
value = { smsWebhookUrl }
onChange = {(e) => setSmsWebhookUrl(e.target.value)}
                        />
  </div>
  < p className = "text-xs text-muted-foreground" > Provider will POST delivery receipts here(optional) </p>
    </div>
    </div>

    < Separator className = "my-6" />

      {/* Test SMS */ }
      < div className = "rounded-xl bg-muted/40 border border-border p-4" >
        <h4 className="text-sm font-semibold mb-3 flex items-center gap-2" >
          <Zap className="h-4 w-4 text-amber-500" /> Send a Test SMS
            </h4>
            < div className = "flex gap-3" >
              <Input
                        placeholder="e.g. 08012345678"
value = { smsTestPhone }
onChange = {(e) => setSmsTestPhone(e.target.value)}
className = "flex-1"
  />
  <Button
                        variant="outline"
onClick = { handleTestSms }
disabled = { smsTesting || (!smsApiKey && !configId)}
className = "gap-1.5 shrink-0" >
{
  smsTesting
    ?<>< Loader2 className = "h-3.5 w-3.5 animate-spin" /> Sending…</>
                          : <><Zap className="h-3.5 w-3.5" /> Send Test </>}
</Button>
  </div>
{
  !smsApiKey && !configId && (
    <p className="text-xs text-amber-600 dark:text-amber-400 mt-2" >
                        ⚠ Save your configuration first before sending a test
    </p>
                    )
}
{
  configId && (
    <p className="text-xs text-muted-foreground mt-2" >
      Rate limited to 5 requests / minute
        </p>
                    )
}
</div>

  < div className = "mt-6 flex items-center justify-between gap-3 flex-wrap" >
    <div />
    < Button
onClick = { handleSaveSms }
disabled = { smsSaving }
className = "gap-1.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700" >
{
  smsSaving
    ?<>< Loader2 className = "h-3.5 w-3.5 animate-spin" /> Saving…</>
                        : <><CheckCircle2 className="h-3.5 w-3.5" /> { configId? "Update SMS Configuration": "Save SMS Configuration" } </>}
</Button>
  </div>
  </div>

{/* ── Pricing & Business Rules ─────────────────────────── */ }
<div className="rounded-lg border border-border bg-card p-6" >
  <div className="mb-6 flex items-center gap-3" >
    <div className="rounded-lg bg-emerald-500/10 p-2" >
      <SettingsIcon className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
        </div>
        < div >
        <h3 className="text-lg font-semibold" > Pricing & amp; Business Rules </h3>
          < p className = "text-sm text-muted-foreground" > Default rates and thresholds — overridable per institution </p>
            </div>
            </div>
            < div className = "grid gap-5 md:grid-cols-2 lg:grid-cols-3" >
              <div className="space-y-2" >
                <Label htmlFor="smsDefaultRate" > Default Charge Rate(₦/SMS)</Label >
                  <div className="relative" >
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium" >₦</span>
                < Input id = "smsDefaultRate" className = "pl-7" value = { smsDefaultRate } onChange = {(e) => setSmsDefaultRate(e.target.value)} />
                </div>
                < p className = "text-xs text-muted-foreground" > What institutions are charged per SMS </p>
                </div>
                < div className = "space-y-2" >
                <Label htmlFor="smsProviderCost" > Provider Cost(₦/SMS)</Label >
                  <div className="relative" >
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium" >₦</span>
                < Input id = "smsProviderCost" className = "pl-7" value = { smsProviderCost } onChange = {(e) => setSmsProviderCost(e.target.value)} />
                </div>
                < p className = "text-xs text-muted-foreground" > What you pay the provider per SMS </p>
                </div>
                < div className = "space-y-2" >
                <Label>Profit Margin </Label>
                < div className = {`flex items-center justify-between rounded-lg border px-4 py-2.5 ${smsMargin() > 0 ? "border-emerald-200 bg-emerald-50 dark:bg-emerald-950/20" : "border-red-200 bg-red-50"}`}>
                <span className="text-sm text-muted-foreground" >₦{ smsDefaultRate } − ₦{ smsProviderCost } </span>
                < span className = {`text-lg font-extrabold ${smsMargin() > 0 ? "text-emerald-600" : "text-red-600"}`}> { smsMargin() } % </span>
                </div>
                < p className = "text-xs text-muted-foreground" > Auto - calculated from above rates </p>
                </div>
                < div className = "space-y-2" >
                <Label htmlFor="smsLowThreshold" > Low Balance Threshold(SMS units) </Label>
                < Input id = "smsLowThreshold" value = { smsLowThreshold } onChange = {(e) => setSmsLowThreshold(e.target.value)} />
                < p className = "text-xs text-muted-foreground" > Alert when wallet drops below this </p>
                </div>
                < div className = "space-y-2" >
                <Label>Max Delivery Retries </Label>
                < Select value = { smsMaxRetries } onValueChange = { setSmsMaxRetries } >
                <SelectTrigger><SelectValue /></SelectTrigger >
                <SelectContent>
                {
                  [1, 2, 3, 4, 5].map((n) => (
                    <SelectItem key= { n } value = { String(n) } > { n } { n === 1 ? "retry" : "retries"} </SelectItem>
                ))}
</SelectContent>
  </Select>
  < p className = "text-xs text-muted-foreground" > Retries on failed delivery </p>
    </div>
    < div className = "space-y-2" >
      <Label htmlFor="smsFailureAlert" > Failure Rate Alert Threshold(%) </Label>
        < Input id = "smsFailureAlert" value = { smsFailureAlert } onChange = {(e) => setSmsFailureAlert(e.target.value)} />
          < p className = "text-xs text-muted-foreground" > Alert when failure rate exceeds this </p>
            </div>
            </div>
            < div className = "mt-6 flex justify-end" >
              <Button onClick={ handleSaveSms } disabled = { smsSaving } className = "gap-1.5" >
                { smsSaving?<Loader2 className = "h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                      Save Pricing Rules
  </Button>
  </div>
  </div>

{/* ── Security & Compliance ────────────────────────────── */ }
<div className="rounded-lg border border-border bg-card p-6" >
  <div className="mb-5 flex items-center gap-3" >
    <div className="rounded-lg bg-rose-500/10 p-2" >
      <Shield className="h-5 w-5 text-rose-600 dark:text-rose-400" />
        </div>
        < div >
        <h3 className="text-lg font-semibold" > Security & amp; Compliance </h3>
          < p className = "text-sm text-muted-foreground" > Access controls and audit settings for SMS operations </p>
            </div>
            </div>
            < div className = "space-y-4" >
            <div className= "flex items-center justify-between rounded-lg border border-border p-4" >
              <div>
              <p className="font-medium text-sm" > Mask Phone Numbers in Logs </p>
                < p className = "text-xs text-muted-foreground" > Show only last 4 digits(e.g. **** 5621) </p>
                  </div>
                  < Switch checked = { maskPhones } onCheckedChange = { setMaskPhones } />
                    </div>
                    < div className = "flex items-center justify-between rounded-lg border border-border p-4" >
                      <div>
                      <p className="font-medium text-sm" > Require 2FA to Change API Key </p>
                        < p className = "text-xs text-muted-foreground" > Extra verification step when rotating credentials </p>
                          </div>
                          < Switch checked = { require2fa } onCheckedChange = { setRequire2fa } />
                            </div>
                            < div className = "flex items-center justify-between rounded-lg border border-border p-4" >
                              <div>
                              <p className="font-medium text-sm" > Auto - Suspend on Balance Depletion </p>
                                < p className = "text-xs text-muted-foreground" > Suspend institution when balance reaches zero </p>
                                  </div>
                                  < Switch checked = { autoSuspend } onCheckedChange = { setAutoSuspend } />
                                    </div>
                                    < div className = "flex items-center justify-between rounded-lg border border-border p-4" >
                                      <div>
                                      <p className="font-medium text-sm" > SMS Audit Log Retention </p>
                                        < p className = "text-xs text-muted-foreground" > How long delivery logs are kept </p>
                                          </div>
                                          < Select value = { logRetention } onValueChange = { setLogRetention } >
                                            <SelectTrigger className="w-36" > <SelectValue /></SelectTrigger >
                                              <SelectContent>
                                              <SelectItem value="30" > 30 days </SelectItem>
                                                < SelectItem value = "60" > 60 days </SelectItem>
                                                  < SelectItem value = "90" > 90 days </SelectItem>
                                                    < SelectItem value = "180" > 6 months </SelectItem>
                                                      < SelectItem value = "365" > 1 year </SelectItem>
                                                        </SelectContent>
                                                        </Select>
                                                        </div>
                                                        </div>
                                                        < div className = "mt-5 flex justify-end" >
                                                          <Button onClick={ handleSaveSms } disabled = { smsSaving } variant = "outline" className = "gap-1.5" >
                                                            { smsSaving?<Loader2 className = "h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                      Save Security Settings
  </Button>
  </div>
  </div>
  </>
            )}
</TabsContent>


          {/* ══ EMAIL TAB ════════════════════════════════════════════ */}
          <TabsContent value="email" className="space-y-6">
            <div className="rounded-lg border border-border bg-card p-6">
              <div className="mb-6 flex items-center gap-3">
                <div className="rounded-lg bg-primary/10 p-2">
                  <Mail className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Email Templates</h3>
                  <p className="text-sm text-muted-foreground">Customize automated email communications</p>
                </div>
              </div>
              <div className="space-y-4">
                {["Welcome Email", "Password Reset", "Invoice Notification", "Trial Expiration Warning", "Subscription Confirmation"].map((t) => (
                  <div key={t} className="flex items-center justify-between rounded-lg border border-border p-4">
                    <div>
                      <p className="font-medium">{t}</p>
                      <p className="text-sm text-muted-foreground">Last updated 5 days ago</p>
                    </div>
                    <Button variant="outline" size="sm">Edit Template</Button>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-lg border border-border bg-card p-6">
              <h4 className="mb-4 font-semibold">SMTP Configuration</h4>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2"><Label>SMTP Host</Label><Input defaultValue="smtp.sendgrid.net" /></div>
                <div className="space-y-2"><Label>Port</Label><Input defaultValue="587" /></div>
                <div className="space-y-2"><Label>Username</Label><Input defaultValue="apikey" /></div>
                <div className="space-y-2"><Label>Password</Label><Input type="password" defaultValue="••••••••" /></div>
              </div>
              <div className="mt-4 flex justify-end gap-3">
                <Button variant="outline">Test Connection</Button>
                <Button>Save</Button>
              </div>
            </div>
          </TabsContent>

          {/* ══ NOTIFICATIONS TAB ════════════════════════════════════ */}
          <TabsContent value="notifications" className="space-y-6">
            <div className="rounded-lg border border-border bg-card p-6">
              <div className="mb-6 flex items-center gap-3">
                <div className="rounded-lg bg-primary/10 p-2">
                  <Bell className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Notification Rules</h3>
                  <p className="text-sm text-muted-foreground">Configure when and how admins receive notifications</p>
                </div>
              </div>
              <div className="space-y-4">
                {[
                  { label: "New Tenant Registration",  desc: "Notify when a new tenant signs up" },
                  { label: "Failed Payment Alerts",    desc: "Notify when a payment fails" },
                  { label: "Trial Expiration",         desc: "Notify 3 days before trial ends" },
                  { label: "Security Alerts",          desc: "Notify on suspicious activity" },
                  { label: "System Health Alerts",     desc: "Notify on service degradation" },
                  { label: "SMS Low Balance Alert",    desc: "Notify when an institution wallet is running low" },
                  { label: "SMS High Failure Rate",    desc: "Notify when failure rate exceeds threshold" },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between rounded-lg border border-border p-4">
                    <div>
                      <p className="font-medium">{item.label}</p>
                      <p className="text-sm text-muted-foreground">{item.desc}</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* ══ MAINTENANCE TAB ══════════════════════════════════════ */}
          <TabsContent value="maintenance" className="space-y-6">
            <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-6">
              <div className="mb-4 flex items-center gap-3">
                <div className="rounded-lg bg-destructive/10 p-2">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-destructive">Maintenance Mode</h3>
                  <p className="text-sm text-muted-foreground">When enabled, all tenants will see a maintenance page</p>
                </div>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border bg-card p-4">
                <div>
                  <p className="font-medium">Enable Maintenance Mode</p>
                  <p className="text-sm text-muted-foreground">Platform will be inaccessible to tenants</p>
                </div>
                <Switch />
              </div>
            </div>
            <div className="rounded-lg border border-border bg-card p-6">
              <h4 className="mb-4 font-semibold">Maintenance Message</h4>
              <div className="space-y-4">
                <div className="space-y-2"><Label>Title</Label><Input defaultValue="Scheduled Maintenance" /></div>
                <div className="space-y-2">
                  <Label>Message</Label>
                  <Textarea rows={4} defaultValue="We're currently performing scheduled maintenance. We'll be back shortly. Thank you for your patience." />
                </div>
                <div className="space-y-2"><Label>Estimated Completion</Label><Input type="datetime-local" /></div>
              </div>
              <div className="mt-4 flex justify-end"><Button>Save Message</Button></div>
            </div>
            <div className="rounded-lg border border-destructive/50 bg-card p-6">
              <h4 className="mb-4 font-semibold text-destructive">Danger Zone</h4>
              <div className="space-y-4">
                <div className="flex items-center justify-between rounded-lg border border-border p-4">
                  <div>
                    <p className="font-medium">Clear All Cache</p>
                    <p className="text-sm text-muted-foreground">Flush all cached data across the platform</p>
                  </div>
                  <Button variant="outline" size="sm">Clear Cache</Button>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-border p-4">
                  <div>
                    <p className="font-medium">Export All Data</p>
                    <p className="text-sm text-muted-foreground">Download a complete backup of platform data</p>
                  </div>
                  <Button variant="outline" size="sm">Export</Button>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
