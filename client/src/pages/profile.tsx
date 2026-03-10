import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Edit, MapPin, Building2, Award, Save, X, Star, ThumbsUp } from "lucide-react";
import { api, getCachedUser } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

export default function Profile() {
  const { toast } = useToast();
  const [profile, setProfile] = useState<any>(getCachedUser() || {});
  const [recs, setRecs] = useState<any[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState<any>({});

  useEffect(() => {
    api.auth.me().then(u => { setProfile(u); setDraft(u); });
    if (getCachedUser()?.id) {
      api.users.recommendations(getCachedUser().id).then(setRecs);
    }
  }, []);

  const save = async () => {
    const updated = await api.auth.update(draft);
    setProfile(updated); setIsEditing(false);
    toast({ title: "Profile saved!" });
  };

  const d = isEditing ? draft : profile;
  const initials = (d?.name || "?").split(" ").map((n: string) => n[0]).join("").slice(0,2).toUpperCase();
  const avgSpeed = recs.length ? (recs.reduce((a: number, r: any) => a + r.speed, 0) / recs.length).toFixed(1) : null;
  const avgExp = recs.length ? (recs.reduce((a: number, r: any) => a + r.experience, 0) / recs.length).toFixed(1) : null;

  return (
    <div className="container mx-auto px-4 py-6 max-w-5xl">
      <Card className="mb-6">
        <div className="h-32 bg-gradient-to-r from-primary/20 via-primary/10 to-primary/5 rounded-t-lg" />
        <CardContent className="pt-0">
          <div className="flex flex-col md:flex-row gap-6 items-start -mt-16 md:-mt-12">
            {/* Avatar with upload */}
            <div className="relative group">
              <Avatar className="h-32 w-32 border-4 border-background text-3xl font-bold">
                {profile.avatarUrl && <AvatarImage src={profile.avatarUrl} alt={profile.name} className="object-cover" />}
                <AvatarFallback className="bg-primary text-primary-foreground text-3xl font-bold">{initials}</AvatarFallback>
              </Avatar>
              <label className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                <span className="text-white text-xs font-medium text-center leading-tight">Upload<br/>Photo</span>
                <input type="file" accept="image/*" className="hidden" onChange={e => {
                  const file = e.target.files?.[0]; if (!file) return;
                  const reader = new FileReader();
                  reader.onload = async ev => {
                    const url = ev.target?.result as string;
                    await api.auth.update({ avatarUrl: url });
                    setProfile((p: any) => ({ ...p, avatarUrl: url }));
                  };
                  reader.readAsDataURL(file);
                }} />
              </label>
            </div>

            <div className="flex-1 pt-16 md:pt-4 w-full">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div className="flex-1">
                  {isEditing ? (
                    <div className="space-y-3">
                      <Input placeholder="Full Name" value={draft.name || ""} onChange={e => setDraft((p: any) => ({ ...p, name: e.target.value }))} />
                      <Input placeholder="Headline (e.g. SDE-2 at Google)" value={draft.headline || ""} onChange={e => setDraft((p: any) => ({ ...p, headline: e.target.value }))} />
                      <div className="grid grid-cols-2 gap-2">
                        <Input placeholder="Company" value={draft.company || ""} onChange={e => setDraft((p: any) => ({ ...p, company: e.target.value }))} />
                        <Input placeholder="Location" value={draft.location || ""} onChange={e => setDraft((p: any) => ({ ...p, location: e.target.value }))} />
                      </div>
                      <Textarea placeholder="Bio" value={draft.bio || ""} onChange={e => setDraft((p: any) => ({ ...p, bio: e.target.value }))} rows={3} />
                    </div>
                  ) : (
                    <>
                      <h1 className="text-2xl font-bold">{d?.name || "Your Name"}</h1>
                      <p className="text-muted-foreground mt-1">{d?.headline || "Add your headline"}</p>
                      <div className="flex flex-wrap gap-3 mt-2 text-sm text-muted-foreground">
                        {d?.company && <span className="flex items-center gap-1"><Building2 className="h-3.5 w-3.5" />{d.company}</span>}
                        {d?.location && <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{d.location}</span>}
                      </div>
                      {d?.bio && <p className="text-sm mt-3">{d.bio}</p>}
                    </>
                  )}
                </div>
                <div className="flex gap-2">
                  {isEditing ? (
                    <>
                      <Button size="sm" onClick={save}><Save className="h-3.5 w-3.5 mr-1" />Save</Button>
                      <Button size="sm" variant="outline" onClick={() => setIsEditing(false)}><X className="h-3.5 w-3.5" /></Button>
                    </>
                  ) : (
                    <Button size="sm" variant="outline" onClick={() => { setDraft(profile); setIsEditing(true); }}>
                      <Edit className="h-3.5 w-3.5 mr-1" />Edit
                    </Button>
                  )}
                </div>
              </div>

              <div className="flex gap-6 mt-4 pt-4 border-t">
                <div className="text-center"><p className="text-2xl font-bold">{(profile.permanentConnections || []).length}</p><p className="text-xs text-muted-foreground">Connections</p></div>
                <div className="text-center"><p className="text-2xl font-bold">{(profile.points || 0).toLocaleString()}</p><p className="text-xs text-muted-foreground">Coins</p></div>
                <div className="text-center"><p className="text-2xl font-bold">{recs.length}</p><p className="text-xs text-muted-foreground">Recommendations</p></div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="recommendations">
        <TabsList className="mb-4">
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
          <TabsTrigger value="skills">Skills</TabsTrigger>
        </TabsList>

        <TabsContent value="recommendations">
          {recs.length === 0 ? (
            <Card><CardContent className="py-12 text-center text-muted-foreground">
              <ThumbsUp className="h-10 w-10 mx-auto mb-3 opacity-20" />
              <p className="font-medium">No recommendations yet</p>
              <p className="text-sm mt-1">Recommendations appear here after you successfully refer someone</p>
            </CardContent></Card>
          ) : (
            <div className="space-y-4">
              {avgSpeed && (
                <Card className="bg-primary/5 border-primary/20">
                  <CardContent className="p-4 flex gap-8">
                    <div className="text-center"><p className="text-2xl font-bold text-primary">{avgSpeed}</p><p className="text-xs text-muted-foreground">Avg Speed</p></div>
                    <div className="text-center"><p className="text-2xl font-bold text-primary">{avgExp}</p><p className="text-xs text-muted-foreground">Avg Experience</p></div>
                    <div className="text-center"><p className="text-2xl font-bold text-primary">{recs.length}</p><p className="text-xs text-muted-foreground">Total</p></div>
                  </CardContent>
                </Card>
              )}
              {recs.map(r => (
                <Card key={r.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-medium text-sm">{r.fromName}</p>
                      <div className="flex gap-1">
                        {[1,2,3,4,5].map(i => <Star key={i} className={`h-3.5 w-3.5 ${i <= r.experience ? "text-yellow-400 fill-yellow-400" : "text-muted-foreground"}`} />)}
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">{r.text}</p>
                    <p className="text-xs text-muted-foreground mt-2">{formatDistanceToNow(new Date(r.createdAt), { addSuffix: true })}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="skills">
          <Card><CardContent className="p-4">
            {(profile.skills || []).length === 0 ? (
              <p className="text-muted-foreground text-sm">No skills added yet. Edit your profile to add skills.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {(profile.skills || []).map((s: string) => <Badge key={s} variant="secondary">{s}</Badge>)}
              </div>
            )}
          </CardContent></Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
