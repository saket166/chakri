import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Users, MessageCircle, Building2 } from "lucide-react";
import { useLocation } from "wouter";

export default function Connections() {
  const [connections, setConnections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [, setLocation] = useLocation();

  useEffect(() => {
    api.users.connections().then(setConnections).finally(() => setLoading(false));
  }, []);

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      <div className="flex items-center gap-3 mb-6">
        <Users className="h-7 w-7 text-primary" />
        <h1 className="text-3xl font-bold">My Connections</h1>
        <span className="text-muted-foreground text-sm">({connections.length})</span>
      </div>
      {loading && <p className="text-muted-foreground">Loading...</p>}
      {!loading && connections.length === 0 && (
        <Card><CardContent className="py-16 text-center text-muted-foreground">
          <Users className="h-12 w-12 mx-auto mb-4 opacity-20" />
          <p className="font-medium text-lg">No connections yet</p>
          <p className="text-sm mt-2 mb-4">Connect with people through referrals or the Search page</p>
          <Button onClick={() => setLocation("/search")}>Search People</Button>
        </CardContent></Card>
      )}
      <div className="grid sm:grid-cols-2 gap-4">
        {connections.map(u => {
          const initials = u.name.split(" ").map((n: string) => n[0]).join("").slice(0,2).toUpperCase();
          return (
            <Card key={u.id} className="hover:shadow-md transition-all">
              <CardContent className="p-4 flex items-center gap-4">
                <Avatar className="h-12 w-12 shrink-0">
                  <AvatarFallback className="bg-primary/10 text-primary font-semibold">{initials}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold">{u.name}</p>
                  {u.headline && <p className="text-sm text-muted-foreground truncate">{u.headline}</p>}
                  {u.company && <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5"><Building2 className="h-3 w-3"/>{u.company}</p>}
                </div>
                <Button size="sm" variant="outline" onClick={() => setLocation("/messages")}>
                  <MessageCircle className="h-3.5 w-3.5 mr-1" />Message
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
