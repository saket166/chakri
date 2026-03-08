import { WorkHistoryItem } from "../work-history-item";
import microsoftLogo from "@assets/generated_images/Tech_company_logo_Microsoft_14dc9805.png";

export default function WorkHistoryItemExample() {
  return (
    <div className="p-4 max-w-2xl">
      <WorkHistoryItem
        company="Microsoft"
        companyLogo={microsoftLogo}
        position="Senior Software Engineer"
        duration="Jan 2020 - Present"
        description="Leading development of cloud infrastructure services"
      />
    </div>
  );
}
