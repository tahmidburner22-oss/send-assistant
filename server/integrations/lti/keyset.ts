/**
 * integrations/lti/keyset.ts — FEAT-PC3 · Phase C
 * ──────────────────────────────────────────────────────────────────────────
 * JWKS endpoint for LTI 1.3. Exposes the platform's public key so tool
 * consumers (Canvas, Moodle, itslearning) can verify Adaptly-issued JWTs.
 *
 * The RSA key pair is loaded from env vars:
 *   LTI_PRIVATE_KEY_PEM  — PKCS#8 PEM (NEVER committed)
 *   LTI_PUBLIC_KEY_PEM   — SPKI PEM (served via JWKS)
 *   LTI_KEY_ID           — stable kid for key rotation
 *
 * If the env vars are absent, the module exports a no-op handler that
 * returns 503 so the app still boots without LTI configured.
 */

import { importSPKI, exportJWK, type JWK } from "jose";

let cachedJwks: { keys: JWK[] } | null = null;

/**
 * Build (and cache) the JWKS document from the configured public key.
 * Returns null when LTI is not configured.
 */
export async function getJwks(): Promise<{ keys: JWK[] } | null> {
  if (cachedJwks) return cachedJwks;

  const publicPem = process.env.LTI_PUBLIC_KEY_PEM;
  const kid = process.env.LTI_KEY_ID || "adaptly-lti-1";

  if (!publicPem) return null;

  try {
    const key = await importSPKI(publicPem.replace(/\\n/g, "\n"), "RS256");
    const jwk = await exportJWK(key);
    jwk.kid = kid;
    jwk.alg = "RS256";
    jwk.use = "sig";
    cachedJwks = { keys: [jwk] };
    return cachedJwks;
  } catch (err) {
    console.error("[LTI] Failed to build JWKS from LTI_PUBLIC_KEY_PEM:", err);
    return null;
  }
}

/**
 * Invalidate cache — useful for tests or hot-reload of keys.
 */
export function clearJwksCache(): void {
  cachedJwks = null;
}
