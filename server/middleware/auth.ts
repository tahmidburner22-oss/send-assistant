import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import db from "../db/index.js";

export const JWT_SECRET = process.env.JWT_SECRET || "send-assistant-dev-secret-change-in-production";
export const SESSION_TIMEOUT_MS = 8 * 60 * 60 * 1000; // 8 hours

export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  role: string;
  schoolId: string | null;
  mfaEnabled: boolean;
  mfaVerified?: boolean;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = extractToken(req);
  if (!token) return res.status(401).json({ error: "Authentication required" });

  try {
    const payload = jwt.verify(token, JWT_SECRET) as AuthUser & { mfaVerified?: boolean };

    // Check session still valid in DB
    const session = db.prepare(
      "SELECT * FROM sessions WHERE token = ? AND expires_at > datetime('now')"
    ).get(token) as any;

    if (!session) return res.status(401).json({ error: "Session expired. Please log in again." });

    // Check user still active
    const user = db.prepare("SELECT * FROM users WHERE id = ? AND is_active = 1").get(payload.id) as any;
    if (!user) return res.status(401).json({ error: "Account deactivated" });

    // If MFA is enabled, require MFA verification
    if (user.mfa_enabled && !payload.mfaVerified) {
      return res.status(403).json({ error: "MFA verification required", mfaRequired: true });
    }

    req.user = {
      id: user.id,
      email: user.email,
      displayName: user.display_name,
      role: user.role,
      schoolId: user.school_id,
      mfaEnabled: !!user.mfa_enabled,
      mfaVerified: payload.mfaVerified,
    };

    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.user) return res.status(401).json({ error: "Authentication required" });
  const adminRoles = ["mat_admin", "school_admin"];
  if (!adminRoles.includes(req.user.role)) {
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
}

export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ error: "Authentication required" });
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }
    next();
  };
}

// Role hierarchy: mat_admin > school_admin > senco > teacher > ta > staff
const ROLE_LEVELS: Record<string, number> = {
  mat_admin: 5,
  school_admin: 4,
  senco: 3,
  teacher: 2,
  ta: 1,
  staff: 0,
};

export const ROLE_LABELS: Record<string, string> = {
  mat_admin: "MAT Administrator",
  school_admin: "School Administrator",
  senco: "SENCO / Inclusion Lead",
  teacher: "Teacher",
  ta: "Teaching Assistant",
  staff: "Support Staff",
};

// Manager-level: school_admin and senco can manage users and settings
export function requireManagerAccess(req: Request, res: Response, next: NextFunction) {
  if (!req.user) return res.status(401).json({ error: "Authentication required" });
  const managerRoles = ["mat_admin", "school_admin", "senco"];
  if (!managerRoles.includes(req.user.role)) {
    return res.status(403).json({ error: "Manager-level access required (School Admin or SENCO)" });
  }
  next();
}

export function requireMinRole(minRole: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ error: "Authentication required" });
    const userLevel = ROLE_LEVELS[req.user.role] || 0;
    const minLevel = ROLE_LEVELS[minRole] || 0;
    if (userLevel < minLevel) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }
    next();
  };
}

export function extractToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) return authHeader.slice(7);
  if (req.cookies?.token) return req.cookies.token;
  return null;
}

export function auditLog(
  userId: string | null,
  schoolId: string | null,
  action: string,
  entityType?: string,
  entityId?: string,
  details?: object,
  ipAddress?: string
) {
  db.prepare(`INSERT INTO audit_logs (id, user_id, school_id, action, entity_type, entity_id, details, ip_address)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).run(
    uuidv4(),
    userId,
    schoolId,
    action,
    entityType || null,
    entityId || null,
    details ? JSON.stringify(details) : null,
    ipAddress || null
  );
}
