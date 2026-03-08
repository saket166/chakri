import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, UserPlus, MessageCircle, Users, Building2 } from "lucide-react";
import { getProfile, getRequests } from "@/lib/userStore";
import { useLocation } from "wouter";

export default function Connections() {
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState("");
  const profile = getProfile();
  const reqs = getRequests();

  // Permanent connections — pull names from referral history
  const permanentConns = (profile.permanentConnections || []).map(pid => {
    const req = reqs.find(r => r.requesterId === pid || r.acceptedById === pid);
    const name = req ? (req.requesterId === pid ? req.requesterName : req.acceptedByName || pid) : pid;
    const company = req?.targetCompany || "";
    const headline = req ? `${req.position} referral` : "Connected via Chakri";
    return { id: pid, name, company, headline };
  });

  // Active referral connections (temporary)
  const tempConns = reqs
    .filter(r => r.connectionActive && (r.requesterId === profile.id || r.acceptedById === profile.id))
    .map(r => {
      const isRequester = r.requesterId === profile.id;
      return {
        id: isRequester ? r.acceptedById! : r.requesterId,
        name: isRequester ? (r.acceptedByName || "Referee") : r.requesterName,
        company: r.targetCompany,
        headline: `Active referral · ${r.position}`,
        temp: true,
      };
    });

  const allConns = [...permanentConns, ...tempConns].filter((c, i, arr) => arr.findIndex(x => x.id === c.id) === i);
  const filtered = allConns.filter(c => !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.company.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="container mx-auto px-4 py-6 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Connections</h1>
        <Button variant="outline" onClick={() => setLocation("/referrals")}>
          <UserPlus className="h-4 w-4 mr-2" />Find via Referrals
        </Button>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input className="pl-10" placeholder="Search connections..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <Tabs defaultValue="all">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="all"><Users className="h-4 w-4 mr-2" />All Connections ({filtered.length})</TabsTrigger>
          <TabsTrigger value="temp">Active Referral Connections ({tempConns.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          {filtered.length === 0 ? (
            <Card><CardContent className="py-16 text-center text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p className="font-semibold text-lg">No connections yet</p>
              <p className="text-sm mt-2">Accept or complete referrals to build your network.</p>
              <Button className="mt-4" onClick={() => setLocation("/referrals")}>Go to Referral Center</Button>
            </CardContent></Card>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map(c => (
                <Card key={c.id} className="hover:shadow-md transition-all">
                  <CardContent className="p-5">
                    <div className="flex items-start gap-4">
                      <Avatar className="h-12 w-12 shrink-0">
                        <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                          {c.name.split(" ").map(n => n[0]).join("").slice(0,2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold truncate">{c.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{c.headline}</p>
                        {c.company && (
                          <div className="flex items-center gap-1 mt-1">
                            <Building2 className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">{c.company}</span>
                          </div>
                        )}
                        {"temp" in c && c.temp && <Badge variant="outline" className="mt-2 text-xs border-blue-300 text-blue-600">Temporary</Badge>}
                      </div>
                    </div>
                    <Button size="sm" variant="outline" className="w-full mt-4" onClick={() => setLocation("/messages")}>
                      <MessageCircle className="h-3.5 w-3.5 mr-1.5" />Message
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="temp">
          {tempConns.length === 0 ? (
            <Card><CardContent className="py-12 text-center text-muted-foreground">
              <p className="font-medium">No active referral connections</p>
              <p className="text-sm mt-1">These appear while a referral is in progress.</p>
            </CardContent></Card>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {tempConns.map(c => (
                <Card key={c.id} className="border-blue-200">
                  <CardContent className="p-5 flex items-center gap-4">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-blue-100 text-blue-700 font-semibold text-sm">
                        {c.name.split(" ").map(n => n[0]).join("").slice(0,2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium">{c.name}</p>
                      <p className="text-xs text-muted-foreground">{c.headline}</p>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => setLocation("/messages")}>
                      <MessageCircle className="h-3.5 w-3.5" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
