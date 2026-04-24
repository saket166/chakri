import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const FROM = "Chakri <noreply@chakri.pro>";

export async function sendOtpEmail(email: string, name: string, otp: string) {
  if (!resend) {
    console.log(`[DEV] OTP for ${email}: ${otp}`);
    return;
  }
  await resend.emails.send({
    from: FROM,
    to: email,
    subject: "Your Chakri verification code",
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
        <h2 style="color:#4f46e5">Welcome to Chakri, ${name}! 👋</h2>
        <p>Your verification code is:</p>
        <div style="font-size:36px;font-weight:bold;letter-spacing:8px;color:#4f46e5;margin:24px 0">${otp}</div>
        <p style="color:#6b7280">This code expires in <strong>10 minutes</strong>. Do not share it with anyone.</p>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0"/>
        <p style="font-size:12px;color:#9ca3af">If you did not sign up for Chakri, you can safely ignore this email.</p>
      </div>`,
  });
}

export async function sendPasswordResetEmail(email: string, name: string, resetLink: string) {
  if (!resend) {
    console.log(`[DEV] Password reset link for ${email}: ${resetLink}`);
    return;
  }
  await resend.emails.send({
    from: FROM,
    to: email,
    subject: "Reset your Chakri password",
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
        <h2 style="color:#4f46e5">Password Reset Request</h2>
        <p>Hi ${name}, we received a request to reset your Chakri password.</p>
        <a href="${resetLink}"
           style="display:inline-block;margin:24px 0;padding:12px 24px;background:#4f46e5;color:white;text-decoration:none;border-radius:8px;font-weight:600">
          Reset Password
        </a>
        <p style="color:#6b7280">This link expires in <strong>1 hour</strong>. If you didn't request this, ignore this email — your account is safe.</p>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0"/>
        <p style="font-size:12px;color:#9ca3af">Or copy this link: ${resetLink}</p>
      </div>`,
  });
}
