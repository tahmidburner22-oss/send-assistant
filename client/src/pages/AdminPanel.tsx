import { useState, useEffect, useRef } from "react";
import {
  Users, Shield, Activity, UserPlus, UserX, UserCheck, Key,
  AlertTriangle, BarChart3, Settings2, Terminal, RefreshCw,
  Eye, EyeOff, CheckCircle2, Cpu, Zap, Globe, TrendingUp,
  CreditCard, Building2, FileText, ChevronDown, ChevronRight,
  PoundSterling, Calendar, ExternalLink, Image, Presentation, Trash2, Plus, Download
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useApp } from "@/contexts/AppContext";
import { schools as schoolsApi, pupils as pupilsApi } from "@/lib/api";
import { useLocation } from "wouter";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import WorksheetRenderer from "@/components/WorksheetRenderer";
import WorksheetErrorBoundary from "@/components/WorksheetErrorBoundary";

const ROLE_LABELS: Record<string, string> = {
  mat_admin: "MAT Admin",
  school_admin: "School Admin",
  senco: "SENCO / Inclusion Lead",
  teacher: "Teacher",
  ta: "Teaching Assistant",
  staff: "Support Staff",
};
const ROLE_COLOURS: Record<string, string> = {
  mat_admin: "bg-purple-100 text-purple-700",
  school_admin: "bg-blue-100 text-blue-700",
  senco: "bg-teal-100 text-teal-700",
  teacher: "bg-brand/10 text-brand",
  ta: "bg-gray-100 text-gray-700",
  staff: "bg-slate-100 text-slate-600",
};
const ROLE_ACCESS: Record<string, string> = {
  mat_admin: "Full MAT-wide access",
  school_admin: "Full school access — users, settings, API keys",
  senco: "Manager access — pupil profiles, reports, inclusion settings",
  teacher: "Standard access — create resources, manage own pupils",
  ta: "Standard access — support pupils, view resources",
  staff: "Limited access — view assigned resources only",
};

const LIBRARY_YEAR_ORDER = [
  "Year 1", "Year 2", "Year 3", "Year 4", "Year 5", "Year 6",
  "Year 7", "Year 8", "Year 9", "Year 10", "Year 11",
];

function normaliseLibraryLabel(value: unknown, fallback: string) {
  const label = String(value ?? "").trim();
  return label || fallback;
}

function sortLibraryYearGroups(a: string, b: string) {
  const aIndex = LIBRARY_YEAR_ORDER.indexOf(a);
  const bIndex = LIBRARY_YEAR_ORDER.indexOf(b);
  if (aIndex !== -1 || bIndex !== -1) {
    if (aIndex === -1) return 1;
    if (bIndex === -1) return -1;
    return aIndex - bIndex;
  }
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });
}

function buildLibraryGroups(entries: any[]) {
  const grouped = new Map<string, Map<string, Map<string, any[]>>>();

  for (const entry of entries) {
    const yearGroup = normaliseLibraryLabel(entry.year_group ?? entry.yearGroup, "Unassigned year");
    const subject = normaliseLibraryLabel(entry.subject, "Unassigned subject");
    const topic = normaliseLibraryLabel(entry.topic, "Unassigned topic");

    if (!grouped.has(yearGroup)) grouped.set(yearGroup, new Map());
    const subjectMap = grouped.get(yearGroup)!;
    if (!subjectMap.has(subject)) subjectMap.set(subject, new Map());
    const topicMap = subjectMap.get(subject)!;
    if (!topicMap.has(topic)) topicMap.set(topic, []);
    topicMap.get(topic)!.push(entry);
  }

  return Array.from(grouped.entries())
    .sort(([a], [b]) => sortLibraryYearGroups(a, b))
    .map(([yearGroup, subjectMap]) => ({
      yearGroup,
      subjects: Array.from(subjectMap.entries())
        .sort(([a], [b]) => a.localeCompare(b, undefined, { sensitivity: "base" }))
        .map(([subject, topicMap]) => ({
          subject,
          topics: Array.from(topicMap.entries())
            .sort(([a], [b]) => a.localeCompare(b, undefined, { sensitivity: "base" }))
            .map(([topic, topicEntries]) => ({ topic, entries: topicEntries })),
        })),
    }));
}

const AI_PROVIDERS = [
  { id: "groq", label: "Groq (Llama 3.1 8B)", icon: Zap, color: "text-orange-500", description: "Ultra-fast, free tier" },
  { id: "gemini", label: "Google Gemini", icon: Globe, color: "text-blue-500", description: "Google's flagship model" },
  { id: "openai", label: "OpenAI GPT-4", icon: Cpu, color: "text-green-600", description: "GPT-4.1 mini" },
  { id: "openrouter", label: "OpenRouter", icon: Globe, color: "text-purple-500", description: "Multi-model routing" },
  { id: "claude", label: "Anthropic Claude", icon: Cpu, color: "text-amber-600", description: "Claude 3.5 Sonnet" },
];

export default function AdminPanel() {
  const { user } = useApp();
  const [, setLocation] = useLocation();
  const [users, setUsers] = useState<any[]>([]);
  const [incidents, setIncidents] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [usageTrend, setUsageTrend] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [inviteRole, setInviteRole] = useState("teacher");
  const [inviting, setInviting] = useState(false);
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({});
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [liveLog, setLiveLog] = useState<string[]>([]);
  const logRef = useRef<HTMLDivElement>(null);
  const [breaches, setBreaches] = useState<any[]>([]);
  const [showBreachForm, setShowBreachForm] = useState(false);
  const [breachForm, setBreachForm] = useState({ title: "", description: "", data_types: [] as string[], affected_count: "", severity: "medium" });
  const [savingBreach, setSavingBreach] = useState(false);
  const [tempCredentials, setTempCredentials] = useState<{ email: string; password: string } | null>(null);

  const canAccess = user && (
    ["mat_admin", "school_admin", "senco"].includes(user.role) ||
    user.email === "admin@adaptly.co.uk" ||
    user.email === "admin@sendassistant.app"
  );
  const isSuperAdmin = user && (
    user.role === "mat_admin" ||
    user.email === "admin@adaptly.co.uk" ||
    user.email === "admin@sendassistant.app"
  );
  // isPlatformOwner: only the exact platform owner email can see the Library
  const isPlatformOwner = user && (
    user.email === "admin@adaptly.co.uk" ||
    user.email === "admin@sendassistant.app"
  );
  const [allSchools, setAllSchools] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [superAuditLogs, setSuperAuditLogs] = useState<any[]>([]);
  const [billingSummary, setBillingSummary] = useState<any>(null);
  const [invoiceForm, setInvoiceForm] = useState({ school_id: "", amount: "", description: "", due_date: "", notes: "" });
  const [generatedInvoice, setGeneratedInvoice] = useState<any>(null);
  const [savingInvoice, setSavingInvoice] = useState(false);
  const [schoolActivity, setSchoolActivity] = useState<{ [id: string]: any[] }>({});
  const [loadingActivity, setLoadingActivity] = useState<string | null>(null);

  useEffect(() => {
    if (!canAccess) return;
        Promise.all([
      schoolsApi.listUsers().catch(() => []),
      pupilsApi.listIncidents().catch(() => []),
      schoolsApi.auditLogs("audit-admin").catch(() => []),
      fetch("/api/admin/stats", { credentials: "include" }).then(r => r.ok ? r.json() : null).catch(() => null),
      fetch("/api/admin/ai-keys", { credentials: "include" }).then(r => r.ok ? r.json() : {}).catch(() => ({})),
      fetch("/api/admin/breach-log", { credentials: "include" }).then(r => r.ok ? r.json() : { breaches: [] }).catch(() => ({ breaches: [] })),
      fetch("/api/admin/school-usage-trend", { credentials: "include" }).then(r => r.ok ? r.json() : []).catch(() => []),
    ]).then(([u, i, a, s, k, b, trend]) => {
      setUsers(u || []); setIncidents(i || []); setAuditLogs(a || []);
      setStats(s); setApiKeys(k || {}); setBreaches((b as any)?.breaches || []);
      setUsageTrend(Array.isArray(trend) ? trend : []);
    }).catch(() => toast.error("Failed to load admin data"))
      .finally(() => setLoading(false));

    // Load super admin data if applicable
    if (isSuperAdmin) {
      Promise.all([
        fetch("/api/admin/super/schools", { credentials: "include" }).then(r => r.ok ? r.json() : { schools: [] }).catch(() => ({ schools: [] })),
        fetch("/api/admin/super/billing-summary", { credentials: "include" }).then(r => r.ok ? r.json() : null).catch(() => null),
        fetch("/api/admin/super/users", { credentials: "include" }).then(r => r.ok ? r.json() : { users: [] }).catch(() => ({ users: [] })),
        fetch("/api/admin/super/audit", { credentials: "include" }).then(r => r.ok ? r.json() : { logs: [] }).catch(() => ({ logs: [] })),
      ]).then(([s, b, u, al]) => {
        setAllSchools((s as any)?.schools || []);
        setBillingSummary(b);
        setAllUsers((u as any)?.users || []);
        setSuperAuditLogs((al as any)?.logs || []);
      }).catch(() => {});
    }
  }, [canAccess]);

  // Live log polling every 5s
  useEffect(() => {
    if (!canAccess) return;
    const poll = setInterval(async () => {
      try {
        const r = await fetch("/api/admin/live-logs", { credentials: "include" });
        if (r.ok) {
          const data = await r.json();
          setLiveLog(data.logs || []);
          if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
        }
      } catch {}
    }, 5000);
    return () => clearInterval(poll);
  }, [canAccess]);

  if (!canAccess) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <Shield className="w-12 h-12 text-muted-foreground" />
        <p className="text-muted-foreground">You don't have permission to access this page.</p>
        <Button variant="outline" onClick={() => setLocation("/home")}>Go Home</Button>
      </div>
    );
  }

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail || !inviteName) return;
    setInviting(true);
    try {
      const result = await schoolsApi.inviteUser({ email: inviteEmail, displayName: inviteName, role: inviteRole });
      const tempPwd = result?.tempPassword;
      if (tempPwd) {
        setTempCredentials({ email: inviteEmail, password: tempPwd });
      } else {
        toast.success(`Invitation sent to ${inviteEmail}`);
      }
      setInviteEmail("");
      setInviteName("");
      const updated = await schoolsApi.listUsers();
      setUsers(updated);
    } catch (err: any) { toast.error(err.message || "Failed to send invitation"); }
    setInviting(false);
  };

  const handleDeactivate = async (userId: string, name: string) => {
    if (!confirm(`Deactivate ${name}? They will no longer be able to log in.`)) return;
    try {
      await schoolsApi.deactivateUser(userId);
      toast.success(`${name} has been deactivated`);
      setUsers(u => u.map(x => x.id === userId ? { ...x, is_active: 0 } : x));
    } catch (err: any) { toast.error(err.message || "Failed to deactivate user"); }
  };

  const handleReactivate = async (userId: string, name: string) => {
    try {
      await schoolsApi.reactivateUser(userId);
      toast.success(`${name} has been reactivated`);
      setUsers(u => u.map(x => x.id === userId ? { ...x, is_active: 1 } : x));
    } catch (err: any) { toast.error(err.message || "Failed to reactivate user"); }
  };

  const handleRoleChange = async (userId: string, role: string) => {
    try {
      await schoolsApi.updateUserRole(userId, role);
      toast.success("Role updated");
      setUsers(u => u.map(x => x.id === userId ? { ...x, role } : x));
    } catch (err: any) { toast.error(err.message || "Failed to update role"); }
  };

  const handleSaveKey = async (provider: string) => {
    setSavingKey(provider);
    try {
      await fetch("/api/admin/ai-keys", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider, key: apiKeys[provider] }),
      });
      toast.success(`${provider} API key saved`);
    } catch { toast.error("Failed to save key"); }
    setSavingKey(null);
  };

  const handleTestKey = async (provider: string) => {
    toast.info(`Testing ${provider} connection...`);
    try {
      const r = await fetch(`/api/admin/test-ai/${provider}`, { credentials: "include" });
      const data = await r.json();
      if (data.ok) toast.success(`${provider} is working correctly`);
      else toast.error(`${provider} test failed: ${data.error}`);
    } catch { toast.error(`${provider} test failed`); }
  };

  return (
    <div className="px-4 py-6 max-w-4xl mx-auto space-y-6">
      {/* Temp credentials dialog */}
      {tempCredentials && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg text-foreground">✅ User Created</h3>
              <button onClick={() => setTempCredentials(null)} className="text-muted-foreground hover:text-foreground text-2xl leading-none">×</button>
            </div>
            <p className="text-sm text-muted-foreground">Share these login credentials securely. This dialog will not appear again once closed.</p>
            <div className="space-y-3">
              <div className="bg-muted rounded-lg p-3">
                <p className="text-xs text-muted-foreground mb-1 font-medium">Email</p>
                <p className="text-sm font-mono text-foreground">{tempCredentials.email}</p>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="text-xs text-amber-700 mb-1 font-medium">Temporary Password — ask them to change this on first login</p>
                <p className="text-sm font-mono text-amber-900 font-bold tracking-wide">{tempCredentials.password}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => { navigator.clipboard.writeText(`Email: ${tempCredentials.email}\nPassword: ${tempCredentials.password}`); toast.success("Copied to clipboard"); }}
                className="flex-1 bg-brand text-white rounded-lg py-2 text-sm font-medium hover:bg-brand/90 transition-colors"
              >📋 Copy Credentials</button>
              <button onClick={() => setTempCredentials(null)} className="flex-1 border border-border rounded-lg py-2 text-sm text-muted-foreground hover:bg-muted transition-colors">Done</button>
            </div>
          </div>
        </div>
      )}
      <div>
        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
          <Shield className="w-5 h-5 text-brand" /> Admin Panel
        </h2>
        <p className="text-sm text-muted-foreground mt-1">Manage users, AI providers, and system settings</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Users", value: users.length, color: "text-blue-600" },
          { label: "Active Users", value: users.filter(u => u.is_active !== 0).length, color: "text-green-600" },
          { label: "Open Incidents", value: incidents.filter(i => i.status === "open").length, color: "text-amber-600" },
          { label: "Audit Events (24h)", value: auditLogs.filter(l => new Date(l.created_at) > new Date(Date.now() - 86400000)).length, color: "text-brand" },
        ].map((s, i) => (
          <Card key={i} className="border-border/50">
            <CardContent className="p-3 text-center">
              <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-[11px] text-muted-foreground mt-0.5">{s.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="users">
        <TabsList className="flex flex-wrap h-auto gap-1 p-1 w-full">
          <TabsTrigger value="users" className="text-xs py-1.5 flex-1"><Users className="w-3.5 h-3.5 mr-1" />Users</TabsTrigger>
          <TabsTrigger value="ai-keys" className="text-xs py-1.5 flex-1"><Key className="w-3.5 h-3.5 mr-1" />AI Keys</TabsTrigger>
          <TabsTrigger value="audit" className="text-xs py-1.5 flex-1"><Activity className="w-3.5 h-3.5 mr-1" />Audit</TabsTrigger>
          <TabsTrigger value="analytics" className="text-xs py-1.5 flex-1"><BarChart3 className="w-3.5 h-3.5 mr-1" />Analytics</TabsTrigger>
          <TabsTrigger value="safeguarding" className="text-xs py-1.5 flex-1"><AlertTriangle className="w-3.5 h-3.5 mr-1" />Safe</TabsTrigger>
          <TabsTrigger value="logs" className="text-xs py-1.5 flex-1"><Terminal className="w-3.5 h-3.5 mr-1" />Logs</TabsTrigger>
          <TabsTrigger value="breach" className="text-xs py-1.5 flex-1"><Shield className="w-3.5 h-3.5 mr-1" />Breaches</TabsTrigger>
          <TabsTrigger value="settings" className="text-xs py-1.5 flex-1"><Settings2 className="w-3.5 h-3.5 mr-1" />System</TabsTrigger>
          {isPlatformOwner && (
            <TabsTrigger value="library" className="text-xs py-1.5 flex-1 bg-amber-50 text-amber-700 data-[state=active]:bg-amber-600 data-[state=active]:text-white"><FileText className="w-3.5 h-3.5 mr-1" />Worksheets</TabsTrigger>
          )}
          {isPlatformOwner && (
            <TabsTrigger value="presentations" className="text-xs py-1.5 flex-1 bg-blue-50 text-blue-700 data-[state=active]:bg-blue-600 data-[state=active]:text-white"><Presentation className="w-3.5 h-3.5 mr-1" />Slides</TabsTrigger>
          )}
          {isPlatformOwner && (
            <TabsTrigger value="diagrams" className="text-xs py-1.5 flex-1 bg-emerald-50 text-emerald-700 data-[state=active]:bg-emerald-600 data-[state=active]:text-white"><Image className="w-3.5 h-3.5 mr-1" />Diagrams</TabsTrigger>
          )}
          {isSuperAdmin && (
            <TabsTrigger value="super" className="text-xs py-1.5 flex-1 bg-purple-50 text-purple-700 data-[state=active]:bg-purple-600 data-[state=active]:text-white">
              <Building2 className="w-3.5 h-3.5 mr-1" />Schools
            </TabsTrigger>
          )}
        </TabsList>

        {/* ── USERS ── */}
        <TabsContent value="users" className="space-y-4 mt-4">
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-brand" /> Invite New User
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleInvite} className="flex gap-2 flex-wrap">
                <Input type="text" value={inviteName} onChange={e => setInviteName(e.target.value)}
                  placeholder="Full name" className="flex-1 min-w-36" required />
                <Input type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)}
                  placeholder="teacher@school.sch.uk" className="flex-1 min-w-48" required />
                <Select value={inviteRole} onValueChange={setInviteRole}>
                  <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(ROLE_LABELS).filter(([k]) => k !== "mat_admin").map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button type="submit" className="bg-brand hover:bg-brand/90 text-white" disabled={inviting}>
                  {inviting ? "Sending..." : "Send Invite"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardContent className="p-0">
              <div className="divide-y divide-border/50">
                {loading ? (
                  <div className="p-6 text-center text-muted-foreground text-sm">Loading users...</div>
                ) : users.length === 0 ? (
                  <div className="p-6 text-center text-muted-foreground text-sm">No users yet</div>
                ) : users.map(u => (
                  <div key={u.id} className="p-4 flex items-center gap-3 flex-wrap">
                    <div className="w-9 h-9 rounded-full bg-brand/10 flex items-center justify-center text-sm font-semibold text-brand shrink-0">
                      {u.display_name?.charAt(0)?.toUpperCase() || u.displayName?.charAt(0)?.toUpperCase() || "?"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{u.display_name || u.displayName}</p>
                      <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                      <p className="text-[11px] text-muted-foreground/70 truncate mt-0.5">{ROLE_ACCESS[u.role] || ""}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ROLE_COLOURS[u.role] || ""}`}>{ROLE_LABELS[u.role] || u.role}</span>
                      {u.is_active === 0 && <Badge variant="destructive" className="text-xs">Inactive</Badge>}
                      {u.id !== user?.id && (
                        <>
                          <Select value={u.role} onValueChange={v => handleRoleChange(u.id, v)}>
                            <SelectTrigger className="h-7 text-xs w-32"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {Object.entries(ROLE_LABELS).filter(([k]) => k !== "mat_admin").map(([k, v]) => (
                                <SelectItem key={k} value={k} className="text-xs">{v}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {u.is_active !== 0 ? (
                            <Button size="sm" variant="ghost" className="h-7 text-xs text-destructive hover:text-destructive"
                              onClick={() => handleDeactivate(u.id, u.display_name || u.displayName)}>
                              <UserX className="w-3.5 h-3.5 mr-1" />Deactivate
                            </Button>
                          ) : (
                            <Button size="sm" variant="ghost" className="h-7 text-xs text-green-600"
                              onClick={() => handleReactivate(u.id, u.display_name || u.displayName)}>
                              <UserCheck className="w-3.5 h-3.5 mr-1" />Reactivate
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── AI KEYS ── */}
        <TabsContent value="ai-keys" className="space-y-4 mt-4">
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Key className="w-4 h-4 text-brand" /> Server-Side AI API Keys
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-1">Keys are stored securely on the server. All users benefit automatically — no individual key entry needed.</p>
            </CardHeader>
            <CardContent className="space-y-4">
              {AI_PROVIDERS.map(provider => {
                const Icon = provider.icon;
                const currentKey = apiKeys[provider.id] || "";
                const isVisible = showKeys[provider.id];
                return (
                  <div key={provider.id} className="p-3 rounded-xl border border-border/40 bg-gray-50/50 space-y-2">
                    <div className="flex items-center gap-2">
                      <Icon className={`w-4 h-4 ${provider.color}`} />
                      <span className="text-sm font-medium">{provider.label}</span>
                      <span className="text-xs text-muted-foreground">— {provider.description}</span>
                      {currentKey && <CheckCircle2 className="w-3.5 h-3.5 text-green-500 ml-auto" />}
                    </div>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Input
                          type={isVisible ? "text" : "password"}
                          value={currentKey}
                          onChange={e => setApiKeys(prev => ({ ...prev, [provider.id]: e.target.value }))}
                          placeholder={`Enter ${provider.label} API key...`}
                          className="h-9 text-sm pr-9"
                        />
                        <button
                          onClick={() => setShowKeys(prev => ({ ...prev, [provider.id]: !prev[provider.id] }))}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {isVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                      <Button onClick={() => handleSaveKey(provider.id)}
                        disabled={savingKey === provider.id || !currentKey}
                        size="sm" className="h-9 bg-brand hover:bg-brand/90 text-white text-xs">
                        {savingKey === provider.id ? "Saving..." : "Save"}
                      </Button>
                      <Button onClick={() => handleTestKey(provider.id)}
                        disabled={!currentKey} size="sm" variant="outline" className="h-9 text-xs">
                        Test
                      </Button>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── AUDIT LOG ── */}
        <TabsContent value="audit" className="space-y-4 mt-4">
          <Card className="border-border/50">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Activity className="w-4 h-4 text-brand" /> Audit Log
              </CardTitle>
              <Button size="sm" variant="outline" className="h-8 text-xs"
                onClick={async () => { const a = await schoolsApi.auditLogs("audit-admin"); setAuditLogs(a); toast.success("Refreshed"); }}>
                <RefreshCw className="w-3 h-3 mr-1" /> Refresh
              </Button>
            </CardHeader>
            <CardContent>
              <div className="divide-y divide-border/50 max-h-96 overflow-y-auto">
                {auditLogs.length === 0 ? (
                  <div className="p-6 text-center text-muted-foreground text-sm">No audit events recorded</div>
                ) : auditLogs.map((log, i) => (
                  <div key={i} className="p-3 flex items-start gap-3 border-b border-border/30 last:border-0">
                    <Activity className="w-4 h-4 text-brand shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0 space-y-1">
                      <p className="text-xs font-semibold text-foreground">{log.action}</p>
                      <p className="text-xs text-muted-foreground">
                        {log.display_name || log.email || "System"}
                        {log.role && ` (${log.role})`}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {log.ip_masked || log.ip_address || "Unknown IP"}
                        {log.device && ` • ${log.device}`}
                        {log.browser && ` • ${log.browser}`}
                        {log.os && ` • ${log.os}`}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {log.created_at ? new Date(log.created_at).toLocaleString("en-GB") : ""}
                      </p>
                    </div>
                  </div>
                 ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        {/* ── ANALYTICS ── */}
        <TabsContent value="analytics" className="space-y-4 mt-4">
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-brand" /> Platform Analytics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {stats ? (
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Total Worksheets", value: stats.totalWorksheets || 0, color: "text-brand" },
                    { label: "Total Stories", value: stats.totalStories || 0, color: "text-purple-600" },
                    { label: "Differentiations", value: stats.totalDifferentiations || 0, color: "text-blue-600" },
                    { label: "Total AI Calls", value: stats.totalAiCalls || 0, color: "text-green-600" },
                    { label: "Active (7 days)", value: stats.activeUsers7d || 0, color: "text-amber-600" },
                    { label: "Avg Time Saved", value: `${stats.avgTimeSaved || 0}m`, color: "text-teal-600" },
                  ].map((s, i) => (
                    <Card key={i} className="border-border/40">
                      <CardContent className="p-3 text-center">
                        <div className={`text-xl font-bold ${s.color}`}>{s.value}</div>
                        <div className="text-[10px] text-muted-foreground mt-0.5 leading-tight">{s.label}</div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">Loading analytics...</p>
              )}

              {/* Weekly usage trend chart */}
              {usageTrend.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1">
                    <TrendingUp className="w-3.5 h-3.5 text-brand" /> School Activity — Last 8 Weeks
                  </p>
                  <ResponsiveContainer width="100%" height={160}>
                    <LineChart data={usageTrend}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="week" tick={{ fontSize: 9 }} interval={1} />
                      <YAxis tick={{ fontSize: 9 }} allowDecimals={false} />
                      <Tooltip />
                      <Legend iconSize={7} wrapperStyle={{ fontSize: 9 }} />
                      <Line type="monotone" dataKey="worksheets" stroke="#10B981" strokeWidth={2} dot={{ r: 2 }} name="Worksheets" />
                      <Line type="monotone" dataKey="stories" stroke="#7C3AED" strokeWidth={2} dot={{ r: 2 }} name="Stories" />
                      <Line type="monotone" dataKey="activeUsers" stroke="#F59E0B" strokeWidth={2} dot={{ r: 2 }} name="Active Users" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── SAFEGUARDING ── */}
        <TabsContent value="safeguarding" className="space-y-4 mt-4">
          <Card className="border-border/50">
            <CardContent className="p-0">
              <div className="divide-y divide-border/50">
                {incidents.length === 0 ? (
                  <div className="p-6 text-center text-muted-foreground text-sm">
                    <CheckCircle2 className="w-8 h-8 text-green-500 mx-auto mb-2" />
                    No safeguarding incidents recorded
                  </div>
                ) : incidents.map(inc => (
                  <div key={inc.id} className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant={inc.severity === "high" ? "destructive" : "secondary"} className="text-xs">{inc.severity}</Badge>
                          <Badge variant={inc.status === "open" ? "outline" : "secondary"} className="text-xs">{inc.status}</Badge>
                          {inc.dsl_notified && <span className="text-xs text-green-600">DSL notified</span>}
                        </div>
                        <p className="text-sm">{inc.description}</p>
                        <p className="text-xs text-muted-foreground mt-1">{new Date(inc.created_at || inc.createdAt).toLocaleString("en-GB")}</p>
                      </div>
                      {inc.status === "open" && (
                        <Button size="sm" variant="outline" className="text-xs h-7 shrink-0" onClick={async () => {
                          try {
                            await pupilsApi.updateIncident(inc.id, { status: "resolved" });
                            setIncidents(i => i.map(x => x.id === inc.id ? { ...x, status: "resolved" } : x));
                            toast.success("Incident marked as resolved");
                          } catch { toast.error("Failed to update incident"); }
                        }}>Resolve</Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── LIVE LOGS ── */}
        <TabsContent value="logs" className="space-y-4 mt-4">
          <Card className="border-border/50">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Terminal className="w-4 h-4 text-green-600" /> Live Application Logs
              </CardTitle>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-xs text-muted-foreground">Live (5s refresh)</span>
              </div>
            </CardHeader>
            <CardContent>
              <div
                ref={logRef}
                className="bg-gray-950 rounded-lg p-3 h-80 overflow-y-auto font-mono text-xs text-green-400 space-y-0.5"
              >
                {liveLog.length === 0 ? (
                  <span className="text-gray-500">Waiting for log entries...</span>
                ) : (
                  liveLog.map((line, i) => (
                    <div key={i} className={`leading-relaxed ${
                      line.includes("ERROR") ? "text-red-400" :
                      line.includes("WARN") ? "text-yellow-400" :
                      line.includes("AI") || line.includes("generate") ? "text-cyan-400" :
                      "text-green-400"
                    }`}>
                      {line}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── SYSTEM SETTINGS ── */}
        <TabsContent value="settings" className="space-y-4 mt-4">
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Settings2 className="w-4 h-4 text-brand" /> System Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { label: "AI Ensemble Mode", desc: "Multiple AI providers working together", status: "Active" },
                { label: "Google OAuth", desc: "Allow users to sign in with Google", status: "Enabled" },
                { label: "Data Persistence", desc: "All user data saved to database", status: "Active" },
                { label: "Audit Logging", desc: "All actions logged for compliance", status: "Active" },
                { label: "Widgit-Style Symbols", desc: "Visual symbols on worksheets for SEND students", status: "Active" },
                { label: "Print-Ready PDF Export", desc: "Pixel-perfect PDF matching on-screen view", status: "Active" },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-border/40 bg-gray-50/50">
                  <div>
                    <p className="text-sm font-medium">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                  <Badge className="bg-green-100 text-green-700">{item.status}</Badge>
                </div>
              ))}

              <div className="pt-2 border-t border-border/40">
                <p className="text-xs font-semibold text-foreground mb-2">Admin Account</p>
                <div className="p-3 rounded-lg bg-brand/5 border border-brand/20 text-xs text-muted-foreground space-y-1">
                  <p><strong>Email:</strong> admin@sendassistant.app</p>
                  <p><strong>Role:</strong> Platform Owner (Full Access)</p>
                  <p><strong>API Keys:</strong> Pre-configured server-side — no user input required</p>
                  <p><strong>Version:</strong> Adaptly v2.0 — SEND Final</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        {/* ── GDPR BREACH LOG ── */}
        <TabsContent value="breach" className="space-y-4 mt-4">
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Shield className="w-4 h-4 text-red-500" /> GDPR Data Breach Log
                  <span className="text-xs font-normal text-muted-foreground ml-1">(Art. 33/34 UK GDPR)</span>
                </CardTitle>
                <Button size="sm" variant="outline" className="text-xs gap-1 border-red-200 text-red-600 hover:bg-red-50" onClick={() => setShowBreachForm(v => !v)}>
                  {showBreachForm ? "Cancel" : "+ Report Breach"}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {showBreachForm && (
                <div className="border border-red-200 rounded-xl p-4 space-y-3 bg-red-50/40">
                  <p className="text-xs font-semibold text-red-700">Report a new data breach — you must notify the ICO within 72 hours if the breach is likely to result in a risk to individuals.</p>
                  <div className="space-y-1">
                    <Label className="text-xs">Breach Title *</Label>
                    <Input className="text-sm" placeholder="e.g. Unauthorised access to pupil records" value={breachForm.title} onChange={e => setBreachForm(f => ({ ...f, title: e.target.value }))} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Description *</Label>
                    <textarea className="w-full text-sm bg-background border border-border rounded-lg px-3 py-2 min-h-[80px] resize-none" placeholder="Describe what happened, when it was discovered, and how..." value={breachForm.description} onChange={e => setBreachForm(f => ({ ...f, description: e.target.value }))} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Data Types Involved *</Label>
                    <div className="flex flex-wrap gap-2">
                      {["Names", "Email addresses", "SEND data", "Behaviour records", "Attendance records", "Safeguarding data", "Passwords", "Financial data"].map(dt => (
                        <button key={dt} type="button"
                          className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                            breachForm.data_types.includes(dt)
                              ? "bg-red-100 border-red-400 text-red-700"
                              : "bg-muted border-border text-muted-foreground hover:border-red-300"
                          }`}
                          onClick={() => setBreachForm(f => ({
                            ...f,
                            data_types: f.data_types.includes(dt)
                              ? f.data_types.filter(x => x !== dt)
                              : [...f.data_types, dt]
                          }))}
                        >{dt}</button>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Estimated Affected Individuals</Label>
                      <Input className="text-sm" type="number" min="0" placeholder="0" value={breachForm.affected_count} onChange={e => setBreachForm(f => ({ ...f, affected_count: e.target.value }))} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Severity</Label>
                      <select className="w-full text-sm bg-background border border-border rounded-lg px-3 py-2" value={breachForm.severity} onChange={e => setBreachForm(f => ({ ...f, severity: e.target.value }))}>
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="critical">Critical</option>
                      </select>
                    </div>
                  </div>
                  <Button className="w-full bg-red-600 hover:bg-red-700 text-white text-sm" disabled={savingBreach || !breachForm.title || !breachForm.description || breachForm.data_types.length === 0}
                    onClick={async () => {
                      setSavingBreach(true);
                      try {
                        const r = await fetch("/api/admin/breach-log", {
                          method: "POST", credentials: "include",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ ...breachForm, affected_count: Number(breachForm.affected_count) || 0 }),
                        });
                        if (!r.ok) throw new Error((await r.json()).error);
                        toast.success("Breach reported and logged to audit trail");
                        setShowBreachForm(false);
                        setBreachForm({ title: "", description: "", data_types: [], affected_count: "", severity: "medium" });
                        const updated = await fetch("/api/admin/breach-log", { credentials: "include" }).then(r => r.json());
                        setBreaches(updated.breaches || []);
                      } catch (err: any) { toast.error(err.message); }
                      setSavingBreach(false);
                    }}
                  >{savingBreach ? "Saving..." : "Submit Breach Report"}</Button>
                </div>
              )}
              {breaches.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Shield className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No breaches reported</p>
                  <p className="text-xs mt-1">Use this log to record any data incidents for ICO compliance</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {breaches.map((b: any) => {
                    const severityColour: Record<string, string> = { low: "bg-blue-100 text-blue-700", medium: "bg-amber-100 text-amber-700", high: "bg-orange-100 text-orange-700", critical: "bg-red-100 text-red-700" };
                    const statusColour: Record<string, string> = { open: "bg-red-100 text-red-700", investigating: "bg-amber-100 text-amber-700", resolved: "bg-green-100 text-green-700", closed: "bg-gray-100 text-gray-600" };
                    return (
                      <div key={b.id} className="border border-border rounded-xl p-4 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-foreground">{b.title}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{b.description}</p>
                          </div>
                          <div className="flex gap-1.5 flex-shrink-0">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${severityColour[b.severity] || "bg-gray-100 text-gray-600"}`}>{b.severity}</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColour[b.status] || "bg-gray-100 text-gray-600"}`}>{b.status}</span>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {(b.data_types || "").split(", ").filter(Boolean).map((dt: string) => (
                            <span key={dt} className="text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground">{dt}</span>
                          ))}
                        </div>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>{b.affected_count} affected</span>
                          <span>Reported: {new Date(b.created_at).toLocaleDateString("en-GB")}</span>
                          <span className={b.ico_notified ? "text-green-600" : "text-amber-600"}>{b.ico_notified ? "✓ ICO notified" : "⚠ ICO not yet notified"}</span>
                        </div>
                        {b.status === "open" && (
                          <div className="flex gap-2 pt-1">
                            <Button size="sm" variant="outline" className="text-xs h-7"
                              onClick={async () => {
                                await fetch(`/api/admin/breach-log/${b.id}`, { method: "PATCH", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ico_notified: 1 }) });
                                setBreaches(bs => bs.map(x => x.id === b.id ? { ...x, ico_notified: 1 } : x));
                                toast.success("ICO notification recorded");
                              }}
                            >Mark ICO Notified</Button>
                            <Button size="sm" variant="outline" className="text-xs h-7"
                              onClick={async () => {
                                await fetch(`/api/admin/breach-log/${b.id}`, { method: "PATCH", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "resolved", resolved_at: new Date().toISOString() }) });
                                setBreaches(bs => bs.map(x => x.id === b.id ? { ...x, status: "resolved" } : x));
                                toast.success("Breach marked as resolved");
                              }}
                            >Mark Resolved</Button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── SUPER ADMIN: ALL SCHOOLS ── */}
        {isSuperAdmin && (
          <TabsContent value="super" className="space-y-4 mt-4">

            {/* Billing Summary Cards */}
            {billingSummary && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  { label: "Total Schools", value: billingSummary.summary.total_schools, icon: Building2, color: "text-blue-600" },
                  { label: "Active Subscriptions", value: billingSummary.summary.active, icon: CheckCircle2, color: "text-green-600" },
                  { label: "On Trial", value: billingSummary.summary.on_trial, icon: Calendar, color: "text-amber-600" },
                  { label: "Overdue", value: billingSummary.summary.overdue, icon: AlertTriangle, color: "text-red-600" },
                  { label: "MRR", value: `£${billingSummary.summary.mrr}`, icon: PoundSterling, color: "text-brand" },
                  { label: "ARR", value: `£${billingSummary.summary.arr}`, icon: TrendingUp, color: "text-purple-600" },
                ].map((s, i) => (
                  <Card key={i} className="border-border/50">
                    <CardContent className="p-3">
                      <div className="flex items-center gap-2">
                        <s.icon className={`w-4 h-4 ${s.color}`} />
                        <div>
                          <div className={`text-lg font-bold ${s.color}`}>{s.value}</div>
                          <div className="text-[11px] text-muted-foreground">{s.label}</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Upcoming Renewals */}
            {billingSummary?.upcoming_renewals?.length > 0 && (
              <Card className="border-amber-200 bg-amber-50/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2 text-amber-800">
                    <Calendar className="w-4 h-4" /> Upcoming Renewals (next 30 days)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {billingSummary.upcoming_renewals.map((s: any) => (
                    <div key={s.id} className="flex items-center justify-between text-xs bg-white rounded-lg p-2.5 border border-amber-100">
                      <div>
                        <p className="font-medium text-foreground">{s.name}</p>
                        <p className="text-muted-foreground">{s.subscription_plan} plan · {s.days_until_renewal}d remaining</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-foreground">£{s.monthly_value}/mo</p>
                        <p className="text-muted-foreground">{new Date(s.subscription_period_end).toLocaleDateString("en-GB")}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Overdue Schools */}
            {billingSummary?.overdue_schools?.length > 0 && (
              <Card className="border-red-200 bg-red-50/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2 text-red-800">
                    <AlertTriangle className="w-4 h-4" /> Overdue Payments
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {billingSummary.overdue_schools.map((s: any) => (
                    <div key={s.id} className="flex items-center justify-between text-xs bg-white rounded-lg p-2.5 border border-red-100">
                      <div>
                        <p className="font-medium text-foreground">{s.name}</p>
                        <p className="text-muted-foreground">{s.domain || "No domain"}</p>
                      </div>
                      <Badge className="bg-red-100 text-red-700 border-0 text-xs">{s.subscription_status}</Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Invoice Generator */}
            <Card className="border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <FileText className="w-4 h-4 text-brand" /> Generate Invoice
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {generatedInvoice ? (
                  <div className="space-y-3">
                    <div className="rounded-xl border border-green-200 bg-green-50 p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-bold text-green-800">{generatedInvoice.invoice_number}</p>
                        <Badge className="bg-green-100 text-green-700 border-0">Issued</Badge>
                      </div>
                      <div className="text-xs space-y-1 text-green-900">
                        <p><span className="font-medium">School:</span> {generatedInvoice.school_name}</p>
                        <p><span className="font-medium">Amount:</span> £{generatedInvoice.amount.toFixed(2)}</p>
                        <p><span className="font-medium">Description:</span> {generatedInvoice.description}</p>
                        <p><span className="font-medium">Issued:</span> {generatedInvoice.issued_date}</p>
                        <p><span className="font-medium">Due:</span> {generatedInvoice.due_date}</p>
                        {generatedInvoice.notes && <p><span className="font-medium">Notes:</span> {generatedInvoice.notes}</p>}
                      </div>
                    </div>
                    <Button variant="outline" className="w-full text-xs" onClick={() => {
                      // Print invoice
                      const w = window.open("", "_blank");
                      if (w) {
                        w.document.write(`<html><head><title>${generatedInvoice.invoice_number}</title><style>body{font-family:Arial,sans-serif;padding:40px;max-width:600px;margin:0 auto}h1{color:#1a1a1a}table{width:100%;border-collapse:collapse}td,th{padding:8px;border-bottom:1px solid #eee;text-align:left}.total{font-size:1.2em;font-weight:bold}.footer{margin-top:40px;font-size:0.8em;color:#666}</style></head><body><h1>INVOICE</h1><p><strong>Invoice No:</strong> ${generatedInvoice.invoice_number}</p><p><strong>Issued:</strong> ${generatedInvoice.issued_date}</p><p><strong>Due:</strong> ${generatedInvoice.due_date}</p><hr/><p><strong>Bill To:</strong><br/>${generatedInvoice.school_name}</p><hr/><table><tr><th>Description</th><th>Amount</th></tr><tr><td>${generatedInvoice.description}</td><td>£${generatedInvoice.amount.toFixed(2)}</td></tr></table><p class="total">Total Due: £${generatedInvoice.amount.toFixed(2)}</p>${generatedInvoice.notes ? `<p><em>${generatedInvoice.notes}</em></p>` : ""}<div class="footer"><p>Adaptly · admin@adaptly.co.uk · adaptly.co.uk</p></div></body></html>`);
                        w.document.close();
                        w.print();
                      }
                    }}>
                      <FileText className="w-3.5 h-3.5 mr-1" /> Print / Save Invoice
                    </Button>
                    <Button variant="ghost" className="w-full text-xs" onClick={() => setGeneratedInvoice(null)}>Create Another Invoice</Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div>
                      <Label className="text-xs">School</Label>
                      <Select value={invoiceForm.school_id} onValueChange={v => setInvoiceForm(f => ({ ...f, school_id: v }))}>
                        <SelectTrigger className="text-xs mt-1"><SelectValue placeholder="Select school..." /></SelectTrigger>
                        <SelectContent>
                          {allSchools.map(s => (
                            <SelectItem key={s.id} value={s.id} className="text-xs">{s.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs">Amount (£)</Label>
                        <Input className="text-xs mt-1" type="number" placeholder="99.00" value={invoiceForm.amount} onChange={e => setInvoiceForm(f => ({ ...f, amount: e.target.value }))} />
                      </div>
                      <div>
                        <Label className="text-xs">Due Date</Label>
                        <Input className="text-xs mt-1" type="date" value={invoiceForm.due_date} onChange={e => setInvoiceForm(f => ({ ...f, due_date: e.target.value }))} />
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs">Description</Label>
                      <Input className="text-xs mt-1" placeholder="e.g. Adaptly Professional subscription — April 2026" value={invoiceForm.description} onChange={e => setInvoiceForm(f => ({ ...f, description: e.target.value }))} />
                    </div>
                    <div>
                      <Label className="text-xs">Notes (optional)</Label>
                      <Input className="text-xs mt-1" placeholder="e.g. Payment by BACS to..." value={invoiceForm.notes} onChange={e => setInvoiceForm(f => ({ ...f, notes: e.target.value }))} />
                    </div>
                    <Button
                      className="w-full bg-brand hover:bg-brand/90 text-white text-xs"
                      disabled={savingInvoice || !invoiceForm.school_id || !invoiceForm.amount || !invoiceForm.description}
                      onClick={async () => {
                        setSavingInvoice(true);
                        try {
                          const r = await fetch("/api/admin/super/invoice", {
                            method: "POST",
                            credentials: "include",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify(invoiceForm),
                          });
                          const data = await r.json();
                          if (data.ok) {
                            setGeneratedInvoice(data.invoice);
                            setInvoiceForm({ school_id: "", amount: "", description: "", due_date: "", notes: "" });
                            toast.success(`Invoice ${data.invoice.invoice_number} created`);
                          } else {
                            toast.error(data.error || "Failed to create invoice");
                          }
                        } catch { toast.error("Failed to create invoice"); }
                        setSavingInvoice(false);
                      }}
                    >
                      {savingInvoice ? "Generating..." : "Generate Invoice"}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* All Schools Table */}
            <Card className="border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-brand" /> All Schools ({allSchools.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {allSchools.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">No schools found</p>
                ) : allSchools.map((school: any) => {
                  const subStatusColor: Record<string, string> = {
                    active: "bg-green-100 text-green-700",
                    trialing: "bg-blue-100 text-blue-700",
                    past_due: "bg-amber-100 text-amber-700",
                    canceled: "bg-red-100 text-red-700",
                    unpaid: "bg-red-100 text-red-700",
                  };
                  const statusLabel = school.subscription_status || school.licence_type || "unknown";
                  const isExpanded = schoolActivity[school.id] !== undefined;
                  return (
                    <div key={school.id} className="border border-border rounded-xl overflow-hidden">
                      <div className="p-3 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-foreground truncate">{school.name}</p>
                            <p className="text-xs text-muted-foreground">{school.domain || "No domain"} · URN: {school.urn || "N/A"}</p>
                          </div>
                          <Badge className={`text-xs border-0 flex-shrink-0 ${subStatusColor[school.subscription_status] || "bg-gray-100 text-gray-600"}`}>
                            {statusLabel}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                          <span><Users className="w-3 h-3 inline mr-1" />{school.user_count || 0} users</span>
                          <span><Users className="w-3 h-3 inline mr-1" />{school.pupil_count || 0} pupils</span>
                          <span>{school.subscription_plan ? `£${{ starter: 49, professional: 99, premium: 149, mat: 299 }[school.subscription_plan] || 0}/mo` : "No plan"}</span>
                        </div>
                        {school.subscription_period_end && (
                          <p className="text-xs text-muted-foreground">
                            <Calendar className="w-3 h-3 inline mr-1" />
                            {school.subscription_cancel_at_period_end ? "Cancels" : "Renews"}{" "}
                            {new Date(school.subscription_period_end).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                          </p>
                        )}
                        {school.last_activity && (
                          <p className="text-xs text-muted-foreground">Last active: {new Date(school.last_activity).toLocaleDateString("en-GB")}</p>
                        )}
                        <div className="flex gap-2 pt-1">
                          <Button
                            size="sm" variant="outline" className="text-xs h-7 flex-1"
                            onClick={async () => {
                              if (isExpanded) {
                                setSchoolActivity(a => { const n = { ...a }; delete n[school.id]; return n; });
                                return;
                              }
                              setLoadingActivity(school.id);
                              try {
                                const r = await fetch(`/api/admin/super/schools/${school.id}/activity`, { credentials: "include" });
                                const data = await r.json();
                                setSchoolActivity(a => ({ ...a, [school.id]: data.logs || [] }));
                              } catch { toast.error("Failed to load activity"); }
                              setLoadingActivity(null);
                            }}
                          >
                            {loadingActivity === school.id ? <RefreshCw className="w-3 h-3 animate-spin" /> : isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                            {isExpanded ? "Hide Activity" : "View Activity"}
                          </Button>
                          <Select
                            value={school.subscription_status || ""}
                            onValueChange={async (v) => {
                              try {
                                await fetch(`/api/admin/super/schools/${school.id}/subscription`, {
                                  method: "PATCH",
                                  credentials: "include",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({ subscription_status: v }),
                                });
                                setAllSchools(ss => ss.map(s => s.id === school.id ? { ...s, subscription_status: v } : s));
                                toast.success(`Status updated to ${v}`);
                              } catch { toast.error("Failed to update status"); }
                            }}
                          >
                            <SelectTrigger className="text-xs h-7 flex-1">
                              <SelectValue placeholder="Override status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="active" className="text-xs">Active</SelectItem>
                              <SelectItem value="trialing" className="text-xs">Trialing</SelectItem>
                              <SelectItem value="past_due" className="text-xs">Past Due</SelectItem>
                              <SelectItem value="canceled" className="text-xs">Canceled</SelectItem>
                              <SelectItem value="unpaid" className="text-xs">Unpaid</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      {isExpanded && schoolActivity[school.id] && (
                        <div className="border-t border-border bg-muted/20 p-3 space-y-1">
                          <p className="text-xs font-medium text-muted-foreground mb-2">Recent Activity</p>
                          {schoolActivity[school.id].length === 0 ? (
                            <p className="text-xs text-muted-foreground">No activity recorded</p>
                          ) : schoolActivity[school.id].slice(0, 20).map((log: any, i: number) => (
                            <div key={i} className="text-xs flex items-start gap-2">
                              <span className="text-muted-foreground flex-shrink-0">{new Date(log.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}</span>
                              <span className="text-foreground truncate">{log.action}</span>
                              {log.display_name && <span className="text-muted-foreground flex-shrink-0">— {log.display_name}</span>}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* All Users Across All Schools */}
            <Card className="border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Users className="w-4 h-4 text-brand" /> All Users ({allUsers.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {allUsers.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">No users found</p>
                ) : allUsers.map((u: any) => (
                  <div key={u.id} className="flex items-center justify-between p-2.5 rounded-xl border border-border/50 bg-white gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-foreground truncate">{u.display_name || u.email}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{u.email} · {u.school_name || "No school"}</p>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <Badge className={`text-[10px] py-0 px-1.5 ${ROLE_COLOURS[u.role] || "bg-gray-100 text-gray-700"}`}>{ROLE_LABELS[u.role] || u.role}</Badge>
                      <Badge className={`text-[10px] py-0 px-1.5 ${u.is_active !== 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{u.is_active !== 0 ? "Active" : "Inactive"}</Badge>
                      <Select
                        value={u.role}
                        onValueChange={async (role) => {
                          try {
                            const r = await fetch(`/api/admin/super/users/${u.id}`, {
                              method: "PATCH", credentials: "include",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ role }),
                            });
                            if (r.ok) { setAllUsers(prev => prev.map(x => x.id === u.id ? { ...x, role } : x)); toast.success("Role updated"); }
                            else toast.error("Failed to update role");
                          } catch { toast.error("Failed to update role"); }
                        }}
                      >
                        <SelectTrigger className="text-[10px] h-6 w-28"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {Object.entries(ROLE_LABELS).map(([v, l]) => <SelectItem key={v} value={v} className="text-xs">{l}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <Button
                        size="sm" variant="outline"
                        className={`text-[10px] h-6 px-2 ${u.is_active !== 0 ? "text-red-600 border-red-200 hover:bg-red-50" : "text-green-600 border-green-200 hover:bg-green-50"}`}
                        onClick={async () => {
                          const newActive = u.is_active === 0 ? 1 : 0;
                          try {
                            const r = await fetch(`/api/admin/super/users/${u.id}`, {
                              method: "PATCH", credentials: "include",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ is_active: newActive === 1 }),
                            });
                            if (r.ok) { setAllUsers(prev => prev.map(x => x.id === u.id ? { ...x, is_active: newActive } : x)); toast.success(newActive ? "User reactivated" : "User deactivated"); }
                            else toast.error("Failed");
                          } catch { toast.error("Failed"); }
                        }}
                      >{u.is_active !== 0 ? "Deactivate" : "Reactivate"}</Button>
                      <Button
                        size="sm" variant="outline"
                        className="text-[10px] h-6 px-2 text-red-700 border-red-200 hover:bg-red-50"
                        onClick={async () => {
                          if (!confirm(`Permanently delete ${u.email}? This cannot be undone.`)) return;
                          try {
                            const r = await fetch(`/api/admin/super/users/${u.id}`, { method: "DELETE", credentials: "include" });
                            if (r.ok) { setAllUsers(prev => prev.filter(x => x.id !== u.id)); toast.success("User deleted"); }
                            else toast.error("Failed to delete user");
                          } catch { toast.error("Failed to delete user"); }
                        }}
                      >Delete</Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Full Audit Log */}
            <Card className="border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Activity className="w-4 h-4 text-brand" /> Full Audit Log ({superAuditLogs.length} events)
                </CardTitle>
              </CardHeader>
              <CardContent>
                {superAuditLogs.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">No audit events recorded</p>
                ) : (
                  <div className="space-y-1 max-h-80 overflow-y-auto">
                    {superAuditLogs.map((log: any, i: number) => (
                      <div key={i} className="flex items-start gap-2 text-xs py-1 border-b border-border/30 last:border-0">
                        <span className="text-muted-foreground flex-shrink-0 w-28">{new Date(log.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                        <span className="text-foreground flex-1 truncate">{log.action}</span>
                        <span className="text-muted-foreground flex-shrink-0">{log.display_name || log.email || ""}</span>
                        {log.school_name && <span className="text-muted-foreground flex-shrink-0 text-[10px]">· {log.school_name}</span>}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

          </TabsContent>
        )}

        {/* ── WORKSHEET LIBRARY ── */}
        <TabsContent value="library" className="space-y-4 mt-4">
          <WorksheetLibraryPanel />
        </TabsContent>

        {/* ── PRESENTATION LIBRARY ── */}
        {isPlatformOwner && (
          <TabsContent value="presentations" className="space-y-4 mt-4">
            <PresentationLibraryPanel />
          </TabsContent>
        )}

        {/* ── DIAGRAM LIBRARY ── */}
        {isPlatformOwner && (
          <TabsContent value="diagrams" className="space-y-4 mt-4">
            <DiagramLibraryPanel />
          </TabsContent>
        )}

      </Tabs>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────────────────
// WORKSHEET LIBRARY PANEL
// ───────────────────────────────────────────────────────────────────────────────────
function WorksheetLibraryPanel() {
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterSubject, setFilterSubject] = useState("");
  const [filterTier, setFilterTier] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadForm, setUploadForm] = useState({ subject: "", topic: "", yearGroup: "", title: "" });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewEntry, setPreviewEntry] = useState<any | null>(null);
  const [viewEntry, setViewEntry] = useState<any | null>(null);
  const [viewLoading, setViewLoading] = useState(false);
  const [reingestTarget, setReingestTarget] = useState<{ id: string; title: string } | null>(null);
  const [reingestFile, setReingestFile] = useState<File | null>(null);
  const [reingestLoading, setReingestLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const reingestFileRef = useRef<HTMLInputElement>(null);

  const handleViewEntry = async (id: string, title: string) => {
    setViewLoading(true);
    try {
      const r = await fetch(`/api/library/entries/${id}`, { credentials: "include" });
      if (!r.ok) throw new Error("Failed to load entry");
      const data = await r.json();
      const entry = data.entry;
      const sections = Array.isArray(entry.sections) ? entry.sections : [];
      const teacherSections = Array.isArray(entry.teacher_sections) ? entry.teacher_sections : [];
      // Build a WorksheetData object compatible with WorksheetRenderer
      const worksheetData = {
        title: entry.title || title,
        subtitle: entry.subtitle || "",
        sections: [...sections, ...teacherSections],
        metadata: {
          subject: entry.subject || "",
          topic: entry.topic || "",
          yearGroup: entry.year_group || "",
        },
        fromLibrary: true,
        libraryId: entry.id,
        canonicalTopicKey: entry.canonical_topic_key || "",
        structuralHash: "",
        libraryAssets: [],
        availableTiers: [],
      };
      setViewEntry(worksheetData);
    } catch (err: any) {
      toast.error(err.message || "Failed to load worksheet");
    }
    setViewLoading(false);
  };

  const handleReingestTeacher = async () => {
    if (!reingestTarget || !reingestFile) return;
    setReingestLoading(true);
    try {
      const formData = new FormData();
      formData.append("pdf", reingestFile);
      const r = await fetch(`/api/library/entries/${reingestTarget.id}/reingest-teacher`, {
        method: "PATCH",
        credentials: "include",
        body: formData,
      });
      if (r.ok) {
        const data = await r.json();
        toast.success(`Teacher sections re-ingested! ${data.teacher_sections_count ?? 0} sections extracted.`);
        setReingestTarget(null);
        setReingestFile(null);
        if (reingestFileRef.current) reingestFileRef.current.value = "";
        await loadEntries();
      } else {
        const err = await r.json();
        toast.error(err.error || "Re-ingest failed");
      }
    } catch { toast.error("Re-ingest failed"); }
    setReingestLoading(false);
  };

  const loadEntries = async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/library/entries", { credentials: "include" });
      if (r.ok) {
        const data = await r.json();
        setEntries(data.entries || []);
      }
    } catch { toast.error("Failed to load library"); }
    setLoading(false);
  };

  useEffect(() => { loadEntries(); }, []);

  const handleCurate = async (id: number, curated: boolean) => {
    try {
      const r = await fetch(`/api/library/entries/${id}/curate`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ curated }),
      });
      if (r.ok) {
        setEntries(prev => prev.map(e => e.id === id ? { ...e, curated } : e));
        toast.success(curated ? "Marked as curated" : "Removed curated status");
      }
    } catch { toast.error("Failed to update entry"); }
  };

  const handleDelete = async (id: number, title: string) => {
    if (!confirm(`Delete "${title}" from the library? This cannot be undone.`)) return;
    try {
      const r = await fetch(`/api/library/entries/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (r.ok) {
        setEntries(prev => prev.filter(e => e.id !== id));
        toast.success("Entry deleted");
      }
    } catch { toast.error("Failed to delete entry"); }
  };

  const handlePdfUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !uploadForm.subject || !uploadForm.topic || !uploadForm.yearGroup) {
      toast.error("Please fill in all fields and select a PDF.");
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("pdf", selectedFile);
      formData.append("subject", uploadForm.subject);
      formData.append("topic", uploadForm.topic);
      formData.append("yearGroup", uploadForm.yearGroup);
      if (uploadForm.title) formData.append("title", uploadForm.title);
      const r = await fetch("/api/library/ingest-pdf", {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      if (r.ok) {
        const data = await r.json();
        toast.success(`PDF ingested! ${data.sections_count} sections extracted.`);
        setSelectedFile(null);
        setUploadForm({ subject: "", topic: "", yearGroup: "", title: "" });
        if (fileInputRef.current) fileInputRef.current.value = "";
        await loadEntries();
      } else {
        const err = await r.json();
        toast.error(err.error || "Ingestion failed");
      }
    } catch { toast.error("Upload failed"); }
    setUploading(false);
  };

  const TIER_LABELS: Record<string, string> = {
    foundation: "Foundation",
    higher: "Higher",
    scaffolded: "Scaffolded",
    mixed: "Mixed",
    standard: "Standard",
  };

  const filtered = entries.filter(e => {
    const q = search.toLowerCase();
    const matchSearch = !q || e.title?.toLowerCase().includes(q) || e.topic?.toLowerCase().includes(q) || e.subject?.toLowerCase().includes(q);
    const matchSubject = !filterSubject || e.subject?.toLowerCase() === filterSubject.toLowerCase();
    const entryTier = (e.tier || e.difficulty || "").toLowerCase();
    const matchTier = !filterTier || entryTier === filterTier.toLowerCase();
    return matchSearch && matchSubject && matchTier;
  });

  // Build unique subjects from entries, normalised
  const subjects = [...new Set(entries.map(e => e.subject).filter(Boolean))].sort();
  // Build unique tiers from entries
  const tiers = [...new Set(entries.map(e => (e.tier || e.difficulty || "").toLowerCase().trim()))].filter(Boolean).sort();
  const groupedEntries = buildLibraryGroups(filtered);

  return (
    <div className="space-y-6">
      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="border-border/50">
          <CardContent className="pt-4 pb-3">
            <p className="text-2xl font-bold text-brand">{entries.length}</p>
            <p className="text-xs text-muted-foreground">Total entries</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="pt-4 pb-3">
            <p className="text-2xl font-bold text-emerald-600">{entries.filter(e => e.curated).length}</p>
            <p className="text-xs text-muted-foreground">Curated</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="pt-4 pb-3">
            <p className="text-2xl font-bold text-blue-600">{entries.filter(e => e.source === "pdf").length}</p>
            <p className="text-xs text-muted-foreground">From PDF</p>
          </CardContent>
        </Card>
      </div>

      {/* PDF Upload */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <FileText className="w-4 h-4 text-brand" /> Upload Master Worksheet PDF
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePdfUpload} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Subject *</Label>
                <Input className="text-sm" placeholder="e.g. Science" value={uploadForm.subject} onChange={e => setUploadForm(f => ({ ...f, subject: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Topic *</Label>
                <Input className="text-sm" placeholder="e.g. Electricity: Circuits" value={uploadForm.topic} onChange={e => setUploadForm(f => ({ ...f, topic: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Year Group *</Label>
                <Input className="text-sm" placeholder="e.g. Year 10" value={uploadForm.yearGroup} onChange={e => setUploadForm(f => ({ ...f, yearGroup: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Title (optional — auto-detected from PDF)</Label>
                <Input className="text-sm" placeholder="Leave blank to auto-detect" value={uploadForm.title} onChange={e => setUploadForm(f => ({ ...f, title: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">PDF File *</Label>
              <input ref={fileInputRef} type="file" accept=".pdf" className="text-sm w-full" onChange={e => setSelectedFile(e.target.files?.[0] || null)} />
            </div>
            <Button type="submit" disabled={uploading} className="w-full bg-brand hover:bg-brand/90 text-white">
              {uploading ? "Ingesting PDF..." : "Upload & Ingest PDF"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Library Browser */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Activity className="w-4 h-4 text-brand" /> Library Browser
              <span className="text-xs font-normal text-muted-foreground">({filtered.length} of {entries.length})</span>
            </CardTitle>
            <Button size="sm" variant="outline" className="text-xs" onClick={loadEntries}>
              <RefreshCw className="w-3 h-3 mr-1" /> Refresh
            </Button>
          </div>
          {/* Search */}
          <Input className="text-xs h-8 mt-2" placeholder="Search title, topic, subject..." value={search} onChange={e => setSearch(e.target.value)} />
          {/* Subject tabs */}
          <div className="flex gap-1.5 mt-2 flex-wrap">
            <button
              className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                filterSubject === "" ? "bg-brand text-white border-brand" : "bg-background text-muted-foreground border-border hover:border-brand/50"
              }`}
              onClick={() => setFilterSubject("")}
            >
              All
            </button>
            {subjects.map(s => (
              <button
                key={s}
                className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                  filterSubject === s ? "bg-brand text-white border-brand" : "bg-background text-muted-foreground border-border hover:border-brand/50"
                }`}
                onClick={() => setFilterSubject(filterSubject === s ? "" : s)}
              >
                {s}
              </button>
            ))}
          </div>
          {/* Tier filter pills */}
          <div className="flex gap-1.5 mt-1.5 flex-wrap">
            <button
              className={`text-xs px-2.5 py-0.5 rounded-full border transition-colors ${
                filterTier === "" ? "bg-slate-700 text-white border-slate-700" : "bg-background text-muted-foreground border-border hover:border-slate-400"
              }`}
              onClick={() => setFilterTier("")}
            >
              All tiers
            </button>
            {["foundation", "higher", "scaffolded", "mixed"].map(t => (
              <button
                key={t}
                className={`text-xs px-2.5 py-0.5 rounded-full border transition-colors ${
                  filterTier === t
                    ? t === "foundation" ? "bg-blue-600 text-white border-blue-600"
                      : t === "higher" ? "bg-purple-600 text-white border-purple-600"
                      : t === "scaffolded" ? "bg-emerald-600 text-white border-emerald-600"
                      : "bg-amber-600 text-white border-amber-600"
                    : "bg-background text-muted-foreground border-border hover:border-slate-400"
                }`}
                onClick={() => setFilterTier(filterTier === t ? "" : t)}
              >
                {TIER_LABELS[t] ?? t}
              </button>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-xs text-muted-foreground text-center py-6">Loading library...</p>
          ) : filtered.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-6">No entries found. Upload a PDF above or generate worksheets to populate the library.</p>
          ) : (
            <div className="space-y-3">
              {groupedEntries.map(yearGroup => {
                const yearCount = yearGroup.subjects.reduce((total, subjectGroup) => total + subjectGroup.topics.reduce((topicTotal, topicGroup) => topicTotal + topicGroup.entries.length, 0), 0);
                return (
                  <details key={yearGroup.yearGroup} className="rounded-xl border border-border/50 bg-muted/20" open>
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3">
                      <div>
                        <p className="text-sm font-semibold text-foreground">{yearGroup.yearGroup}</p>
                        <p className="text-xs text-muted-foreground">Browse worksheet entries by subject and topic</p>
                      </div>
                      <Badge variant="outline" className="text-[10px]">{yearCount} entries</Badge>
                    </summary>
                    <div className="px-4 pb-4 space-y-3">
                      {yearGroup.subjects.map(subjectGroup => {
                        const subjectCount = subjectGroup.topics.reduce((total, topicGroup) => total + topicGroup.entries.length, 0);
                        return (
                          <details key={`${yearGroup.yearGroup}-${subjectGroup.subject}`} className="rounded-lg border border-border/40 bg-background" open>
                            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-3 py-2.5">
                              <div>
                                <p className="text-sm font-medium text-foreground">{subjectGroup.subject}</p>
                                <p className="text-xs text-muted-foreground">Topics and master worksheets</p>
                              </div>
                              <Badge variant="outline" className="text-[10px]">{subjectCount} entries</Badge>
                            </summary>
                            <div className="px-3 pb-3 space-y-2">
                              {subjectGroup.topics.map(topicGroup => (
                                <details key={`${yearGroup.yearGroup}-${subjectGroup.subject}-${topicGroup.topic}`} className="rounded-lg border border-dashed border-border/50 bg-muted/10" open>
                                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-3 py-2">
                                    <div>
                                      <p className="text-sm font-medium text-foreground">{topicGroup.topic}</p>
                                      <p className="text-xs text-muted-foreground">{topicGroup.entries.length} worksheet{topicGroup.entries.length === 1 ? "" : "s"}</p>
                                    </div>
                                    <Badge variant="secondary" className="text-[10px]">{topicGroup.entries.length}</Badge>
                                  </summary>
                                  <div className="px-3 pb-3 space-y-2">
                                    {topicGroup.entries.map(entry => (
                                      <div key={entry.id} className="flex items-center gap-3 p-3 rounded-lg border border-border/50 hover:bg-muted/30 transition-colors">
                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-center gap-2 flex-wrap">
                                            <span className="text-sm font-medium truncate">{entry.title}</span>
                                            {entry.curated && <Badge className="text-[10px] py-0 bg-emerald-100 text-emerald-700 border-emerald-200">Curated</Badge>}
                                            <Badge variant="outline" className="text-[10px] py-0">{entry.source === "pdf" ? "PDF" : "AI"}</Badge>
                                            {(() => {
                                              const t = (entry.tier || entry.difficulty || "").toLowerCase();
                                              if (!t || t === "standard") return null;
                                              const tierColors: Record<string, string> = {
                                                foundation: "bg-blue-100 text-blue-700 border-blue-200",
                                                higher: "bg-purple-100 text-purple-700 border-purple-200",
                                                scaffolded: "bg-emerald-100 text-emerald-700 border-emerald-200",
                                                mixed: "bg-amber-100 text-amber-700 border-amber-200",
                                              };
                                              return <Badge className={`text-[10px] py-0 ${tierColors[t] || ""}`}>{TIER_LABELS[t] ?? t}</Badge>;
                                            })()}
                                          </div>
                                          <p className="text-xs text-muted-foreground mt-0.5">
                                            {entry.subject} · {entry.topic} · {entry.year_group}
                                            {entry.tier && entry.tier !== "standard" && ` · ${entry.tier}`}
                                            {` · ${entry.sections_count ?? 0} sections`}
                                            {entry.teacher_sections_count > 0 && ` · ${entry.teacher_sections_count} teacher`}
                                          </p>
                                        </div>
                                        <div className="flex items-center gap-1.5 flex-shrink-0">
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            className="text-xs h-7 px-2 gap-1"
                                            disabled={viewLoading}
                                            onClick={() => handleViewEntry(entry.id, entry.title)}
                                          >
                                            <Eye className="w-3 h-3" />
                                            View
                                          </Button>
                                          <Button size="sm" variant="outline" className="text-xs h-7 px-2" onClick={() => setPreviewEntry(previewEntry?.id === entry.id ? null : entry)}>
                                            {previewEntry?.id === entry.id ? "Hide" : "JSON"}
                                          </Button>
                                          <Button
                                            size="sm"
                                            variant={entry.curated ? "default" : "outline"}
                                            className={`text-xs h-7 px-2 ${entry.curated ? "bg-emerald-600 hover:bg-emerald-700 text-white" : ""}`}
                                            onClick={() => handleCurate(entry.id, !entry.curated)}
                                          >
                                            {entry.curated ? "Curated" : "Curate"}
                                          </Button>
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            className="text-xs h-7 px-2 text-amber-600 hover:bg-amber-50 border-amber-200"
                                            onClick={() => { setReingestTarget({ id: entry.id, title: entry.title }); setReingestFile(null); }}
                                          >
                                            Re-ingest
                                          </Button>
                                          <Button size="sm" variant="outline" className="text-xs h-7 px-2 text-red-600 hover:bg-red-50 border-red-200" onClick={() => handleDelete(entry.id, entry.title)}>
                                            Delete
                                          </Button>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </details>
                              ))}
                            </div>
                          </details>
                        );
                      })}
                    </div>
                  </details>
                );
              })}
              {previewEntry && (
                <div className="mt-3 p-4 rounded-xl border border-brand/30 bg-brand/5 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-brand">{previewEntry.title}</p>
                    <Button size="sm" variant="ghost" className="text-xs h-6" onClick={() => setPreviewEntry(null)}>Close</Button>
                  </div>
                  <p className="text-xs text-muted-foreground">{previewEntry.subtitle}</p>
                  <div className="space-y-1 max-h-64 overflow-y-auto">
                    {(previewEntry.sections || []).map((s: any, i: number) => (
                      <div key={i} className="text-xs p-2 rounded bg-background border border-border/40">
                        <span className="font-medium text-brand">[{s.type}]</span> <span className="font-medium">{s.title}</span>
                        {s.marks && <span className="ml-1 text-muted-foreground">({s.marks}m)</span>}
                        <p className="text-muted-foreground mt-0.5 line-clamp-2">{s.content?.substring(0, 120)}...</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Full Worksheet Viewer Dialog */}
      <Dialog open={!!viewEntry} onOpenChange={(open) => { if (!open) setViewEntry(null); }}>
        <DialogContent className="max-w-5xl w-full h-[90vh] flex flex-col p-0 gap-0">
          <DialogHeader className="px-6 py-4 border-b border-border/50 flex-shrink-0">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-base font-semibold">
                {viewEntry?.title}
              </DialogTitle>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{viewEntry?.metadata?.subject}</span>
                {viewEntry?.metadata?.yearGroup && <span>· {viewEntry.metadata.yearGroup}</span>}
                <span>· {(viewEntry?.sections || []).length} sections</span>
              </div>
            </div>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto p-6">
            {viewEntry && (
              <WorksheetErrorBoundary>
                <WorksheetRenderer
                  worksheet={viewEntry}
                  viewMode="teacher"
                  textSize={16}
                  overlayColor="none"
                />
              </WorksheetErrorBoundary>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Re-ingest Teacher Sections Dialog */}
      <Dialog open={!!reingestTarget} onOpenChange={(open) => { if (!open) { setReingestTarget(null); setReingestFile(null); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold">Re-ingest Teacher Sections</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-xs text-muted-foreground">
              Upload the master PDF for <span className="font-medium text-foreground">{reingestTarget?.title}</span> to extract and replace its teacher answer key sections.
            </p>
            <div className="space-y-1">
              <Label className="text-xs">Master Worksheet PDF *</Label>
              <input
                ref={reingestFileRef}
                type="file"
                accept=".pdf"
                className="text-sm w-full"
                onChange={e => setReingestFile(e.target.files?.[0] || null)}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button size="sm" variant="outline" className="text-xs" onClick={() => { setReingestTarget(null); setReingestFile(null); }}>
                Cancel
              </Button>
              <Button
                size="sm"
                className="text-xs bg-amber-600 hover:bg-amber-700 text-white"
                disabled={!reingestFile || reingestLoading}
                onClick={handleReingestTeacher}
              >
                {reingestLoading ? "Re-ingesting..." : "Re-ingest Teacher Sections"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────────────────
// PRESENTATION LIBRARY PANEL
// ───────────────────────────────────────────────────────────────────────────────────
function PresentationLibraryPanel() {
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("All");
  const [tierFilter, setTierFilter] = useState("All");
  const [viewEntry, setViewEntry] = useState<any | null>(null);
  const [viewLoading, setViewLoading] = useState(false);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 20;

  const loadEntries = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/presentation-library/entries", { credentials: "include" });
      const data = await res.json();
      setEntries(data.entries || []);
    } catch { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => { loadEntries(); }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this presentation?")) return;
    await fetch(`/api/presentation-library/entries/${id}`, { method: "DELETE", credentials: "include" });
    setEntries(e => e.filter(x => x.id !== id));
  };

  const handleToggleCurate = async (id: string, current: number) => {
    await fetch(`/api/presentation-library/entries/${id}/curate`, {
      method: "PATCH", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ curated: current ? 0 : 1 })
    });
    setEntries(e => e.map(x => x.id === id ? { ...x, curated: current ? 0 : 1 } : x));
  };

  const handleView = async (entry: any) => {
    setViewLoading(true);
    try {
      const res = await fetch(`/api/presentation-library/entries/${entry.id}`, { credentials: "include" });
      const data = await res.json();
      setViewEntry(data.entry);
    } catch { setViewEntry(entry); }
    setViewLoading(false);
  };

  const subjects = ["All", ...Array.from(new Set(entries.map(e => e.subject).filter(Boolean))).sort()];
  const tiers = ["All", "Foundation", "Higher", "Scaffolded", "Mixed"];

  const filtered = entries.filter(e => {
    if (subjectFilter !== "All" && e.subject !== subjectFilter) return false;
    if (tierFilter !== "All" && e.tier !== tierFilter) return false;
    if (search && !`${e.title} ${e.subject} ${e.topic}`.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

  const tierColour: Record<string, string> = {
    Foundation: "bg-blue-100 text-blue-700",
    Higher: "bg-purple-100 text-purple-700",
    Scaffolded: "bg-green-100 text-green-700",
    Mixed: "bg-orange-100 text-orange-700",
  };

  return (
    <div className="space-y-4">
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Presentation className="w-4 h-4 text-blue-600" />
            Presentation Library
            <Badge variant="secondary" className="ml-auto text-xs">{entries.length} Total</Badge>
            <Badge variant="outline" className="text-xs text-blue-600">{entries.filter(e => e.curated).length} Curated</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Subject tabs */}
          <div className="flex flex-wrap gap-1">
            {subjects.map(s => (
              <button key={s} onClick={() => { setSubjectFilter(s); setPage(1); }}
                className={`px-2 py-0.5 rounded text-xs font-medium transition-colors ${subjectFilter === s ? "bg-blue-600 text-white" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}>
                {s}
              </button>
            ))}
          </div>
          {/* Tier filter pills */}
          <div className="flex flex-wrap gap-1">
            {tiers.map(t => (
              <button key={t} onClick={() => { setTierFilter(t); setPage(1); }}
                className={`px-2 py-0.5 rounded-full text-xs font-medium border transition-colors ${tierFilter === t ? "bg-blue-600 text-white border-blue-600" : "border-border text-muted-foreground hover:bg-muted/50"}`}>
                {t}
              </button>
            ))}
          </div>
          {/* Search */}
          <Input className="text-xs h-8" placeholder="Search presentations..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />

          {loading ? (
            <div className="text-xs text-muted-foreground py-4 text-center">Loading...</div>
          ) : paginated.length === 0 ? (
            <div className="text-xs text-muted-foreground py-8 text-center">
              {entries.length === 0 ? "No presentations in library yet. Generate presentations from the Lesson Hub to populate this library." : "No results match your filters."}
            </div>
          ) : (
            <div className="space-y-1">
              {paginated.map(entry => (
                <div key={entry.id} className="flex items-center gap-2 p-2 rounded-lg border border-border/40 hover:bg-muted/30 text-xs">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{entry.title}</div>
                    <div className="text-muted-foreground flex gap-1 flex-wrap mt-0.5">
                      {entry.subject && <Badge variant="outline" className="text-[10px] px-1 py-0">{entry.subject}</Badge>}
                      {entry.year_group && <Badge variant="outline" className="text-[10px] px-1 py-0">{entry.year_group}</Badge>}
                      {entry.tier && <Badge className={`text-[10px] px-1 py-0 ${tierColour[entry.tier] || "bg-gray-100 text-gray-600"}`}>{entry.tier}</Badge>}
                      <span className="text-muted-foreground">{entry.slide_count} slides</span>
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button size="sm" variant="outline" className="h-6 text-[10px] px-2" onClick={() => handleView(entry)} disabled={viewLoading}>View</Button>
                    <Button size="sm" variant="outline" className={`h-6 text-[10px] px-2 ${entry.curated ? "bg-amber-50 text-amber-700 border-amber-300" : ""}`} onClick={() => handleToggleCurate(entry.id, entry.curated)}>
                      {entry.curated ? "✓ Curated" : "Curate"}
                    </Button>
                    <Button size="sm" variant="outline" className="h-6 text-[10px] px-2 text-red-600 hover:bg-red-50" onClick={() => handleDelete(entry.id)}>
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-muted-foreground">{filtered.length} results</span>
              <div className="flex gap-1">
                <Button size="sm" variant="outline" className="h-6 text-xs px-2" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Prev</Button>
                <span className="text-xs px-2 py-1">{page} / {totalPages}</span>
                <Button size="sm" variant="outline" className="h-6 text-xs px-2" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Presentation Dialog */}
      {viewEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setViewEntry(null)}>
          <div className="bg-background rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-background z-10">
              <div>
                <h2 className="font-semibold text-sm">{viewEntry.title}</h2>
                <div className="flex gap-1 mt-1 flex-wrap">
                  {viewEntry.subject && <Badge variant="outline" className="text-[10px]">{viewEntry.subject}</Badge>}
                  {viewEntry.year_group && <Badge variant="outline" className="text-[10px]">{viewEntry.year_group}</Badge>}
                  {viewEntry.tier && <Badge className={`text-[10px] ${tierColour[viewEntry.tier] || "bg-gray-100 text-gray-600"}`}>{viewEntry.tier}</Badge>}
                  <Badge variant="secondary" className="text-[10px]">{viewEntry.slide_count} slides</Badge>
                </div>
              </div>
              <Button size="sm" variant="ghost" onClick={() => setViewEntry(null)}>✕</Button>
            </div>
            <div className="p-4 space-y-3">
              {(viewEntry.slides || []).length === 0 ? (
                <div className="text-xs text-muted-foreground text-center py-8">No slide data available for this presentation.</div>
              ) : (
                (viewEntry.slides as any[]).map((slide: any, i: number) => (
                  <div key={i} className="border rounded-lg p-3 bg-muted/20">
                    <div className="text-xs font-semibold text-muted-foreground mb-1">Slide {i + 1}{slide.title ? ` — ${slide.title}` : ""}</div>
                    {slide.content && <div className="text-xs whitespace-pre-wrap">{slide.content}</div>}
                    {slide.bullets && Array.isArray(slide.bullets) && (
                      <ul className="list-disc list-inside text-xs space-y-0.5 mt-1">
                        {slide.bullets.map((b: string, j: number) => <li key={j}>{b}</li>)}
                      </ul>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────────────────
// DIAGRAM LIBRARY PANEL
// ───────────────────────────────────────────────────────────────────────────────────
function DiagramLibraryPanel() {
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("All");
  const [viewEntry, setViewEntry] = useState<any | null>(null);

  const loadEntries = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/diagram-library/entries", { credentials: "include" });
      const data = await res.json();
      setEntries(data.entries || []);
    } catch { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => { loadEntries(); }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this diagram?")) return;
    await fetch(`/api/diagram-library/entries/${id}`, { method: "DELETE", credentials: "include" });
    setEntries(e => e.filter(x => x.id !== id));
  };

  const handleToggleCurate = async (id: string, current: number) => {
    await fetch(`/api/diagram-library/entries/${id}/curate`, {
      method: "PATCH", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ curated: current ? 0 : 1 })
    });
    setEntries(e => e.map(x => x.id === id ? { ...x, curated: current ? 0 : 1 } : x));
  };

  const subjects = ["All", ...Array.from(new Set(entries.map(e => e.subject).filter(Boolean))).sort()];

  const filtered = entries.filter(e => {
    if (subjectFilter !== "All" && e.subject !== subjectFilter) return false;
    if (search && !`${e.title} ${e.subject} ${e.topic} ${e.description || ""}`.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const groupedEntries = buildLibraryGroups(filtered);

  return (
    <div className="space-y-4">
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Image className="w-4 h-4 text-emerald-600" />
            Diagram Library
            <Badge variant="secondary" className="ml-auto text-xs">{entries.length} Total</Badge>
            <Badge variant="outline" className="text-xs text-emerald-600">{entries.filter(e => e.curated).length} Curated</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Subject tabs */}
          <div className="flex flex-wrap gap-1">
            {subjects.map(s => (
              <button key={s} onClick={() => { setSubjectFilter(s); }}
                className={`px-2 py-0.5 rounded text-xs font-medium transition-colors ${subjectFilter === s ? "bg-emerald-600 text-white" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}>
                {s}
              </button>
            ))}
          </div>
          {/* Search */}
          <Input className="text-xs h-8" placeholder="Search diagrams..." value={search} onChange={e => { setSearch(e.target.value); }} />

          {loading ? (
            <div className="text-xs text-muted-foreground py-4 text-center">Loading...</div>
          ) : groupedEntries.length === 0 ? (
            <div className="text-xs text-muted-foreground py-8 text-center">
              {entries.length === 0
                ? "No diagrams in library yet. Diagrams are auto-added when worksheets with reference diagrams are generated."
                : "No results match your filters."}
            </div>
          ) : (
            <div className="space-y-3">
              {groupedEntries.map(yearGroup => {
                const yearCount = yearGroup.subjects.reduce((total, subjectGroup) => total + subjectGroup.topics.reduce((topicTotal, topicGroup) => topicTotal + topicGroup.entries.length, 0), 0);
                return (
                  <details key={yearGroup.yearGroup} className="rounded-xl border border-border/50 bg-muted/20" open>
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3">
                      <div>
                        <p className="text-sm font-semibold text-foreground">{yearGroup.yearGroup}</p>
                        <p className="text-xs text-muted-foreground">Browse diagrams by subject and topic</p>
                      </div>
                      <Badge variant="outline" className="text-[10px]">{yearCount} diagrams</Badge>
                    </summary>
                    <div className="px-4 pb-4 space-y-3">
                      {yearGroup.subjects.map(subjectGroup => {
                        const subjectCount = subjectGroup.topics.reduce((total, topicGroup) => total + topicGroup.entries.length, 0);
                        return (
                          <details key={`${yearGroup.yearGroup}-${subjectGroup.subject}`} className="rounded-lg border border-border/40 bg-background" open>
                            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-3 py-2.5">
                              <div>
                                <p className="text-sm font-medium text-foreground">{subjectGroup.subject}</p>
                                <p className="text-xs text-muted-foreground">Topic-indexed diagram sets</p>
                              </div>
                              <Badge variant="outline" className="text-[10px]">{subjectCount} diagrams</Badge>
                            </summary>
                            <div className="px-3 pb-3 space-y-3">
                              {subjectGroup.topics.map(topicGroup => (
                                <details key={`${yearGroup.yearGroup}-${subjectGroup.subject}-${topicGroup.topic}`} className="rounded-lg border border-dashed border-border/50 bg-muted/10" open>
                                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-3 py-2">
                                    <div>
                                      <p className="text-sm font-medium text-foreground">{topicGroup.topic}</p>
                                      <p className="text-xs text-muted-foreground">{topicGroup.entries.length} diagram{topicGroup.entries.length === 1 ? "" : "s"}</p>
                                    </div>
                                    <Badge variant="secondary" className="text-[10px]">{topicGroup.entries.length}</Badge>
                                  </summary>
                                  <div className="px-3 pb-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {topicGroup.entries.map(entry => (
                                      <div key={entry.id} className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow cursor-pointer group bg-background" onClick={() => setViewEntry(entry)}>
                                        <div className="aspect-video bg-muted flex items-center justify-center overflow-hidden">
                                          {entry.image_url ? (
                                            <img src={entry.image_url} alt={entry.title} className="w-full h-full object-contain" />
                                          ) : (
                                            <Image className="w-8 h-8 text-muted-foreground/30" />
                                          )}
                                        </div>
                                        <div className="p-2">
                                          <div className="text-xs font-medium truncate">{entry.title}</div>
                                          <div className="flex gap-1 mt-1 flex-wrap">
                                            {entry.subject && <Badge variant="outline" className="text-[10px] px-1 py-0">{entry.subject}</Badge>}
                                            {entry.curated ? <Badge className="text-[10px] px-1 py-0 bg-amber-100 text-amber-700">Curated</Badge> : null}
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </details>
                              ))}
                            </div>
                          </details>
                        );
                      })}
                    </div>
                  </details>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Diagram Dialog */}
      {viewEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setViewEntry(null)}>
          <div className="bg-background rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-background z-10">
              <div>
                <h2 className="font-semibold text-sm">{viewEntry.title}</h2>
                <div className="flex gap-1 mt-1 flex-wrap">
                  {viewEntry.subject && <Badge variant="outline" className="text-[10px]">{viewEntry.subject}</Badge>}
                  {viewEntry.topic && <Badge variant="outline" className="text-[10px]">{viewEntry.topic}</Badge>}
                  {viewEntry.year_group && <Badge variant="outline" className="text-[10px]">{viewEntry.year_group}</Badge>}
                </div>
                {viewEntry.description && <p className="text-xs text-muted-foreground mt-1">{viewEntry.description}</p>}
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => { const a = document.createElement("a"); a.href = viewEntry.image_url; a.download = viewEntry.title + ".png"; a.click(); }}>
                  <Download className="w-3 h-3 mr-1" />Download
                </Button>
                <Button size="sm" variant="outline" className={`h-7 text-xs ${viewEntry.curated ? "bg-amber-50 text-amber-700 border-amber-300" : ""}`} onClick={() => { handleToggleCurate(viewEntry.id, viewEntry.curated); setViewEntry((v: any) => ({ ...v, curated: v.curated ? 0 : 1 })); }}>
                  {viewEntry.curated ? "✓ Curated" : "Curate"}
                </Button>
                <Button size="sm" variant="outline" className="h-7 text-xs text-red-600 hover:bg-red-50" onClick={() => { handleDelete(viewEntry.id); setViewEntry(null); }}>
                  <Trash2 className="w-3 h-3" />
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setViewEntry(null)}>✕</Button>
              </div>
            </div>
            <div className="p-4">
              {viewEntry.image_url ? (
                <img src={viewEntry.image_url} alt={viewEntry.title} className="w-full rounded-lg border" />
              ) : (
                <div className="text-xs text-muted-foreground text-center py-8">No image available</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
