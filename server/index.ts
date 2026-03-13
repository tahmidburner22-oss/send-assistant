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
      fontSrc: ["'self'", "fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: [
        "'self'",
        "https://api.groq.com",
        "https://generativelanguage.googleapis.com",
        "https://api.openai.com",
        "https://openrouter.ai",
        "https://api.anthropic.com",
        "https://router.huggingface.co",
        "https://accounts.google.com",
      ],
      frameSrc: ["accounts.google.com"],
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

// ── CORS ──────────────────────────────────────────────────────────────────────
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",")
  : [];
app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.length === 0 || allowedOrigins.some(o => origin.startsWith(o.trim()))) {
      return cb(null, true);
    }
    cb(new Error("Not allowed by CORS"));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization"],
  exposedHeaders: ["RateLimit-Limit", "RateLimit-Remaining"],
}));

// ── Rate limiting ─────────────────────────────────────────────────────────────
// Strict limiter for auth endpoints (brute-force protection)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // 50 attempts per 15 min — generous enough for normal use, still blocks brute force
  message: { error: "Too many login attempts. Please try again in 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },
  skipSuccessfulRequests: true, // only count failed attempts
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
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },
});

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
    .replace(/on\w+\s*=/gi, "")
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
app.use("/api/diagram-proxy", diagramProxyRouter);

// ── Health check ──────────────────────────────────────────────────────────────
app.get("/api/health", (_, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString(), version: "2.2.0-Billing" });
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

// ── Global error handler — never leak stack traces in production ──────────────
app.use((err: any, req: express.Request, res: express.Response, _next: express.NextFunction) => {
  const status = err.status || err.statusCode || 500;
  if (isDev) {
    console.error("Unhandled error:", err);
    res.status(status).json({ error: err.message, stack: err.stack });
  } else {
    // In production, log internally but return a generic message
    console.error(`[${new Date().toISOString()}] ${req.method} ${req.path} — ${err.message}`);
    res.status(status).json({ error: status < 500 ? err.message : "An unexpected error occurred." });
  }
});

// ── Start ─────────────────────────────────────────────────────────────────────
import { initDb } from "./db/index.js";
initDb().then(() => {
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Adaptly API running on http://localhost:${PORT}`);
    console.log(`   Environment: ${process.env.NODE_ENV || "development"}`);
  });
}).catch(err => {
  console.error("Failed to initialise database:", err);
  process.exit(1);
});

export default app;
