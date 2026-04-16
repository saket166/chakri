import type { Express, Request, Response } from "express";
import { db } from "./db";
import { users, feedItems } from "@shared/schema";
import { eq, ilike } from "drizzle-orm";
import bcrypt from "bcryptjs";

// Generate 6-digit OTP
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Sends OTP via Resend API
 * Note: While in trial/testing, you may need to use 'onboarding@resend.dev' 
 * and verify your recipient email in the Resend dashboard.
 */
async function sendOTPEmail(email: string, otp: string, name: string): Promise<void> {
  console.log(`\n====== OTP FOR ${email} ======\nOTP: ${otp}\n==============================\n`);

  if (!process.env.RESEND_API_KEY) {
    console.log("No RESEND_API_KEY set — OTP only in logs");
    return;
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        // Change to your verified domain once configured in Resend
        from: "Chakri <onboarding@resend.dev>", 
        to: [email],
        subject: "Your Chakri verification code",
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#f9fafb;border-radius:12px">
            <div style="text-align:center;margin-bottom:24px">
              <div style="display:inline-block;background:#7c3aed;color:white;font-size:24px;font-weight:bold;padding:8px 20px;border-radius:8px">Chakri</div>
            </div>
            <h2 style="color:#111827;font-size:20px;margin:0 0 8px">Welcome, ${name}!</h2>
            <p style="color:#6b7280;font-size:15px;margin:0 0 24px">Use this code to verify your email address. It expires in 10 minutes.</p>
            <div style="background:white;border:2px solid #7c3aed;border-radius:12px;padding:24px;text-align:center;margin-bottom:24px">
              <p style="color:#6b7280;font-size:13px;margin:0 0 8px;letter-spacing:1px;text-transform:uppercase">Verification Code</p>
              <p style="color:#7c3aed;font-size:48px;font-weight:bold;letter-spacing:16px;margin:0">${otp}</p>
            </div>
            <p style="color:#9ca3af;font-size:13px;text-align:center;margin:0">If you didn't create a Chakri account, you can safely ignore this email.</p>
          </div>
        `,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("Resend API error response:", err);
    } else {
      console.log(`OTP email successfully sent to ${email}`);
    }
  } catch (e) {
    console.error("Failed to execute fetch to Resend:", e);
  }
}

export function registerAuthRoutes(app: Express) {

  // ── Sign Up Step 1: Create account & send OTP ──────────────────────────────
  app.post("/api/auth/signup", async (req: Request, res: Response) => {
    const { email, name, password, phone, headline, company, location } = req.body;
    
    if (!email || !name || !password) {
      return res.status(400).json({ error: "Email, name and password are required" });
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

      const otp = generateOTP();
      const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); 
      const passwordHash = await bcrypt.hash(password, 10);

      if (existing.length > 0) {
        // Update unverified account with new details and OTP
        await db.update(users).set({ 
          name, 
          passwordHash, 
          otpCode: otp, 
          otpExpiresAt, 
          phone: phone || "", 
          headline: headline || "", 
          company: company || "", 
          location: location || "" 
        })
        .where(eq(users.id, existing[0].id));
        
        await sendOTPEmail(trimmedEmail, otp, name);
        return res.json({ message: "OTP sent", userId: existing[0].id });
      }

      // Create new account
      const [user] = await db.insert(users).values({
        email: trimmedEmail,
        name,
        passwordHash,
        phone: phone || "",
        headline: headline || "",
        company: company || "",
        location: location || "",
        otpCode: otp,
        otpExpiresAt,
        emailVerified: false,
        points: 500, // Welcome points
      }).returning();

      await sendOTPEmail(trimmedEmail, otp, name);
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

    try {
      const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      
      if (!user) return res.status(404).json({ error: "User not found" });
      if (user.otpCode !== otp) return res.status(400).json({ error: "Incorrect OTP." });
      if (!user.otpExpiresAt || new Date() > user.otpExpiresAt) {
        return res.status(400).json({ error: "OTP expired. Please request a new one." });
      }

      const [verified] = await db.update(users)
        .set({ emailVerified: true, otpCode: "", otpExpiresAt: null })
        .where(eq(users.id, userId))
        .returning();

      // Social trigger: New member joined feed
      await db.insert(feedItems).values({ 
        type: "new_member", 
        text: `${verified.name} just joined Chakri! 👋` 
      }).catch(() => {});

      const { passwordHash, otpCode, ...safeUser } = verified;
      return res.json(safeUser);
    } catch (e) {
      return res.status(500).json({ error: "Verification failed" });
    }
  });

  // ── Sign In ────────────────────────────────────────────────────────────────
  app.post("/api/auth/signin", async (req: Request, res: Response) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Missing credentials" });

    const [user] = await db.select().from(users).where(ilike(users.email, email.trim())).limit(1);
    
    if (!user) return res.status(401).json({ error: "Account not found." });
    if (!user.emailVerified) return res.status(401).json({ error: "Please verify your email first." });

    const valid = await bcrypt.compare(password, user.passwordHash || "");
    if (!valid) return res.status(401).json({ error: "Invalid password." });

    const { passwordHash, otpCode, ...safeUser } = user;
    return res.json(safeUser);
  });

  // ── Resend OTP ─────────────────────────────────────────────────────────────
  app.post("/api/auth/resend-otp", async (req: Request, res: Response) => {
    const { userId } = req.body;
    try {
      const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      if (!user) return res.status(404).json({ error: "User not found" });

      const otp = generateOTP();
      const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
      
      await db.update(users).set({ otpCode: otp, otpExpiresAt }).where(eq(users.id, userId));
      await sendOTPEmail(user.email, otp, user.name);
      
      return res.json({ message: "OTP resent" });
    } catch (e) {
      return res.status(500).json({ error: "Failed to resend OTP" });
    }
  });
}