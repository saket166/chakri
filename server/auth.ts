import type { Express, Request, Response } from "express";
import { db } from "./db";
import { users, feedItems } from "@shared/schema";
import { eq, ilike } from "drizzle-orm";
import bcrypt from "bcryptjs";

// Generate 6-digit OTP
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Send OTP via email using Supabase's built-in email (or just log it for now)
async function sendOTPEmail(email: string, otp: string, name: string): Promise<void> {
  // In production: use Resend, SendGrid, or Supabase Auth emails
  // For now: log to console (visible in Render logs) and store in DB for retrieval
  console.log(`\n====== OTP FOR ${email} ======\nOTP: ${otp}\n==============================\n`);
  
  // If RESEND_API_KEY is set, send real email
  if (process.env.RESEND_API_KEY) {
    try {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { "Authorization": `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: "Chakri <noreply@chakri.app>",
          to: [email],
          subject: "Your Chakri verification code",
          html: `<div style="font-family:sans-serif;max-width:400px;margin:0 auto;padding:20px">
            <h2 style="color:#6d28d9">Welcome to Chakri, ${name}!</h2>
            <p>Your verification code is:</p>
            <div style="font-size:48px;font-weight:bold;letter-spacing:12px;color:#6d28d9;text-align:center;padding:20px;background:#f3f4f6;border-radius:8px">${otp}</div>
            <p style="color:#6b7280;font-size:14px">This code expires in 10 minutes. Do not share it with anyone.</p>
          </div>`
        })
      });
    } catch (e) { console.error("Email send failed:", e); }
  }
}

export function registerAuthRoutes(app: Express) {

  // ── Sign Up Step 1: Create account, send OTP ───────────────────────────────
  app.post("/api/auth/signup", async (req: Request, res: Response) => {
    const { email, name, password, phone, headline, company, location } = req.body;
    if (!email || !name || !password) return res.status(400).json({ error: "Email, name and password are required" });
    if (password.length < 6) return res.status(400).json({ error: "Password must be at least 6 characters" });

    try {
      // Check if email already exists
      const existing = await db.select({ id: users.id, emailVerified: users.emailVerified })
        .from(users).where(ilike(users.email, email.trim())).limit(1);

      if (existing.length > 0 && existing[0].emailVerified) {
        return res.status(400).json({ error: "An account with this email already exists. Please sign in." });
      }

      const otp = generateOTP();
      const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min
      const passwordHash = await bcrypt.hash(password, 10);

      if (existing.length > 0) {
        // Update existing unverified account
        await db.update(users).set({ name, passwordHash, otpCode: otp, otpExpiresAt, phone: phone || "", headline: headline || "", company: company || "", location: location || "" })
          .where(eq(users.id, existing[0].id));
        await sendOTPEmail(email.trim(), otp, name);
        return res.json({ message: "OTP sent", userId: existing[0].id });
      }

      // Create new user
      const [user] = await db.insert(users).values({
        email: email.trim().toLowerCase(), name, passwordHash, phone: phone || "",
        headline: headline || "", company: company || "", location: location || "",
        otpCode: otp, otpExpiresAt, emailVerified: false, points: 500,
      }).returning();

      await sendOTPEmail(email.trim(), otp, name);
      return res.json({ message: "OTP sent", userId: user.id });
    } catch (e: any) {
      console.error("Signup error:", e);
      return res.status(500).json({ error: "Signup failed. Please try again." });
    }
  });

  // ── Sign Up Step 2: Verify OTP ─────────────────────────────────────────────
  app.post("/api/auth/verify-otp", async (req: Request, res: Response) => {
    const { userId, otp } = req.body;
    if (!userId || !otp) return res.status(400).json({ error: "Missing userId or OTP" });

    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user) return res.status(404).json({ error: "User not found" });
    if (user.otpCode !== otp) return res.status(400).json({ error: "Incorrect OTP. Please try again." });
    if (!user.otpExpiresAt || new Date() > user.otpExpiresAt) return res.status(400).json({ error: "OTP expired. Please request a new one." });

    const [verified] = await db.update(users)
      .set({ emailVerified: true, otpCode: "", otpExpiresAt: null })
      .where(eq(users.id, userId)).returning();

    // Welcome feed item
    await db.insert(feedItems).values({ type: "new_member", text: `${verified.name} just joined Chakri! 👋` }).catch(() => {});

    // Return user without sensitive fields
    const { passwordHash, otpCode, ...safeUser } = verified;
    return res.json(safeUser);
  });

  // ── Sign In ────────────────────────────────────────────────────────────────
  app.post("/api/auth/signin", async (req: Request, res: Response) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Email and password are required" });

    const [user] = await db.select().from(users).where(ilike(users.email, email.trim())).limit(1);
    if (!user) return res.status(401).json({ error: "No account found with this email. Please sign up." });
    if (!user.emailVerified) return res.status(401).json({ error: "Please verify your email first. Check your inbox for the OTP." });

    const valid = await bcrypt.compare(password, user.passwordHash || "");
    if (!valid) return res.status(401).json({ error: "Incorrect password. Please try again." });

    const { passwordHash, otpCode, ...safeUser } = user;
    return res.json(safeUser);
  });

  // ── Resend OTP ─────────────────────────────────────────────────────────────
  app.post("/api/auth/resend-otp", async (req: Request, res: Response) => {
    const { userId } = req.body;
    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user) return res.status(404).json({ error: "User not found" });

    const otp = generateOTP();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await db.update(users).set({ otpCode: otp, otpExpiresAt }).where(eq(users.id, userId));
    await sendOTPEmail(user.email, otp, user.name);
    return res.json({ message: "OTP resent" });
  });
}
