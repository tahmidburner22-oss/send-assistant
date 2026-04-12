import "dotenv/config";
// ── Crypto polyfill for msedge-tts (needs globalThis.crypto.subtle and crypto.getRandomValues) ──
// Railway may run Node.js < 19 where globalThis.crypto is not available as a global
import { webcrypto } from "crypto";
if (typeof (globalThis as any).crypto === "undefined") {
  (globalThis as any).crypto = webcrypto;
}

// ── Browser API polyfills for pdf-parse v2 (pdfjs-dist needs DOMMatrix/ImageData/Path2D) ──
// Railway's Node.js environment doesn't provide these browser globals
if (typeof (globalThis as any).DOMMatrix === "undefined") {
  (globalThis as any).DOMMatrix = class DOMMatrix {
    a = 1; b = 0; c = 0; d = 1; e = 0; f = 0;
    m11 = 1; m12 = 0; m13 = 0; m14 = 0;
    m21 = 0; m22 = 1; m23 = 0; m24 = 0;
    m31 = 0; m32 = 0; m33 = 1; m34 = 0;
    m41 = 0; m42 = 0; m43 = 0; m44 = 1;
    is2D = true; isIdentity = true;
    constructor(init?: number[] | string) {
      if (Array.isArray(init) && init.length >= 6) {
        [this.a, this.b, this.c, this.d, this.e, this.f] = init as number[];
        this.m11 = this.a; this.m12 = this.b; this.m21 = this.c;
        this.m22 = this.d; this.m41 = this.e; this.m42 = this.f;
        this.isIdentity = (this.a===1 && this.b===0 && this.c===0 && this.d===1 && this.e===0 && this.f===0);
      }
    }
    multiply(_o: any) { return new (globalThis as any).DOMMatrix(); }
    translate(tx = 0, ty = 0) { return new (globalThis as any).DOMMatrix([this.a,this.b,this.c,this.d,this.e+tx,this.f+ty]); }
    scale(sx = 1, sy?: number) { return new (globalThis as any).DOMMatrix([this.a*sx,this.b,this.c,this.d*(sy??sx),this.e,this.f]); }
    inverse() { return new (globalThis as any).DOMMatrix(); }
    transformPoint(p: {x:number;y:number}) { return {x:p.x*this.a+p.y*this.c+this.e, y:p.x*this.b+p.y*this.d+this.f, z:0, w:1}; }
    toJSON() { return {a:this.a,b:this.b,c:this.c,d:this.d,e:this.e,f:this.f}; }
  };
}
if (typeof (globalThis as any).ImageData === "undefined") {
  (globalThis as any).ImageData = class ImageData {
    data: Uint8ClampedArray; width: number; height: number; colorSpace = "srgb";
    constructor(dataOrWidth: Uint8ClampedArray | number, width: number, height?: number) {
      if (typeof dataOrWidth === "number") {
        this.width = dataOrWidth; this.height = width;
        this.data = new Uint8ClampedArray(dataOrWidth * width * 4);
      } else {
        this.data = dataOrWidth; this.width = width;
        this.height = height ?? (dataOrWidth.length / (width * 4));
      }
    }
  };
}
if (typeof (globalThis as any).Path2D === "undefined") {
  (globalThis as any).Path2D = class Path2D {
    constructor(_p?: any) {}
    addPath(_p: any, _t?: any) {} closePath() {} moveTo(_x: number, _y: number) {}
    lineTo(_x: number, _y: number) {} bezierCurveTo(_a:number,_b:number,_c:number,_d:number,_e:number,_f:number) {}
    quadraticCurveTo(_a:number,_b:number,_c:number,_d:number) {}
    arc(_x:number,_y:number,_r:number,_s:number,_e:number,_ac?:boolean) {}
    arcTo(_a:number,_b:number,_c:number,_d:number,_r:number) {}
    ellipse(_x:number,_y:number,_rx:number,_ry:number,_rot:number,_s:number,_e:number,_ac?:boolean) {}
    rect(_x:number,_y:number,_w:number,_h:number) {}
  };
}
import express from "express";
import compression from "compression";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

// Import routes
import authRouter from "./routes/auth.js";
import schoolsRouter from "./routes/schools.js";
import pupilsRouter from "./routes/pupils.js";
import aiRouter from "./routes/ai.js";
import dataRouter from "./routes/data.js";
import adminRouter from "./routes/admin.js";
import gdprRouter from "./routes/gdpr.js";
import revisionRouter from "./routes/revision.js";
import schoolApiKeysRouter from "./routes/schoolApiKeys.js";
import billingRouter from "./routes/billing.js";
import misRouter from "./routes/mis.js";
import briefingRouter from "./routes/briefing.js";
import quizRouter from "./routes/quiz.js";
import superadminRouter from "./routes/superadmin.js";
import diagramProxyRouter from "./routes/diagram-proxy.js";
import feedbackRouter from "./routes/feedback.js";
import parentMessagesRouter from "./routes/parentMessages.js";
import worksheetLibraryRouter from "./routes/worksheetLibrary.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = parseInt(process.env.PORT || "3001");
const isDev = process.env.NODE_ENV !== "production";

// ── Trust Railway's proxy ─────────────────────────────────────────────────────
app.set("trust proxy", 1);

// ── www → non-www redirect ────────────────────────────────────────────────────
app.use((req, res, next) => {
  const host = req.headers.host || "";
  if (host.startsWith("www.")) {
    const proto = req.headers["x-forwarded-proto"] || "https";
    return res.redirect(301, `${proto}://${host.slice(4)}${req.originalUrl}`);
  }
  next();
});

// ── Security headers (Helmet) ─────────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "accounts.google.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "fonts.googleapis.com"],
      fontSrc: ["'self'", "fonts.gstatic.com", "data:"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: [
        "'self'",
        "https://api.groq.com",
        "https://generativelanguage.googleapis.com",
        "https://api.openai.com",
        "https://openrouter.ai",
        "https://api.anthropic.com",
        "https://router.huggingface.co",
        "https://api.cerebras.ai",
        "https://api.sambanova.ai",
        "https://api.deepseek.com",
        "https://api.cohere.com",
        "https://api.mistral.ai",
        "https://accounts.google.com",
        "wss://adaptly.co.uk",
      ],
      frameSrc: ["accounts.google.com"],
      // Allow blob: URLs for neural voice audio playback
      mediaSrc: ["'self'", "blob:"],
      // Allow blob: URLs for Web Workers (audio processing)
      workerSrc: ["'self'", "blob:"],
      // GDPR: prevent embedding in iframes from other origins
      frameAncestors: ["'self'"],
    },
  },
  crossOriginEmbedderPolicy: false,
  // Enforce HTTPS for 1 year (HSTS)
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
  // Prevent MIME sniffing
  noSniff: true,
  // Prevent clickjacking
  frameguard: { action: "sameorigin" },
  // Disable X-Powered-By
  hidePoweredBy: true,
  // Referrer policy — don't leak URL to third parties
  referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  // Permissions policy — restrict dangerous browser APIs
  permittedCrossDomainPolicies: { permittedPolicies: "none" },
}));

// ── Additional security headers ───────────────────────────────────────────────
app.use((_req, res, next) => {
  // Permissions-Policy: disable camera, microphone, geolocation, payment
  res.setHeader(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()"
  );
  // Cache control for API responses — never cache sensitive data
  if (_req.path.startsWith("/api")) {
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, private");
    res.setHeader("Pragma", "no-cache");
  }
  next();
});

// ── Compression — gzip/brotli for all responses (especially large JS chunks) ─
app.use(compression({
  level: 6, // balanced speed vs compression ratio
  threshold: 1024, // only compress responses > 1KB
  filter: (req, res) => {
    if (req.headers['x-no-compression']) return false;
    return compression.filter(req, res);
  },
}));

// ── CORS ──────────────────────────────────────────────────────────────────────────────────────
// Exact-match origins only — startsWith() would allow subdomain spoofing (e.g. adaptly.co.uk.evil.com)
const allowedOrigins: Set<string> = new Set(
  (process.env.ALLOWED_ORIGINS || "https://adaptly.co.uk")
    .split(",")
    .map(o => o.trim())
    .filter(Boolean)
);
app.use(cors({
  origin: (origin, cb) => {
    // Server-to-server or same-origin request (no Origin header) — allow
    if (origin === undefined) return cb(null, true);
    // Explicit null origin — reject (sandboxed iframe / data: URI attack vector)
    if (!origin || origin === "null") return cb(new Error("Null origin not allowed"));
    // Exact match only
    if (allowedOrigins.has(origin)) return cb(null, true);
    cb(new Error("Not allowed by CORS"));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization"],
  exposedHeaders: ["RateLimit-Limit", "RateLimit-Remaining"],
}));

// ── Rate limiting ──────────────────────────────────────────────────────────────────────────────────────
// Strict limiter for auth endpoints (brute-force protection)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 failed attempts per IP per 15 min — combined with per-account lockout in auth.ts
  message: { error: "Too many login attempts from this IP. Please try again in 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },
  skipSuccessfulRequests: true, // only count failed attempts
  // Skip session check and token refresh — these are not login attempts
  skip: (req: any) => {
    const p = req.path || '';
    return p === '/me' || p === '/refresh' || p.endsWith('/me') || p.endsWith('/refresh');
  },
});

// AI endpoints — expensive, limit tightly
const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60, // increased from 30 to reduce false positives during normal use
  message: { error: "Too many AI requests. Please slow down." },
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },
});

// General API limiter
const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 1000, // 1000 req/min per IP — prevents abuse while allowing normal usage
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },
  // Skip rate limiting for session check and auth endpoints — called on every page load
  skip: (req: any) => {
    const p = req.originalUrl || req.path;
    return p.startsWith('/api/auth/');
  },
});

// JWT_SECRET and ENCRYPTION_KEY are configured via Railway environment variables

// ── Issue 4: Expired session + password reset cleanup (runs hourly) ───────────
import db from "./db/index.js";
setInterval(async () => {
  try {
    const deletedSessions = await db.prepare("DELETE FROM sessions WHERE expires_at < NOW()").run();
    const deletedResets   = await db.prepare("DELETE FROM password_resets WHERE expires_at < NOW() OR used = 1").run();
    if (deletedSessions.changes > 0 || deletedResets.changes > 0) {
      console.log(`[Cleanup] Removed ${deletedSessions.changes} expired sessions, ${deletedResets.changes} used/expired password resets`);
    }
  } catch (e) {
    console.error("[Cleanup] Session cleanup error:", e);
  }
}, 60 * 60 * 1000); // every hour

// ── Body parsing — tight limits to prevent DoS ────────────────────────────────
// Stripe webhook needs raw body — capture it before JSON parsing
app.use("/api/billing/webhook", express.raw({ type: "application/json" }), (req: any, _res: any, next: any) => {
  req.rawBody = req.body;
  next();
});
app.use(express.json({ limit: "5mb" })); // increased to 5mb to handle large AI-generated worksheets with SVG
app.use(express.urlencoded({ extended: true, limit: "5mb" }));
app.use(cookieParser());
app.use(generalLimiter);

// ── Input sanitisation middleware ─────────────────────────────────────────────
// Strip dangerous HTML/script tags from all string fields in request body
function sanitiseString(val: string): string {
  return val
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/<[^>]+>/g, "")
    .replace(/javascript:/gi, "")
    // Only strip HTML event handler attributes (e.g. onclick="..."), not plain text like "Protons = 11"
    .replace(/\s+on\w+\s*=\s*["']/gi, " ")
    .trim();
}
function sanitiseBody(obj: any): any {
  if (typeof obj === "string") return sanitiseString(obj);
  if (Array.isArray(obj)) return obj.map(sanitiseBody);
  if (obj && typeof obj === "object") {
    const clean: any = {};
    for (const [k, v] of Object.entries(obj)) {
      clean[k] = sanitiseBody(v);
    }
    return clean;
  }
  return obj;
}
app.use((req, _res, next) => {
  if (req.body && typeof req.body === "object") {
    req.body = sanitiseBody(req.body);
  }
  next();
});

// ── API Routes ────────────────────────────────────────────────────────────────
// Issue 9: Dedicated rate limit for forgot-password (3 per hour per IP)
const forgotPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  message: { error: "Too many password reset requests. Please try again in 1 hour." },
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },
});
app.use("/api/auth/forgot-password", forgotPasswordLimiter);
app.use("/api/auth", authLimiter, authRouter);
app.use("/api/schools", schoolsRouter);
app.use("/api/pupils", pupilsRouter);
app.use("/api/ai", aiLimiter, aiRouter);
app.use("/api/data", dataRouter);
app.use("/api/admin", adminRouter);
app.use("/api/gdpr", gdprRouter);
app.use("/api/revision", aiLimiter, revisionRouter);
app.use("/api/school-keys", schoolApiKeysRouter);
app.use("/api/billing", billingRouter);
app.use("/api/mis", misRouter);
app.use("/api/briefing", briefingRouter);
app.use("/api/quiz", quizRouter);
app.use("/api/admin", superadminRouter);
app.use("/api/diagram-proxy", aiLimiter, diagramProxyRouter);
app.use("/api/feedback", feedbackRouter);
app.use("/api/messages", parentMessagesRouter);
app.use("/api/library", worksheetLibraryRouter);

// ── Health check ──────────────────────────────────────────────────────────────
app.get("/api/health", (_, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString(), version: "2.4.0-12Providers" });
});

// ── Serve static frontend in production ───────────────────────────────────────
const distPath = path.join(__dirname, "..");
const indexHtml = path.join(distPath, "index.html");
if (!isDev && fs.existsSync(indexHtml)) {
  console.log(`📁 Serving static frontend from: ${distPath}`);
  app.use(express.static(distPath, {
    // Security: set cache headers for static assets
    setHeaders: (res, filePath) => {
      if (filePath.endsWith(".html")) {
        res.setHeader("Cache-Control", "no-store");
      } else {
        res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
      }
    },
  }));
  app.get("*", (req, res) => {
    if (!req.path.startsWith("/api")) {
      res.sendFile(indexHtml);
    }
  });
} else {
  console.warn(`⚠️  Frontend not found at ${distPath} (isDev=${isDev})`);
}

// ── Global error handler — never leak stack traces or internal details in production ────────
app.use((err: any, req: express.Request, res: express.Response, _next: express.NextFunction) => {
  const status = err.status || err.statusCode || 500;
  // Always log the full error internally for debugging
  console.error(`[${new Date().toISOString()}] ${req.method} ${req.path} [${status}] ${err.message}`);
  if (isDev) {
    // In development, include stack trace for easier debugging
    res.status(status).json({ error: err.message, stack: err.stack });
  } else {
    // In production: only expose client errors (4xx) verbatim; mask all server errors (5xx)
    // Never expose err.message for 5xx — it may contain DB details, file paths, or secrets
    const safeMessage = status >= 500
      ? "An unexpected error occurred. Please try again or contact support."
      : (err.message || "Request failed");
    res.status(status).json({ error: safeMessage });
  }
});

// ── Start ─────────────────────────────────────────────────────────────────────
import { initDb } from "./db/index.js";
import { initWebSocketServer } from "./lib/notifications.js";
import http from "http";

initDb().then(() => {
  const httpServer = http.createServer(app);
  initWebSocketServer(httpServer);
  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Adaptly API running on http://localhost:${PORT}`);
    console.log(`   Environment: ${process.env.NODE_ENV || "development"}`);
  });
  // Increase server timeout to 150 seconds to allow AI generation to complete
  // Railway's default timeout is 30s which kills long AI requests
  httpServer.timeout = 150000; // 150 seconds
  (httpServer as any).keepAliveTimeout = 155000; // slightly above timeout
  (httpServer as any).headersTimeout = 160000; // slightly above keepAliveTimeout
}).catch(err => {
  console.error("Failed to initialise database:", err);
  process.exit(1);
});

export default app;

