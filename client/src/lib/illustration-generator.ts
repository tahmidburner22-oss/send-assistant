/**
 * illustration-generator.ts
 *
 * Client helper for the free, safety-gated story-illustration endpoint
 * (server /api/generation-proxy, Cloudflare Workers AI FLUX). This is Tier 4
 * of the visual engine — used ONLY for unique scenes (e.g. a child's storybook
 * page) where vector diagrams, the curated bank, ARASAAC symbols and stock
 * search have nothing suitable.
 *
 * Teacher-initiated by design: callers live in teacher-facing tools (e.g. the
 * Reading & Story Studio). The server applies the safeguarding filter and a
 * fixed child-safe style; this helper just degrades gracefully (returns null)
 * so the caller can fall back to a lower visual tier or text-only.
 *
 * Pure TS — no React. Safe to import anywhere.
 */

export interface GeneratedIllustration {
  /** data: URL (base64) ready to drop into an <img src> / PDF / e-book page. */
  dataUrl: string;
  cached: boolean;
  attribution: string;
}

let _enabled: boolean | null = null;

/**
 * Whether the (optional) generation feature is configured on the server.
 * Cached for the session. Returns false on any error so callers hide the
 * control rather than showing a broken button.
 */
export async function isIllustrationGenerationEnabled(): Promise<boolean> {
  if (_enabled !== null) return _enabled;
  try {
    const res = await fetch("/api/generation-proxy/status", { credentials: "include" });
    if (!res.ok) {
      _enabled = false;
      return false;
    }
    const json = (await res.json()) as { enabled?: boolean };
    _enabled = json?.enabled === true;
    return _enabled;
  } catch {
    _enabled = false;
    return false;
  }
}

export type IllustrationStyle = "storybook" | "cartoon" | "calm" | "line";

/**
 * Generate one unique story illustration. Returns null if the feature is
 * disabled, the prompt was rejected by the safety gate, or generation failed —
 * callers should fall back to a lower visual tier (vector / stock / symbol) or
 * text only. Never throws.
 */
export async function generateIllustration(
  prompt: string,
  opts: { style?: IllustrationStyle } = {},
): Promise<GeneratedIllustration | null> {
  const p = prompt.trim();
  if (!p) return null;
  try {
    const res = await fetch("/api/generation-proxy/illustrate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ prompt: p, style: opts.style || "storybook" }),
    });
    if (!res.ok) {
      if (res.status === 503) _enabled = false; // feature not configured
      return null;
    }
    const json = (await res.json()) as Partial<GeneratedIllustration>;
    if (typeof json.dataUrl !== "string") return null;
    return {
      dataUrl: json.dataUrl,
      cached: json.cached === true,
      attribution: typeof json.attribution === "string" ? json.attribution : "",
    };
  } catch {
    return null;
  }
}
