/**
 * SubscriptionGate
 * Wraps protected routes and shows a paywall screen if the school's
 * subscription has lapsed (not in trial, not active, not past_due grace).
 *
 * Rules:
 *  - Users with no school (solo teachers) are always allowed through.
 *  - Trial period: always allowed through.
 *  - Active / trialing subscription: allowed through.
 *  - past_due: allowed through with a warning banner (7-day grace).
 *  - canceled / unpaid: blocked with upgrade prompt.
 *  - School admins see a "Manage Billing" button; others see "Contact your admin".
 */
import { useEffect, useState } from "react";
import { useApp } from "@/contexts/AppContext";
import { billing } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CreditCard, Lock, RefreshCw } from "lucide-react";
import { toast } from "sonner";

interface BillingStatus {
  status: string;
  plan: string | null;
  licenceType: string;
  trialEndsAt: string | null;
  periodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  isAccessible: boolean;
  stripeConfigured: boolean;
}

interface Props {
  children: React.ReactNode;
}

export default function SubscriptionGate({ children }: Props) {
  const { user, school } = useApp();
  const [billingStatus, setBillingStatus] = useState<BillingStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [redirecting, setRedirecting] = useState(false);

  const isAdmin = user?.role === "school_admin" || user?.role === "mat_admin";
  // Platform owner / developer account always gets full access — no billing checks ever
  const isPlatformOwner = user?.email === "admin@adaptly.co.uk" || user?.email === "admin@sendassistant.app";
  const isSuperAdmin = isPlatformOwner || user?.role === "mat_admin" || user?.role === "super_admin";

  useEffect(() => {
    // Super admins and platform owner always have access — skip billing check
    if (isSuperAdmin || !user?.schoolId) {
      setLoading(false);
      return;
    }
    billing.status()
      .then(s => setBillingStatus(s))
      .catch(() => setBillingStatus(null))
      .finally(() => setLoading(false));
  }, [user?.schoolId]);

  // Show warning banner for past_due (grace period)
  const showPastDueBanner =
    billingStatus?.status === "past_due" && billingStatus?.isAccessible;

  // Block access for canceled/unpaid (never block super admins)
  const isBlocked =
    !isSuperAdmin &&
    billingStatus !== null &&
    !billingStatus.isAccessible &&
    user?.schoolId != null;

  // Trial ending soon (within 3 days)
  const trialEndingSoon =
    billingStatus?.licenceType === "trial" &&
    billingStatus?.trialEndsAt &&
    new Date(billingStatus.trialEndsAt) > new Date() &&
    (new Date(billingStatus.trialEndsAt).getTime() - Date.now()) < 3 * 24 * 60 * 60 * 1000;

  const handleManageBilling = async () => {
    setRedirecting(true);
    try {
      // Try customer portal first (existing subscriber)
      const { url } = await billing.portal();
      window.location.href = url;
    } catch {
      // No portal session — redirect to pricing
      window.location.href = "/pricing";
    } finally {
      setRedirecting(false);
    }
  };

  const handleSubscribe = async (plan: string) => {
    setRedirecting(true);
    try {
      const { url } = await billing.checkout(plan, "monthly");
      window.location.href = url;
    } catch (err: any) {
      toast.error(err.message || "Failed to start checkout");
      setRedirecting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isBlocked) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-destructive/30">
          <CardContent className="pt-8 pb-8 text-center space-y-6">
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
                <Lock className="w-8 h-8 text-destructive" />
              </div>
            </div>

            <div className="space-y-2">
              <h1 className="text-xl font-bold">Subscription Required</h1>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {billingStatus?.status === "canceled"
                  ? "Your school's Adaptly subscription has been cancelled. To continue using Adaptly, please subscribe to a plan."
                  : "Your school's Adaptly subscription payment is overdue. Please update your payment details to restore access."}
              </p>
            </div>

            {school && (
              <div className="bg-muted rounded-lg px-4 py-3 text-sm">
                <p className="font-medium">{school.name}</p>
                <p className="text-muted-foreground text-xs mt-0.5">
                  Status: <Badge variant="destructive" className="text-xs ml-1">
                    {billingStatus?.status === "canceled" ? "Cancelled" : "Payment overdue"}
                  </Badge>
                </p>
              </div>
            )}

            {isAdmin ? (
              <div className="space-y-3">
                {billingStatus?.stripeConfigured ? (
                  <>
                    <Button
                      className="w-full bg-brand hover:bg-brand/90 text-white"
                      onClick={() => handleSubscribe("professional")}
                      disabled={redirecting}
                    >
                      <CreditCard className="w-4 h-4 mr-2" />
                      {redirecting ? "Redirecting..." : "Subscribe — Professional £99/month"}
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={handleManageBilling}
                      disabled={redirecting}
                    >
                      Manage Billing
                    </Button>
                  </>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      To reactivate your account, please contact us:
                    </p>
                    <Button className="w-full bg-brand hover:bg-brand/90 text-white" asChild>
                      <a href="mailto:billing@adaptly.co.uk">
                        <CreditCard className="w-4 h-4 mr-2" />
                        Contact Billing
                      </a>
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Please contact your school administrator to renew the Adaptly subscription.
                </p>
                <Button variant="outline" className="w-full" asChild>
                  <a href="mailto:admin@school.sch.uk">Contact Your Admin</a>
                </Button>
              </div>
            )}

            <p className="text-xs text-muted-foreground">
              Questions? Email{" "}
              <a href="mailto:billing@adaptly.co.uk" className="text-brand hover:underline">
                billing@adaptly.co.uk
              </a>
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      {/* Past-due warning banner */}
      {showPastDueBanner && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-amber-800">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>
              Your subscription payment is overdue. Please update your payment details to avoid losing access.
            </span>
          </div>
          {isAdmin && (
            <Button
              size="sm"
              variant="outline"
              className="border-amber-400 text-amber-800 hover:bg-amber-100 ml-4 shrink-0"
              onClick={handleManageBilling}
              disabled={redirecting}
            >
              {redirecting ? "..." : "Update Payment"}
            </Button>
          )}
        </div>
      )}

      {/* Trial ending soon banner */}
      {trialEndingSoon && (
        <div className="bg-blue-50 border-b border-blue-200 px-4 py-2 flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-blue-800">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>
              Your free trial ends{" "}
              {billingStatus?.trialEndsAt
                ? new Date(billingStatus.trialEndsAt).toLocaleDateString("en-GB", { day: "numeric", month: "long" })
                : "soon"}
              . Subscribe to keep access.
            </span>
          </div>
          {isAdmin && (
            <Button
              size="sm"
              className="bg-brand hover:bg-brand/90 text-white ml-4 shrink-0"
              onClick={() => window.location.href = "/pricing"}
            >
              Subscribe Now
            </Button>
          )}
        </div>
      )}

      {children}
    </>
  );
}
