import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useApp } from "@/contexts/AppContext";
import { billing as billingApi } from "@/lib/api";
import {
  useUserPreferences,
  COLOUR_THEMES,
  WALLPAPERS,
  ALL_DASHBOARD_CARDS,
  ALL_SUBJECTS,
} from "@/contexts/UserPreferencesContext";
import {
  CheckCircle, Zap, Brain, Cpu, Globe, Bot, Layers, Key, Plus, Trash2,
  Eye, EyeOff, ChevronDown, ChevronUp, RefreshCw, AlertCircle, Shield,
  CreditCard, ExternalLink, Database, Upload, Link2, Unlink, Crown,
  Palette, Layout, Sidebar, RotateCcw, Monitor,
} from "lucide-react";
import { toast } from "sonner";

// ── Billing Section ───────────────────────────────────────────────────────────
function BillingSection() {
  const { user } = useApp();
  const isAdmin = user?.role === "school_admin" || user?.role === "mat_admin" || user?.role === "admin" || user?.role === "super_admin";
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    billingApi.status()
      .then(s => setStatus(s))
      .catch(() => setStatus(null))
      .finally(() => setLoading(false));
  }, []);

  const handlePortal = async () => {
    setRedirecting(true);
    try {
      const { url } = await billingApi.portal();
      window.location.href = url;
    } catch {
      window.location.href = "/pricing";
    } finally {
      setRedirecting(false);
    }
  };

  const handleCheckout = async (plan: string) => {
    setRedirecting(true);
    try {
      const { url } = await billingApi.checkout(plan, "monthly");
      window.location.href = url;
    } catch (err: any) {
      toast.error(err.message || "Failed to start checkout");
      setRedirecting(false);
    }
  };

  if (!isAdmin) return null;

  const planLabel = status?.plan
    ? status.plan.charAt(0).toUpperCase() + status.plan.slice(1)
    : status?.licenceType === "trial" ? "Free Trial" : "Free";

  const statusColor = status?.status === "active" || status?.status === "trialing"
    ? "bg-green-100 text-green-700"
    : status?.status === "past_due"
    ? "bg-amber-100 text-amber-700"
    : "bg-red-100 text-red-700";

  const statusLabel = status?.status === "active" ? "Active"
    : status?.status === "trialing" ? "Trial"
    : status?.status === "past_due" ? "Payment overdue"
    : status?.status === "canceled" ? "Cancelled"
    : "Inactive";

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <CreditCard className="h-4 w-4 text-brand" />
          Subscription & Billing
        </CardTitle>
        <p className="text-xs text-muted-foreground mt-1">Manage your school's Adaptly subscription.</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <RefreshCw className="w-4 h-4 animate-spin" /> Loading billing status...
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between rounded-lg bg-muted/40 p-3">
              <div>
                <p className="text-sm font-medium">{planLabel} Plan</p>
                {status?.periodEnd && (
                  <p className="text-xs text-muted-foreground">
                    {status?.cancelAtPeriodEnd ? "Cancels" : "Renews"}{" "}
                    {new Date(status.periodEnd).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
                  </p>
                )}
                {status?.trialEndsAt && status?.licenceType === "trial" && (
                  <p className="text-xs text-muted-foreground">
                    Trial ends {new Date(status.trialEndsAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
                  </p>
                )}
              </div>
              <Badge className={`text-xs border-0 ${statusColor}`}>{statusLabel}</Badge>
            </div>

            {status?.stripeConfigured ? (
              <div className="space-y-2">
                {(status?.status === "active" || status?.status === "trialing" || status?.status === "past_due") ? (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={handlePortal}
                    disabled={redirecting}
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    {redirecting ? "Redirecting..." : "Manage Billing & Invoices"}
                  </Button>
                ) : (
                  <>
                    <Button
                      className="w-full bg-brand hover:bg-brand/90 text-white"
                      onClick={() => handleCheckout("professional")}
                      disabled={redirecting}
                    >
                      <CreditCard className="w-4 h-4 mr-2" />
                      {redirecting ? "Redirecting..." : "Subscribe — Professional £99/month"}
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => handleCheckout("starter")}
                      disabled={redirecting}
                    >
                      {redirecting ? "Redirecting..." : "Subscribe — Starter £49/month"}
                    </Button>
                  </>
                )}
              </div>
            ) : (
              <div className="rounded-lg bg-muted/40 p-3 text-xs text-muted-foreground">
                <p>To manage your subscription, please contact us:</p>
                <a href="mailto:billing@adaptly.co.uk" className="text-brand hover:underline font-medium">billing@adaptly.co.uk</a>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

const PRESET_PROVIDERS = [
  { id: "groq", label: "Groq", description: "Ultra-fast Llama 3.3 70B Versatile. Free tier available.", url: "https://console.groq.com/keys", placeholder: "gsk_...", defaultModel: "llama-3.3-70b-versatile", icon: Zap, color: "text-orange-500", bg: "bg-orange-50 dark:bg-orange-950/30", badge: "Free tier", badgeColor: "bg-green-100 text-green-700" },
  { id: "gemini", label: "Google Gemini", description: "Gemini 2.0 Flash. Generous free tier.", url: "https://aistudio.google.com/app/apikey", placeholder: "AIza...", defaultModel: "gemini-2.0-flash", icon: Brain, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-950/30", badge: "Free tier", badgeColor: "bg-green-100 text-green-700" },
  { id: "openai", label: "OpenAI", description: "GPT-4o Mini and GPT-4o. Pay-as-you-go.", url: "https://platform.openai.com/api-keys", placeholder: "sk-...", defaultModel: "gpt-4o-mini", icon: Cpu, color: "text-green-600", bg: "bg-green-50 dark:bg-green-950/30", badge: "Paid", badgeColor: "bg-blue-100 text-blue-700" },
  { id: "openrouter", label: "OpenRouter", description: "Access 100+ models from one API key.", url: "https://openrouter.ai/keys", placeholder: "sk-or-...", defaultModel: "", icon: Globe, color: "text-purple-500", bg: "bg-purple-50 dark:bg-purple-950/30", badge: "Multi-model", badgeColor: "bg-purple-100 text-purple-700" },
  { id: "claude", label: "Anthropic Claude", description: "Claude 3.5 Sonnet — excellent for writing.", url: "https://console.anthropic.com/settings/keys", placeholder: "sk-ant-...", defaultModel: "claude-3-5-sonnet-20241022", icon: Bot, color: "text-yellow-600", bg: "bg-yellow-50 dark:bg-yellow-950/30", badge: "Paid", badgeColor: "bg-orange-100 text-orange-700" },
  { id: "huggingface", label: "HuggingFace", description: "Open-source models via Inference API.", url: "https://huggingface.co/settings/tokens", placeholder: "hf_...", defaultModel: "", icon: Layers, color: "text-pink-500", bg: "bg-pink-50 dark:bg-pink-950/30", badge: "Free tier", badgeColor: "bg-yellow-100 text-yellow-700" },
];

interface SavedKey { id: number; provider: string; providerLabel: string; model: string; baseUrl?: string; isCustom: boolean; }

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem("send_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// ── MIS Integration Section ───────────────────────────────────────────────────
function MisIntegrationSection() {
  const { user, refreshData } = useApp();
  const isAdmin = user?.role === "school_admin" || user?.role === "mat_admin" || user?.role === "admin" || user?.role === "super_admin";
  const [misStatus, setMisStatus] = useState<{ isPremium: boolean; bromcom: boolean; arbor: boolean } | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [bromcomKey, setBromcomKey] = useState("");
  const [bromcomSchoolId, setBromcomSchoolId] = useState("");
  const [arborKey, setArborKey] = useState("");
  const [arborSubdomain, setArborSubdomain] = useState("");
  const [syncing, setSyncing] = useState<string | null>(null);
  const [showBromcomForm, setShowBromcomForm] = useState(false);
  const [showArborForm, setShowArborForm] = useState(false);
  const [syncResult, setSyncResult] = useState<any>(null);

  useEffect(() => {
    if (!isAdmin) return;
    fetch("/api/mis/status", { headers: getAuthHeader() })
      .then(r => r.json())
      .then(d => setMisStatus(d))
      .catch(() => setMisStatus({ isPremium: false, bromcom: false, arbor: false }))
      .finally(() => setLoading(false));
  }, [isAdmin]);

  const saveKey = async (provider: "bromcom" | "arbor") => {
    const apiKey = provider === "bromcom" ? bromcomKey : arborKey;
    const schoolId = provider === "bromcom" ? bromcomSchoolId : arborSubdomain;
    if (!apiKey.trim()) { toast.error("API key is required"); return; }
    setSaving(provider);
    try {
      const res = await fetch("/api/mis/save-key", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeader() },
        body: JSON.stringify({ provider, apiKey, schoolId }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || "Credentials saved");
        setMisStatus(prev => prev ? { ...prev, [provider]: true } : prev);
        if (provider === "bromcom") { setBromcomKey(""); setShowBromcomForm(false); }
        else { setArborKey(""); setShowArborForm(false); }
      } else {
        toast.error(data.error || "Failed to save credentials");
      }
    } catch { toast.error("Network error"); }
    setSaving(null);
  };

  const removeKey = async (provider: "bromcom" | "arbor") => {
    try {
      const res = await fetch(`/api/mis/remove-key/${provider}`, { method: "DELETE", headers: getAuthHeader() });
      if (res.ok) {
        toast.success(`${provider === "bromcom" ? "Bromcom" : "Arbor"} credentials removed`);
        setMisStatus(prev => prev ? { ...prev, [provider]: false } : prev);
      }
    } catch { toast.error("Failed to remove credentials"); }
  };

  const syncNow = async (provider: "bromcom" | "arbor") => {
    setSyncing(provider);
    setSyncResult(null);
    try {
      const res = await fetch(`/api/mis/sync/${provider}`, {
        method: "POST",
        headers: getAuthHeader(),
        credentials: "include",
      });
      const data = await res.json();
      if (res.ok) {
        setSyncResult(data);
        const total = (data.pupils?.created || 0) + (data.behaviour?.created || 0) +
          (data.attendance?.created || 0) + (data.comments?.created || 0);
        toast.success(`Sync complete — ${total} records imported`);
        await refreshData();
      } else {
        toast.error(data.error || "Sync failed");
      }
    } catch { toast.error("Network error during sync"); }
    setSyncing(null);
  };

  const syncDemo = async () => {
    setSyncing("demo");
    setSyncResult(null);
    try {
      const res = await fetch("/api/mis/sync-demo", {
        method: "POST",
        headers: getAuthHeader(),
        credentials: "include",
      });
      const data = await res.json();
      if (res.ok) {
        setSyncResult(data);
        const total = (data.pupils?.created || 0) + (data.behaviour?.created || 0) +
          (data.attendance?.created || 0) + (data.comments?.created || 0);
        toast.success(`Demo sync complete — ${total} records imported`);
        // Refresh app data so pupils appear immediately without a page reload
        await refreshData();
      } else {
        toast.error(data.error || "Demo sync failed");
      }
    } catch { toast.error("Network error"); }
    setSyncing(null);
  };

  if (!isAdmin) return null;

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Database className="h-4 w-4 text-brand" />
          MIS Integration
        </CardTitle>
        <p className="text-xs text-muted-foreground mt-1">
          Import pupil data from your school's Management Information System. CSV import is available on all plans. Live API sync requires a Premium plan.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground"><RefreshCw className="w-4 h-4 animate-spin" /> Loading...</div>
        ) : (
          <>
            {/* Bromcom */}
            <div className={`border rounded-lg ${misStatus?.bromcom ? "border-brand/40 bg-brand/5" : "border-border"}`}>
              <div className="flex items-center justify-between p-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-md bg-blue-50 flex items-center justify-center"><Database className="h-3.5 w-3.5 text-blue-600" /></div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">Bromcom</span>
                      {misStatus?.bromcom && <Badge className="bg-green-100 text-green-700 text-xs border-0"><CheckCircle className="h-3 w-3 mr-1" />Connected</Badge>}
                      {!misStatus?.isPremium && <Badge className="bg-amber-100 text-amber-700 text-xs border-0"><Crown className="h-3 w-3 mr-1" />Premium</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground">Live pupil sync via Bromcom REST API</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {misStatus?.bromcom && (
                    <>
                      <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => syncNow("bromcom")} disabled={syncing === "bromcom"}>
                        <RefreshCw className={`w-3 h-3 mr-1 ${syncing === "bromcom" ? "animate-spin" : ""}`} />{syncing === "bromcom" ? "Syncing..." : "Sync Now"}
                      </Button>
                      <Button size="sm" variant="ghost" className="h-7 w-7 text-red-500" onClick={() => removeKey("bromcom")}><Unlink className="w-3.5 h-3.5" /></Button>
                    </>
                  )}
                  {!misStatus?.bromcom && (
                    <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setShowBromcomForm(!showBromcomForm)} disabled={!misStatus?.isPremium}>
                      <Link2 className="w-3 h-3 mr-1" />Connect
                    </Button>
                  )}
                </div>
              </div>
              {showBromcomForm && misStatus?.isPremium && (
                <div className="px-3 pb-3 space-y-2 border-t pt-3">
                  <div>
                    <Label className="text-xs">Bromcom API Key *</Label>
                    <Input type="password" placeholder="Bearer token from Bromcom Partner Portal" value={bromcomKey} onChange={e => setBromcomKey(e.target.value)} className="mt-1 text-xs font-mono" />
                  </div>
                  <div>
                    <Label className="text-xs">School ID (from Bromcom)</Label>
                    <Input placeholder="e.g. 12345" value={bromcomSchoolId} onChange={e => setBromcomSchoolId(e.target.value)} className="mt-1 text-xs" />
                  </div>
                  <Button size="sm" className="w-full bg-brand hover:bg-brand/90 text-white text-xs" onClick={() => saveKey("bromcom")} disabled={saving === "bromcom"}>
                    {saving === "bromcom" ? "Saving..." : "Save Bromcom Credentials"}
                  </Button>
                </div>
              )}
              {!misStatus?.isPremium && (
                <div className="px-3 pb-3 text-xs text-amber-700 flex items-center gap-1">
                  <Crown className="w-3 h-3" />Upgrade to Premium to enable live MIS sync.
                  <a href="/pricing" className="text-brand hover:underline ml-1">View plans →</a>
                </div>
              )}
            </div>

            {/* Arbor */}
            <div className={`border rounded-lg ${misStatus?.arbor ? "border-brand/40 bg-brand/5" : "border-border"}`}>
              <div className="flex items-center justify-between p-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-md bg-green-50 flex items-center justify-center"><Database className="h-3.5 w-3.5 text-green-600" /></div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">Arbor</span>
                      {misStatus?.arbor && <Badge className="bg-green-100 text-green-700 text-xs border-0"><CheckCircle className="h-3 w-3 mr-1" />Connected</Badge>}
                      {!misStatus?.isPremium && <Badge className="bg-amber-100 text-amber-700 text-xs border-0"><Crown className="h-3 w-3 mr-1" />Premium</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground">Live pupil sync via Arbor REST API</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {misStatus?.arbor && (
                    <>
                      <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => syncNow("arbor")} disabled={syncing === "arbor"}>
                        <RefreshCw className={`w-3 h-3 mr-1 ${syncing === "arbor" ? "animate-spin" : ""}`} />{syncing === "arbor" ? "Syncing..." : "Sync Now"}
                      </Button>
                      <Button size="sm" variant="ghost" className="h-7 w-7 text-red-500" onClick={() => removeKey("arbor")}><Unlink className="w-3.5 h-3.5" /></Button>
                    </>
                  )}
                  {!misStatus?.arbor && (
                    <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setShowArborForm(!showArborForm)} disabled={!misStatus?.isPremium}>
                      <Link2 className="w-3 h-3 mr-1" />Connect
                    </Button>
                  )}
                </div>
              </div>
              {showArborForm && misStatus?.isPremium && (
                <div className="px-3 pb-3 space-y-2 border-t pt-3">
                  <div>
                    <Label className="text-xs">Arbor API Key *</Label>
                    <Input type="password" placeholder="username:password (Base64 encoded) or token" value={arborKey} onChange={e => setArborKey(e.target.value)} className="mt-1 text-xs font-mono" />
                  </div>
                  <div>
                    <Label className="text-xs">School Subdomain</Label>
                    <Input placeholder="e.g. myschool (from myschool.arbor.sc)" value={arborSubdomain} onChange={e => setArborSubdomain(e.target.value)} className="mt-1 text-xs" />
                  </div>
                  <Button size="sm" className="w-full bg-brand hover:bg-brand/90 text-white text-xs" onClick={() => saveKey("arbor")} disabled={saving === "arbor"}>
                    {saving === "arbor" ? "Saving..." : "Save Arbor Credentials"}
                  </Button>
                </div>
              )}
              {!misStatus?.isPremium && (
                <div className="px-3 pb-3 text-xs text-amber-700 flex items-center gap-1">
                  <Crown className="w-3 h-3" />Upgrade to Premium to enable live MIS sync.
                  <a href="/pricing" className="text-brand hover:underline ml-1">View plans →</a>
                </div>
              )}
            </div>

            {/* Demo Sync Button */}
            <div className="mt-3 p-3 rounded-lg border border-dashed border-brand/40 bg-brand/5">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm font-medium text-gray-800">Demo Sync</div>
                  <div className="text-xs text-muted-foreground mt-0.5">Load 20 realistic mock pupils with behaviour, attendance &amp; comments — no API keys needed.</div>
                </div>
                <Button size="sm" variant="outline" className="shrink-0 h-7 text-xs border-brand/40 text-brand hover:bg-brand/10" onClick={syncDemo} disabled={syncing === "demo"}>
                  <RefreshCw className={`w-3 h-3 mr-1 ${syncing === "demo" ? "animate-spin" : ""}`} />{syncing === "demo" ? "Loading..." : "Load Demo Data"}
                </Button>
              </div>
            </div>

            {/* Sync Result Summary */}
            {syncResult && (
              <div className="mt-3 p-3 rounded-lg border border-green-200 bg-green-50 space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-green-800">
                  <CheckCircle className="w-4 h-4" />
                  Last Sync Summary — {syncResult.provider === "demo" ? "Demo Data" : syncResult.provider === "bromcom" ? "Bromcom" : "Arbor"}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: "Pupils", icon: "👤", created: syncResult.pupils?.created || 0, updated: syncResult.pupils?.updated || 0, skipped: syncResult.pupils?.skipped || 0 },
                    { label: "Behaviour", icon: "📋", created: syncResult.behaviour?.created || 0, updated: 0, skipped: syncResult.behaviour?.skipped || 0 },
                    { label: "Attendance", icon: "📅", created: syncResult.attendance?.created || 0, updated: syncResult.attendance?.updated || 0, skipped: syncResult.attendance?.skipped || 0 },
                    { label: "Comments", icon: "💬", created: syncResult.comments?.created || 0, updated: 0, skipped: syncResult.comments?.skipped || 0 },
                  ].map(item => (
                    <div key={item.label} className="bg-white rounded-md p-2 border border-green-100">
                      <div className="text-xs font-medium text-gray-700">{item.icon} {item.label}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        <span className="text-green-700 font-medium">{item.created} new</span>
                        {item.updated > 0 && <span className="ml-1 text-blue-700">{item.updated} updated</span>}
                        {item.skipped > 0 && <span className="ml-1 text-gray-500">{item.skipped} skipped</span>}
                      </div>
                    </div>
                  ))}
                </div>
                {syncResult.errors?.length > 0 && (
                  <div className="text-xs text-amber-700 mt-1">
                    ⚠️ {syncResult.errors.length} warning(s): {syncResult.errors[0]}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

// ── Personalisation Section ──────────────────────────────────────────────────
function PersonalisationSection() {
  const {
    preferences,
    setTheme,
    setWallpaper,
    toggleSidebarItem,
    isSidebarItemHidden,
    toggleDashboardCard,
    toggleDashboardSubject,
    setShowWorksheetLibrary,
    setCardBorderColor,
    setIconShape,
    setIconBorderStyle,
    setCardStyle,
    setLayoutDensity,
    setHomeSection,
    resetPreferences,
    currentTheme,
    currentWallpaper,
  } = useUserPreferences();

  const initialTab = (typeof window !== "undefined"
    ? (new URLSearchParams(window.location.search).get("tab") as "theme" | "wallpaper" | "sidebar" | "dashboard" | null)
    : null) || "theme";
  const [activeTab, setActiveTab] = useState<"theme" | "wallpaper" | "sidebar" | "dashboard">(initialTab);
  const [customWallpaperUrl, setCustomWallpaperUrl] = useState("");

  // All sidebar items for the toggle list
  // Items grouped by hub — these control what appears in the sidebar Quick Access section
  const allSidebarItems = [
    // Core navigation (always shown, not togglable but listed for completeness)
    { path: "/home",               label: "Home",                    group: "Core" },
    // Quick Access items users can show/hide
    { path: "/history",            label: "History",                 group: "Quick Access" },
    { path: "/analytics",          label: "Analytics",               group: "Quick Access" },
    { path: "/daily-briefing",     label: "Daily Briefing",          group: "Quick Access" },
    { path: "/quiz-game",          label: "QuizBlast",               group: "Quick Access" },
    { path: "/ideas",              label: "Ideas",                   group: "Quick Access" },
    { path: "/pupils",             label: "Pupil Profiles",          group: "Quick Access" },
    // SEND Hub tools
    { path: "/send-screener",             label: "SEND Screener",          group: "SEND Hub" },
    { path: "/differentiate",             label: "Differentiate",          group: "SEND Hub" },
    { path: "/worksheets",                label: "Worksheets (SEND)",      group: "SEND Hub" },
    { path: "/tools/iep-generator",       label: "IEP / EHCP Goals",       group: "SEND Hub" },
    { path: "/tools/social-stories",      label: "Social Stories",         group: "SEND Hub" },
    { path: "/tools/pupil-passport",      label: "Pupil Passport",         group: "SEND Hub" },
    { path: "/tools/smart-targets",       label: "SMART Targets",          group: "SEND Hub" },
    { path: "/tools/behaviour-plan",      label: "Behaviour Support Plan", group: "SEND Hub" },
    { path: "/tools/wellbeing-support",   label: "Wellbeing Support",      group: "SEND Hub" },
    { path: "/visual-timetable",          label: "Visual Timetable",       group: "SEND Hub" },
    // Revision Hub tools
    { path: "/revision-hub",                  label: "Audio Revision Hub",       group: "Revision Hub" },
    { path: "/past-papers",                   label: "Past Papers",              group: "Revision Hub" },
    { path: "/tools/flash-cards",             label: "Flash Cards",              group: "Revision Hub" },
    { path: "/tools/quiz-generator",          label: "Quiz Generator",           group: "Revision Hub" },
    { path: "/tools/vocabulary-builder",      label: "Vocabulary Builder",       group: "Revision Hub" },
    { path: "/tools/comprehension-generator", label: "Comprehension Generator",  group: "Revision Hub" },
    // Planning Hub tools
    { path: "/tools/lesson-planner",       label: "Lesson Planner",         group: "Planning Hub" },
    { path: "/tools/medium-term-planner",  label: "Medium Term Planner",    group: "Planning Hub" },
    { path: "/tools/rubric-generator",     label: "Rubric / Mark Scheme",   group: "Planning Hub" },
    { path: "/tools/exit-ticket",          label: "Exit Ticket",            group: "Planning Hub" },
    { path: "/tools/risk-assessment",      label: "Risk Assessment",        group: "Planning Hub" },
    { path: "/reading",                    label: "Reading & Stories",      group: "Planning Hub" },
    { path: "/templates",                  label: "Pre-made Worksheets",    group: "Planning Hub" },
    // Communications Hub tools
    { path: "/parent-portal",              label: "Parent Portal",          group: "Communications Hub" },
    { path: "/tools/report-comments",      label: "Report Comments",        group: "Communications Hub" },
    { path: "/tools/parent-newsletter",    label: "Parent Newsletter",      group: "Communications Hub" },
    { path: "/tools/text-rewriter",        label: "Text Rewriter",          group: "Communications Hub" },
    { path: "/pupil-comments",             label: "Pupil Comments",         group: "Communications Hub" },
    { path: "/behaviour-tracking",         label: "Behaviour Tracking",     group: "Communications Hub" },
    { path: "/attendance",                 label: "Attendance Tracker",     group: "Communications Hub" },
  ];

  const tabs = [
    { id: "theme" as const,     label: "Colour Theme",  icon: Palette },
    { id: "wallpaper" as const, label: "Wallpaper",     icon: Monitor },
    { id: "sidebar" as const,   label: "Sidebar",       icon: Sidebar },
    { id: "dashboard" as const, label: "Dashboard",     icon: Layout },
  ];

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Palette className="h-4 w-4 text-brand" />
          Personalisation
        </CardTitle>
        <p className="text-xs text-muted-foreground mt-1">Customise your Adaptly experience — changes are saved automatically per account.</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Sub-tabs */}
        <div className="flex gap-1 bg-muted/50 rounded-xl p-1">
          {tabs.map(t => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-medium transition-all ${
                  activeTab === t.id ? "bg-white shadow-sm text-brand" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* Colour Theme */}
        {activeTab === "theme" && (
          <div className="space-y-4">
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">Choose a brand colour for your Adaptly interface.</p>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                {COLOUR_THEMES.map(theme => (
                  <button
                    key={theme.id}
                    onClick={() => { setTheme(theme.id); toast.success(`Theme changed to ${theme.label}`); }}
                    className={`flex flex-col items-center gap-1.5 p-2 rounded-xl border-2 transition-all ${
                      preferences.themeId === theme.id ? "border-brand shadow-md" : "border-transparent hover:border-border"
                    }`}
                    title={theme.label}
                  >
                    <div className="w-8 h-8 rounded-full shadow-sm" style={{ backgroundColor: theme.preview }} />
                    <span className="text-[10px] text-center text-muted-foreground leading-tight">{theme.label}</span>
                    {preferences.themeId === theme.id && (
                      <CheckCircle className="w-3 h-3 text-brand" />
                    )}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-xl">
                <div className="w-6 h-6 rounded-full" style={{ backgroundColor: currentTheme.preview }} />
                <span className="text-xs text-muted-foreground">Current: <strong className="text-foreground">{currentTheme.label}</strong></span>
              </div>
            </div>

            {/* Card Border Colour */}
            <div className="space-y-2 pt-2 border-t border-border/50">
              <div>
                <p className="text-xs font-medium text-foreground">Card Border Colour</p>
                <p className="text-xs text-muted-foreground mt-0.5">Add a coloured border to all cards across the app.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {[
                  { label: "None", value: "none", preview: "transparent", border: "border-border" },
                  { label: "Brand", value: currentTheme.primary, preview: currentTheme.primary, border: "" },
                  { label: "Emerald", value: "#10b981", preview: "#10b981", border: "" },
                  { label: "Violet", value: "#7c3aed", preview: "#7c3aed", border: "" },
                  { label: "Blue", value: "#3b82f6", preview: "#3b82f6", border: "" },
                  { label: "Amber", value: "#f59e0b", preview: "#f59e0b", border: "" },
                  { label: "Rose", value: "#f43f5e", preview: "#f43f5e", border: "" },
                  { label: "Teal", value: "#14b8a6", preview: "#14b8a6", border: "" },
                  { label: "Slate", value: "#64748b", preview: "#64748b", border: "" },
                ].map(opt => {
                  const isActive = (preferences.cardBorderColor || "none") === opt.value;
                  return (
                    <button
                      key={opt.value}
                      onClick={() => {
                        setCardBorderColor(opt.value);
                        toast.success(opt.value === "none" ? "Card borders reset" : `Card borders set to ${opt.label}`);
                      }}
                      className={`flex flex-col items-center gap-1 p-2 rounded-xl border-2 transition-all ${
                        isActive ? "border-brand shadow-md" : "border-transparent hover:border-border"
                      }`}
                      title={opt.label}
                    >
                      <div
                        className={`w-7 h-7 rounded-lg border-2 ${opt.value === "none" ? "border-dashed border-border bg-background" : ""}`}
                        style={opt.value !== "none" ? { backgroundColor: opt.preview, borderColor: opt.preview } : {}}
                      />
                      <span className="text-[9px] text-muted-foreground">{opt.label}</span>
                      {isActive && <CheckCircle className="w-3 h-3 text-brand" />}
                    </button>
                  );
                })}
                {/* Custom colour picker */}
                <div className="flex flex-col items-center gap-1 p-2">
                  <label className="cursor-pointer">
                    <div className="w-7 h-7 rounded-lg border-2 border-dashed border-brand/50 flex items-center justify-center bg-brand-light/30 hover:bg-brand-light/60 transition-colors">
                      <span className="text-[8px] font-bold text-brand">+</span>
                    </div>
                    <input
                      type="color"
                      className="sr-only"
                      value={preferences.cardBorderColor && preferences.cardBorderColor !== "none" ? preferences.cardBorderColor : "#10b981"}
                      onChange={e => setCardBorderColor(e.target.value)}
                    />
                  </label>
                  <span className="text-[9px] text-muted-foreground">Custom</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Wallpaper */}
        {activeTab === "wallpaper" && (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">Choose a background for your login screen and dashboard.</p>
            <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
              {WALLPAPERS.map(wp => (
                <button
                  key={wp.id}
                  onClick={() => { setWallpaper(wp.id); toast.success(`Wallpaper set to ${wp.label}`); }}
                  className={`flex flex-col items-center gap-1.5 p-2 rounded-xl border-2 transition-all ${
                    preferences.wallpaperId === wp.id ? "border-brand shadow-md" : "border-transparent hover:border-border"
                  }`}
                  title={wp.label}
                >
                  <div
                    className="w-10 h-7 rounded-lg shadow-sm border border-border/30"
                    style={{ background: wp.preview }}
                  />
                  <span className="text-[10px] text-center text-muted-foreground leading-tight">{wp.label}</span>
                  {preferences.wallpaperId === wp.id && <CheckCircle className="w-3 h-3 text-brand" />}
                </button>
              ))}
            </div>
            {/* Custom URL */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-foreground">Or use a custom image URL:</p>
              <div className="flex gap-2">
                <Input
                  value={customWallpaperUrl}
                  onChange={e => setCustomWallpaperUrl(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  className="text-xs h-8"
                />
                <Button
                  size="sm"
                  onClick={() => {
                    if (!customWallpaperUrl.trim()) return;
                    setWallpaper("custom", customWallpaperUrl.trim());
                    toast.success("Custom wallpaper applied");
                  }}
                  className="h-8 text-xs px-3"
                >
                  Apply
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Sidebar Customisation */}
        {activeTab === "sidebar" && (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">
              Toggle which items are visible inside each hub. The 5 hub sections are always shown in the sidebar.
              Hidden tools are still accessible via direct URL or search.
            </p>
            <div className="space-y-4 max-h-[480px] overflow-y-auto pr-1">
              {(() => {
                // Group items by their group label
                const groups = allSidebarItems.reduce<Record<string, typeof allSidebarItems>>((acc, item) => {
                  const g = item.group || "Other";
                  if (!acc[g]) acc[g] = [];
                  acc[g].push(item);
                  return acc;
                }, {});
                const groupColors: Record<string, string> = {
                  "Core": "text-gray-600",
                  "Quick Access": "text-slate-600",
                  "SEND Hub": "text-indigo-600",
                  "Revision Hub": "text-teal-600",
                  "Planning Hub": "text-green-600",
                  "Communications Hub": "text-rose-600",
                  "Classroom Hub": "text-blue-600",
                };
                return Object.entries(groups).map(([groupName, items]) => (
                  <div key={groupName}>
                    <p className={`text-[10px] font-bold uppercase tracking-widest mb-1.5 ${groupColors[groupName] || "text-muted-foreground"}`}>
                      {groupName}
                    </p>
                    <div className="space-y-0.5">
                      {items.map(item => {
                        const hidden = isSidebarItemHidden(item.path);
                        const isCore = groupName === "Core";
                        return (
                          <div key={item.path} className="flex items-center justify-between py-1.5 px-3 rounded-lg hover:bg-muted/40 transition-colors">
                            <span className={`text-xs ${hidden ? "text-muted-foreground line-through" : "text-foreground"}`}>
                              {item.label}
                            </span>
                            {isCore ? (
                              <span className="text-[10px] text-muted-foreground font-medium px-2 py-0.5 bg-muted rounded-full">Always on</span>
                            ) : (
                              <button
                                onClick={() => toggleSidebarItem(item.path)}
                                className={`text-xs px-2.5 py-1 rounded-full font-medium transition-colors ${
                                  hidden
                                    ? "bg-red-100 text-red-600 hover:bg-red-200"
                                    : "bg-green-100 text-green-700 hover:bg-green-200"
                                }`}
                              >
                                {hidden ? "Hidden" : "Visible"}
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ));
              })()}
            </div>
            <p className="text-[10px] text-muted-foreground">Tip: Home and Settings are always visible.</p>
          </div>
        )}

        {/* Dashboard Customisation */}
        {activeTab === "dashboard" && (
          <div className="space-y-4">
            <div>
              <p className="text-xs font-medium text-foreground mb-2">Quick Access Cards</p>
              <p className="text-xs text-muted-foreground mb-3">Choose which cards appear on your dashboard home screen.</p>
              <div className="grid grid-cols-2 gap-2">
                {ALL_DASHBOARD_CARDS.map(card => {
                  const visible = preferences.dashboardCards.includes(card.id);
                  return (
                    <button
                      key={card.id}
                      onClick={() => toggleDashboardCard(card.id)}
                      className={`flex items-center gap-2 p-2.5 rounded-xl border-2 text-left transition-all ${
                        visible ? "border-brand/40 bg-brand/5" : "border-border bg-muted/20 opacity-50"
                      }`}
                    >
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${visible ? "bg-brand" : "bg-muted-foreground"}`} />
                      <span className="text-xs font-medium text-foreground truncate">{card.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="border-t border-border/50 pt-4">
              <p className="text-xs font-medium text-foreground mb-2">Subjects on Dashboard</p>
              <p className="text-xs text-muted-foreground mb-3">Choose which subjects appear in your quick-subject filter.</p>
              <div className="flex flex-wrap gap-2">
                {ALL_SUBJECTS.map(subject => {
                  const active = preferences.dashboardSubjects.includes(subject);
                  return (
                    <button
                      key={subject}
                      onClick={() => toggleDashboardSubject(subject)}
                      className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-all ${
                        active
                          ? "bg-brand text-white border-brand"
                          : "bg-white text-muted-foreground border-border hover:border-brand/50"
                      }`}
                    >
                      {subject}
                    </button>
                  );
                })}
              </div>
            </div>
            {/* Icon & Card Appearance */}
            <div className="border-t border-border/50 pt-4">
              <p className="text-xs font-medium text-foreground mb-1">Icon &amp; Card Appearance</p>
              <p className="text-xs text-muted-foreground mb-3">Customise how cards and icons look across the dashboard.</p>
              <div className="space-y-4">
                {/* Icon border style */}
                <div>
                  <p className="text-[11px] font-medium text-muted-foreground mb-2">Icon border style</p>
                  <div className="flex gap-2">
                    {(["none", "subtle", "bold"] as const).map(opt => (
                      <button
                        key={opt}
                        onClick={() => setIconBorderStyle(opt)}
                        className={`flex-1 py-2 rounded-xl border-2 text-xs font-medium capitalize transition-all ${
                          (preferences.iconBorderStyle ?? "none") === opt
                            ? "border-brand text-brand bg-brand/5"
                            : "border-border text-muted-foreground hover:border-brand/40"
                        }`}
                      >
                        {opt.charAt(0).toUpperCase() + opt.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
                {/* Icon shape */}
                <div>
                  <p className="text-[11px] font-medium text-muted-foreground mb-2">Icon shape</p>
                  <div className="flex gap-2">
                    {(["rounded", "circle", "square"] as const).map(opt => (
                      <button
                        key={opt}
                        onClick={() => setIconShape(opt)}
                        className={`flex-1 py-2 rounded-xl border-2 text-xs font-medium capitalize transition-all ${
                          (preferences.iconShape ?? "rounded") === opt
                            ? "border-brand text-brand bg-brand/5"
                            : "border-border text-muted-foreground hover:border-brand/40"
                        }`}
                      >
                        {opt.charAt(0).toUpperCase() + opt.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
                {/* Card style */}
                <div>
                  <p className="text-[11px] font-medium text-muted-foreground mb-2">Card style</p>
                  <div className="flex gap-2">
                    {(["default", "flat", "elevated"] as const).map(opt => (
                      <button
                        key={opt}
                        onClick={() => setCardStyle(opt)}
                        className={`flex-1 py-2 rounded-xl border-2 text-xs font-medium capitalize transition-all ${
                          (preferences.cardStyle ?? "default") === opt
                            ? "border-brand text-brand bg-brand/5"
                            : "border-border text-muted-foreground hover:border-brand/40"
                        }`}
                      >
                        {opt.charAt(0).toUpperCase() + opt.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
                {/* Layout density */}
                <div>
                  <p className="text-[11px] font-medium text-muted-foreground mb-2">Layout density</p>
                  <div className="flex gap-2">
                    {(["comfortable", "compact"] as const).map(opt => (
                      <button
                        key={opt}
                        onClick={() => setLayoutDensity(opt)}
                        className={`flex-1 py-2 rounded-xl border-2 text-xs font-medium capitalize transition-all ${
                          (preferences.layoutDensity ?? "comfortable") === opt
                            ? "border-brand text-brand bg-brand/5"
                            : "border-border text-muted-foreground hover:border-brand/40"
                        }`}
                      >
                        {opt.charAt(0).toUpperCase() + opt.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Home Page Sections */}
            <div className="border-t border-border/50 pt-4">
              <p className="text-xs font-medium text-foreground mb-1">Home Page Sections</p>
              <p className="text-xs text-muted-foreground mb-3">Show or hide sections on your dashboard home screen.</p>
              <div className="space-y-2">
                {([
                  { key: "showContinueSection", label: "Continue where you left off", desc: "In-progress worksheets, stories and differentiations" },
                  { key: "showRecentActivity", label: "Recent Activity", desc: "Last 3 items created across all tools" },
                  { key: "showSubjectBrowser", label: "Browse by Subject", desc: "Subject shortcut grid" },
                  { key: "showCobsTip", label: "COBS Handbook Tip", desc: "Daily tip from the COBS handbook" },
                ] as const).map(({ key, label, desc }) => {
                  const val = (preferences as any)[key] !== false;
                  return (
                    <div key={key} className="flex items-center justify-between p-3 bg-muted/40 rounded-xl border border-border/50">
                      <div>
                        <p className="text-xs font-medium text-foreground">{label}</p>
                        <p className="text-[10px] text-muted-foreground">{desc}</p>
                      </div>
                      <button
                        onClick={() => setHomeSection(key, !val)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0 ${
                          val ? 'bg-brand' : 'bg-muted-foreground/30'
                        }`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                          val ? 'translate-x-6' : 'translate-x-1'
                        }`} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Feature Toggles */}
            <div className="border-t border-border/50 pt-4">
            <p className="text-xs font-medium text-foreground mb-2">Feature Toggles</p>
            <p className="text-xs text-muted-foreground mb-3">Enable or disable optional features across the platform.</p>
            <div className="flex items-center justify-between p-3 bg-muted/40 rounded-lg border border-border/50">
              <div>
                <p className="text-xs font-medium text-foreground">Worksheet Library Tab</p>
                <p className="text-xs text-muted-foreground">Show the pre-built Library tab in the Worksheets page</p>
              </div>
              <button
                onClick={() => setShowWorksheetLibrary(!preferences.showWorksheetLibrary)}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                  preferences.showWorksheetLibrary ? 'bg-brand' : 'bg-muted-foreground/30'
                }`}
              >
                <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
                  preferences.showWorksheetLibrary ? 'translate-x-4' : 'translate-x-0.5'
                }`} />
              </button>
            </div>
            </div>
          </div>
        )}

        {/* Save & Apply + Reset buttons */}
        <div className="pt-2 border-t border-border/50 flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => { toast.success("Preferences saved! Reloading..."); setTimeout(() => window.location.reload(), 800); }}
            className="text-xs gap-2 bg-brand hover:bg-brand/90 text-white"
          >
            <CheckCircle className="w-3 h-3" />
            Save &amp; Apply
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => { resetPreferences(); toast.success("Preferences reset to defaults"); setTimeout(() => window.location.reload(), 800); }}
            className="text-xs gap-2 text-muted-foreground"
          >
            <RotateCcw className="w-3 h-3" />
            Reset to defaults
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Settings() {
  const { user, logout } = useApp();
  const isAdmin = user?.role === "school_admin" || user?.role === "mat_admin" || user?.role === "admin" || user?.role === "super_admin";
  const [savedKeys, setSavedKeys] = useState<SavedKey[]>([]);
  const [loadingKeys, setLoadingKeys] = useState(false);
  const [expandedProvider, setExpandedProvider] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Record<string, { apiKey: string; model: string; baseUrl: string; showKey: boolean }>>({});
  const [savingProvider, setSavingProvider] = useState<string | null>(null);
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customProvider, setCustomProvider] = useState({ label: "", apiKey: "", model: "", baseUrl: "" });

  // Sessions
  const [sessions, setSessions] = useState<any[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [revokingSession, setRevokingSession] = useState<string | null>(null);

  // Referral
  const [referral, setReferral] = useState<{ code: string; uses: number; url: string } | null>(null);

  const fetchKeys = async () => {
    setLoadingKeys(true);
    try {
      const res = await fetch("/api/school-keys", { headers: { ...getAuthHeader() } });
      if (res.ok) { const data = await res.json(); setSavedKeys(data.keys || []); }
    } catch (_) {}
    setLoadingKeys(false);
  };

  const fetchSessions = async () => {
    setLoadingSessions(true);
    try {
      const res = await fetch("/api/auth/sessions", { headers: { ...getAuthHeader() } });
      if (res.ok) { const data = await res.json(); setSessions(data); }
    } catch (_) {}
    setLoadingSessions(false);
  };

  const fetchReferral = async () => {
    try {
      const res = await fetch("/api/extras/referral", { headers: { ...getAuthHeader() } });
      if (res.ok) setReferral(await res.json());
    } catch (_) {}
  };

  useEffect(() => {
    if (isAdmin) fetchKeys();
    fetchSessions();
    fetchReferral();
  }, [isAdmin]);

  const revokeSession = async (id: string) => {
    setRevokingSession(id);
    try {
      await fetch(`/api/auth/sessions/${id}`, { method: "DELETE", headers: { ...getAuthHeader() } });
      setSessions(prev => prev.filter(s => s.id !== id));
      toast.success("Session revoked");
    } catch (_) { toast.error("Failed to revoke session"); }
    setRevokingSession(null);
  };

  const revokeAllOtherSessions = async () => {
    try {
      await fetch("/api/auth/sessions", { method: "DELETE", headers: { ...getAuthHeader() } });
      await fetchSessions();
      toast.success("All other sessions signed out");
    } catch (_) { toast.error("Failed to revoke sessions"); }
  };

  const handleGdprExport = async () => {
    try {
      const res = await fetch("/api/gdpr/school/export", { headers: { ...getAuthHeader() } });
      if (!res.ok) { toast.error("Export failed — admin access required"); return; }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url; a.download = "school-data-export.json";
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("School data exported");
    } catch (_) { toast.error("Export failed"); }
  };

  const getEditVal = (id: string) => editValues[id] || { apiKey: "", model: "", baseUrl: "", showKey: false };

  const handleSave = async (providerId: string, providerLabel: string) => {
    const vals = getEditVal(providerId);
    const existing = savedKeys.find(k => k.provider === providerId);
    if (!vals.apiKey.trim() && !existing) { toast.error("API key is required"); return; }
    setSavingProvider(providerId);
    try {
      const method = existing ? "PUT" : "POST";
      const url = existing ? `/api/school-keys/${existing.id}` : "/api/school-keys";
      const body: Record<string, string> = { provider: providerId, providerLabel };
      if (vals.apiKey.trim()) body.apiKey = vals.apiKey;
      if (vals.model) body.model = vals.model;
      if (vals.baseUrl) body.baseUrl = vals.baseUrl;
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json", ...getAuthHeader() }, body: JSON.stringify(body) });
      if (res.ok) {
        toast.success(`${providerLabel} key saved — available to all staff immediately`);
        setEditValues(prev => ({ ...prev, [providerId]: { ...getEditVal(providerId), apiKey: "" } }));
        await fetchKeys();
        setExpandedProvider(null);
      } else { const err = await res.json(); toast.error(err.error || "Failed to save key"); }
    } catch (_) { toast.error("Network error"); }
    setSavingProvider(null);
  };

  const handleDelete = async (keyId: number, providerLabel: string) => {
    try {
      const res = await fetch(`/api/school-keys/${keyId}`, { method: "DELETE", headers: { ...getAuthHeader() } });
      if (res.ok) { toast.success(`${providerLabel} key removed`); await fetchKeys(); }
    } catch (_) { toast.error("Failed to remove key"); }
  };

  const handleAddCustom = async () => {
    if (!customProvider.label || !customProvider.apiKey) { toast.error("Provider name and API key required"); return; }
    const id = customProvider.label.toLowerCase().replace(/\s+/g, "-");
    setSavingProvider(id);
    try {
      const res = await fetch("/api/school-keys", { method: "POST", headers: { "Content-Type": "application/json", ...getAuthHeader() }, body: JSON.stringify({ provider: id, providerLabel: customProvider.label, apiKey: customProvider.apiKey, model: customProvider.model, baseUrl: customProvider.baseUrl || undefined }) });
      if (res.ok) { toast.success("Custom provider added"); setCustomProvider({ label: "", apiKey: "", model: "", baseUrl: "" }); setShowCustomForm(false); await fetchKeys(); }
    } catch (_) { toast.error("Failed to add provider"); }
    setSavingProvider(null);
  };

  return (
    <div className="px-4 py-6 max-w-2xl mx-auto space-y-6">
      <div>
        <h2 className="text-xl font-bold text-foreground">Settings</h2>
        <p className="text-sm text-muted-foreground mt-1">Your account and AI configuration</p>
      </div>

      {/* No AI keys warning for non-admins */}
      {!isAdmin && savedKeys.length === 0 && (
        <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-amber-600" />
          <div>
            <p className="font-semibold">AI providers not configured</p>
            <p className="mt-0.5">Ask your school admin to add API keys in Settings → AI Providers. Until then, AI generation may fall back to local templates.</p>
          </div>
        </div>
      )}

      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Key className="h-4 w-4 text-brand" />
              AI Providers
              {savedKeys.length > 0 && <Badge className="bg-green-100 text-green-700 text-xs border-0 ml-1">{savedKeys.length} active</Badge>}
            </CardTitle>
            {isAdmin && <Button variant="ghost" size="icon" className="h-7 w-7" onClick={fetchKeys} disabled={loadingKeys}><RefreshCw className={`h-3.5 w-3.5 ${loadingKeys ? "animate-spin" : ""}`} /></Button>}
          </div>
          {isAdmin
            ? <p className="text-xs text-muted-foreground mt-1">Manage your school's AI API keys. All staff use these — you control the costs. Keys are encrypted at rest.</p>
            : <p className="text-xs text-muted-foreground mt-1">AI providers configured by your school admin. Contact your admin to change these.</p>
          }
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-2 rounded-lg bg-muted/40 p-2.5 text-xs text-muted-foreground">
            <Shield className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-brand" />
            <span>API keys are encrypted with AES-256-GCM before storage. They are never logged, never sent to the client, and only decrypted server-side at the moment of use.</span>
          </div>
          {isAdmin ? (
            <>
              {PRESET_PROVIDERS.map(p => {
                const saved = savedKeys.find(k => k.provider === p.id);
                const isExpanded = expandedProvider === p.id;
                const vals = getEditVal(p.id);
                const Icon = p.icon;
                return (
                  <div key={p.id} className={`border rounded-lg transition-colors ${saved ? "border-brand/40 bg-brand/5" : "border-border"}`}>
                    <button className="w-full flex items-center justify-between p-3 text-left" onClick={() => setExpandedProvider(isExpanded ? null : p.id)}>
                      <div className="flex items-center gap-2">
                        <div className={`w-7 h-7 rounded-md ${p.bg} flex items-center justify-center flex-shrink-0`}><Icon className={`h-3.5 w-3.5 ${p.color}`} /></div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-medium">{p.label}</span>
                            <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${p.badgeColor}`}>{p.badge}</span>
                            {saved && <Badge className="bg-green-100 text-green-700 text-xs border-0"><CheckCircle className="h-3 w-3 mr-1" />Active</Badge>}
                          </div>
                          <p className="text-xs text-muted-foreground">{p.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {saved && <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:text-red-600" onClick={e => { e.stopPropagation(); handleDelete(saved.id, p.label); }}><Trash2 className="w-3.5 h-3.5" /></Button>}
                        {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                      </div>
                    </button>
                    {isExpanded && (
                      <div className="px-3 pb-3 space-y-2 border-t pt-3">
                        {saved && <p className="text-xs text-green-700 flex items-center gap-1"><CheckCircle className="w-3 h-3" />Key saved. Enter a new key below to replace it.</p>}
                        <div>
                          <Label className="text-xs">API Key {saved ? "(leave blank to keep existing)" : "*"}</Label>
                          <div className="relative mt-1">
                            <Input type={vals.showKey ? "text" : "password"} placeholder={p.placeholder} value={vals.apiKey} onChange={e => setEditValues(prev => ({ ...prev, [p.id]: { ...getEditVal(p.id), apiKey: e.target.value } }))} className="pr-8 text-xs font-mono" />
                            <button className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground" onClick={() => setEditValues(prev => ({ ...prev, [p.id]: { ...getEditVal(p.id), showKey: !vals.showKey } }))}>{vals.showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}</button>
                          </div>
                        </div>
                        <div>
                          <Label className="text-xs">Model (optional)</Label>
                          <Input className="mt-1 text-xs" placeholder={`Default: ${p.defaultModel || "auto"}`} value={vals.model} onChange={e => setEditValues(prev => ({ ...prev, [p.id]: { ...getEditVal(p.id), model: e.target.value } }))} />
                        </div>
                        <div className="flex items-center justify-between pt-1">
                          <a href={p.url} target="_blank" rel="noopener noreferrer" className="text-xs text-brand hover:underline">Get your {p.label} API key →</a>
                          <Button size="sm" className="bg-brand hover:bg-brand/90 text-white text-xs h-7" onClick={() => handleSave(p.id, p.label)} disabled={savingProvider === p.id || (!vals.apiKey.trim() && !saved)}>{savingProvider === p.id ? "Saving..." : saved ? "Update" : "Save"}</Button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
              {savedKeys.filter(k => k.isCustom).map(k => (
                <div key={k.id} className="border border-brand/40 bg-brand/5 rounded-lg p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-md bg-muted flex items-center justify-center"><Key className="h-3.5 w-3.5 text-muted-foreground" /></div>
                    <div>
                      <div className="flex items-center gap-2"><span className="text-sm font-medium">{k.providerLabel}</span><Badge className="bg-green-100 text-green-700 text-xs border-0"><CheckCircle className="h-3 w-3 mr-1" />Active</Badge></div>
                      <p className="text-xs text-muted-foreground">Custom provider{k.model ? ` · ${k.model}` : ""}</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:text-red-600" onClick={() => handleDelete(k.id, k.providerLabel)}><Trash2 className="w-3.5 h-3.5" /></Button>
                </div>
              ))}
              <div className="border border-dashed border-border rounded-lg">
                <button className="w-full flex items-center gap-2 p-3 text-sm text-muted-foreground hover:text-foreground" onClick={() => setShowCustomForm(!showCustomForm)}><Plus className="w-4 h-4" />Add custom AI provider (OpenAI-compatible)</button>
                {showCustomForm && (
                  <div className="px-3 pb-3 space-y-2 border-t pt-3">
                    <Input placeholder="Provider name (e.g. My Local LLM)" value={customProvider.label} onChange={e => setCustomProvider(p => ({ ...p, label: e.target.value }))} className="text-xs" />
                    <Input type="password" placeholder="API key" value={customProvider.apiKey} onChange={e => setCustomProvider(p => ({ ...p, apiKey: e.target.value }))} className="text-xs font-mono" />
                    <Input placeholder="Base URL (e.g. https://my-llm.example.com/v1)" value={customProvider.baseUrl} onChange={e => setCustomProvider(p => ({ ...p, baseUrl: e.target.value }))} className="text-xs" />
                    <Input placeholder="Model name" value={customProvider.model} onChange={e => setCustomProvider(p => ({ ...p, model: e.target.value }))} className="text-xs" />
                    <Button size="sm" className="w-full bg-brand hover:bg-brand/90 text-white text-xs" onClick={handleAddCustom} disabled={!!savingProvider}>{savingProvider ? "Adding..." : "Add Provider"}</Button>
                  </div>
                )}
              </div>
              {savedKeys.length === 0 && !loadingKeys && (
                <div className="flex items-center gap-2 rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  No AI keys configured yet. Add at least one provider above to enable AI features for your school.
                </div>
              )}
            </>
          ) : (
            <div className="space-y-2">
              {savedKeys.length > 0 ? savedKeys.map(k => {
                const preset = PRESET_PROVIDERS.find(p => p.id === k.provider);
                const Icon = preset?.icon || Key;
                return (
                  <div key={k.id} className="flex items-center justify-between py-1.5 px-2 rounded-lg bg-muted/30">
                    <div className="flex items-center gap-2">
                      <div className={`w-6 h-6 rounded-md ${preset?.bg || "bg-muted"} flex items-center justify-center`}><Icon className={`h-3.5 w-3.5 ${preset?.color || "text-muted-foreground"}`} /></div>
                      <span className="text-sm font-medium">{k.providerLabel}</span>
                    </div>
                    <Badge className="bg-green-100 text-green-700 text-xs border-0"><CheckCircle className="h-3 w-3 mr-1" />Active</Badge>
                  </div>
                );
              }) : <p className="text-xs text-muted-foreground text-center py-2">No AI providers configured. Contact your school admin.</p>}
            </div>
          )}
        </CardContent>
      </Card>

      <BillingSection />
      <MisIntegrationSection />

      <PersonalisationSection />

      <Card className="border-border/50">
        <CardHeader className="pb-3"><CardTitle className="text-base">Account</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">{user?.displayName}</p>
              <p className="text-xs text-muted-foreground">{user?.email} · {user?.role}</p>
            </div>
            <Badge className="bg-brand-light text-brand text-xs">Active</Badge>
          </div>
          <Button variant="outline" className="w-full text-red-600 hover:text-red-700 hover:bg-red-50" onClick={logout}>Sign Out</Button>
        </CardContent>
      </Card>

      <Card className="border-border/50">
        <CardContent className="p-4">
          <p className="text-xs text-muted-foreground text-center">
            Adaptly for UK Teachers<br />
            <a href="/privacy" className="text-brand hover:underline">Privacy Policy</a>
            {" · "}
            <a href="/terms" className="text-brand hover:underline">Terms</a>
            {" · "}
            <a href="/help" className="text-brand hover:underline">Help Centre</a>
            {" · "}
            <a href="/ai-governance" className="text-brand hover:underline">AI Governance</a>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
