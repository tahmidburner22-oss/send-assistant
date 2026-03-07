import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useApp } from "@/contexts/AppContext";
import { CheckCircle, Zap, Brain, Cpu, Globe, Bot, Layers } from "lucide-react";

export default function Settings() {
  const { user, logout } = useApp();

  const providers = [
    { name: "Groq (Llama 3.3 70B)", icon: Zap, color: "text-orange-500", bg: "bg-orange-50", badge: "Primary" },
    { name: "Google Gemini 2.0 Flash", icon: Brain, color: "text-blue-500", bg: "bg-blue-50", badge: "Fallback 1" },
    { name: "OpenAI GPT-4o mini", icon: Cpu, color: "text-green-600", bg: "bg-green-50", badge: "Fallback 2" },
    { name: "OpenRouter (100+ models)", icon: Globe, color: "text-purple-500", bg: "bg-purple-50", badge: "Fallback 3" },
    { name: "Claude 3 Haiku", icon: Bot, color: "text-yellow-600", bg: "bg-yellow-50", badge: "Fallback 4" },
    { name: "HuggingFace (Qwen / Llama)", icon: Layers, color: "text-pink-500", bg: "bg-pink-50", badge: "Fallback 5" },
  ];

  return (
    <div className="px-4 py-6 max-w-2xl mx-auto space-y-6">
      <div>
        <h2 className="text-xl font-bold text-foreground">Settings</h2>
        <p className="text-sm text-muted-foreground mt-1">Your account and AI configuration</p>
      </div>

      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            AI — Always On
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            AI is fully configured and ready to use on your account. No setup required.
            The system automatically tries each provider in order and falls back instantly
            if one is unavailable — so AI always works, every time.
          </p>
        </CardHeader>
        <CardContent className="space-y-2">
          {providers.map((p) => {
            const Icon = p.icon;
            return (
              <div key={p.name} className={`flex items-center justify-between py-1.5 px-2 rounded-lg bg-muted/30`}>
                <div className="flex items-center gap-2">
                  <div className={`w-6 h-6 rounded-md ${p.bg} flex items-center justify-center`}>
                    <Icon className={`h-3.5 w-3.5 ${p.color}`} />
                  </div>
                  <span className="text-sm font-medium">{p.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">{p.badge}</span>
                  <Badge className="bg-green-100 text-green-700 text-xs border-0">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Ready
                  </Badge>
                </div>
              </div>
            );
          })}
          <p className="text-xs text-muted-foreground pt-2 text-center">
            All 6 providers are pre-configured by your administrator. AI is always available.
          </p>
        </CardContent>
      </Card>

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
          <Button
            variant="outline"
            className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={logout}
          >
            Sign Out
          </Button>
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
