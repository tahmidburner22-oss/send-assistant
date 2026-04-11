# Code Review Suggestions (April 2026)

These are high-impact improvements identified from a quick pass through core server/auth code.

## 1) Tighten CORS origin matching
- `origin.startsWith(o.trim())` can accept malicious lookalike origins (e.g. `https://trusted.com.evil.tld`).
- Prefer exact origin equality or parsed host allowlists.
- Suggested approach: parse with `new URL(origin)` and compare normalized `origin`/`hostname` against explicit values.

## 2) Avoid over-broad request body sanitization
- Global sanitization strips all HTML tags from every string in `req.body`.
- This can unintentionally alter valid teacher content (math symbols, pseudo-markup, pasted HTML snippets).
- Prefer context-aware validation per endpoint using schemas (e.g. Zod), and encode on render.

## 3) Move account lockout state out of process memory
- `failedLoginAttempts` and `lockoutUntil` are in-memory maps.
- In multi-instance deployments, lockout becomes inconsistent and resets on restart.
- Store lockout counters and expiry in shared DB/Redis for reliable brute-force protection.

## 4) Improve SQL placeholder translation safety
- Query translation currently replaces every `?` token via regex.
- This can be risky if `?` appears in SQL string literals/comments.
- Prefer native parameterized SQL at call sites or a parser-aware translator.

## 5) Remove dead/comment-mismatch guidance in DB layer
- The DB module includes long comments describing sync-over-async/proxy behavior, but implementation is async methods.
- Align comments to actual behavior to reduce maintenance confusion for new contributors.

## 6) Add targeted tests around security middleware
- There are existing server tests, but security-critical behavior would benefit from dedicated coverage:
  - CORS allow/deny edge cases.
  - Sanitization behavior for safe educational content.
  - Auth lockout behavior across repeated failed logins.

## 7) Introduce structured logging with request IDs
- Current logs are mostly plain `console.log/error`.
- Adopt structured logging (JSON) with request ID, route, user/school context and latency to improve incident debugging.

## 8) Revisit CSP `unsafe-inline`
- CSP currently allows `'unsafe-inline'` for scripts/styles.
- Consider migrating to nonces/hashes incrementally to reduce XSS risk while preserving functionality.

---

## Files reviewed
- `server/index.ts`
- `server/routes/auth.ts`
- `server/db/index.ts`
- `package.json`
