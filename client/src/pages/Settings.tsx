import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useApp } from "@/contexts/AppContext";
import {
  CheckCircle, Zap, Brain, Cpu, Globe, Bot, Layers, Key, Plus, Trash2,
  Eye, EyeOff, ChevronDown, ChevronUp, RefreshCw, AlertCircle, Shield,
} from "lucide-react";
import { toast } from "sonner";

const PRESET_PROVIDERS = [
  { id: "groq", label: "Groq", description: "Ultra-fast Llama 3.3 70B. Free tier available.", url: "https://console.groq.com/keys", placeholder: "gsk_...", defaultModel: "llama-3.3-70b-versatile", icon: Zap, color: "text-orange-500", bg: "bg-orange-50 dark:bg-orange-950/30", badge: "Free tier", badgeColor: "bg-green-100 text-green-700" },
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

export default function Settings() {
  const { user, logout } = useApp();
  const isAdmin = user?.role === "admin" || user?.role === "super_admin";
  const [savedKeys, setSavedKeys] = useState<SavedKey[]>([]);
  const [loadingKeys, setLoadingKeys] = useState(false);
  const [expandedProvider, setExpandedProvider] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Record<string, { apiKey: string; model: string; baseUrl: string; showKey: boolean }>>({});
  const [savingProvider, setSavingProvider] = useState<string | null>(null);
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customProvider, setCustomProvider] = useState({ label: "", apiKey: "", model: "", baseUrl: "" });

  const fetchKeys = async () => {
    setLoadingKeys(true);
    try {
      const res = await fetch("/api/school-keys", { headers: { ...getAuthHeader() } });
      if (res.ok) { const data = await res.json(); setSavedKeys(data.keys || []); }
    } catch (_) {}
    setLoadingKeys(false);
  };

  useEffect(() => { if (isAdmin) fetchKeys(); }, [isAdmin]);

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
        toast.success(`${providerLabel} key saved`);
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
