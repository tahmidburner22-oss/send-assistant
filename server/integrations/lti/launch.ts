/**
 * integrations/lti/launch.ts — FEAT-PC3 · Phase C
 * ──────────────────────────────────────────────────────────────────────────
 * LTI 1.3 launch handler. Validates the OIDC login initiation and the
 * id_token (resource link request) from the platform, maps the LTI user
 * to an Adaptly user/class via tenant-scoped lookup, then redirects to
 * the worksheet page.
 *
 * Flow (IMS Security Framework 1.0):
 *   1. Platform → GET/POST /lti/login (OIDC initiation)
 *   2. Adaptly → redirect to platform's auth endpoint with nonce
 *   3. Platform → POST /lti/launch with id_token JWT
 *   4. Adaptly → validate JWT signature, nonce, claims → redirect to app
 *
 * Deep linking (ContentItem / DeepLinkingRequest) is handled separately.
 */

import { jwtVerify, createRemoteJWKSet, type JWTPayload } from "jose";
import type { Request, Response } from "express";

// ─── Types ─────────────────────────────────────────────────────────────────

export interface LtiPlatformConfig {
  /** Platform issuer URL (e.g. "https://canvas.instructure.com"). */
  issuer: string;
  /** Client ID registered on the platform for Adaptly. */
  clientId: string;
  /** Platform's OIDC auth endpoint. */
  authEndpoint: string;
  /** Platform's JWKS URI for verifying id_tokens. */
  jwksUri: string;
  /** Platform's token endpoint (for AGS score posting). */
  tokenEndpoint?: string;
}

export interface LtiLaunchClaims extends JWTPayload {
  /** LTI message type. */
  "https://purl.imsglobal.org/spec/lti/claim/message_type"?: string;
  /** LTI version. */
  "https://purl.imsglobal.org/spec/lti/claim/version"?: string;
  /** Deployment ID. */
  "https://purl.imsglobal.org/spec/lti/claim/deployment_id"?: string;
  /** Target link URI. */
  "https://purl.imsglobal.org/spec/lti/claim/target_link_uri"?: string;
  /** Resource link. */
  "https://purl.imsglobal.org/spec/lti/claim/resource_link"?: {
    id: string;
    title?: string;
  };
  /** Context (course). */
  "https://purl.imsglobal.org/spec/lti/claim/context"?: {
    id: string;
    label?: string;
    title?: string;
  };
  /** Roles. */
  "https://purl.imsglobal.org/spec/lti/claim/roles"?: string[];
  /** Custom parameters. */
  "https://purl.imsglobal.org/spec/lti/claim/custom"?: Record<string, string>;
  /** Name claims. */
  name?: string;
  email?: string;
  given_name?: string;
  family_name?: string;
}

// ─── In-memory nonce store (production should use Redis/DB) ────────────────

const nonceStore = new Map<string, { expiresAt: number; state: string }>();
const NONCE_TTL_MS = 5 * 60 * 1000; // 5 minutes

function storeNonce(nonce: string, state: string): void {
  nonceStore.set(nonce, { expiresAt: Date.now() + NONCE_TTL_MS, state });
  // Lazy cleanup
  if (nonceStore.size > 1000) {
    const now = Date.now();
    for (const [k, v] of nonceStore) {
      if (v.expiresAt < now) nonceStore.delete(k);
    }
  }
}

function consumeNonce(nonce: string): boolean {
  const entry = nonceStore.get(nonce);
  if (!entry) return false;
  nonceStore.delete(nonce);
  return entry.expiresAt > Date.now();
}

// ─── Platform registry ─────────────────────────────────────────────────────

/**
 * Load platform configs from env. Format:
 *   LTI_PLATFORMS = JSON array of LtiPlatformConfig objects.
 *
 * In production, this would come from a DB lookup keyed on issuer+clientId.
 */
export function getPlatformConfigs(): LtiPlatformConfig[] {
  const raw = process.env.LTI_PLATFORMS;
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    console.error("[LTI] Failed to parse LTI_PLATFORMS env var");
    return [];
  }
}

function findPlatform(issuer: string, clientId?: string): LtiPlatformConfig | null {
  const configs = getPlatformConfigs();
  return (
    configs.find(
      (p) => p.issuer === issuer && (!clientId || p.clientId === clientId),
    ) || null
  );
}

// ─── OIDC Login Initiation ─────────────────────────────────────────────────

/**
 * Handle the OIDC login initiation request from the platform.
 * Redirects back to the platform's auth endpoint with a nonce.
 */
export function handleOidcLogin(req: Request, res: Response): void {
  const params = { ...req.query, ...req.body } as Record<string, string>;
  const issuer = params.iss;
  const loginHint = params.login_hint;
  const targetLinkUri = params.target_link_uri;
  const clientId = params.client_id;

  if (!issuer || !loginHint) {
    res.status(400).json({ error: "Missing iss or login_hint" });
    return;
  }

  const platform = findPlatform(issuer, clientId);
  if (!platform) {
    res.status(400).json({ error: "Unknown platform issuer" });
    return;
  }

  const nonce = generateId();
  const state = generateId();
  storeNonce(nonce, state);

  const authParams = new URLSearchParams({
    scope: "openid",
    response_type: "id_token",
    client_id: platform.clientId,
    redirect_uri: `${getBaseUrl(req)}/lti/launch`,
    login_hint: loginHint,
    state,
    nonce,
    response_mode: "form_post",
    prompt: "none",
  });

  if (params.lti_message_hint) {
    authParams.set("lti_message_hint", params.lti_message_hint);
  }

  res.redirect(`${platform.authEndpoint}?${authParams.toString()}`);
}

// ─── Resource Link Launch ──────────────────────────────────────────────────

/**
 * Handle the LTI 1.3 resource link launch (POST with id_token).
 * Validates the JWT, maps user, and redirects to the app.
 */
export async function handleLaunch(req: Request, res: Response): Promise<void> {
  const idToken = req.body?.id_token;
  const state = req.body?.state;

  if (!idToken) {
    res.status(400).json({ error: "Missing id_token" });
    return;
  }

  try {
    // Decode header to get issuer for JWKS lookup
    const [headerB64] = idToken.split(".");
    const header = JSON.parse(Buffer.from(headerB64, "base64url").toString());
    
    // Decode payload to get issuer (we need it to find platform config)
    const [, payloadB64] = idToken.split(".");
    const unverifiedPayload = JSON.parse(Buffer.from(payloadB64, "base64url").toString());
    const issuer = unverifiedPayload.iss;
    const aud = Array.isArray(unverifiedPayload.aud)
      ? unverifiedPayload.aud[0]
      : unverifiedPayload.aud;

    const platform = findPlatform(issuer, aud);
    if (!platform) {
      res.status(403).json({ error: "Unknown platform" });
      return;
    }

    // Verify JWT against platform's JWKS
    const jwks = createRemoteJWKSet(new URL(platform.jwksUri));
    const { payload } = await jwtVerify(idToken, jwks, {
      issuer: platform.issuer,
      audience: platform.clientId,
    });

    const claims = payload as LtiLaunchClaims;

    // Validate nonce
    const nonce = claims.nonce as string | undefined;
    if (!nonce || !consumeNonce(nonce)) {
      res.status(403).json({ error: "Invalid or expired nonce" });
      return;
    }

    // Validate message type
    const messageType =
      claims["https://purl.imsglobal.org/spec/lti/claim/message_type"];
    if (
      messageType !== "LtiResourceLinkRequest" &&
      messageType !== "LtiDeepLinkingRequest"
    ) {
      res.status(400).json({ error: `Unsupported message type: ${messageType}` });
      return;
    }

    // Extract user info
    const ltiUserId = claims.sub || "";
    const context =
      claims["https://purl.imsglobal.org/spec/lti/claim/context"];
    const roles =
      claims["https://purl.imsglobal.org/spec/lti/claim/roles"] || [];
    const resourceLink =
      claims["https://purl.imsglobal.org/spec/lti/claim/resource_link"];

    // Build redirect URL with LTI context as query params
    // In production this would create/find an Adaptly session
    const redirectParams = new URLSearchParams({
      lti: "1",
      lti_user: ltiUserId,
      lti_context: context?.id || "",
      lti_resource: resourceLink?.id || "",
      lti_role: roles.some((r) => r.includes("Instructor"))
        ? "teacher"
        : "student",
    });

    if (claims.name) redirectParams.set("name", claims.name);
    if (claims.email) redirectParams.set("email", claims.email);

    // Deep linking response goes to a different handler
    if (messageType === "LtiDeepLinkingRequest") {
      res.redirect(`/lti/deeplink?${redirectParams.toString()}`);
      return;
    }

    // Resource link → redirect to the app
    const targetUri =
      claims["https://purl.imsglobal.org/spec/lti/claim/target_link_uri"] ||
      "/";
    res.redirect(`${targetUri}?${redirectParams.toString()}`);
  } catch (err) {
    console.error("[LTI] Launch validation failed:", err);
    res.status(403).json({ error: "Token validation failed" });
  }
}

// ─── Helpers ───────────────────────────────────────────────────────────────

function generateId(): string {
  const bytes = new Uint8Array(24);
  // Use Node.js crypto
  require("crypto").randomFillSync(bytes);
  return Buffer.from(bytes).toString("base64url");
}

function getBaseUrl(req: Request): string {
  const proto = req.headers["x-forwarded-proto"] || req.protocol || "https";
  const host = req.headers.host || "adaptly.co.uk";
  return `${proto}://${host}`;
}
