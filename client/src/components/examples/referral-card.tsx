import { ReferralCard } from "../referral-card";
import microsoftLogo from "@assets/generated_images/Tech_company_logo_Microsoft_14dc9805.png";
import avatarUrl from "@assets/generated_images/Professional_man_avatar_f59c5afe.png";

export default function ReferralCardExample() {
  return (
    <div className="p-4 max-w-2xl">
      <ReferralCard
        id="1"
        companyName="Microsoft"
        companyLogo={microsoftLogo}
        position="Senior Software Engineer"
        location="Seattle, WA"
        postedBy={{
          name: "John Smith",
          avatar: avatarUrl,
          headline: "Engineering Manager at Microsoft",
        }}
        postedTime="2 hours ago"
        status="active"
      />
    </div>
  );
}
