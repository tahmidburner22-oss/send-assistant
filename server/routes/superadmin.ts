/**
 * Super Admin Routes
 * Restricted to admin@adaptly.co.uk only
 * Handles user management, access control, and plan management
 */
import { Router, Request, Response } from "express";
import db from "../db/index.js";
import { requireAuth, requireAdmin, auditLog } from "../middleware/auth.js";

const router = Router();

// ── Middleware: Restrict to platform owner only ─────────────────────────────────
function requirePlatformOwner(req: Request, res: Response, next: Function) {
  if (req.user?.email !== "admin@adaptly.co.uk" && req.user?.email !== "admin@sendassistant.app") {
    return res.status(403).json({ error: "Unauthorized: Super Admin access required" });
  }
  next();
}

// ── GET /api/admin/users ────────────────────────────────────────────────────────
// Fetch all users with their school and plan information
router.get("/users", requireAuth, requireAdmin, requirePlatformOwner, (req: Request, res: Response) => {
  try {
    const users = db.prepare(
      `SELECT 
        u.id, u.email, u.display_name, u.role, u.school_id, u.email_verified, u.created_at,
        s.name as school_name, s.subscription_plan, s.licence_type
       FROM users u
       LEFT JOIN schools s ON u.school_id = s.id
       ORDER BY u.created_at DESC`
    ).all() as any[];

    res.json(users);
  } catch (err) {
    console.error("Error fetching users:", err);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

// ── PATCH /api/admin/users/:userId ──────────────────────────────────────────────
// Update a user's role or subscription plan
router.patch("/users/:userId", requireAuth, requireAdmin, requirePlatformOwner, (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { field, value } = req.body;

    if (!["role", "subscription_plan"].includes(field)) {
      return res.status(400).json({ error: "Invalid field to update" });
    }

    // Validate role
    if (field === "role") {
      const validRoles = ["mat_admin", "school_admin", "senco", "teacher", "ta", "staff"];
      if (!validRoles.includes(value)) {
        return res.status(400).json({ error: "Invalid role" });
      }
      db.prepare("UPDATE users SET role = ? WHERE id = ?").run(value, userId);
    }

    // Validate and update subscription plan
    if (field === "subscription_plan") {
      const validPlans = ["trial", "starter", "professional", "premium", "mat", "enterprise"];
      if (!validPlans.includes(value)) {
        return res.status(400).json({ error: "Invalid plan" });
      }
      const user = db.prepare("SELECT school_id FROM users WHERE id = ?").get(userId) as any;
      if (user?.school_id) {
        db.prepare("UPDATE schools SET subscription_plan = ?, subscription_status = 'active' WHERE id = ?").run(
          value,
          user.school_id
        );
      }
    }

    // Fetch updated user
    const updated = db.prepare(
      `SELECT 
        u.id, u.email, u.display_name, u.role, u.school_id, u.email_verified, u.created_at,
        s.name as school_name, s.subscription_plan, s.licence_type
       FROM users u
       LEFT JOIN schools s ON u.school_id = s.id
       WHERE u.id = ?`
    ).get(userId) as any;

    auditLog(
      req.user!.id,
      user?.school_id,
      "superadmin.user_updated",
      "users",
      userId,
      { field, value },
      req.ip
    );

    res.json(updated);
  } catch (err) {
    console.error("Error updating user:", err);
    res.status(500).json({ error: "Failed to update user" });
  }
});

// ── DELETE /api/admin/users/:userId ─────────────────────────────────────────────
// Delete a user account
router.delete("/users/:userId", requireAuth, requireAdmin, requirePlatformOwner, (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    // Prevent deleting self
    if (userId === req.user!.id) {
      return res.status(400).json({ error: "Cannot delete your own account" });
    }

    // Get user info before deletion
    const user = db.prepare("SELECT school_id, email FROM users WHERE id = ?").get(userId) as any;

    // Delete user
    db.prepare("DELETE FROM users WHERE id = ?").run(userId);

    auditLog(
      req.user!.id,
      user?.school_id,
      "superadmin.user_deleted",
      "users",
      userId,
      { email: user?.email },
      req.ip
    );

    res.json({ success: true, message: "User deleted" });
  } catch (err) {
    console.error("Error deleting user:", err);
    res.status(500).json({ error: "Failed to delete user" });
  }
});

// ── GET /api/admin/stats ────────────────────────────────────────────────────────
// Platform statistics for the Super Admin dashboard
router.get("/stats", requireAuth, requireAdmin, requirePlatformOwner, (req: Request, res: Response) => {
  try {
    const totalUsers = (db.prepare("SELECT COUNT(*) as c FROM users").get() as any).c;
    const totalSchools = (db.prepare("SELECT COUNT(*) as c FROM schools").get() as any).c;
    const premiumSchools = (
      db.prepare(
        "SELECT COUNT(*) as c FROM schools WHERE subscription_plan IN ('premium', 'mat', 'enterprise')"
      ).get() as any
    ).c;
    const totalPupils = (db.prepare("SELECT COUNT(*) as c FROM pupils WHERE is_active = 1").get() as any).c;

    res.json({
      totalUsers,
      totalSchools,
      premiumSchools,
      totalPupils,
      trialSchools: totalSchools - premiumSchools,
    });
  } catch (err) {
    console.error("Error fetching stats:", err);
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

export default router;
