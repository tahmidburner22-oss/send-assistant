import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useApp } from "@/contexts/AppContext";
import { getStoredKey, setStoredKey } from "@/lib/ai";
import { Key, CheckCircle, AlertCircle, Zap, Brain, Cpu, RefreshCw, Eye, EyeOff, Globe } from "lucide-react";

type ProviderID = "groq" | "gemini" | "openrouter" | "openai";
type ProviderStatus = Record<ProviderID, "idle" | "testing" | "ok" | "fail">;

export default function Settings() {
  const { user, logout } = useApp();
  const [keys, setKeys] = useState<Record<ProviderID, string>>({
    groq: getStoredKey("groq"),
    gemini: getStoredKey("gemini"),
    openrouter: getStoredKey("openrouter"),
    openai: getStoredKey("openai"),
  });
  const [showKeys, setShowKeys] = useState<Record<ProviderID, boolean>>({
    groq: false, gemini: false, openrouter: false, openai: false,
  });
  const [status, setStatus] = useState<ProviderStatus>({
    groq: "idle", gemini: "idle", openrouter: "idle", openai: "idle",
  });

  useEffect(() => {
    setKeys({
      groq: getStoredKey("groq"),
      gemini: getStoredKey("gemini"),
      openrouter: getStoredKey("openrouter"),
      openai: getStoredKey("openai"),
    });
  }, []);

  const saveKey = (provider: ProviderID) => {
    setStoredKey(provider, keys[provider]);
    toast.success(`${provider.charAt(0).toUpperCase() + provider.slice(1)} API key saved!`);
  };

  const testProvider = async (provider: ProviderID) => {
    setStatus(s => ({ ...s, [provider]: "testing" }));
    try {
      const key = keys[provider];
      if (!key) throw new Error("No key");
      let res: Response;
      if (provider === "groq") {
        res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
          body: JSON.stringify({ model: "llama-3.3-70b-versatile", messages: [{ role: "user", content: "Say OK" }], max_tokens: 5 }),
        });
      } else if (provider === "gemini") {
        res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contents: [{ parts: [{ text: "Say OK" }] }], generationConfig: { maxOutputTokens: 5 } }),
        });
      } else if (provider === "openrouter") {
        res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}`, "HTTP-Referer": "https://adaptly.co.uk" },
          body: JSON.stringify({ model: "meta-llama/llama-3.3-70b-instruct:free", messages: [{ role: "user", content: "Say OK" }], max_tokens: 5 }),
        });
      } else {
        res = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
          body: JSON.stringify({ model: "gpt-4o-mini", messages: [{ role: "user", content: "Say OK" }], max_tokens: 5 }),
        });
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setStatus(s => ({ ...s, [provider]: "ok" }));
      toast.success(`${provider} is working!`);
    } catch {
      setStatus(s => ({ ...s, [provider]: "fail" }));
      toast.error(`${provider} test failed. Check your API key.`);
    }
  };

  const testAll = async () => {
    toast.info("Testing all providers...");
    for (const p of (["groq", "gemini", "openrouter", "openai"] as ProviderID[])) {
      if (keys[p]) await testProvider(p);
    }
  };

  const providers = [
    {
      id: "groq" as ProviderID,
      name: "Groq",
      icon: Zap,
      color: "text-orange-500",
      bg: "bg-orange-50",
      description: "Ultra-fast inference. Primary AI provider. Pre-configured & ready to use.",
      placeholder: "gsk_...",
      link: "https://console.groq.com/keys",
      badge: "Primary",
      badgeColor: "bg-orange-100 text-orange-700",
    },
    {
      id: "gemini" as ProviderID,
      name: "Google Gemini",
      icon: Brain,
      color: "text-blue-500",
      bg: "bg-blue-50",
      description: "Google Gemini 2.0 Flash. 2nd fallback. Free tier available.",
      placeholder: "AIza...",
      link: "https://aistudio.google.com/apikey",
      badge: "Fallback 1",
      badgeColor: "bg-blue-100 text-blue-700",
    },
    {
      id: "openrouter" as ProviderID,
      name: "OpenRouter",
      icon: Globe,
      color: "text-purple-500",
      bg: "bg-purple-50",
      description: "Access to 100+ free models (Llama, Mistral, Gemma). 3rd fallback.",
      placeholder: "sk-or-...",
      link: "https://openrouter.ai/keys",
      badge: "Fallback 2",
      badgeColor: "bg-purple-100 text-purple-700",
    },
    {
      id: "openai" as ProviderID,
      name: "OpenAI",
      icon: Cpu,
      color: "text-green-600",
      bg: "bg-green-50",
      description: "GPT-4o mini. Final fallback provider.",
      placeholder: "sk-...",
      link: "https://platform.openai.com/api-keys",
      badge: "Fallback 3",
      badgeColor: "bg-green-100 text-green-700",
    },
  ];

  return (
    <div className="px-4 py-6 max-w-2xl mx-auto space-y-6">
      <div>
        <h2 className="text-xl font-bold text-foreground">Settings</h2>
        <p className="text-sm text-muted-foreground mt-1">Manage your AI providers and account settings</p>
      </div>

      {/* AI Provider Keys */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Key className="h-4 w-4 text-brand" />
            AI Provider Keys
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Keys are stored locally in your browser. The system automatically tries each provider in order
            (Groq → Gemini → OpenRouter → OpenAI) and falls back if one fails. Groq is pre-configured and ready to use.
          </p>
        </CardHeader>
        <CardContent className="space-y-5">
          {providers.map((provider) => {
            const Icon = provider.icon;
            const s = status[provider.id];
            return (
              <div key={provider.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-7 h-7 rounded-lg ${provider.bg} flex items-center justify-center`}>
                      <Icon className={`h-4 w-4 ${provider.color}`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <Label className="text-sm font-medium">{provider.name}</Label>
                        <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${provider.badgeColor}`}>{provider.badge}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{provider.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {s === "ok" && <Badge className="bg-green-100 text-green-700 text-xs"><CheckCircle className="h-3 w-3 mr-1" />Working</Badge>}
                    {s === "fail" && <Badge className="bg-red-100 text-red-700 text-xs"><AlertCircle className="h-3 w-3 mr-1" />Failed</Badge>}
                    {s === "testing" && <Badge className="bg-blue-100 text-blue-700 text-xs"><RefreshCw className="h-3 w-3 mr-1 animate-spin" />Testing</Badge>}
                    {keys[provider.id] && s === "idle" && <Badge className="bg-gray-100 text-gray-600 text-xs">Saved</Badge>}
                  </div>
                </div>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      type={showKeys[provider.id] ? "text" : "password"}
                      placeholder={provider.placeholder}
                      value={keys[provider.id]}
                      onChange={e => setKeys(k => ({ ...k, [provider.id]: e.target.value }))}
                      className="pr-9 font-mono text-xs"
                    />
                    <button
                      type="button"
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      onClick={() => setShowKeys(s => ({ ...s, [provider.id]: !s[provider.id] }))}
                    >
                      {showKeys[provider.id] ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => saveKey(provider.id)}>Save</Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => testProvider(provider.id)}
                    disabled={!keys[provider.id] || s === "testing"}
                    className="text-xs"
                  >
                    Test
                  </Button>
                </div>
                <a href={provider.link} target="_blank" rel="noopener noreferrer" className="text-xs text-brand hover:underline">
                  Get a free {provider.name} API key →
                </a>
              </div>
            );
          })}
          <Button variant="outline" className="w-full" onClick={testAll}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Test All Providers
          </Button>
        </CardContent>
      </Card>

      {/* Account */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Account</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">{user?.displayName}</p>
              <p className="text-xs text-muted-foreground">{user?.email} · {user?.role}</p>
            </div>
            <Badge className="bg-brand-light text-brand text-xs">Active</Badge>
          </div>
          <Button variant="outline" className="w-full text-red-600 hover:text-red-700 hover:bg-red-50" onClick={logout}>
            Sign Out
          </Button>
        </CardContent>
      </Card>

      {/* About */}
      <Card className="border-border/50">
        <CardContent className="p-4">
          <p className="text-xs text-muted-foreground text-center">
            Adaptly for UK Teachers<br />
            <a href="/privacy" className="text-brand hover:underline">Privacy Policy</a> · <a href="/terms" className="text-brand hover:underline">Terms</a> · <a href="/help" className="text-brand hover:underline">Help Centre</a> · <a href="/ai-governance" className="text-brand hover:underline">AI Governance</a>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
