import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, Building2, MapPin, MessageCircle, UserPlus } from "lucide-react";
import { getProfile, getRequests, sendPermanentConnection } from "@/lib/userStore";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const profile = getProfile();
  const reqs = getRequests();

  // Build a list of all known users from referral request history
  const knownUsers = new Map<string, { id: string; name: string; company: string; headline: string; location: string }>();
  reqs.forEach(r => {
    if (r.requesterId !== profile.id && !knownUsers.has(r.requesterId)) {
      knownUsers.set(r.requesterId, { id: r.requesterId, name: r.requesterName, company: r.targetCompany, headline: r.requesterHeadline, location: "" });
    }
    if (r.acceptedById && r.acceptedById !== profile.id && !knownUsers.has(r.acceptedById)) {
      knownUsers.set(r.acceptedById, { id: r.acceptedById, name: r.acceptedByName || "", company: r.targetCompany, headline: "", location: "" });
    }
  });

  const users = Array.from(knownUsers.values()).filter(u => u.name);
  const filtered = query.trim().length < 2 ? [] : users.filter(u =>
    u.name.toLowerCase().includes(query.toLowerCase()) ||
    u.company.toLowerCase().includes(query.toLowerCase()) ||
    u.headline.toLowerCase().includes(query.toLowerCase())
  );

  const handleConnect = (u: typeof users[0]) => {
    sendPermanentConnection(u.id, u.name);
    toast({ title: `Connected with ${u.name}!` });
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <Search className="h-7 w-7 text-primary" />
        <h1 className="text-3xl font-bold">Search People</h1>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          className="pl-11 h-12 text-base"
          placeholder="Search by name, company, or role..."
          value={query}
          autoFocus
          onChange={e => setQuery(e.target.value)}
        />
      </div>

      {query.trim().length > 0 && query.trim().length < 2 && (
        <p className="text-sm text-muted-foreground text-center py-4">Type at least 2 characters to search</p>
      )}

      {query.trim().length >= 2 && filtered.length === 0 && (
        <Card><CardContent className="py-12 text-center text-muted-foreground">
          <Search className="h-10 w-10 mx-auto mb-3 opacity-20" />
          <p className="font-medium">No users found for "{query}"</p>
          <p className="text-sm mt-1">Users appear here after referral activity on the platform</p>
        </CardContent></Card>
      )}

      <div className="space-y-3">
        {filtered.map(u => {
          const isConnected = profile.permanentConnections.includes(u.id);
          const initials = u.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
          return (
            <Card key={u.id} className="hover:shadow-md transition-all">
              <CardContent className="p-4 flex items-center gap-4">
                <Avatar className="h-12 w-12 shrink-0">
                  <AvatarFallback className="bg-primary/10 text-primary font-semibold">{initials}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold">{u.name}</p>
                  {u.headline && <p className="text-sm text-muted-foreground truncate">{u.headline}</p>}
                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                    {u.company && <span className="text-xs text-muted-foreground flex items-center gap-1"><Building2 className="h-3 w-3" />{u.company}</span>}
                    {isConnected && <Badge variant="secondary" className="text-xs">Connected</Badge>}
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  {isConnected ? (
                    <Button size="sm" variant="outline" onClick={() => setLocation("/messages")}>
                      <MessageCircle className="h-3.5 w-3.5 mr-1" />Message
                    </Button>
                  ) : (
                    <Button size="sm" onClick={() => handleConnect(u)}>
                      <UserPlus className="h-3.5 w-3.5 mr-1" />Connect
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {query.trim().length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <Search className="h-14 w-14 mx-auto mb-4 opacity-15" />
          <p className="font-medium text-lg">Find people on Chakri</p>
          <p className="text-sm mt-2">Search by name, company, or role to find and connect with professionals</p>
        </div>
      )}
    </div>
  );
}
