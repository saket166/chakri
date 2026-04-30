import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MapPin, Building2, Star, ThumbsUp, GraduationCap, Briefcase, FileText, MessageCircle, UserPlus, CheckCircle, Clock, UserCheck } from "lucide-react";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { useLocation } from "wouter";

export default function PublicProfile({ params }: { params: { id: string } }) {
  const { id } = params;
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [profile, setProfile] = useState<any>(null);
  const [connectionStatus, setConnectionStatus] = useState<string>("none");
  const [recs, setRecs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    Promise.all([
      api.users.getPublicProfile(id).catch(() => null),
      api.users.recommendations(id).catch(() => [])
    ]).then(([data, r]) => {
      if (data) {
        setProfile(data.user);
        setConnectionStatus(data.connectionStatus);
      }
      setRecs(r || []);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [id]);

  if (connectionStatus === "self") {
    setLocation("/profile");
    return null;
  }

  if (loading) return <div className="container mx-auto px-4 py-6 max-w-5xl text-center py-20 text-muted-foreground">Loading profile...</div>;
  if (!profile) return <div className="container mx-auto px-4 py-6 max-w-5xl text-center py-20 text-muted-foreground">User not found.</div>;

  const handleConnect = async () => {
    try {
      await api.users.sendConnectRequest(id);
      setConnectionStatus("pending_sent");
      toast({ title: `Connection request sent to ${profile.name}!` });
    } catch (e: any) { toast({ title: e.message || "Failed to send request", variant: "destructive" }); }
  };

  const initials = (profile.name || "?").split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();
  const avgExp = recs.length ? (recs.reduce((a: number, r: any) => a + r.experience, 0) / recs.length).toFixed(1) : null;

  return (
    <div className="container mx-auto px-4 py-6 max-w-5xl">
      {/* Header Card */}
      <Card className="mb-6">
        <div className="h-32 bg-gradient-to-r from-primary/20 via-primary/10 to-primary/5 rounded-t-lg" />
        <CardContent className="pt-0">
          <div className="flex flex-col md:flex-row gap-6 items-start -mt-16 md:-mt-12">
            <Avatar className="h-32 w-32 border-4 border-background text-3xl font-bold bg-background">
              {profile.avatarUrl && <AvatarImage src={profile.avatarUrl} alt={profile.name} className="object-cover" />}
              <AvatarFallback className="bg-primary text-primary-foreground text-3xl font-bold">{initials}</AvatarFallback>
            </Avatar>

            <div className="flex-1 pt-16 md:pt-4 w-full">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div className="flex-1">
                  <h1 className="text-2xl font-bold">{profile.name}</h1>
                  {profile.headline && <p className="text-muted-foreground mt-1">{profile.headline}</p>}
                  <div className="flex flex-wrap gap-3 mt-2 text-sm text-muted-foreground">
                    {profile.company && <span className="flex items-center gap-1"><Building2 className="h-3.5 w-3.5" />{profile.company}</span>}
                    {profile.location && <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{profile.location}</span>}
                  </div>
                  {profile.bio && <p className="text-sm mt-3 text-muted-foreground">{profile.bio}</p>}
                </div>
                <div className="flex gap-2">
                  {connectionStatus === "connected" ? (
                    <>
                      <Badge variant="secondary" className="h-9 px-3 flex items-center gap-1 text-sm font-medium">
                        <CheckCircle className="h-4 w-4 text-green-500" /> Connected
                      </Badge>
                      <Button onClick={() => setLocation(`/messages?to=${profile.id}&name=${encodeURIComponent(profile.name)}`)}>
                        <MessageCircle className="h-4 w-4 mr-1.5" /> Message
                      </Button>
                    </>
                  ) : connectionStatus === "pending_sent" ? (
                    <Button variant="outline" disabled className="opacity-70">
                      <Clock className="h-4 w-4 mr-1.5" /> Request Sent
                    </Button>
                  ) : connectionStatus === "pending_received" ? (
                    <Button onClick={() => setLocation("/connections")}>
                      <UserCheck className="h-4 w-4 mr-1.5" /> View Request
                    </Button>
                  ) : (
                    <Button onClick={handleConnect}>
                      <UserPlus className="h-4 w-4 mr-1.5" /> Connect
                    </Button>
                  )}
                </div>
              </div>

              <div className="flex gap-6 mt-4 pt-4 border-t">
                <div className="text-center">
                  <p className="text-2xl font-bold">{profile.connectionCount || 0}</p>
                  <p className="text-xs text-muted-foreground">Connections</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">{profile.points || 0}</p>
                  <p className="text-xs text-muted-foreground">Coins</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">{recs.length}</p>
                  <p className="text-xs text-muted-foreground">Recommendations</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="experience">
        <TabsList className="mb-4 grid grid-cols-5 w-full">
          <TabsTrigger value="experience"><Briefcase className="h-3.5 w-3.5 mr-1 hidden sm:inline" />Experience</TabsTrigger>
          <TabsTrigger value="education"><GraduationCap className="h-3.5 w-3.5 mr-1 hidden sm:inline" />Education</TabsTrigger>
          <TabsTrigger value="skills">Skills</TabsTrigger>
          <TabsTrigger value="certifications"><FileText className="h-3.5 w-3.5 mr-1 hidden sm:inline" />Certs</TabsTrigger>
          <TabsTrigger value="recommendations">Reviews {recs.length > 0 && <span className="ml-1 text-[10px] bg-primary/15 text-primary rounded-full px-1.5 py-0.5 font-bold">{recs.length}</span>}</TabsTrigger>
        </TabsList>

        {/* Experience */}
        <TabsContent value="experience" className="space-y-3">
          {(profile.workHistory || [])?.map((w: any, i: number) => (
            <Card key={i}><CardContent className="p-4">
              <div className="flex justify-between items-start">
                <div><p className="font-semibold">{w.role}</p><p className="text-sm text-muted-foreground">{w.company}</p></div>
                <span className="text-xs text-muted-foreground">{w.period}</span>
              </div>
              {w.description && <p className="text-sm mt-2 text-muted-foreground">{w.description}</p>}
            </CardContent></Card>
          ))}
          {!(profile.workHistory || []).length && <p className="text-sm text-muted-foreground">No experience added.</p>}
        </TabsContent>

        {/* Education */}
        <TabsContent value="education" className="space-y-3">
          {(profile.education || [])?.map((e: any, i: number) => (
            <Card key={i}><CardContent className="p-4">
              <div className="flex justify-between items-start">
                <div><p className="font-semibold">{e.degree}</p><p className="text-sm text-muted-foreground">{e.institution}</p></div>
                <span className="text-xs text-muted-foreground">{e.year}</span>
              </div>
            </CardContent></Card>
          ))}
          {!(profile.education || []).length && <p className="text-sm text-muted-foreground">No education added.</p>}
        </TabsContent>

        {/* Skills */}
        <TabsContent value="skills">
          <Card><CardContent className="p-4 space-y-3">
            <div className="flex flex-wrap gap-2">
              {(profile.skills || [])?.map((s: string) => (
                <Badge key={s} variant="secondary">{s}</Badge>
              ))}
              {!(profile.skills || [])?.length && <p className="text-sm text-muted-foreground">No skills added.</p>}
            </div>
          </CardContent></Card>
        </TabsContent>

        {/* Certifications */}
        <TabsContent value="certifications" className="space-y-3">
          {(profile.certifications || [])?.map((c: any, i: number) => (
            <Card key={i}><CardContent className="p-4">
              <div className="flex justify-between items-start">
                <div><p className="font-semibold">{c.name}</p><p className="text-sm text-muted-foreground">{c.issuer}</p></div>
                <span className="text-xs text-muted-foreground">{c.year}</span>
              </div>
            </CardContent></Card>
          ))}
          {!(profile.certifications || []).length && <p className="text-sm text-muted-foreground">No certifications added.</p>}
        </TabsContent>

        {/* Recommendations */}
        <TabsContent value="recommendations">
          {recs.length === 0 ? (
            <Card><CardContent className="py-12 text-center text-muted-foreground">
              <ThumbsUp className="h-10 w-10 mx-auto mb-3 opacity-20" />
              <p className="font-medium">No recommendations yet</p>
            </CardContent></Card>
          ) : (
            <div className="space-y-4">
              {avgExp && (
                <Card className="bg-primary/5 border-primary/20"><CardContent className="p-4 flex gap-8">
                  <div className="text-center"><p className="text-2xl font-bold text-primary">{avgExp}/5</p><p className="text-xs text-muted-foreground">Avg Rating</p></div>
                  <div className="text-center"><p className="text-2xl font-bold text-primary">{recs.length}</p><p className="text-xs text-muted-foreground">Total Reviews</p></div>
                </CardContent></Card>
              )}
              {recs.map(r => (
                <Card key={r.id}><CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium text-sm">{r.fromName}</p>
                    <div className="flex gap-0.5">{[1,2,3,4,5].map(i => <Star key={i} className={`h-3.5 w-3.5 ${i <= r.experience ? "text-yellow-400 fill-yellow-400" : "text-muted-foreground"}`} />)}</div>
                  </div>
                  <p className="text-sm text-muted-foreground">{r.text}</p>
                  <p className="text-xs text-muted-foreground mt-2">{formatDistanceToNow(new Date(r.createdAt), { addSuffix: true })}</p>
                </CardContent></Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
