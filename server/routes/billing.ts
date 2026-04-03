/**
 * Billing Routes — Stripe Integration
 * Handles subscription checkout, customer portal, and webhook events.
 *
 * Environment variables required:
 *   STRIPE_SECRET_KEY       — Stripe secret key (sk_live_... or sk_test_...)
 *   STRIPE_WEBHOOK_SECRET   — Stripe webhook signing secret (whsec_...)
 *   STRIPE_PRICE_STARTER_M  — Stripe Price ID for Starter monthly
 *   STRIPE_PRICE_STARTER_Y  — Stripe Price ID for Starter annual
 *   STRIPE_PRICE_PRO_M      — Stripe Price ID for Professional monthly
 *   STRIPE_PRICE_PRO_Y      — Stripe Price ID for Professional annual
 *   STRIPE_PRICE_PREMIUM_M  — Stripe Price ID for Premium monthly
 *   STRIPE_PRICE_PREMIUM_Y  — Stripe Price ID for Premium annual
 *   CLIENT_URL              — Frontend URL e.g. https://adaptly.co.uk
 */
import { Router, Request, Response } from "express";
import Stripe from "stripe";
import { db } from "../db/index.js";
import { requireAuth } from "../middleware/auth.js";
import { v4 as uuidv4 } from "uuid";

const router = Router();

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || "";
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || "";
const CLIENT_URL = process.env.CLIENT_URL || "https://adaptly.co.uk";

// Only initialise Stripe if key is present
const stripe = STRIPE_SECRET_KEY
  ? new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2026-02-25.clover" })
  : null;

// ── Plan → Price ID mapping ───────────────────────────────────────────────────
function getPriceId(plan: string, billing: "monthly" | "annual"): string | null {
  const map: Record<string, Record<string, string>> = {
    starter: {
      monthly: process.env.STRIPE_PRICE_STARTER_M || "",
      annual: process.env.STRIPE_PRICE_STARTER_Y || "",
    },
    professional: {
      monthly: process.env.STRIPE_PRICE_PRO_M || "",
      annual: process.env.STRIPE_PRICE_PRO_Y || "",
    },
    premium: {
      monthly: process.env.STRIPE_PRICE_PREMIUM_M || "",
      annual: process.env.STRIPE_PRICE_PREMIUM_Y || "",
    },
  };
  return map[plan]?.[billing] || null;
}

// ── Helper: get or create Stripe customer for a school ───────────────────────
async function getOrCreateStripeCustomer(school: any, adminEmail: string): Promise<string> {
  if (!stripe) throw new Error("Stripe not configured");
  if (school.stripe_customer_id) return school.stripe_customer_id;

  const customer = await stripe.customers.create({
    email: adminEmail,
    name: school.name,
    metadata: { school_id: school.id, school_name: school.name },
  });

  await db.prepare("UPDATE schools SET stripe_customer_id = ? WHERE id = ?").run(
    customer.id,
    school.id
  );
  return customer.id;
}

// ── GET /api/billing/status — current subscription status ────────────────────
router.get("/status", requireAuth, async (req: Request, res: Response) => {
  const user = req.user!;

  // Platform owner always has full premium access — no billing checks
  const PLATFORM_OWNER_EMAILS = ["admin@adaptly.co.uk", "admin@sendassistant.app"];
  if (PLATFORM_OWNER_EMAILS.includes(user.email || "")) {
    return res.json({
      status: "active",
      plan: "premium",
      licenceType: "premium",
      trialEndsAt: null,
      periodEnd: null,
      cancelAtPeriodEnd: false,
      isAccessible: true,
      stripeConfigured: !!stripe,
      isPlatformOwner: true,
    });
  }

  if (!user.schoolId) return res.json({ status: "no_school", plan: null });

  const school = await db.prepare("SELECT * FROM schools WHERE id = ?").get(user.schoolId) as any;
  if (!school) return res.json({ status: "no_school", plan: null });

  const now = new Date().toISOString();
  const trialActive =
    school.licence_type === "trial" &&
    school.trial_ends_at &&
    school.trial_ends_at > now;

  const subscriptionActive =
    school.subscription_status === "active" ||
    school.subscription_status === "trialing";

  const isAccessible = trialActive || subscriptionActive;

  res.json({
    status: school.subscription_status || "trialing",
    plan: school.subscription_plan || school.licence_type,
    licenceType: school.licence_type,
    trialEndsAt: school.trial_ends_at,
    periodEnd: school.subscription_period_end,
    cancelAtPeriodEnd: !!school.subscription_cancel_at_period_end,
    isAccessible,
    stripeConfigured: !!stripe,
  });
});

// ── POST /api/billing/checkout — create Stripe Checkout session ───────────────
router.post("/checkout", requireAuth, async (req: Request, res: Response) => {
  if (!stripe) {
    return res.status(503).json({ error: "Payment processing is not yet configured. Please contact support." });
  }

  const user = req.user!;
  if (!user.schoolId) return res.status(400).json({ error: "No school associated with this account" });
  if (!["school_admin", "mat_admin"].includes(user.role)) {
    return res.status(403).json({ error: "Only school admins can manage billing" });
  }

  const { plan, billing = "monthly" } = req.body;
  if (!["starter", "professional", "premium"].includes(plan)) {
    return res.status(400).json({ error: "Invalid plan. Choose: starter, professional, or premium" });
  }
  if (!["monthly", "annual"].includes(billing)) {
    return res.status(400).json({ error: "Invalid billing period. Choose: monthly or annual" });
  }

  const priceId = getPriceId(plan, billing as "monthly" | "annual");
  if (!priceId) {
    return res.status(503).json({ error: "This plan is not yet available for online purchase. Please contact sales@adaptly.co.uk" });
  }

  try {
    const school = await db.prepare("SELECT * FROM schools WHERE id = ?").get(user.schoolId) as any;
    const customerId = await getOrCreateStripeCustomer(school, user.email);

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: "subscription",
      success_url: `${CLIENT_URL}/settings?billing=success`,
      cancel_url: `${CLIENT_URL}/settings?billing=cancelled`,
      metadata: {
        school_id: user.schoolId,
        plan,
        billing,
      },
      subscription_data: {
        metadata: { school_id: user.schoolId, plan },
        trial_period_days: school.licence_type === "trial" ? 0 : undefined,
      },
      allow_promotion_codes: true,
      billing_address_collection: "required",
      customer_update: { address: "auto" },
    });

    res.json({ url: session.url });
  } catch (err: any) {
    console.error("Stripe checkout error:", err);
    res.status(500).json({ error: "Failed to create checkout session" });
  }
});

// ── POST /api/billing/portal — create Stripe Customer Portal session ──────────
router.post("/portal", requireAuth, async (req: Request, res: Response) => {
  if (!stripe) {
    return res.status(503).json({ error: "Payment processing is not yet configured." });
  }

  const user = req.user!;
  if (!user.schoolId) return res.status(400).json({ error: "No school associated" });
  if (!["school_admin", "mat_admin"].includes(user.role)) {
    return res.status(403).json({ error: "Only school admins can manage billing" });
  }

  const school = await db.prepare("SELECT * FROM schools WHERE id = ?").get(user.schoolId) as any;
  if (!school?.stripe_customer_id) {
    return res.status(400).json({ error: "No billing account found. Please subscribe first." });
  }

  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: school.stripe_customer_id,
      return_url: `${CLIENT_URL}/settings`,
    });
    res.json({ url: session.url });
  } catch (err: any) {
    console.error("Stripe portal error:", err);
    res.status(500).json({ error: "Failed to open billing portal" });
  }
});

// ── POST /api/billing/webhook — Stripe webhook handler ───────────────────────
// IMPORTANT: This route must receive the raw body (not parsed JSON).
// Register this BEFORE express.json() middleware in server/index.ts
router.post(
  "/webhook",
  // Raw body middleware — must be applied before express.json() in the main app
  async (req: Request, res: Response) => {
    if (!stripe || !STRIPE_WEBHOOK_SECRET) {
      return res.status(200).json({ received: true }); // silently accept if not configured
    }

    const sig = req.headers["stripe-signature"] as string;
    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(
        (req as any).rawBody || req.body,
        sig,
        STRIPE_WEBHOOK_SECRET
      );
    } catch (err: any) {
      console.error("Stripe webhook signature verification failed:", err.message);
      return res.status(400).json({ error: `Webhook error: ${err.message}` });
    }

    handleWebhookEvent(event).catch(err =>
      console.error("Webhook handler error:", err)
    );

    res.json({ received: true });
  }
);

async function handleWebhookEvent(event: Stripe.Event) {
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const schoolId = session.metadata?.school_id;
      const plan = session.metadata?.plan;
      if (!schoolId || !plan) break;

      await db.prepare(`UPDATE schools SET
        subscription_status = 'active',
        subscription_plan = ?,
        licence_type = ?,
        stripe_customer_id = COALESCE(stripe_customer_id, ?),
        subscription_cancel_at_period_end = 0
        WHERE id = ?`).run(plan, plan, session.customer as string, schoolId);

      console.log(`[Billing] Checkout completed: school=${schoolId} plan=${plan}`);
      break;
    }

    case "customer.subscription.updated": {
      const sub = event.data.object as Stripe.Subscription;
      const schoolId = sub.metadata?.school_id;
      if (!schoolId) break;

      const plan = sub.metadata?.plan || (sub.items.data[0]?.price?.metadata?.plan ?? null);
      const periodEnd = (sub as any).current_period_end
        ? new Date((sub as any).current_period_end * 1000).toISOString()
        : null;

      await db.prepare(`UPDATE schools SET
        subscription_status = ?,
        subscription_plan = COALESCE(?, subscription_plan),
        subscription_period_end = ?,
        subscription_cancel_at_period_end = ?,
        licence_type = CASE WHEN ? = 'active' THEN COALESCE(?, licence_type) ELSE licence_type END
        WHERE id = ?`).run(
        sub.status,
        plan,
        periodEnd,
        sub.cancel_at_period_end ? 1 : 0,
        sub.status,
        plan,
        schoolId
      );

      console.log(`[Billing] Subscription updated: school=${schoolId} status=${sub.status}`);
      break;
    }

    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      const schoolId = sub.metadata?.school_id;
      if (!schoolId) break;

      await db.prepare(`UPDATE schools SET
        subscription_status = 'canceled',
        subscription_cancel_at_period_end = 0
        WHERE id = ?`).run(schoolId);

      console.log(`[Billing] Subscription cancelled: school=${schoolId}`);
      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      const customerId = invoice.customer as string;
      if (!customerId) break;

      const school = await db.prepare("SELECT id FROM schools WHERE stripe_customer_id = ?").get(customerId) as any;
      if (!school) break;

      await db.prepare("UPDATE schools SET subscription_status = 'past_due' WHERE id = ?").run(school.id);
      console.log(`[Billing] Payment failed: school=${school.id}`);
      break;
    }

    case "invoice.payment_succeeded": {
      const invoice = event.data.object as Stripe.Invoice;
      const customerId = invoice.customer as string;
      if (!customerId) break;

      const school = await db.prepare("SELECT id FROM schools WHERE stripe_customer_id = ?").get(customerId) as any;
      if (!school) break;

      await db.prepare("UPDATE schools SET subscription_status = 'active' WHERE id = ?").run(school.id);
      console.log(`[Billing] Payment succeeded: school=${school.id}`);
      break;
    }

    default:
      // Unhandled event type — ignore
      break;
  }
}

export default router;
