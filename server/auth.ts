import type { Express, Request, Response } from "express";
import { db } from "./db";
import { users, feedItems } from "@shared/schema";
import { eq, ilike } from "drizzle-orm";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "chakri-dev-secret-change-in-prod";
const JWT_EXPIRES = "7d";

// Basic email format check
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Sign a JWT containing the userId
function signToken(userId: string): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES });
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
        // Re-signup for an unverified account — activate it
        const [updated] = await db.update(users).set({
          name, passwordHash,
          phone: phone || "", headline: headline || "",
          company: company || "", location: location || "",
          emailVerified: true, otpCode: "", otpExpiresAt: null,
        })
        .where(eq(users.id, existing[0].id))
        .returning();
        user = updated;
      } else {
        // Brand new account — verified immediately
        const [created] = await db.insert(users).values({
          email: trimmedEmail, name, passwordHash,
          phone: phone || "", headline: headline || "",
          company: company || "", location: location || "",
          emailVerified: true, points: 500,
        }).returning();
        user = created;
      }

      const { passwordHash: _ph, otpCode: _otp, ...safeUser } = user;
      const token = signToken(user.id);
      return res.json({ token, ...safeUser });

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
      const token = signToken(user.id);
      return res.json({ token, ...safeUser });
    } catch (e) {
      console.error("Signin error:", e);
      return res.status(500).json({ error: "Sign in failed" });
    }
  });
}