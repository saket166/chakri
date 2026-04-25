import { useEffect, useState } from "react";
import { useRoute, Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MapPin, Building2, Award, Briefcase, GraduationCap, Star, FileText, Copy, Check, UserPlus, ArrowLeft } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { getCachedUser } from "@/lib/api";

async function fetchPublicProfile(id: string) {
  const r = await fetch(`/api/users/${id}`);
  if (!r.ok) throw new Error("User not found");
  return r.json();
}

async function fetchRecs(id: string) {
  const tok = localStorage.getItem("chakri_token") || "";
  const r = await fetch(`/api/recommendations/${id}`, { headers: { Authorization: `Bearer ${tok}` } });
  return r.ok ? r.json() : [];
}

export default function PublicProfile() {
  const [, params] = useRoute("/profile/:id");
  const userId = params?.id;

  const [profile, setProfile] = useState<any>(null);
  const [recs, setRecs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [copied, setCopied] = useState(false);

  const me = getCachedUser();
  const isOwnProfile = me?.id === userId;

  useEffect(() => {
    if (!userId) return;
    Promise.all([fetchPublicProfile(userId), fetchRecs(userId)])
      .then(([p, r]) => { setProfile(p); setRecs(r); })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [userId]);

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="space-y-4 animate-pulse">
        <div className="h-32 rounded-2xl shimmer" />
        <div className="h-8 rounded-xl shimmer w-1/2" />
        <div className="h-4 rounded shimmer w-1/3" />
      </div>
    </div>
  );

  if (notFound || !profile) return (
    <div className="container mx-auto px-4 py-16 max-w-xl text-center">
      <p className="text-6xl font-black text-muted/30 mb-4">404</p>
      <p className="text-xl font-bold mb-2">Profile not found</p>
      <p className="text-muted-foreground mb-6">This profile doesn't exist or may have been removed.</p>
      <Link href="/home">
        <Button variant="outline"><ArrowLeft className="h-4 w-4 mr-2" />Go Home</Button>
      </Link>
    </div>
  );

  const initials = (profile.name || "?").split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();
  const avgExp = recs.length > 0 ? (recs.reduce((s: number, r: any) => s + r.experience, 0) / recs.length).toFixed(1) : null;

  return (
    <div className="container mx-auto px-4 py-6 max-w-3xl">

      {/* Back */}
      <Link href="/home" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-5 transition-colors">
        <ArrowLeft className="h-3.5 w-3.5" />Back
      </Link>

      {/* ── Profile Hero Card ── */}
      <Card className="overflow-hidden mb-5 shadow-md">
        {/* Gradient banner */}
        <div className="h-24 bg-gradient-to-r from-primary via-rose-500 to-rose-700 relative">
          <div className="absolute inset-0 opacity-30" style={{
            backgroundImage: "radial-gradient(circle at 20% 50%, rgba(255,255,255,0.3) 0%, transparent 60%)"
          }} />
        </div>
        <CardContent className="px-6 pb-6 -mt-10">
          <div className="flex items-end justify-between gap-4 flex-wrap">
            <Avatar className="h-20 w-20 border-4 border-background shadow-lg">
              {profile.avatarUrl && <AvatarFallback className="text-3xl">{initials}</AvatarFallback>}
              <AvatarFallback className="bg-gradient-to-br from-primary to-rose-600 text-white text-2xl font-black">{initials}</AvatarFallback>
            </Avatar>
            <div className="flex items-center gap-2 pb-1">
              {isOwnProfile ? (
                <Link href="/profile">
                  <Button size="sm" variant="outline">Edit Profile</Button>
                </Link>
              ) : (
                <Link href="/connections">
                  <Button size="sm" className="gap-1.5">
                    <UserPlus className="h-3.5 w-3.5" />Connect
                  </Button>
                </Link>
              )}
              <Button size="sm" variant="outline" onClick={copyLink} className="gap-1.5">
                {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? "Copied!" : "Share"}
              </Button>
            </div>
          </div>

          <div className="mt-3">
            <h1 className="text-2xl font-black leading-tight">{profile.name}</h1>
            {profile.headline && <p className="text-muted-foreground mt-0.5 leading-snug">{profile.headline}</p>}
            <div className="flex flex-wrap gap-3 mt-3 text-sm text-muted-foreground">
              {profile.company && (
                <span className="flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5 text-primary" />{profile.company}
                </span>
              )}
              {profile.location && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5" />{profile.location}
                </span>
              )}
            </div>
            {/* Stats row */}
            <div className="flex gap-5 mt-4 pt-4 border-t border-border/60">
              <div className="text-center">
                <p className="text-xl font-black text-primary">{profile.referralCount || 0}</p>
                <p className="text-[11px] text-muted-foreground font-medium">Referrals Given</p>
              </div>
              {avgExp && (
                <div className="text-center">
                  <p className="text-xl font-black text-amber-500">{avgExp}/5</p>
                  <p className="text-[11px] text-muted-foreground font-medium">Avg Rating</p>
                </div>
              )}
              {recs.length > 0 && (
                <div className="text-center">
                  <p className="text-xl font-black">{recs.length}</p>
                  <p className="text-[11px] text-muted-foreground font-medium">Reviews</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bio */}
      {profile.bio && (
        <Card className="mb-5 shadow-sm">
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground leading-relaxed">{profile.bio}</p>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs defaultValue="experience">
        <TabsList className="grid grid-cols-4 w-full mb-4">
          <TabsTrigger value="experience"><Briefcase className="h-3.5 w-3.5 mr-1 hidden sm:inline" />Experience</TabsTrigger>
          <TabsTrigger value="education"><GraduationCap className="h-3.5 w-3.5 mr-1 hidden sm:inline" />Education</TabsTrigger>
          <TabsTrigger value="skills">Skills</TabsTrigger>
          <TabsTrigger value="reviews">
            Reviews {recs.length > 0 && <span className="ml-1 text-[10px] bg-primary/15 text-primary rounded-full px-1.5 py-0.5 font-bold">{recs.length}</span>}
          </TabsTrigger>
        </TabsList>

        {/* Experience */}
        <TabsContent value="experience" className="space-y-3">
          {(profile.workHistory || []).length === 0 ? (
            <Card><CardContent className="py-10 text-center text-muted-foreground text-sm">No experience listed.</CardContent></Card>
          ) : (profile.workHistory || []).map((w: any, i: number) => (
            <Card key={i} className="shadow-sm hover-lift-sm">
              <CardContent className="p-4">
                <p className="font-semibold leading-tight">{w.role}</p>
                <p className="text-sm text-muted-foreground">{w.company}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{w.startYear}{w.endYear ? ` – ${w.endYear}` : " – Present"}</p>
                {w.description && <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{w.description}</p>}
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Education */}
        <TabsContent value="education" className="space-y-3">
          {(profile.education || []).length === 0 ? (
            <Card><CardContent className="py-10 text-center text-muted-foreground text-sm">No education listed.</CardContent></Card>
          ) : (profile.education || []).map((e: any, i: number) => (
            <Card key={i} className="shadow-sm hover-lift-sm">
              <CardContent className="p-4">
                <p className="font-semibold">{e.institution}</p>
                <p className="text-sm text-muted-foreground">{e.degree}{e.field ? ` · ${e.field}` : ""}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{e.startYear}{e.endYear ? ` – ${e.endYear}` : ""}</p>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Skills */}
        <TabsContent value="skills">
          {(profile.skills || []).length === 0 ? (
            <Card><CardContent className="py-10 text-center text-muted-foreground text-sm">No skills listed.</CardContent></Card>
          ) : (
            <Card className="shadow-sm">
              <CardContent className="p-5">
                <div className="flex flex-wrap gap-2">
                  {(profile.skills || []).map((s: string) => (
                    <Badge key={s} variant="secondary" className="text-sm px-3 py-1">{s}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Reviews */}
        <TabsContent value="reviews" className="space-y-3">
          {recs.length === 0 ? (
            <Card><CardContent className="py-10 text-center text-muted-foreground text-sm">No reviews yet.</CardContent></Card>
          ) : (
            <>
              {avgExp && (
                <Card className="shadow-sm bg-primary/5 border-primary/20">
                  <CardContent className="p-4 flex gap-8">
                    <div className="text-center">
                      <p className="text-2xl font-black text-primary">{avgExp}/5</p>
                      <p className="text-xs text-muted-foreground">Avg Rating</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-black">{recs.length}</p>
                      <p className="text-xs text-muted-foreground">Total Reviews</p>
                    </div>
                  </CardContent>
                </Card>
              )}
              {recs.map((r: any) => (
                <Card key={r.id} className="shadow-sm hover-lift-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-semibold text-sm">{r.fromName}</p>
                      <div className="flex gap-0.5">
                        {[1,2,3,4,5].map(i => (
                          <Star key={i} className={`h-3.5 w-3.5 ${i <= r.experience ? "text-amber-400 fill-amber-400" : "text-muted-foreground"}`} />
                        ))}
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">{r.text}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {formatDistanceToNow(new Date(r.createdAt), { addSuffix: true })}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
