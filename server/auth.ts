import type { Express, Request, Response } from "express";
import { db } from "./db";
import { users, feedItems } from "@shared/schema";
import { eq, ilike } from "drizzle-orm";
import bcrypt from "bcryptjs";

// Basic email format check
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function registerAuthRoutes(app: Express) {

  // ── Sign Up — no OTP, instant activation ──────────────────────────────────
  app.post("/api/auth/signup", async (req: Request, res: Response) => {
    const { email, name, password, phone, headline, company, location } = req.body;

    if (!email || !name || !password) {
      return res.status(400).json({ error: "Email, name and password are required" });
    }
    if (!isValidEmail(email.trim())) {
      return res.status(400).json({ error: "Please enter a valid email address." });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }

    try {
      const trimmedEmail = email.trim().toLowerCase();
      const existing = await db.select({ id: users.id, emailVerified: users.emailVerified })
        .from(users)
        .where(ilike(users.email, trimmedEmail))
        .limit(1);

      if (existing.length > 0 && existing[0].emailVerified) {
        return res.status(400).json({ error: "An account with this email already exists." });
      }

      const passwordHash = await bcrypt.hash(password, 10);

      let user;

      if (existing.length > 0) {
        // Re-signup for an unverified account — just activate it now
        const [updated] = await db.update(users).set({
          name,
          passwordHash,
          phone: phone || "",
          headline: headline || "",
          company: company || "",
          location: location || "",
          emailVerified: true,
          otpCode: "",
          otpExpiresAt: null,
        })
        .where(eq(users.id, existing[0].id))
        .returning();
        user = updated;
      } else {
        // Brand new account — verified immediately
        const [created] = await db.insert(users).values({
          email: trimmedEmail,
          name,
          passwordHash,
          phone: phone || "",
          headline: headline || "",
          company: company || "",
          location: location || "",
          emailVerified: true,
          points: 500,
        }).returning();
        user = created;
      }

      // Social feed: new member joined (company-based, anonymous)
      const feedText = user.company
        ? `Someone from ${user.company} just joined Chakri! 👋`
        : `A new professional just joined Chakri! 👋`;
      await db.insert(feedItems).values({ type: "new_member", text: feedText })
        .catch((err) => { console.error("Feed insert error:", err); });

      const { passwordHash: _ph, otpCode: _otp, ...safeUser } = user;
      return res.json(safeUser);

    } catch (e: any) {
      console.error("Signup error:", e);
      return res.status(500).json({ error: "Signup failed. Please try again." });
    }
  });

  // ── Sign In ────────────────────────────────────────────────────────────────
  app.post("/api/auth/signin", async (req: Request, res: Response) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Missing credentials" });
    if (!isValidEmail(email.trim())) {
      return res.status(400).json({ error: "Please enter a valid email address." });
    }

    try {
      const [user] = await db.select().from(users).where(ilike(users.email, email.trim())).limit(1);

      if (!user) return res.status(401).json({ error: "Account not found." });

      const valid = await bcrypt.compare(password, user.passwordHash || "");
      if (!valid) return res.status(401).json({ error: "Invalid password." });

      const { passwordHash, otpCode, ...safeUser } = user;
      return res.json(safeUser);
    } catch (e) {
      console.error("Signin error:", e);
      return res.status(500).json({ error: "Sign in failed" });
    }
  });
}