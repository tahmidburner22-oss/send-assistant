import { Check, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const plans = [
  {
    name: "Free Trial",
    price: "Free",
    period: "30 days",
    badge: null,
    description: "Try everything with no commitment",
    features: [
      "Up to 5 users",
      "All core AI tools",
      "Up to 20 pupil profiles",
      "Worksheet & story generation",
      "Attendance tracking",
      "Email support",
    ],
    cta: "Start Free Trial",
    ctaHref: "/onboarding",
    highlight: false,
  },
  {
    name: "Starter",
    price: "£29",
    period: "per month",
    badge: null,
    description: "For small SEND teams",
    features: [
      "Up to 10 users",
      "Unlimited pupil profiles",
      "All AI tools",
      "Worksheet & story generation",
      "Differentiation tool",
      "Attendance & behaviour tracking",
      "Safeguarding incident reporting",
      "Audit logs",
      "Email support",
    ],
    cta: "Get Started",
    ctaHref: "/onboarding",
    highlight: false,
  },
  {
    name: "Professional",
    price: "£79",
    period: "per month",
    badge: "Most Popular",
    description: "For whole-school SEND support",
    features: [
      "Unlimited users",
      "Unlimited pupil profiles",
      "All Starter features",
      "Multi-role hierarchy (Admin > Teacher > TA)",
      "Bulk pupil import (CSV)",
      "MFA / SSO (Google Workspace)",
      "Visual timetable builder",
      "Parent portal",
      "Priority email support",
      "KCSIE 2025 alignment documentation",
    ],
    cta: "Get Started",
    ctaHref: "/onboarding",
    highlight: true,
  },
  {
    name: "Enterprise / MAT",
    price: "Custom",
    period: "per year",
    badge: null,
    description: "For Multi-Academy Trusts",
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
    ctaHref: "mailto:sales@sendassistant.app",
    highlight: false,
  },
];

export default function Pricing() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 py-12">
        <Button variant="ghost" size="sm" onClick={() => window.history.back()} className="mb-6 -ml-2">
          <ArrowLeft className="w-4 h-4 mr-1" />Back
        </Button>

        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold">Simple, Transparent Pricing</h1>
          <p className="text-muted-foreground mt-2">Start with a free 30-day trial. No credit card required.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map(plan => (
            <Card key={plan.name} className={`relative border-border/50 ${plan.highlight ? "border-brand shadow-md" : ""}`}>
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-brand text-white">{plan.badge}</Badge>
                </div>
              )}
              <CardHeader className="pb-4 pt-6">
                <h2 className="font-semibold text-lg">{plan.name}</h2>
                <div className="mt-2">
                  <span className="text-3xl font-bold">{plan.price}</span>
                  {plan.price !== "Custom" && <span className="text-muted-foreground text-sm ml-1">/{plan.period}</span>}
                  {plan.price === "Custom" && <span className="text-muted-foreground text-sm ml-1">{plan.period}</span>}
                </div>
                <p className="text-sm text-muted-foreground mt-1">{plan.description}</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <Check className="w-4 h-4 text-brand shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  className={`w-full ${plan.highlight ? "bg-brand hover:bg-brand/90 text-white" : ""}`}
                  variant={plan.highlight ? "default" : "outline"}
                  asChild
                >
                  <a href={plan.ctaHref}>{plan.cta}</a>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-sm text-muted-foreground">All plans include UK data residency · GDPR compliant · No pupil data used for AI training</p>
          <p className="text-sm text-muted-foreground mt-1">Questions? Email <a href="mailto:sales@sendassistant.app" className="text-brand hover:underline">sales@sendassistant.app</a></p>
        </div>
      </div>
    </div>
  );
}
