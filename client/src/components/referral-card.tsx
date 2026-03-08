import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MapPin, Clock, Briefcase } from "lucide-react";
import { useState } from "react";

interface ReferralCardProps {
  id: string;
  companyName: string;
  companyLogo: string;
  position: string;
  location: string;
  postedBy: {
    name: string;
    avatar: string;
    headline: string;
  };
  postedTime: string;
  status: "active" | "accepted" | "expired" | "confirmed";
  timeRemaining?: string;
  onAccept?: (id: string) => void;
}

export function ReferralCard({
  id,
  companyName,
  companyLogo,
  position,
  location,
  postedBy,
  postedTime,
  status,
  timeRemaining,
  onAccept,
}: ReferralCardProps) {
  const [isAccepted, setIsAccepted] = useState(status === "accepted");

  const handleAccept = () => {
    setIsAccepted(true);
    onAccept?.(id);
    console.log(`Accepted referral request: ${id}`);
  };

  return (
    <Card className="hover-elevate" data-testid={`card-referral-${id}`}>
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0 pb-4">
        <div className="flex items-start gap-4 flex-1 min-w-0">
          <Avatar className="h-12 w-12 rounded-md">
            <AvatarImage src={companyLogo} alt={companyName} />
            <AvatarFallback>{companyName[0]}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg truncate">{position}</h3>
            <p className="text-sm text-muted-foreground truncate">{companyName}</p>
            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground flex-wrap">
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {location}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {postedTime}
              </span>
            </div>
          </div>
        </div>
        {status === "active" && !isAccepted && (
          <Button
            onClick={handleAccept}
            size="sm"
            data-testid={`button-accept-${id}`}
          >
            <Briefcase className="h-4 w-4 mr-2" />
            Accept Referral
          </Button>
        )}
        {(isAccepted || status === "accepted") && timeRemaining && (
          <Badge variant="outline" className="bg-amber-500/10 border-amber-500/20 text-amber-700 dark:text-amber-400">
            <Clock className="h-3 w-3 mr-1" />
            {timeRemaining}
          </Badge>
        )}
        {status === "confirmed" && (
          <Badge className="bg-green-500/10 border-green-500/20 text-green-700 dark:text-green-400">
            Confirmed
          </Badge>
        )}
        {status === "expired" && (
          <Badge variant="outline" className="bg-destructive/10 border-destructive/20">
            Expired
          </Badge>
        )}
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={postedBy.avatar} alt={postedBy.name} />
            <AvatarFallback>{postedBy.name[0]}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{postedBy.name}</p>
            <p className="text-xs text-muted-foreground truncate">{postedBy.headline}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
