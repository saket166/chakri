import { Shield } from "lucide-react";

export default function Privacy() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <Shield className="h-7 w-7 text-primary" />
        <h1 className="text-3xl font-bold">Privacy Policy</h1>
      </div>
      <p className="text-sm text-muted-foreground mb-8">Last updated: April 2026 · Applies to chakri.pro</p>

      <div className="space-y-8 text-sm leading-relaxed">
        <section>
          <h2 className="font-semibold text-base mb-2">1. Who We Are</h2>
          <p className="text-muted-foreground">Chakri ("we", "our", "us") operates the platform at chakri.pro. We are committed to protecting your personal data and respecting your privacy. This Policy explains what data we collect, how we use it, and your rights regarding your data.</p>
        </section>

        <section>
          <h2 className="font-semibold text-base mb-2">2. Data We Collect</h2>
          <p className="text-muted-foreground mb-2"><strong>Information you provide:</strong></p>
          <ul className="text-muted-foreground space-y-1 list-disc pl-5 mb-3">
            <li>Account details: name, email address, phone number, password (stored as a bcrypt hash — never in plain text)</li>
            <li>Profile information: professional headline, current company, location, bio, skills, work history, education</li>
            <li>Referral content: job positions requested, target companies, cover letters, resume files</li>
            <li>Platform activity: referral requests posted, accepted, and completed; messages sent; connections made</li>
          </ul>
          <p className="text-muted-foreground mb-2"><strong>Information collected automatically:</strong></p>
          <ul className="text-muted-foreground space-y-1 list-disc pl-5">
            <li>IP address (used for rate-limiting and abuse prevention)</li>
            <li>Authentication tokens (JWT, stored in your browser's localStorage)</li>
          </ul>
        </section>

        <section>
          <h2 className="font-semibold text-base mb-2">3. How We Use Your Data</h2>
          <ul className="text-muted-foreground space-y-1 list-disc pl-5">
            <li><strong>To provide the service:</strong> matching referral requests with referees, enabling messaging, managing the coin economy</li>
            <li><strong>Account security:</strong> email verification, password reset, rate limiting</li>
            <li><strong>Communications:</strong> transactional emails (OTP codes, password resets, referral notifications) sent via Resend from noreply@chakri.pro</li>
            <li><strong>Fraud prevention:</strong> detecting and preventing abuse, impersonation, or policy violations</li>
            <li>We do <strong>not</strong> sell your personal data to any third party. We do <strong>not</strong> use your data for advertising.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-semibold text-base mb-2">4. Data Sharing</h2>
          <p className="text-muted-foreground mb-2">Your data is shared only in the following limited circumstances:</p>
          <ul className="text-muted-foreground space-y-1 list-disc pl-5">
            <li><strong>Other users:</strong> Your name, headline, company, and profile are visible to other verified Chakri users to enable referral matching and connections.</li>
            <li><strong>Resumes:</strong> Your uploaded resume is stored in Supabase Storage and shared only with users who accept your specific referral request.</li>
            <li><strong>Service providers:</strong> We use Supabase (database and file storage, hosted in the EU/US), Render (server hosting), and Resend (transactional email). These providers are bound by their own privacy policies and data processing agreements.</li>
            <li><strong>Legal requirements:</strong> We may disclose data if required to do so by law or in good-faith belief that such disclosure is necessary to comply with legal obligations.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-semibold text-base mb-2">5. Data Retention</h2>
          <p className="text-muted-foreground">We retain your account data for as long as your account is active. If you delete your account, all your personal data (profile, messages, referral history, notifications) is permanently deleted from our database within 24 hours. Resume files stored in Supabase Storage are deleted within 7 days of account deletion.</p>
        </section>

        <section>
          <h2 className="font-semibold text-base mb-2">6. Your Rights</h2>
          <ul className="text-muted-foreground space-y-1 list-disc pl-5">
            <li><strong>Access:</strong> You can view all your profile data in the Profile and Settings pages.</li>
            <li><strong>Correction:</strong> You can update your information at any time in Profile and Settings.</li>
            <li><strong>Deletion:</strong> You can delete your account and all associated data from Settings → Danger Zone → Delete Account.</li>
            <li><strong>Portability:</strong> To request an export of your data, email us at chakri.prod@google.com.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-semibold text-base mb-2">7. Security</h2>
          <p className="text-muted-foreground">We implement industry-standard security measures including: bcrypt password hashing, JWT-based authentication with expiring tokens, HTTPS in transit, rate limiting on authentication endpoints, and role-based API access controls. No system is 100% secure; if you believe your account has been compromised, contact us immediately.</p>
        </section>

        <section>
          <h2 className="font-semibold text-base mb-2">8. Cookies & Local Storage</h2>
          <p className="text-muted-foreground">Chakri does not use tracking cookies. We store your authentication token and cached profile data in your browser's localStorage solely to keep you logged in. This data is cleared when you log out or delete your account.</p>
        </section>

        <section>
          <h2 className="font-semibold text-base mb-2">9. Children's Privacy</h2>
          <p className="text-muted-foreground">Chakri is not directed at anyone under 18. We do not knowingly collect personal data from minors. If we learn that we have collected data from a user under 18, we will delete it promptly.</p>
        </section>

        <section>
          <h2 className="font-semibold text-base mb-2">10. Changes to This Policy</h2>
          <p className="text-muted-foreground">We may update this Privacy Policy from time to time. We will notify you of material changes via email. The "Last updated" date at the top of this page reflects the most recent revision.</p>
        </section>

        <section>
          <h2 className="font-semibold text-base mb-2">11. Contact</h2>
          <p className="text-muted-foreground">For privacy questions, data requests, or concerns, contact us at <a href="mailto:chakri.prod@google.com" className="text-primary hover:underline">chakri.prod@google.com</a>. We aim to respond within 5 business days.</p>
        </section>
      </div>
    </div>
  );
}
