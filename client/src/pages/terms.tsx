import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText } from "lucide-react";

export default function Terms() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <FileText className="h-7 w-7 text-primary" />
        <h1 className="text-3xl font-bold">Terms of Service</h1>
      </div>
      <p className="text-sm text-muted-foreground mb-6">Last updated: March 2026</p>
      <div className="space-y-6 text-sm leading-relaxed">
        {[
          ["1. Acceptance of Terms", "By accessing or using Chakri, you agree to be bound by these Terms of Service. If you do not agree, please do not use the platform."],
          ["2. Description of Service", "Chakri is a referral networking platform that connects job seekers with professionals who can provide referrals at their companies. We facilitate connections but are not responsible for the outcome of any referral or job application."],
          ["3. User Accounts", "You must provide accurate and complete information when creating an account. You are responsible for maintaining the confidentiality of your account credentials. You must be at least 18 years old to use Chakri."],
          ["4. Referral Rules", "Users who accept a referral request must complete it within 24 hours or face a strike. Three strikes result in a temporary 7-day ban. Users must not accept referral requests they do not intend to fulfill. False confirmations of referrals are strictly prohibited."],
          ["5. Chakri Coins", "Chakri Coins are virtual credits earned through platform activity. They have no monetary value and cannot be exchanged for cash. Chakri reserves the right to adjust coin balances or rewards at any time. Coins may be used to redeem marketplace rewards subject to availability."],
          ["6. Prohibited Conduct", "You may not use Chakri to: harass or harm other users, provide false referral confirmations, create multiple accounts, scrape or automate platform interactions, or engage in any fraudulent activity."],
          ["7. Privacy", "Your use of Chakri is also governed by our Privacy Policy. By using the platform you consent to the collection and use of your data as described therein."],
          ["8. Limitation of Liability", "Chakri is provided 'as is' without warranties of any kind. We are not liable for any indirect, incidental, or consequential damages arising from your use of the platform."],
          ["9. Changes to Terms", "We may update these terms at any time. Continued use of Chakri after changes constitutes acceptance of the new terms."],
          ["10. Contact", "For questions about these terms, contact us at legal@chakri.app"],
        ].map(([title, content]) => (
          <div key={title}>
            <h2 className="font-semibold text-base mb-2">{title}</h2>
            <p className="text-muted-foreground">{content}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
