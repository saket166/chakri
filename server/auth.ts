import type { Express, Request, Response } from "express";
import { db } from "./db";
import { users } from "@shared/schema";
import { eq, ilike } from "drizzle-orm";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { sendOtpEmail, sendPasswordResetEmail } from "./email";

const JWT_SECRET = process.env.JWT_SECRET || "chakri-dev-secret-change-in-prod";
const JWT_EXPIRES = "7d";
const APP_URL = process.env.APP_URL || "https://chakri.pro";

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function signToken(userId: string): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES });
}

function generateOtp(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function generateResetToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export function registerAuthRoutes(app: Express) {

  // ── Sign Up ─────────────────────────────────────────────────────────────────
  app.post("/api/auth/signup", async (req: Request, res: Response) => {
    const { email, name, password, phone, headline, company, location } = req.body;
    if (!email || !name || !password) return res.status(400).json({ error: "Email, name and password are required" });
    if (!isValidEmail(email.trim())) return res.status(400).json({ error: "Please enter a valid email address." });
    if (password.length < 6) return res.status(400).json({ error: "Password must be at least 6 characters" });

    try {
      const trimmedEmail = email.trim().toLowerCase();
      const existing = await db.select({ id: users.id, emailVerified: users.emailVerified })
        .from(users).where(ilike(users.email, trimmedEmail)).limit(1);

      if (existing.length > 0 && existing[0].emailVerified) {
        return res.status(400).json({ error: "An account with this email already exists." });
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const otp = generateOtp();
      const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min

      let user;
      if (existing.length > 0) {
        const [updated] = await db.update(users).set({
          name, passwordHash, phone: phone || "", headline: headline || "",
          company: company || "", location: location || "",
          emailVerified: false, otpCode: otp, otpExpiresAt,
        }).where(eq(users.id, existing[0].id)).returning();
        user = updated;
      } else {
        const [created] = await db.insert(users).values({
          email: trimmedEmail, name, passwordHash,
          phone: phone || "", headline: headline || "",
          company: company || "", location: location || "",
          emailVerified: false, points: 500,
          otpCode: otp, otpExpiresAt,
        }).returning();
        user = created;
      }

      // Send verification email (non-blocking)
      sendOtpEmail(user.email, user.name, otp).catch(console.error);

      return res.json({ userId: user.id, email: user.email });
    } catch (e: any) {
      console.error("Signup error:", e);
      return res.status(500).json({ error: "Signup failed. Please try again." });
    }
  });

  // ── Verify OTP ──────────────────────────────────────────────────────────────
  app.post("/api/auth/verify-otp", async (req: Request, res: Response) => {
    const { userId, otp } = req.body;
    if (!userId || !otp) return res.status(400).json({ error: "Missing userId or OTP" });

    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user) return res.status(404).json({ error: "User not found" });
    if (user.emailVerified) return res.status(400).json({ error: "Email already verified" });
    if (!user.otpCode || user.otpCode !== otp.toString())
      return res.status(400).json({ error: "Invalid verification code" });
    if (user.otpExpiresAt && new Date() > user.otpExpiresAt)
      return res.status(400).json({ error: "Code expired. Please request a new one." });

    const [verified] = await db.update(users).set({
      emailVerified: true, otpCode: "", otpExpiresAt: null,
    }).where(eq(users.id, userId)).returning();

    const { passwordHash, otpCode, ...safeUser } = verified;
    return res.json({ token: signToken(verified.id), ...safeUser });
  });

  // ── Resend OTP ──────────────────────────────────────────────────────────────
  app.post("/api/auth/resend-otp", async (req: Request, res: Response) => {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: "Missing userId" });

    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user) return res.status(404).json({ error: "User not found" });
    if (user.emailVerified) return res.status(400).json({ error: "Already verified" });

    const otp = generateOtp();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await db.update(users).set({ otpCode: otp, otpExpiresAt }).where(eq(users.id, userId));
    sendOtpEmail(user.email, user.name, otp).catch(console.error);
    return res.json({ ok: true });
  });

  // ── Sign In ──────────────────────────────────────────────────────────────────
  app.post("/api/auth/signin", async (req: Request, res: Response) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Missing credentials" });
    if (!isValidEmail(email.trim())) return res.status(400).json({ error: "Please enter a valid email address." });

    try {
      const [user] = await db.select().from(users).where(ilike(users.email, email.trim())).limit(1);
      if (!user) return res.status(401).json({ error: "Account not found." });

      const valid = await bcrypt.compare(password, user.passwordHash || "");
      if (!valid) return res.status(401).json({ error: "Invalid password." });

      if (!user.emailVerified) {
        // Re-send OTP so they can verify
        const otp = generateOtp();
        const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
        await db.update(users).set({ otpCode: otp, otpExpiresAt }).where(eq(users.id, user.id));
        sendOtpEmail(user.email, user.name, otp).catch(console.error);
        return res.status(403).json({
          error: "Please verify your email first.",
          userId: user.id,
          needsVerification: true,
        });
      }

      const { passwordHash, otpCode, ...safeUser } = user;
      return res.json({ token: signToken(user.id), ...safeUser });
    } catch (e) {
      console.error("Signin error:", e);
      return res.status(500).json({ error: "Sign in failed" });
    }
  });

  // ── Forgot Password ─────────────────────────────────────────────────────────
  app.post("/api/auth/forgot-password", async (req: Request, res: Response) => {
    const { email } = req.body;
    if (!email || !isValidEmail(email.trim()))
      return res.status(400).json({ error: "Valid email required" });

    const [user] = await db.select({ id: users.id, name: users.name, email: users.email })
      .from(users).where(ilike(users.email, email.trim())).limit(1);

    // Always return success to prevent email enumeration
    if (!user) return res.json({ ok: true });

    const token = generateResetToken();
    const otpExpiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await db.update(users).set({ otpCode: token, otpExpiresAt }).where(eq(users.id, user.id));

    const resetLink = `${APP_URL}/reset-password?token=${token}&email=${encodeURIComponent(user.email)}`;
    sendPasswordResetEmail(user.email, user.name, resetLink).catch(console.error);
    return res.json({ ok: true });
  });

  // ── Reset Password ──────────────────────────────────────────────────────────
  app.post("/api/auth/reset-password", async (req: Request, res: Response) => {
    const { token, email, newPassword } = req.body;
    if (!token || !email || !newPassword)
      return res.status(400).json({ error: "Missing fields" });
    if (newPassword.length < 6)
      return res.status(400).json({ error: "Password must be at least 6 characters" });

    const [user] = await db.select().from(users).where(ilike(users.email, email.trim())).limit(1);
    if (!user || user.otpCode !== token)
      return res.status(400).json({ error: "Invalid or expired reset link." });
    if (user.otpExpiresAt && new Date() > user.otpExpiresAt)
      return res.status(400).json({ error: "Reset link has expired. Please request a new one." });

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await db.update(users).set({ passwordHash, otpCode: "", otpExpiresAt: null })
      .where(eq(users.id, user.id));

    return res.json({ ok: true });
  });
}