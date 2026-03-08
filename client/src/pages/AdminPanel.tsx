import { useState, useEffect, useRef } from "react";
import {
  Users, Shield, Activity, UserPlus, UserX, UserCheck, Key,
  AlertTriangle, BarChart3, Settings2, Terminal, RefreshCw,
  Eye, EyeOff, CheckCircle2, Cpu, Zap, Globe
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

const AI_PROVIDERS = [
  { id: "groq", label: "Groq (Llama 3.3)", icon: Zap, color: "text-orange-500", description: "Ultra-fast, free tier" },
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
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("teacher");
  const [inviting, setInviting] = useState(false);
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({});
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [liveLog, setLiveLog] = useState<string[]>([]);
  const logRef = useRef<HTMLDivElement>(null);

  const canAccess = user && (
    ["mat_admin", "school_admin", "senco"].includes(user.role) ||
    user.email === "admin@sendassistant.app"
  );

  useEffect(() => {
    if (!canAccess) return;
    Promise.all([
      schoolsApi.listUsers().catch(() => []),
      pupilsApi.listIncidents().catch(() => []),
      schoolsApi.auditLogs().catch(() => []),
      fetch("/api/admin/stats", { credentials: "include" }).then(r => r.ok ? r.json() : null).catch(() => null),
      fetch("/api/admin/ai-keys", { credentials: "include" }).then(r => r.ok ? r.json() : {}).catch(() => ({})),
    ]).then(([u, i, a, s, k]) => {
      setUsers(u || []); setIncidents(i || []); setAuditLogs(a || []);
      setStats(s); setApiKeys(k || {});
    }).catch(() => toast.error("Failed to load admin data"))
      .finally(() => setLoading(false));
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
    if (!inviteEmail) return;
    setInviting(true);
    try {
      await schoolsApi.inviteUser({ email: inviteEmail, role: inviteRole });
      toast.success(`Invitation sent to ${inviteEmail}`);
      setInviteEmail("");
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
          <TabsTrigger value="settings" className="text-xs py-1.5 flex-1"><Settings2 className="w-3.5 h-3.5 mr-1" />System</TabsTrigger>
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
                onClick={async () => { const a = await schoolsApi.auditLogs(); setAuditLogs(a); toast.success("Refreshed"); }}>
                <RefreshCw className="w-3 h-3 mr-1" /> Refresh
              </Button>
            </CardHeader>
            <CardContent>
              <div className="divide-y divide-border/50 max-h-96 overflow-y-auto">
                {auditLogs.length === 0 ? (
                  <div className="p-6 text-center text-muted-foreground text-sm">No audit events recorded</div>
                ) : auditLogs.map((log, i) => (
                  <div key={i} className="p-3 flex items-start gap-3">
                    <Activity className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-mono text-muted-foreground">{log.action}</p>
                      <p className="text-xs text-muted-foreground">{log.user_name || log.userEmail || "System"} · {log.created_at || log.createdAt ? new Date(log.created_at || log.createdAt).toLocaleString("en-GB") : ""}</p>
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
      </Tabs>
    </div>
  );
}
