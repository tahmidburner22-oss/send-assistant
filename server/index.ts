import "dotenv/config";
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

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = parseInt(process.env.PORT || "3001");
const isDev = process.env.NODE_ENV !== "production";

// ── Trust Railway's proxy ─────────────────────────────────────────────────────
app.set("trust proxy", 1);

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
  max: 10, // tightened from 20 to 10
  message: { error: "Too many login attempts. Please try again in 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },
  skipSuccessfulRequests: false, // count all attempts
});

// AI endpoints — expensive, limit tightly
const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
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
app.use(express.json({ limit: "1mb" })); // reduced from 10mb
app.use(express.urlencoded({ extended: true, limit: "1mb" }));
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

// ── Health check ──────────────────────────────────────────────────────────────
app.get("/api/health", (_, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString(), version: "2.1.0-GDPR" });
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
