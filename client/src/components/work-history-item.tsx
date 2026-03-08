import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Building2 } from "lucide-react";

interface WorkHistoryItemProps {
  company: string;
  companyLogo?: string;
  position: string;
  duration: string;
  description?: string;
  isLast?: boolean;
}

export function WorkHistoryItem({
  company,
  companyLogo,
  position,
  duration,
  description,
  isLast = false,
}: WorkHistoryItemProps) {
  return (
    <div className="flex gap-4" data-testid={`work-item-${company}`}>
      <div className="flex flex-col items-center">
        <Avatar className="h-12 w-12 rounded-md">
          {companyLogo ? (
            <AvatarImage src={companyLogo} alt={company} />
          ) : (
            <AvatarFallback>
              <Building2 className="h-6 w-6" />
            </AvatarFallback>
          )}
        </Avatar>
        {!isLast && (
          <div className="w-px h-full bg-border mt-2" />
        )}
      </div>
      <div className="flex-1 pb-8">
        <h4 className="font-semibold text-base">{position}</h4>
        <p className="text-sm text-muted-foreground">{company}</p>
        <p className="text-xs text-muted-foreground mt-1">{duration}</p>
        {description && (
          <p className="text-sm mt-2 text-foreground/80">{description}</p>
        )}
      </div>
    </div>
  );
}
