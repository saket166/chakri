import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Building2, UserPlus, MessageCircle } from "lucide-react";
import { useState } from "react";

interface ConnectionCardProps {
  id: string;
  name: string;
  avatar: string;
  headline: string;
  company: string;
  mutualConnections?: number;
  isConnected?: boolean;
  onConnect?: (id: string) => void;
}

export function ConnectionCard({
  id,
  name,
  avatar,
  headline,
  company,
  mutualConnections,
  isConnected = false,
  onConnect,
}: ConnectionCardProps) {
  const [connected, setConnected] = useState(isConnected);

  const handleConnect = () => {
    setConnected(true);
    onConnect?.(id);
    console.log(`Connected with: ${name}`);
  };

  return (
    <Card className="hover-elevate" data-testid={`card-connection-${id}`}>
      <CardContent className="p-6">
        <div className="flex flex-col items-center text-center">
          <Avatar className="h-20 w-20 mb-4">
            <AvatarImage src={avatar} alt={name} />
            <AvatarFallback>{name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
          </Avatar>
          <h3 className="font-semibold text-base mb-1" data-testid={`text-name-${id}`}>{name}</h3>
          <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{headline}</p>
          <div className="flex items-center gap-1 text-xs text-muted-foreground mb-4">
            <Building2 className="h-3 w-3" />
            <span>{company}</span>
          </div>
          {mutualConnections && mutualConnections > 0 && (
            <p className="text-xs text-muted-foreground mb-4">
              {mutualConnections} mutual connection{mutualConnections > 1 ? 's' : ''}
            </p>
          )}
          {!connected ? (
            <Button
              onClick={handleConnect}
              size="sm"
              className="w-full"
              data-testid={`button-connect-${id}`}
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Connect
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              data-testid={`button-message-${id}`}
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              Message
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
