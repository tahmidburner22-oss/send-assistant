import { useState } from "react";
import { ArrowLeft, Check, Zap, Building2, GraduationCap, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useApp } from "@/contexts/AppContext";

const plans = [
  {
    name: "Free Trial",
    monthlyPrice: 0,
    annualPrice: 0,
    period: "30 days",
    badge: null,
    icon: Sparkles,
    description: "Try everything with no commitment",
    limits: { users: 5, pupils: 20, worksheets: 50 },
    features: [
      "Up to 5 users",
      "Up to 20 pupil profiles",
      "Up to 50 AI generations",
      "All core AI tools",
      "Worksheet & story generation",
      "Attendance tracking",
      "Email support",
    ],
    cta: "Start Free Trial",
    ctaHref: "/onboarding",
    highlight: false,
    stripePriceId: null,
  },
  {
    name: "Starter",
    monthlyPrice: 29,
    annualPrice: 24,
    period: "per month",
    badge: null,
    icon: Zap,
    description: "For small SEND teams",
    limits: { users: 10, pupils: -1, worksheets: -1 },
    features: [
      "Up to 10 users",
      "Unlimited pupil profiles",
      "Unlimited AI generations",
      "All AI tools",
      "Worksheet & story generation",
      "Differentiation tool",
      "Attendance & behaviour tracking",
      "Safeguarding incident reporting",
      "Audit logs",
      "Email support",
    ],
    cta: "Get Started",
    ctaHref: "/settings?tab=billing",
    highlight: false,
    stripePriceId: "starter",
  },
  {
    name: "Professional",
    monthlyPrice: 79,
    annualPrice: 66,
    period: "per month",
    badge: "Most Popular",
    icon: GraduationCap,
    description: "For whole-school SEND support",
    limits: { users: -1, pupils: -1, worksheets: -1 },
    features: [
      "Unlimited users",
      "Unlimited pupil profiles",
      "All Starter features",
      "Multi-role hierarchy (Admin > Teacher > TA)",
      "Bulk pupil import (CSV)",
      "MFA / SSO (Google Workspace)",
      "Visual timetable builder",
      "Parent portal with two-way messaging",
      "Real-time notifications",
      "Priority email support",
      "KCSIE 2025 alignment documentation",
    ],
    cta: "Get Started",
    ctaHref: "/settings?tab=billing",
    highlight: true,
    stripePriceId: "professional",
  },
  {
    name: "Enterprise / MAT",
    monthlyPrice: null,
    annualPrice: null,
    period: "per year",
    badge: null,
    icon: Building2,
    description: "For Multi-Academy Trusts",
    limits: { users: -1, pupils: -1, worksheets: -1 },
    features: [
      "All Professional features",
      "MAT admin dashboard",
      "Multi-school management",
      "MIS integration support",
      "Azure AD / Microsoft SSO",
      "Custom onboarding",
      "Data Processing Agreement",
      "DPIA support",
      "Dedicated account manager",
      "SLA guarantee",
    ],
    cta: "Contact Us",
    ctaHref: "mailto:sales@adaptly.co.uk",
    highlight: false,
    stripePriceId: null,
  },
];

export default function Pricing() {
  const [annual, setAnnual] = useState(false);
  const { user } = useApp();
  const isInsideApp = !!user;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 py-12">
        <Button variant="ghost" size="sm" onClick={() => window.history.back()} className="mb-6 -ml-2">
          <ArrowLeft className="w-4 h-4 mr-1" />Back
        </Button>

        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold">Simple, Transparent Pricing</h1>
          <p className="text-muted-foreground mt-2">Start with a free 30-day trial. No credit card required.</p>

          {/* Annual billing toggle */}
          <div className="flex items-center justify-center gap-3 mt-6">
            <Label htmlFor="billing-toggle" className={`text-sm font-medium ${!annual ? "text-foreground" : "text-muted-foreground"}`}>
              Monthly
            </Label>
            <Switch
              id="billing-toggle"
              checked={annual}
              onCheckedChange={setAnnual}
            />
            <Label htmlFor="billing-toggle" className={`text-sm font-medium ${annual ? "text-foreground" : "text-muted-foreground"}`}>
              Annual
            </Label>
            {annual && (
              <Badge className="bg-green-100 text-green-700 border-green-200 ml-1">
                Save up to 17%
              </Badge>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map(plan => {
            const Icon = plan.icon;
            const displayPrice = plan.monthlyPrice === null
              ? "Custom"
              : plan.monthlyPrice === 0
              ? "Free"
              : annual
              ? `£${plan.annualPrice}`
              : `£${plan.monthlyPrice}`;

            return (
              <Card key={plan.name} className={`relative border-border/50 flex flex-col ${plan.highlight ? "border-brand shadow-md" : ""}`}>
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-brand text-white">{plan.badge}</Badge>
                  </div>
                )}
                <CardHeader className="pb-4 pt-6">
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${plan.highlight ? "bg-brand/10" : "bg-muted"}`}>
                      <Icon className={`w-4 h-4 ${plan.highlight ? "text-brand" : "text-muted-foreground"}`} />
                    </div>
                    <h2 className="font-semibold text-lg">{plan.name}</h2>
                  </div>
                  <div className="mt-1">
                    <span className="text-3xl font-bold">{displayPrice}</span>
                    {displayPrice !== "Custom" && displayPrice !== "Free" && (
                      <span className="text-muted-foreground text-sm ml-1">/{plan.period}</span>
                    )}
                    {displayPrice === "Custom" && (
                      <span className="text-muted-foreground text-sm ml-1">{plan.period}</span>
                    )}
                    {annual && plan.monthlyPrice !== null && plan.monthlyPrice > 0 && (
                      <p className="text-xs text-green-600 mt-0.5">Billed annually (£{plan.annualPrice! * 12}/yr)</p>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{plan.description}</p>

                  {/* Usage limits */}
                  {(plan.limits.users > 0 || plan.limits.pupils > 0 || plan.limits.worksheets > 0) && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {plan.limits.users > 0 && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{plan.limits.users} users</span>
                      )}
                      {plan.limits.pupils > 0 && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{plan.limits.pupils} pupils</span>
                      )}
                      {plan.limits.worksheets > 0 && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{plan.limits.worksheets} generations</span>
                      )}
                    </div>
                  )}
                </CardHeader>
                <CardContent className="space-y-4 flex-1 flex flex-col">
                  <ul className="space-y-2 flex-1">
                    {plan.features.map(f => (
                      <li key={f} className="flex items-start gap-2 text-sm">
                        <Check className="w-4 h-4 text-brand shrink-0 mt-0.5" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    className={`w-full mt-auto ${plan.highlight ? "bg-brand hover:bg-brand/90 text-white" : ""}`}
                    variant={plan.highlight ? "default" : "outline"}
                    asChild
                  >
                    <a href={plan.ctaHref}>{plan.cta}</a>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Upgrade CTA for logged-in users */}
        {isInsideApp && user?.plan === "free" && (
          <div className="mt-8 p-4 rounded-xl border border-brand/30 bg-brand/5 flex items-center justify-between gap-4">
            <div>
              <p className="font-semibold text-foreground text-sm">You're on the Free Trial</p>
              <p className="text-xs text-muted-foreground mt-0.5">Upgrade to Starter or Professional to unlock unlimited generations and all features.</p>
            </div>
            <Button className="bg-brand hover:bg-brand/90 text-white flex-shrink-0" asChild>
              <a href="/settings?tab=billing">Upgrade Now</a>
            </Button>
          </div>
        )}

        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground">All plans include UK data residency · GDPR compliant · No pupil data used for AI training</p>
          <p className="text-sm text-muted-foreground mt-1">Questions? Email <a href="mailto:sales@adaptly.co.uk" className="text-brand hover:underline">sales@adaptly.co.uk</a></p>
        </div>
      </div>
    </div>
  );
}
