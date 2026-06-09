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

export async function sendReferralRequestEmail(email: string, name: string, requesterName: string, targetCompany: string, position: string, coinsCost: number, appUrl: string) {
  if (!resend) {
    console.log(`[DEV] Referral request email for ${email}: ${requesterName} wants a referral at ${targetCompany}`);
    return;
  }
  await resend.emails.send({
    from: FROM,
    to: email,
    subject: `New referral request at ${targetCompany}`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
        <h2 style="color:#4f46e5">Hi ${name}! 👋</h2>
        <p><strong>${requesterName}</strong> is looking for a referral for the <strong>${position}</strong> role at <strong>${targetCompany}</strong>.</p>
        <p>Since you work at ${targetCompany}, you can help them out and earn <strong>${Math.round(coinsCost * 1.5)} coins</strong>!</p>
        <a href="${appUrl}/referrals"
           style="display:inline-block;margin:24px 0;padding:12px 24px;background:#4f46e5;color:white;text-decoration:none;border-radius:8px;font-weight:600">
          View Request
        </a>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0"/>
        <p style="font-size:12px;color:#9ca3af">You received this email because you are registered as working at ${targetCompany} on Chakri.</p>
      </div>`,
  });
}

export async function sendReferralConfirmedEmail(email: string, name: string, referrerName: string, company: string, position: string, appUrl: string) {
  if (!resend) {
    console.log(`[DEV] Referral confirmed email for ${email}`);
    return;
  }
  await resend.emails.send({
    from: FROM,
    to: email,
    subject: "Your referral was submitted! 🎉",
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
        <h2 style="color:#4f46e5">Hi ${name}!</h2>
        <p>Great news! <strong>${referrerName}</strong> has officially submitted your referral for the <strong>${position}</strong> role at <strong>${company}</strong>.</p>
        <p>We wish you the best of luck with your application process. Make sure to keep your profile updated!</p>
        <a href="${appUrl}/referrals"
           style="display:inline-block;margin:24px 0;padding:12px 24px;background:#4f46e5;color:white;text-decoration:none;border-radius:8px;font-weight:600">
          View Details
        </a>
      </div>`,
  });
}

export async function sendConnectionRequestEmail(email: string, name: string, senderName: string, appUrl: string) {
  if (!resend) {
    console.log(`[DEV] Connection request email for ${email} from ${senderName}`);
    return;
  }
  await resend.emails.send({
    from: FROM,
    to: email,
    subject: `${senderName} wants to connect on Chakri`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
        <h2 style="color:#4f46e5">New Connection Request</h2>
        <p>Hi ${name},</p>
        <p><strong>${senderName}</strong> wants to connect with you on Chakri.</p>
        <p>Connecting allows you to see each other's full profiles and send direct messages.</p>
        <a href="${appUrl}/connections"
           style="display:inline-block;margin:24px 0;padding:12px 24px;background:#4f46e5;color:white;text-decoration:none;border-radius:8px;font-weight:600">
          View Request
        </a>
      </div>`,
  });
}

export async function sendWeeklySummaryEmail(email: string, name: string, feedHighlights: any[], appUrl: string) {
  if (!resend) {
    console.log(`[DEV] Weekly summary email for ${email}`);
    return;
  }

  const listHtml = feedHighlights.length > 0 
    ? `<ul style="padding-left: 20px; color: #374151;">` + feedHighlights.map(f => `<li style="margin-bottom: 8px;">${f.text}</li>`).join('') + `</ul>`
    : `<p style="color: #6b7280;">It was a quiet week, but new opportunities are always popping up.</p>`;

  await resend.emails.send({
    from: FROM,
    to: email,
    subject: "Your Weekly Chakri Summary",
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
        <h2 style="color:#4f46e5">Happy Friday, ${name}!</h2>
        <p>Here is a quick look at some of the top activity in the Chakri community this week:</p>
        ${listHtml}
        <a href="${appUrl}/home"
           style="display:inline-block;margin:24px 0;padding:12px 24px;background:#4f46e5;color:white;text-decoration:none;border-radius:8px;font-weight:600">
          Go to Feed
        </a>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0"/>
        <p style="font-size:12px;color:#9ca3af">You're receiving this because you are an active member of Chakri.</p>
      </div>`,
  });
}
