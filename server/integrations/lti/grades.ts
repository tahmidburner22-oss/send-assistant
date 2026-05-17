/**
 * integrations/lti/grades.ts — FEAT-PC3 · Phase C
 * ──────────────────────────────────────────────────────────────────────────
 * LTI Advantage Assignment & Grade Services 2.0 (AGS).
 *
 * Posts scores back to the platform after a student completes a worksheet
 * or quiz via an LTI-launched session.
 *
 * Flow:
 *   1. Adaptly → POST platform.tokenEndpoint (client_credentials grant)
 *   2. Adaptly → POST lineitem scores endpoint with the grade
 *
 * Requires:
 *   - LTI_PRIVATE_KEY_PEM in env (for signing client assertion JWT)
 *   - Platform's token endpoint and lineitem URL from the launch claims
 */

import { SignJWT, importPKCS8 } from "jose";

// ─── Types ─────────────────────────────────────────────────────────────────

export interface AgsScorePayload {
  /** The LTI user ID (sub claim from launch). */
  userId: string;
  /** Score given (0–1 scale, where 1 = 100%). */
  scoreGiven: number;
  /** Maximum possible score. */
  scoreMaximum: number;
  /** Activity progress. */
  activityProgress: "Initialized" | "Started" | "InProgress" | "Submitted" | "Completed";
  /** Grading progress. */
  gradingProgress: "FullyGraded" | "Pending" | "PendingManual" | "Failed" | "NotReady";
  /** Optional comment. */
  comment?: string;
  /** ISO timestamp. */
  timestamp?: string;
}

export interface AgsConfig {
  /** Platform's token endpoint. */
  tokenEndpoint: string;
  /** The lineitem URL from the AGS claim in the launch. */
  lineitemUrl: string;
  /** Platform issuer. */
  issuer: string;
  /** Client ID. */
  clientId: string;
}

// ─── Score posting ─────────────────────────────────────────────────────────

/**
 * Post a score to the platform via AGS 2.0.
 * Returns true on success, throws on failure.
 */
export async function postScore(
  config: AgsConfig,
  score: AgsScorePayload,
): Promise<boolean> {
  // Step 1: Get an access token via client_credentials + private_key_jwt
  const accessToken = await getAccessToken(config);

  // Step 2: POST score to the lineitem's scores endpoint
  const scoresUrl = config.lineitemUrl.endsWith("/scores")
    ? config.lineitemUrl
    : `${config.lineitemUrl}/scores`;

  const body = {
    userId: score.userId,
    scoreGiven: score.scoreGiven,
    scoreMaximum: score.scoreMaximum,
    activityProgress: score.activityProgress,
    gradingProgress: score.gradingProgress,
    comment: score.comment || "",
    timestamp: score.timestamp || new Date().toISOString(),
  };

  const response = await fetch(scoresUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/vnd.ims.lis.v1.score+json",
      Accept: "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(
      `[LTI AGS] Score post failed (${response.status}): ${text.slice(0, 200)}`,
    );
  }

  return true;
}

// ─── Access token via client_credentials ───────────────────────────────────

async function getAccessToken(config: AgsConfig): Promise<string> {
  const privatePem = process.env.LTI_PRIVATE_KEY_PEM;
  const kid = process.env.LTI_KEY_ID || "adaptly-lti-1";

  if (!privatePem) {
    throw new Error("[LTI AGS] LTI_PRIVATE_KEY_PEM not configured");
  }

  const privateKey = await importPKCS8(
    privatePem.replace(/\\n/g, "\n"),
    "RS256",
  );

  // Build client assertion JWT
  const assertion = await new SignJWT({})
    .setProtectedHeader({ alg: "RS256", kid, typ: "JWT" })
    .setIssuer(config.clientId)
    .setSubject(config.clientId)
    .setAudience(config.tokenEndpoint)
    .setIssuedAt()
    .setExpirationTime("5m")
    .setJti(crypto.randomUUID())
    .sign(privateKey);

  // Exchange for access token
  const tokenBody = new URLSearchParams({
    grant_type: "client_credentials",
    client_assertion_type:
      "urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
    client_assertion: assertion,
    scope: "https://purl.imsglobal.org/spec/lti-ags/scope/score",
  });

  const tokenResponse = await fetch(config.tokenEndpoint, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: tokenBody.toString(),
  });

  if (!tokenResponse.ok) {
    const text = await tokenResponse.text().catch(() => "");
    throw new Error(
      `[LTI AGS] Token request failed (${tokenResponse.status}): ${text.slice(0, 200)}`,
    );
  }

  const data = (await tokenResponse.json()) as { access_token?: string };
  if (!data.access_token) {
    throw new Error("[LTI AGS] No access_token in token response");
  }

  return data.access_token;
}
