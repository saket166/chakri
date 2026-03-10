import { Shield } from "lucide-react";

export default function Privacy() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <Shield className="h-7 w-7 text-primary" />
        <h1 className="text-3xl font-bold">Privacy Policy</h1>
      </div>
      <p className="text-sm text-muted-foreground mb-6">Last updated: March 2026</p>
      <div className="space-y-6 text-sm leading-relaxed">
        {[
          ["1. Information We Collect", "We collect information you provide directly: name, email address, phone number, company, job title, location, and profile details. We also collect activity data including referral requests, connections, messages, and ratings."],
          ["2. How We Use Your Information", "We use your information to: provide and improve the Chakri platform, match referral requests with relevant professionals, send notifications about referral activity, and calculate and award Chakri Coins."],
          ["3. Information Sharing", "We do not sell your personal information. Your profile information (name, company, headline) is visible to other Chakri users. Your contact details are only shared with users you are directly connected with during an active referral."],
          ["4. Data Storage", "Your data is stored securely on Supabase infrastructure hosted on AWS. We implement industry-standard security measures including encryption in transit and at rest."],
          ["5. Google Sign-In", "If you sign in with Google, we receive your name, email address, and profile picture from Google. We do not receive your Google password. Google's privacy policy governs their data practices."],
          ["6. Cookies", "We use session cookies to keep you logged in. We do not use tracking or advertising cookies."],
          ["7. Data Retention", "We retain your data for as long as your account is active. You may delete your account at any time from Settings, which will permanently remove your data within 30 days."],
          ["8. Your Rights", "You have the right to access, correct, or delete your personal data. Contact us at privacy@chakri.app to exercise these rights."],
          ["9. Children's Privacy", "Chakri is not intended for users under 18 years of age. We do not knowingly collect data from minors."],
          ["10. Contact", "For privacy-related questions, contact us at privacy@chakri.app"],
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
