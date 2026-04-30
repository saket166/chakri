import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, MessageCircle, Building2, UserCheck, UserX, Clock } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

export default function Connections() {
  const [connections, setConnections] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const load = () => {
    Promise.all([
      api.users.connections().catch(() => []),
      api.users.connectRequests().catch(() => []),
    ]).then(([conns, reqs]) => {
      setConnections(conns);
      setRequests(reqs);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleAccept = async (req: any) => {
    try {
      await api.users.acceptConnectRequest(req.id);
      toast({ title: `Connected with ${req.fromName}!` });
      load();
    } catch { toast({ title: "Failed", variant: "destructive" }); }
  };

  const handleReject = async (req: any) => {
    try {
      await api.users.rejectConnectRequest(req.id);
      setRequests(prev => prev.filter(r => r.id !== req.id));
    } catch { toast({ title: "Failed", variant: "destructive" }); }
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      <div className="flex items-center gap-3 mb-6">
        <Users className="h-7 w-7 text-primary" />
        <h1 className="text-3xl font-bold">Connections</h1>
      </div>

      <Tabs defaultValue="my">
        <TabsList className="mb-4">
          <TabsTrigger value="my">My Connections ({connections.length})</TabsTrigger>
          <TabsTrigger value="requests">
            Requests {requests.length > 0 && <span className="ml-1.5 bg-red-500 text-white text-xs rounded-full px-1.5">{requests.length}</span>}
          </TabsTrigger>
        </TabsList>

        {/* My Connections */}
        <TabsContent value="my">
          {loading && <p className="text-muted-foreground">Loading...</p>}
          {!loading && connections.length === 0 && (
            <Card><CardContent className="py-16 text-center text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p className="font-medium text-lg">No connections yet</p>
              <p className="text-sm mt-2 mb-4">Find people to connect with</p>
              <Button onClick={() => setLocation("/search")}>Search People</Button>
            </CardContent></Card>
          )}
          <div className="grid sm:grid-cols-2 gap-4">
            {connections.map(u => {
              const initials = (u.name || "?").split(" ").map((n: string) => n[0]).join("").slice(0,2).toUpperCase();
              return (
                <Card key={u.id} className="hover:shadow-md transition-all">
                  <CardContent className="p-4 flex items-center gap-4">
                    <Link href={`/user/${u.id}`} className="shrink-0 cursor-pointer hover:opacity-80 transition-opacity">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback className="bg-primary/10 text-primary font-semibold">{initials}</AvatarFallback>
                      </Avatar>
                    </Link>
                    <div className="flex-1 min-w-0">
                      <Link href={`/user/${u.id}`} className="font-semibold hover:underline cursor-pointer">{u.name}</Link>
                      {u.headline && <p className="text-sm text-muted-foreground truncate">{u.headline}</p>}
                      {u.company && <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5"><Building2 className="h-3 w-3"/>{u.company}</p>}
                    </div>
                    <Button size="sm" variant="outline" onClick={() => setLocation(`/messages?to=${u.id}&name=${encodeURIComponent(u.name)}`)}>
                      <MessageCircle className="h-3.5 w-3.5 mr-1" />Message
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Pending Requests */}
        <TabsContent value="requests">
          {requests.length === 0 && (
            <Card><CardContent className="py-16 text-center text-muted-foreground">
              <Clock className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p className="font-medium text-lg">No pending requests</p>
              <p className="text-sm mt-1">Connection requests from others will appear here</p>
            </CardContent></Card>
          )}
          <div className="space-y-3">
            {requests.map(req => {
              const initials = (req.fromName || "?").split(" ").map((n: string) => n[0]).join("").slice(0,2).toUpperCase();
              return (
                <Card key={req.id}>
                  <CardContent className="p-4 flex items-center gap-4">
                    <Link href={`/user/${req.fromId}`} className="shrink-0 cursor-pointer hover:opacity-80 transition-opacity">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback className="bg-primary/10 text-primary font-semibold">{initials}</AvatarFallback>
                      </Avatar>
                    </Link>
                    <div className="flex-1 min-w-0">
                      <Link href={`/user/${req.fromId}`} className="font-semibold hover:underline cursor-pointer">{req.fromName}</Link>
                      {req.fromHeadline && <p className="text-sm text-muted-foreground truncate">{req.fromHeadline}</p>}
                      {req.fromCompany && <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5"><Building2 className="h-3 w-3"/>{req.fromCompany}</p>}
                      <p className="text-xs text-muted-foreground mt-1">{formatDistanceToNow(new Date(req.createdAt), { addSuffix: true })}</p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button size="sm" onClick={() => handleAccept(req)}>
                        <UserCheck className="h-3.5 w-3.5 mr-1" />Accept
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleReject(req)}>
                        <UserX className="h-3.5 w-3.5 mr-1" />Decline
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
