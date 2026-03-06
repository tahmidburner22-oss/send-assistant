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

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = parseInt(process.env.PORT || "3001");
const isDev = process.env.NODE_ENV !== "production";

// ── Security middleware ───────────────────────────────────────────────────────
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
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// ── CORS ──────────────────────────────────────────────────────────────────────
const allowedOrigins = process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(",") : [];
app.use(cors({
  origin: (origin, cb) => {
    // Allow all if no restrictions set; otherwise check whitelist
    if (!origin || allowedOrigins.length === 0 || allowedOrigins.some(o => origin.startsWith(o.trim()))) return cb(null, true);
    cb(new Error("Not allowed by CORS"));
  },
  credentials: true,
}));

// ── Rate limiting ─────────────────────────────────────────────────────────────
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  message: { error: "Too many requests. Please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
});

// ── Body parsing ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(generalLimiter);

// ── API Routes ────────────────────────────────────────────────────────────────
app.use("/api/auth", authLimiter, authRouter);
app.use("/api/schools", schoolsRouter);
app.use("/api/pupils", pupilsRouter);
app.use("/api/ai", aiRouter);
app.use("/api/data", dataRouter);

// ── Health check ──────────────────────────────────────────────────────────────
app.get("/api/health", (_, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString(), version: "1.0.0" });
});

// ── Serve static frontend in production ───────────────────────────────────────
// In production, __dirname = dist/server/ so the built frontend is at dist/server/../
// i.e. one level up from __dirname (the dist/ folder itself)
const distPath = path.join(__dirname, "..");
const indexHtml = path.join(distPath, "index.html");
if (!isDev && fs.existsSync(indexHtml)) {
  console.log(`📁 Serving static frontend from: ${distPath}`);
  app.use(express.static(distPath));
  // SPA fallback — all non-API routes serve index.html
  app.get("*", (req, res) => {
    if (!req.path.startsWith("/api")) {
      res.sendFile(indexHtml);
    }
  });
} else {
  console.warn(`⚠️  Frontend not found at ${distPath} (isDev=${isDev})`);
}

// ── Error handler ─────────────────────────────────────────────────────────────
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("Unhandled error:", err);
  res.status(err.status || 500).json({ error: err.message || "Internal server error" });
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
