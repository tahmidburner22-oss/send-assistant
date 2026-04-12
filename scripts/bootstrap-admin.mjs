#!/usr/bin/env node
/**
 * bootstrap-admin.mjs
 *
 * One-time script to create the first admin account on a fresh deployment.
 * Run this ONCE after deploying to a new environment.
 *
 * Usage:
 *   BOOTSTRAP_ADMIN_EMAIL=you@school.com BOOTSTRAP_ADMIN_PASSWORD=SecurePass123! node scripts/bootstrap-admin.mjs
 *
 * Or set these in your environment and run:
 *   node scripts/bootstrap-admin.mjs
 */

import { createHash, randomBytes } from "crypto";
import { createRequire } from "module";

const require = createRequire(import.meta.url);

const email = process.env.BOOTSTRAP_ADMIN_EMAIL;
const password = process.env.BOOTSTRAP_ADMIN_PASSWORD;
const appUrl = process.env.APP_URL || "https://adaptly.co.uk";

if (!email || !password) {
  console.error(
    "ERROR: BOOTSTRAP_ADMIN_EMAIL and BOOTSTRAP_ADMIN_PASSWORD must be set.\n" +
    "Usage: BOOTSTRAP_ADMIN_EMAIL=you@school.com BOOTSTRAP_ADMIN_PASSWORD=SecurePass123! node scripts/bootstrap-admin.mjs"
  );
  process.exit(1);
}

if (password.length < 12) {
  console.error("ERROR: Password must be at least 12 characters long.");
  process.exit(1);
}

console.log(`Creating admin account for: ${email}`);
console.log(`Target: ${appUrl}`);

// Call the registration endpoint with a special bootstrap token
const res = await fetch(`${appUrl}/api/auth/bootstrap-admin`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    email,
    password,
    bootstrapSecret: process.env.BOOTSTRAP_SECRET || "",
  }),
});

const data = await res.json();

if (!res.ok) {
  console.error("Failed to create admin:", data.error || JSON.stringify(data));
  process.exit(1);
}

console.log("✅ Admin account created successfully.");
console.log("   Email:", email);
console.log("   You can now log in at:", appUrl + "/login");
console.log("\nIMPORTANT: Remove BOOTSTRAP_ADMIN_PASSWORD from your environment after first login.");
