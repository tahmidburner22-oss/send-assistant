import { useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  GraduationCap, Building2, Shield, UserPlus, Check, ArrowRight, ArrowLeft,
  Key, Plus, Trash2, Eye, EyeOff, ChevronDown, ChevronUp, Zap,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { schools as schoolsApi } from "@/lib/api";

const STEPS = [
  { id: 1, title: "School Details", icon: Building2 },
  { id: 2, title: "DSL Contact", icon: Shield },
  { id: 3, title: "Admin Account", icon: UserPlus },
  { id: 4, title: "AI Setup", icon: Key },
  { id: 5, title: "Complete", icon: Check },
];

const PRESET_PROVIDERS = [
  { id: "groq", label: "Groq", description: "Ultra-fast Llama 3.3 70B Versatile. Free tier available.", url: "https://console.groq.com/keys", placeholder: "gsk_...", defaultModel: "llama-3.3-70b-versatile", badge: "Free tier", badgeColor: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300" },
  { id: "gemini", label: "Google Gemini", description: "Gemini 2.5 Flash. Generous free tier.", url: "https://aistudio.google.com/app/apikey", placeholder: "AIza...", defaultModel: "gemini-2.5-flash", badge: "Free tier", badgeColor: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300" },
  { id: "openai", label: "OpenAI", description: "GPT-4o Mini and GPT-4o. Pay-as-you-go.", url: "https://platform.openai.com/api-keys", placeholder: "sk-...", defaultModel: "gpt-4o-mini", badge: "Paid", badgeColor: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300" },
  { id: "openrouter", label: "OpenRouter", description: "Access 100+ models from one API key.", url: "https://openrouter.ai/keys", placeholder: "sk-or-...", defaultModel: "", badge: "Multi-model", badgeColor: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300" },
  { id: "claude", label: "Anthropic Claude", description: "Claude 3.5 Sonnet — excellent for writing.", url: "https://console.anthropic.com/settings/keys", placeholder: "sk-ant-...", defaultModel: "claude-3-5-sonnet-20241022", badge: "Paid", badgeColor: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300" },
  { id: "huggingface", label: "HuggingFace", description: "Open-source models via Inference API.", url: "https://huggingface.co/settings/tokens", placeholder: "hf_...", defaultModel: "", badge: "Free tier", badgeColor: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300" },
];

interface ApiKeyEntry {
  provider: string; providerLabel: string; apiKey: string; model: string; baseUrl: string; isCustom: boolean; showKey: boolean;
}

export default function Onboarding() {
  const [, setLocation] = useLocation();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [savingKeys, setSavingKeys] = useState(false);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [schoolData, setSchoolData] = useState({ name: "", urn: "", phase: "", address: "", domain: "", licenceType: "trial" });
  const [dslData, setDslData] = useState({ dslName: "", dslEmail: "", dslPhone: "" });
  const [adminData, setAdminData] = useState({ displayName: "", email: "", password: "", confirmPassword: "" });
  const [apiKeys, setApiKeys] = useState<ApiKeyEntry[]>([]);
  const [expandedProvider, setExpandedProvider] = useState<string | null>(null);
  const [customProvider, setCustomProvider] = useState({ label: "", apiKey: "", model: "", baseUrl: "" });
  const [showCustomForm, setShowCustomForm] = useState(false);

  const updateSchool = (k: string, v: string) => setSchoolData(s => ({ ...s, [k]: v }));
  const updateDsl = (k: string, v: string) => setDslData(s => ({ ...s, [k]: v }));
  const updateAdmin = (k: string, v: string) => setAdminData(s => ({ ...s, [k]: v }));
  const getKeyEntry = (id: string) => apiKeys.find(k => k.provider === id);

  const setProviderKey = (providerId: string, providerLabel: string, apiKey: string, model: string, baseUrl = "", isCustom = false) => {
    setApiKeys(prev => {
      const idx = prev.findIndex(k => k.provider === providerId);
      const entry: ApiKeyEntry = { provider: providerId, providerLabel, apiKey, model, baseUrl, isCustom, showKey: false };
      if (idx >= 0) { const u = [...prev]; u[idx] = { ...u[idx], apiKey, model, baseUrl }; return u; }
      return [...prev, entry];
    });
  };
  const removeKey = (id: string) => setApiKeys(prev => prev.filter(k => k.provider !== id));
  const toggleShowKey = (id: string) => setApiKeys(prev => prev.map(k => k.provider === id ? { ...k, showKey: !k.showKey } : k));

  const handleSubmit = async () => {
    if (adminData.password !== adminData.confirmPassword) { toast.error("Passwords do not match"); return; }
    if (adminData.password.length < 8) { toast.error("Password must be at least 8 characters"); return; }
    if (!/[0-9]/.test(adminData.password)) { toast.error("Password must contain at least one number"); return; }
    if (!/[^a-zA-Z0-9]/.test(adminData.password)) { toast.error("Password must contain at least one special character (e.g. ! @ # $)"); return; }
    setLoading(true);
    try {
      const result = await schoolsApi.onboard({ school: schoolData, dsl: dslData, admin: { displayName: adminData.displayName, email: adminData.email, password: adminData.password } }) as any;
      if (result?.token) setAuthToken(result.token);
      setStep(4);
    } catch (err: any) { toast.error(err.message || "Onboarding failed. Please try again."); }
    setLoading(false);
  };

  const handleSaveKeys = async () => {
    if (apiKeys.length === 0) { setStep(5); return; }
    setSavingKeys(true);
    const token = authToken || localStorage.getItem("send_token");
    let saved = 0;
    for (const entry of apiKeys) {
      if (!entry.apiKey.trim()) continue;
      try {
        await fetch("/api/school-keys", { method: "POST", headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify({ provider: entry.provider, providerLabel: entry.providerLabel, apiKey: entry.apiKey, model: entry.model, baseUrl: entry.baseUrl || undefined }) });
        saved++;
      } catch (_) {}
    }
    setSavingKeys(false);
    if (saved > 0) toast.success(`${saved} AI provider${saved > 1 ? "s" : ""} configured`);
    setStep(5);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-light via-background to-background flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-brand mx-auto mb-3 flex items-center justify-center shadow-lg"><GraduationCap className="w-7 h-7 text-white" /></div>
          <h1 className="text-2xl font-bold">Register Your School</h1>
          <p className="text-sm text-muted-foreground mt-1">Set up Adaptly for your school in minutes</p>
        </div>
        <div className="flex items-center justify-center mb-8 gap-2">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${step >= s.id ? "bg-brand text-white" : "bg-muted text-muted-foreground"}`}>{step > s.id ? <Check className="w-4 h-4" /> : s.id}</div>
              {i < STEPS.length - 1 && <div className={`w-8 h-0.5 transition-colors ${step > s.id ? "bg-brand" : "bg-border"}`} />}
            </div>
          ))}
        </div>
        <Card className="border-border/50 shadow-sm">
          <CardContent className="p-6">
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                  <h2 className="text-lg font-semibold flex items-center gap-2"><Building2 className="w-5 h-5 text-brand" />School Details</h2>
                  <div className="space-y-2"><Label htmlFor="school-name">School name *</Label><Input id="school-name" value={schoolData.name} onChange={e => updateSchool("name", e.target.value)} placeholder="e.g. Oakwood Primary School" required /></div>
                  <div className="space-y-2"><Label htmlFor="school-urn">URN (optional)</Label><Input id="school-urn" value={schoolData.urn} onChange={e => updateSchool("urn", e.target.value)} placeholder="e.g. 123456" /></div>
                  <div className="space-y-2"><Label htmlFor="school-phase">School phase *</Label>
                    <Select value={schoolData.phase} onValueChange={v => updateSchool("phase", v)}>
                      <SelectTrigger id="school-phase"><SelectValue placeholder="Select phase" /></SelectTrigger>
                      <SelectContent><SelectItem value="primary">Primary</SelectItem><SelectItem value="secondary">Secondary</SelectItem><SelectItem value="all-through">All-through</SelectItem><SelectItem value="special">Special school</SelectItem><SelectItem value="other">Other</SelectItem></SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2"><Label htmlFor="school-address">Address</Label><Input id="school-address" value={schoolData.address} onChange={e => updateSchool("address", e.target.value)} placeholder="e.g. 1 School Lane, London" /></div>
                  <div className="space-y-2"><Label htmlFor="school-domain">Email domain (optional)</Label><Input id="school-domain" value={schoolData.domain} onChange={e => updateSchool("domain", e.target.value)} placeholder="e.g. school.sch.uk" /><p className="text-xs text-muted-foreground">If set, only emails from this domain can register for your school.</p></div>
                  <Button className="w-full bg-brand hover:bg-brand/90 text-white" onClick={() => { if (!schoolData.name || !schoolData.phase) { toast.error("School name and phase are required"); return; } setStep(2); }}>Continue <ArrowRight className="w-4 h-4 ml-1" /></Button>
                </motion.div>
              )}
              {step === 2 && (
                <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                  <h2 className="text-lg font-semibold flex items-center gap-2"><Shield className="w-5 h-5 text-brand" />Designated Safeguarding Lead</h2>
                  <p className="text-sm text-muted-foreground">Your DSL will be notified of any safeguarding concerns flagged by the AI content filter. Required for KCSIE 2025 compliance.</p>
                  <div className="space-y-2"><Label htmlFor="dsl-name">DSL full name *</Label><Input id="dsl-name" value={dslData.dslName} onChange={e => updateDsl("dslName", e.target.value)} placeholder="e.g. Jane Smith" required /></div>
                  <div className="space-y-2"><Label htmlFor="dsl-email">DSL email address *</Label><Input id="dsl-email" type="email" value={dslData.dslEmail} onChange={e => updateDsl("dslEmail", e.target.value)} placeholder="dsl@school.sch.uk" required /></div>
                  <div className="space-y-2"><Label htmlFor="dsl-phone">DSL phone number</Label><Input id="dsl-phone" type="tel" value={dslData.dslPhone} onChange={e => updateDsl("dslPhone", e.target.value)} placeholder="e.g. 01234 567890" /></div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setStep(1)} className="flex-1"><ArrowLeft className="w-4 h-4 mr-1" />Back</Button>
                    <Button className="flex-1 bg-brand hover:bg-brand/90 text-white" onClick={() => { if (!dslData.dslName || !dslData.dslEmail) { toast.error("DSL name and email are required"); return; } setStep(3); }}>Continue <ArrowRight className="w-4 h-4 ml-1" /></Button>
                  </div>
                </motion.div>
              )}
              {step === 3 && (
                <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                  <h2 className="text-lg font-semibold flex items-center gap-2"><UserPlus className="w-5 h-5 text-brand" />School Admin Account</h2>
                  <p className="text-sm text-muted-foreground">Create the school admin account. This person will manage users and settings.</p>
                  <div className="space-y-2"><Label htmlFor="admin-name">Your full name *</Label><Input id="admin-name" value={adminData.displayName} onChange={e => updateAdmin("displayName", e.target.value)} placeholder="Your name" required /></div>
                  <div className="space-y-2"><Label htmlFor="admin-email">Your school email *</Label><Input id="admin-email" type="email" value={adminData.email} onChange={e => updateAdmin("email", e.target.value)} placeholder="you@school.sch.uk" required /></div>
                  <div className="space-y-2"><Label htmlFor="admin-pass">Password *</Label><Input id="admin-pass" type="password" value={adminData.password} onChange={e => updateAdmin("password", e.target.value)} placeholder="Min 8 characters" required /></div>
                  <div className="space-y-2"><Label htmlFor="admin-confirm">Confirm password *</Label><Input id="admin-confirm" type="password" value={adminData.confirmPassword} onChange={e => updateAdmin("confirmPassword", e.target.value)} placeholder="Confirm password" required /></div>
                  <p className="text-xs text-muted-foreground">By registering you agree to our <a href="/terms" className="text-brand hover:underline">Terms of Service</a> and <a href="/privacy" className="text-brand hover:underline">Privacy Policy</a>.</p>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setStep(2)} className="flex-1"><ArrowLeft className="w-4 h-4 mr-1" />Back</Button>
                    <Button className="flex-1 bg-brand hover:bg-brand/90 text-white" onClick={handleSubmit} disabled={loading}>{loading ? "Setting up..." : "Continue"} {!loading && <ArrowRight className="w-4 h-4 ml-1" />}</Button>
                  </div>
                </motion.div>
              )}
              {step === 4 && (
                <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                  <div>
                    <h2 className="text-lg font-semibold flex items-center gap-2"><Key className="w-5 h-5 text-brand" />AI Provider Setup</h2>
                    <p className="text-sm text-muted-foreground mt-1">Add your school's own AI API keys. All staff in your school will use these — you control the costs. Keys are encrypted and never shared.</p>
                  </div>
                  <div className="rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-3 text-xs text-amber-800 dark:text-amber-200">
                    <strong>Why bring your own keys?</strong> You pay AI providers directly at cost — no markup. Groq and Gemini both have generous free tiers that cover most school usage.
                  </div>
                  <div className="space-y-2">
                    {PRESET_PROVIDERS.map(p => {
                      const entry = getKeyEntry(p.id);
                      const isExpanded = expandedProvider === p.id;
                      return (
                        <div key={p.id} className={`border rounded-lg transition-colors ${entry ? "border-brand/40 bg-brand/5" : "border-border"}`}>
                          <button className="w-full flex items-center justify-between p-3 text-left" onClick={() => setExpandedProvider(isExpanded ? null : p.id)}>
                            <div className="flex items-center gap-2">
                              {entry ? <Check className="w-4 h-4 text-green-600 flex-shrink-0" /> : <Key className="w-4 h-4 text-muted-foreground flex-shrink-0" />}
                              <div>
                                <div className="flex items-center gap-2"><span className="text-sm font-medium">{p.label}</span><span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${p.badgeColor}`}>{p.badge}</span></div>
                                <p className="text-xs text-muted-foreground">{p.description}</p>
                              </div>
                            </div>
                            {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                          </button>
                          {isExpanded && (
                            <div className="px-3 pb-3 space-y-2 border-t pt-3">
                              <div className="flex items-center gap-2">
                                <div className="flex-1 relative">
                                  <Input type={entry?.showKey ? "text" : "password"} placeholder={p.placeholder} value={entry?.apiKey || ""} onChange={e => setProviderKey(p.id, p.label, e.target.value, entry?.model || p.defaultModel)} className="pr-8 text-xs font-mono" />
                                  {entry && <button className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground" onClick={() => toggleShowKey(p.id)}>{entry.showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}</button>}
                                </div>
                                {entry && <Button variant="ghost" size="icon" className="h-9 w-9 text-red-500 hover:text-red-600" onClick={() => removeKey(p.id)}><Trash2 className="w-4 h-4" /></Button>}
                              </div>
                              <Input placeholder={`Model (default: ${p.defaultModel || "auto"})`} value={entry?.model || ""} onChange={e => setProviderKey(p.id, p.label, entry?.apiKey || "", e.target.value)} className="text-xs" />
                              <a href={p.url} target="_blank" rel="noopener noreferrer" className="text-xs text-brand hover:underline">Get your {p.label} API key →</a>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <div className="border border-dashed border-border rounded-lg">
                    <button className="w-full flex items-center gap-2 p-3 text-sm text-muted-foreground hover:text-foreground" onClick={() => setShowCustomForm(!showCustomForm)}>
                      <Plus className="w-4 h-4" />Add custom AI provider (OpenAI-compatible)
                    </button>
                    {showCustomForm && (
                      <div className="px-3 pb-3 space-y-2 border-t pt-3">
                        <Input placeholder="Provider name (e.g. My Local LLM)" value={customProvider.label} onChange={e => setCustomProvider(p => ({ ...p, label: e.target.value }))} className="text-xs" />
                        <Input type="password" placeholder="API key" value={customProvider.apiKey} onChange={e => setCustomProvider(p => ({ ...p, apiKey: e.target.value }))} className="text-xs font-mono" />
                        <Input placeholder="Base URL (e.g. https://my-llm.example.com/v1)" value={customProvider.baseUrl} onChange={e => setCustomProvider(p => ({ ...p, baseUrl: e.target.value }))} className="text-xs" />
                        <Input placeholder="Model name" value={customProvider.model} onChange={e => setCustomProvider(p => ({ ...p, model: e.target.value }))} className="text-xs" />
                        <Button size="sm" className="w-full bg-brand hover:bg-brand/90 text-white text-xs" onClick={() => {
                          if (!customProvider.label || !customProvider.apiKey) { toast.error("Provider name and API key required"); return; }
                          const id = customProvider.label.toLowerCase().replace(/\s+/g, "-");
                          setProviderKey(id, customProvider.label, customProvider.apiKey, customProvider.model, customProvider.baseUrl, true);
                          setCustomProvider({ label: "", apiKey: "", model: "", baseUrl: "" });
                          setShowCustomForm(false);
                          toast.success("Custom provider added");
                        }}>Add Provider</Button>
                      </div>
                    )}
                  </div>
                  {apiKeys.length > 0 && <div className="flex items-center gap-2 text-xs text-green-700 dark:text-green-400"><Zap className="w-3.5 h-3.5" />{apiKeys.length} provider{apiKeys.length > 1 ? "s" : ""} configured — all staff in your school will use these</div>}
                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" onClick={() => setStep(3)} className="flex-1 text-sm"><ArrowLeft className="w-4 h-4 mr-1" />Back</Button>
                    <Button className="flex-1 bg-brand hover:bg-brand/90 text-white text-sm" onClick={handleSaveKeys} disabled={savingKeys}>{savingKeys ? "Saving..." : apiKeys.length > 0 ? "Save & Continue" : "Skip for now"} <ArrowRight className="w-4 h-4 ml-1" /></Button>
                  </div>
                  <p className="text-xs text-center text-muted-foreground">You can add or change API keys anytime in Settings → AI Providers.</p>
                </motion.div>
              )}
              {step === 5 && (
                <motion.div key="step5" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-4 py-4">
                  <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 mx-auto flex items-center justify-center">
                    <Check className="w-8 h-8 text-green-600" />
                  </div>
                  <h2 className="text-xl font-semibold">School registered! 🎉</h2>
                  <p className="text-sm text-muted-foreground">Your school is live on Adaptly. Sign in now and generate your first worksheet in under 30 seconds.</p>
                  <div className="text-left space-y-2 bg-brand/5 border border-brand/20 rounded-xl p-4">
                    <div className="flex items-start gap-2.5">
                      <div className="w-5 h-5 rounded-full bg-brand text-white flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">1</div>
                      <p className="text-sm text-foreground"><strong>Sign in</strong> with the admin account you just created</p>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <div className="w-5 h-5 rounded-full bg-brand text-white flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">2</div>
                      <p className="text-sm text-foreground"><strong>Generate your first worksheet</strong> — pick a subject, year group and topic, then click Generate</p>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <div className="w-5 h-5 rounded-full bg-brand text-white flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">3</div>
                      <p className="text-sm text-foreground"><strong>Invite your team</strong> — go to Settings → Staff to add teachers and SENCOs</p>
                    </div>
                  </div>
                  {apiKeys.length === 0 && (
                    <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3">
                      ⚠️ <strong>No AI keys added.</strong> After signing in go to <strong>Settings → AI Providers</strong> to add a free Groq or Gemini key before using AI features.
                    </p>
                  )}
                  <div className="flex flex-col gap-2">
                    <Button className="w-full bg-brand hover:bg-brand/90 text-white h-11 font-semibold" onClick={() => setLocation("/login")}>
                      Sign In &amp; Generate First Worksheet →
                    </Button>
                    <Button variant="outline" className="w-full h-9 text-sm" onClick={() => setLocation("/")}>
                      Back to Home
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
