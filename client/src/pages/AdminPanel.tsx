import { useState, useEffect } from "react";
import { Users, Shield, Activity, Building2, UserPlus, UserX, UserCheck, Key, AlertTriangle, ChevronDown } from "lucide-react";
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
  mat_admin: "MAT Admin", school_admin: "School Admin", senco: "SENCO",
  teacher: "Teacher", ta: "Teaching Assistant",
};
const ROLE_COLOURS: Record<string, string> = {
  mat_admin: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  school_admin: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  senco: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  teacher: "bg-brand/10 text-brand",
  ta: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
};

export default function AdminPanel() {
  const { user } = useApp();
  const [, setLocation] = useLocation();
  const [users, setUsers] = useState<any[]>([]);
  const [incidents, setIncidents] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("teacher");
  const [inviting, setInviting] = useState(false);

  // Only admins/SENCOs can access
  const canAccess = user && ["mat_admin", "school_admin", "senco"].includes(user.role);

  useEffect(() => {
    if (!canAccess) return;
    Promise.all([
      schoolsApi.listUsers(),
      pupilsApi.listIncidents(),
      schoolsApi.auditLogs(),
    ]).then(([u, i, a]) => {
      setUsers(u); setIncidents(i); setAuditLogs(a);
    }).catch(err => toast.error("Failed to load admin data")).finally(() => setLoading(false));
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

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold">Admin Panel</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage users, safeguarding, and audit logs</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Users", value: users.length, icon: Users, colour: "text-blue-600" },
          { label: "Active Users", value: users.filter(u => u.is_active).length, icon: UserCheck, colour: "text-green-600" },
          { label: "Open Incidents", value: incidents.filter(i => i.status === "open").length, icon: AlertTriangle, colour: "text-amber-600" },
          { label: "Audit Events (24h)", value: auditLogs.filter(l => new Date(l.created_at) > new Date(Date.now() - 86400000)).length, icon: Activity, colour: "text-brand" },
        ].map(stat => (
          <Card key={stat.label} className="border-border/50">
            <CardContent className="p-4 flex items-center gap-3">
              <stat.icon className={`w-8 h-8 ${stat.colour}`} />
              <div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="users">
        <TabsList>
          <TabsTrigger value="users"><Users className="w-4 h-4 mr-1.5" />Users</TabsTrigger>
          <TabsTrigger value="safeguarding"><Shield className="w-4 h-4 mr-1.5" />Safeguarding</TabsTrigger>
          <TabsTrigger value="audit"><Activity className="w-4 h-4 mr-1.5" />Audit Log</TabsTrigger>
        </TabsList>

        {/* Users tab */}
        <TabsContent value="users" className="space-y-4 mt-4">
          {/* Invite form */}
          <Card className="border-border/50">
            <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><UserPlus className="w-4 h-4" />Invite User</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handleInvite} className="flex gap-2 flex-wrap">
                <Input type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="email@school.sch.uk" className="flex-1 min-w-48" required />
                <Select value={inviteRole} onValueChange={setInviteRole}>
                  <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(ROLE_LABELS).filter(([k]) => k !== "mat_admin").map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button type="submit" className="bg-brand hover:bg-brand/90 text-white" disabled={inviting}>{inviting ? "Sending..." : "Send Invite"}</Button>
              </form>
            </CardContent>
          </Card>

          {/* User list */}
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
                      {u.display_name?.charAt(0)?.toUpperCase() || "?"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{u.display_name}</p>
                      <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ROLE_COLOURS[u.role] || ""}`}>{ROLE_LABELS[u.role] || u.role}</span>
                      {!u.is_active && <Badge variant="destructive" className="text-xs">Inactive</Badge>}
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
                          {u.is_active ? (
                            <Button size="sm" variant="ghost" className="h-7 text-xs text-destructive hover:text-destructive" onClick={() => handleDeactivate(u.id, u.display_name)}>
                              <UserX className="w-3.5 h-3.5 mr-1" />Deactivate
                            </Button>
                          ) : (
                            <Button size="sm" variant="ghost" className="h-7 text-xs text-green-600" onClick={() => handleReactivate(u.id, u.display_name)}>
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

        {/* Safeguarding tab */}
        <TabsContent value="safeguarding" className="space-y-4 mt-4">
          <Card className="border-border/50">
            <CardContent className="p-0">
              <div className="divide-y divide-border/50">
                {incidents.length === 0 ? (
                  <div className="p-6 text-center text-muted-foreground text-sm">No safeguarding incidents recorded</div>
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
                        <p className="text-xs text-muted-foreground mt-1">{new Date(inc.created_at).toLocaleString("en-GB")}</p>
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

        {/* Audit log tab */}
        <TabsContent value="audit" className="space-y-4 mt-4">
          <Card className="border-border/50">
            <CardContent className="p-0">
              <div className="divide-y divide-border/50 max-h-96 overflow-y-auto">
                {auditLogs.length === 0 ? (
                  <div className="p-6 text-center text-muted-foreground text-sm">No audit events recorded</div>
                ) : auditLogs.map(log => (
                  <div key={log.id} className="p-3 flex items-start gap-3">
                    <Activity className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-mono text-muted-foreground">{log.action}</p>
                      <p className="text-xs text-muted-foreground">{log.user_name || "System"} · {new Date(log.created_at).toLocaleString("en-GB")}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
