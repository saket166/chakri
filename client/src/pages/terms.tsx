import { Card, CardContent } from "@/components/ui/card";
import { FileText } from "lucide-react";

export default function Terms() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <FileText className="h-7 w-7 text-primary" />
        <h1 className="text-3xl font-bold">Terms of Service</h1>
      </div>
      <p className="text-sm text-muted-foreground mb-8">Last updated: April 2026 · Effective for all users of chakri.pro</p>

      <div className="space-y-8 text-sm leading-relaxed">
        <section>
          <h2 className="font-semibold text-base mb-2">1. Acceptance of Terms</h2>
          <p className="text-muted-foreground">By creating an account or using Chakri ("the Platform"), you agree to these Terms of Service and our Privacy Policy. If you do not agree, do not use the Platform. You must be at least 18 years old and legally capable of entering binding contracts to use Chakri.</p>
        </section>

        <section>
          <h2 className="font-semibold text-base mb-2">2. What Chakri Does</h2>
          <p className="text-muted-foreground">Chakri is a professional referral networking platform that connects job seekers ("Requesters") with professionals ("Referees") who can provide referrals at their employer companies. Chakri facilitates these connections but is not a recruiter, staffing agency, or guarantor of employment outcomes. We make no guarantee that any referral will result in an interview, offer, or employment.</p>
        </section>

        <section>
          <h2 className="font-semibold text-base mb-2">3. Account Responsibilities</h2>
          <ul className="text-muted-foreground space-y-1 list-disc pl-5">
            <li>You must provide accurate, truthful information during registration and maintain it up to date.</li>
            <li>You are solely responsible for all activity under your account.</li>
            <li>You must keep your password confidential. Chakri will never ask for your password.</li>
            <li>You may not create multiple accounts or share your account with others.</li>
            <li>You must verify your email address before using core platform features.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-semibold text-base mb-2">4. Referral Rules & Obligations</h2>
          <ul className="text-muted-foreground space-y-1 list-disc pl-5">
            <li><strong>Referees</strong> who accept a referral request must complete it within 24 hours of acceptance.</li>
            <li>Failure to complete an accepted referral results in a <strong>strike</strong>. Three strikes within 90 days trigger a 7-day account suspension.</li>
            <li>Submitting a false referral confirmation is grounds for permanent account termination.</li>
            <li>Referees must only accept requests they genuinely intend to and are able to fulfill at their current employer.</li>
            <li><strong>Requesters</strong> must not misrepresent their qualifications, experience, or skills in any request or resume submitted.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-semibold text-base mb-2">5. Chakri Coins</h2>
          <ul className="text-muted-foreground space-y-1 list-disc pl-5">
            <li>Chakri Coins ("Coins") are virtual credits with no monetary value and cannot be converted to cash or transferred.</li>
            <li>Coins are deducted when a referral request is posted and awarded to Referees upon successful referral confirmation.</li>
            <li>Chakri reserves the right to adjust coin balances, rewards, or the coin economy at any time without prior notice.</li>
            <li>Coins earned or held in accounts that are terminated for policy violations will be forfeited.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-semibold text-base mb-2">6. Prohibited Conduct</h2>
          <p className="text-muted-foreground mb-2">You agree not to:</p>
          <ul className="text-muted-foreground space-y-1 list-disc pl-5">
            <li>Harass, threaten, or harm other users.</li>
            <li>Submit false or misleading information in any referral request or profile.</li>
            <li>Use automated tools, bots, or scripts to interact with the Platform.</li>
            <li>Attempt to gain unauthorized access to other accounts or Platform systems.</li>
            <li>Use the Platform for any unlawful purpose or in violation of any applicable law.</li>
            <li>Scrape, index, or reproduce Platform content without written permission.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-semibold text-base mb-2">7. Uploaded Content</h2>
          <p className="text-muted-foreground">By uploading a resume or any content to Chakri, you grant Chakri a limited, non-exclusive licence to store, display, and share that content with relevant users for the purpose of facilitating referrals. You retain ownership of your content. You represent that you own or have the right to upload all content you submit.</p>
        </section>

        <section>
          <h2 className="font-semibold text-base mb-2">8. Disclaimer of Warranties</h2>
          <p className="text-muted-foreground">The Platform is provided "as is" and "as available" without warranties of any kind, express or implied, including but not limited to merchantability, fitness for a particular purpose, or non-infringement. We do not warrant that the Platform will be uninterrupted, error-free, or free of harmful components.</p>
        </section>

        <section>
          <h2 className="font-semibold text-base mb-2">9. Limitation of Liability</h2>
          <p className="text-muted-foreground">To the maximum extent permitted by law, Chakri and its founders, employees, and agents shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of or inability to use the Platform, even if advised of the possibility of such damages.</p>
        </section>

        <section>
          <h2 className="font-semibold text-base mb-2">10. Account Termination</h2>
          <p className="text-muted-foreground">Chakri reserves the right to suspend or permanently terminate any account that violates these Terms, engages in fraudulent activity, or is deemed harmful to other users or the Platform, at our sole discretion and without prior notice.</p>
        </section>

        <section>
          <h2 className="font-semibold text-base mb-2">11. Changes to Terms</h2>
          <p className="text-muted-foreground">We may update these Terms at any time. We will notify registered users of material changes via email. Continued use of Chakri after the effective date of changes constitutes acceptance of the revised Terms.</p>
        </section>

        <section>
          <h2 className="font-semibold text-base mb-2">12. Governing Law</h2>
          <p className="text-muted-foreground">These Terms are governed by and construed in accordance with the laws of India. Any disputes shall be subject to the exclusive jurisdiction of the courts in Bengaluru, Karnataka, India.</p>
        </section>

        <section>
          <h2 className="font-semibold text-base mb-2">13. Contact</h2>
          <p className="text-muted-foreground">For questions about these Terms, email us at <a href="mailto:chakri.prod@google.com" className="text-primary hover:underline">chakri.prod@google.com</a>.</p>
        </section>
      </div>
    </div>
  );
}
