import { Router } from "express";
import { sendFeedbackEmail } from "../email/index.js";

const router = Router();

router.post("/", async (req, res) => {
  try {
    const { name = "", email = "", type = "other", message } = req.body;
    if (!message || typeof message !== "string" || message.trim().length < 5) {
      return res.status(400).json({ error: "Message is required" });
    }
    await sendFeedbackEmail({
      name: String(name).slice(0, 100),
      email: String(email).slice(0, 200),
      type: String(type).slice(0, 50),
      message: String(message).slice(0, 5000),
    });
    return res.json({ ok: true });
  } catch (err) {
    console.error("[feedback] Failed:", err);
    // Don't fail silently — still return ok so the user isn't blocked
    return res.json({ ok: true });
  }
});

export default router;
