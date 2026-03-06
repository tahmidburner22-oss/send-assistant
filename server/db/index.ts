import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcryptjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const DB_PATH = process.env.DB_PATH || path.join(process.cwd(), "data", "send-assistant.db");

// Ensure data directory exists
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

export const db = new Database(DB_PATH);

// Enable WAL mode and foreign keys
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

// Run schema — look in multiple locations to support both dev and dist
const schemaPaths = [
  path.join(__dirname, "schema.sql"),
  path.join(__dirname, "..", "db", "schema.sql"),
  path.join(process.cwd(), "server", "db", "schema.sql"),
];
const schemaPath = schemaPaths.find(p => fs.existsSync(p));
if (!schemaPath) throw new Error("schema.sql not found in: " + schemaPaths.join(", "));
const schema = fs.readFileSync(schemaPath, "utf-8");
db.exec(schema);

// Seed a default MAT admin if no users exist
const userCount = (db.prepare("SELECT COUNT(*) as c FROM users").get() as { c: number }).c;
if (userCount === 0) {
  const schoolId = uuidv4();
  const adminId = uuidv4();
  const hash = bcrypt.hashSync("Admin1234!", 12);

  db.prepare(`INSERT INTO schools (id, name, urn, domain, onboarding_complete, licence_type)
    VALUES (?, 'Default School', '000000', '', 1, 'professional')`).run(schoolId);

  db.prepare(`INSERT INTO users (id, school_id, email, display_name, password_hash, role, email_verified)
    VALUES (?, ?, 'admin@sendassistant.app', 'System Admin', ?, 'mat_admin', 1)`).run(adminId, schoolId, hash);

  console.log("✅ Seeded default admin: admin@sendassistant.app / Admin1234!");
}

export default db;
