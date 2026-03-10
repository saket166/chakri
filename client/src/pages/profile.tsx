import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SkillBadge } from "@/components/skill-badge";
import {
  Edit, MapPin, Building2, Award, GraduationCap, FileText, Briefcase,
  Save, X, Plus, Trash2,
} from "lucide-react";
import { getProfile, saveProfile, getUserRatings, type UserProfile } from "@/lib/userStore";
import { Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Profile() {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState<UserProfile>(getProfile());
  const [draft, setDraft] = useState<UserProfile>(getProfile());
  const [newSkill, setNewSkill] = useState("");

  // Reload if updated elsewhere (e.g. sidebar)
  useEffect(() => {
    const handler = () => { const p = getProfile(); setProfile(p); };
    window.addEventListener("chakri_profile_updated", handler);
    return () => window.removeEventListener("chakri_profile_updated", handler);
  }, []);

  const startEdit = () => {
    setDraft(JSON.parse(JSON.stringify(profile)));
    setIsEditing(true);
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setNewSkill("");
  };

  const saveEdit = () => {
    const updated = saveProfile(draft);
    setProfile(updated);
    setIsEditing(false);
    setNewSkill("");
    toast({ title: "Profile saved!", description: "Your changes have been saved." });
  };

  const d = isEditing ? draft : profile;

  const setField = (field: keyof UserProfile, value: any) =>
    setDraft((prev) => ({ ...prev, [field]: value }));

  const addSkill = () => {
    const s = newSkill.trim();
    if (s && !draft.skills.includes(s)) {
      setDraft((p) => ({ ...p, skills: [...p.skills, s] }));
      setNewSkill("");
    }
  };

  const initials = (d.name || "?").split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="container mx-auto px-4 py-6 max-w-5xl">
      {/* Header Card */}
      <Card className="mb-6">
        <div className="h-32 bg-gradient-to-r from-primary/20 via-primary/10 to-primary/5 rounded-t-lg" />
        <CardContent className="pt-0">
          <div className="flex flex-col md:flex-row gap-6 items-start -mt-16 md:-mt-12">
            <div className="relative group">
              <Avatar className="h-32 w-32 border-4 border-background text-3xl font-bold">
                {profile.avatarUrl && <AvatarImage src={profile.avatarUrl} alt={profile.name} className="object-cover" />}
                <AvatarFallback className="bg-primary text-primary-foreground text-3xl font-bold">{initials}</AvatarFallback>
              </Avatar>
              <label className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                <span className="text-white text-xs font-medium text-center leading-tight">Upload<br/>Photo</span>
                <input type="file" accept="image/*" className="hidden" onChange={e => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = ev => {
                    const url = ev.target?.result as string;
                    saveProfile({ avatarUrl: url });
                    setProfile(p => ({ ...p, avatarUrl: url }));
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
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label>Full Name</Label>
                          <Input value={draft.name} onChange={(e) => setField("name", e.target.value)} placeholder="Your Name" />
                        </div>
                        <div>
                          <Label>Headline</Label>
                          <Input value={draft.headline} onChange={(e) => setField("headline", e.target.value)} placeholder="Software Engineer at Infosys" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label>Company</Label>
                          <Input value={draft.company} onChange={(e) => setField("company", e.target.value)} placeholder="Company Name" />
                        </div>
                        <div>
                          <Label>Location</Label>
                          <Input value={draft.location} onChange={(e) => setField("location", e.target.value)} placeholder="City, State" />
                        </div>
                      </div>
                      <div>
                        <Label>Bio</Label>
                        <Textarea value={draft.bio} onChange={(e) => setField("bio", e.target.value)} placeholder="Tell people about yourself..." rows={2} />
                      </div>
                    </div>
                  ) : (
                    <>
                      <h1 className="text-3xl font-bold">{d.name || "Your Name"}</h1>
                      {d.headline && <p className="text-lg text-muted-foreground mt-1">{d.headline}</p>}
                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground flex-wrap">
                        {d.location && <span className="flex items-center gap-1"><MapPin className="h-4 w-4" />{d.location}</span>}
                        {d.company && <span className="flex items-center gap-1"><Building2 className="h-4 w-4" />{d.company}</span>}
                      </div>
                      {d.bio && <p className="mt-2 text-sm text-muted-foreground">{d.bio}</p>}
                    </>
                  )}
                </div>
                <div className="flex gap-2 shrink-0">
                  {isEditing ? (
                    <>
                      <Button variant="outline" size="sm" onClick={cancelEdit}><X className="h-4 w-4 mr-1" />Cancel</Button>
                      <Button size="sm" onClick={saveEdit}><Save className="h-4 w-4 mr-1" />Save</Button>
                    </>
                  ) : (
                    <Button variant="outline" onClick={startEdit} data-testid="button-edit-profile">
                      <Edit className="h-4 w-4 mr-2" />Edit Profile
                    </Button>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-4 mt-4">
                <div className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-yellow-500" />
                  <div>
                    <p className="text-2xl font-bold">{(d.points || 0).toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">Chakri Coins</p>
                  </div>
                </div>
                <div className="h-12 w-px bg-border" />
                <div>
                  <p className="text-2xl font-bold">142</p>
                  <p className="text-xs text-muted-foreground">Connections</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="experience" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="experience" data-testid="tab-experience">Experience</TabsTrigger>
          <TabsTrigger value="education" data-testid="tab-education">Education</TabsTrigger>
          <TabsTrigger value="skills" data-testid="tab-skills">Skills</TabsTrigger>
          <TabsTrigger value="certifications" data-testid="tab-certifications">Certifications</TabsTrigger>
          <TabsTrigger value="ratings">Ratings</TabsTrigger>
        </TabsList>

        {/* EXPERIENCE */}
        <TabsContent value="experience">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Briefcase className="h-5 w-5" />Work Experience</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {isEditing ? (
                <>
                  {draft.workHistory.map((w, i) => (
                    <div key={i} className="p-3 border rounded-lg space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-muted-foreground">Entry {i + 1}</span>
                        <Button variant="ghost" size="sm" onClick={() => setDraft((p) => ({ ...p, workHistory: p.workHistory.filter((_, j) => j !== i) }))}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <Input placeholder="Company" value={w.company} onChange={(e) => { const wh = [...draft.workHistory]; wh[i] = { ...wh[i], company: e.target.value }; setField("workHistory", wh); }} />
                        <Input placeholder="Position" value={w.position} onChange={(e) => { const wh = [...draft.workHistory]; wh[i] = { ...wh[i], position: e.target.value }; setField("workHistory", wh); }} />
                      </div>
                      <Input placeholder="Duration e.g. Jan 2020 - Present" value={w.duration} onChange={(e) => { const wh = [...draft.workHistory]; wh[i] = { ...wh[i], duration: e.target.value }; setField("workHistory", wh); }} />
                      <Textarea placeholder="Description" rows={2} value={w.description} onChange={(e) => { const wh = [...draft.workHistory]; wh[i] = { ...wh[i], description: e.target.value }; setField("workHistory", wh); }} />
                    </div>
                  ))}
                  <Button variant="outline" className="w-full" onClick={() => setDraft((p) => ({ ...p, workHistory: [...p.workHistory, { company: "", position: "", duration: "", description: "" }] }))}>
                    <Plus className="h-4 w-4 mr-2" />Add Experience
                  </Button>
                </>
              ) : d.workHistory.length > 0 ? (
                d.workHistory.map((w, i) => (
                  <div key={i} className="flex gap-4 pb-4 border-b last:border-0 last:pb-0">
                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Briefcase className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold">{w.position}</p>
                      <p className="text-sm text-muted-foreground">{w.company}</p>
                      <p className="text-xs text-muted-foreground">{w.duration}</p>
                      {w.description && <p className="text-sm mt-1">{w.description}</p>}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground text-sm">No experience added yet. Click "Edit Profile" to add.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* EDUCATION */}
        <TabsContent value="education">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><GraduationCap className="h-5 w-5" />Education</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {isEditing ? (
                <>
                  {draft.education.map((e, i) => (
                    <div key={i} className="p-3 border rounded-lg space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-muted-foreground">Entry {i + 1}</span>
                        <Button variant="ghost" size="sm" onClick={() => setDraft((p) => ({ ...p, education: p.education.filter((_, j) => j !== i) }))}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                      <Input placeholder="Institution e.g. IIT Bombay" value={e.institution} onChange={(ev) => { const ed = [...draft.education]; ed[i] = { ...ed[i], institution: ev.target.value }; setField("education", ed); }} />
                      <Input placeholder="Degree e.g. B.Tech Computer Science" value={e.degree} onChange={(ev) => { const ed = [...draft.education]; ed[i] = { ...ed[i], degree: ev.target.value }; setField("education", ed); }} />
                      <Input placeholder="Duration e.g. 2018 - 2022" value={e.duration} onChange={(ev) => { const ed = [...draft.education]; ed[i] = { ...ed[i], duration: ev.target.value }; setField("education", ed); }} />
                    </div>
                  ))}
                  <Button variant="outline" className="w-full" onClick={() => setDraft((p) => ({ ...p, education: [...p.education, { institution: "", degree: "", duration: "" }] }))}>
                    <Plus className="h-4 w-4 mr-2" />Add Education
                  </Button>
                </>
              ) : d.education.length > 0 ? (
                d.education.map((e, i) => (
                  <div key={i} className="flex gap-4 pb-4 border-b last:border-0 last:pb-0" data-testid={`education-${i}`}>
                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0"><GraduationCap className="h-5 w-5 text-primary" /></div>
                    <div>
                      <p className="font-semibold">{e.degree}</p>
                      <p className="text-sm text-muted-foreground">{e.institution}</p>
                      <p className="text-xs text-muted-foreground">{e.duration}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground text-sm">No education added yet. Click "Edit Profile" to add.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* SKILLS */}
        <TabsContent value="skills">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Skills</CardTitle>
                <span className="text-sm text-muted-foreground">{d.skills.length} skills</span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2 mb-4">
                {d.skills.length > 0 ? d.skills.map((skill) => (
                  <SkillBadge key={skill} skill={skill} endorsements={Math.floor(Math.random() * 30) + 5}
                    editable={isEditing}
                    onRemove={(s) => setDraft((p) => ({ ...p, skills: p.skills.filter((x) => x !== s) }))} />
                )) : <p className="text-muted-foreground text-sm">No skills added yet. Click "Edit Profile" to add.</p>}
              </div>
              {isEditing && (
                <div className="pt-4 border-t">
                  <p className="text-sm text-muted-foreground mb-2">Add a new skill</p>
                  <div className="flex gap-2">
                    <Input placeholder="e.g. React, Java, SQL" value={newSkill}
                      onChange={(e) => setNewSkill(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSkill())}
                      data-testid="input-add-skill" />
                    <Button onClick={addSkill} data-testid="button-add-skill">Add</Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* CERTIFICATIONS */}
        <TabsContent value="certifications">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" />Certifications</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {isEditing ? (
                <>
                  {draft.certifications.map((c, i) => (
                    <div key={i} className="p-3 border rounded-lg space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-muted-foreground">Entry {i + 1}</span>
                        <Button variant="ghost" size="sm" onClick={() => setDraft((p) => ({ ...p, certifications: p.certifications.filter((_, j) => j !== i) }))}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                      <Input placeholder="Certificate Name e.g. AWS Solutions Architect" value={c.name} onChange={(e) => { const ct = [...draft.certifications]; ct[i] = { ...ct[i], name: e.target.value }; setField("certifications", ct); }} />
                      <div className="grid grid-cols-2 gap-2">
                        <Input placeholder="Issuer e.g. Amazon" value={c.issuer} onChange={(e) => { const ct = [...draft.certifications]; ct[i] = { ...ct[i], issuer: e.target.value }; setField("certifications", ct); }} />
                        <Input placeholder="Year e.g. 2023" value={c.year} onChange={(e) => { const ct = [...draft.certifications]; ct[i] = { ...ct[i], year: e.target.value }; setField("certifications", ct); }} />
                      </div>
                    </div>
                  ))}
                  <Button variant="outline" className="w-full" onClick={() => setDraft((p) => ({ ...p, certifications: [...p.certifications, { name: "", issuer: "", year: "" }] }))}>
                    <Plus className="h-4 w-4 mr-2" />Add Certification
                  </Button>
                </>
              ) : d.certifications.length > 0 ? (
                d.certifications.map((c, i) => (
                  <div key={i} className="flex items-start gap-4 p-4 rounded-lg border" data-testid={`certification-${i}`}>
                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0"><Award className="h-6 w-6 text-primary" /></div>
                    <div className="flex-1">
                      <h4 className="font-semibold">{c.name}</h4>
                      <p className="text-sm text-muted-foreground">{c.issuer}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="secondary" className="text-xs">Verified</Badge>
                        <span className="text-xs text-muted-foreground">{c.year}</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground text-sm">No certifications added yet. Click "Edit Profile" to add.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* RATINGS */}
        <TabsContent value="ratings">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Star className="h-5 w-5 text-yellow-500" />My Ratings</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {(() => {
                const ratings = getUserRatings();
                if (ratings.length === 0) return <p className="text-muted-foreground text-sm">No ratings yet. Complete referrals to get rated.</p>;
                const avg = (ratings.reduce((s, r) => s + r.overall, 0) / ratings.length).toFixed(1);
                return <>
                  <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                    <Star className="h-6 w-6 text-yellow-500 fill-yellow-400" />
                    <div>
                      <p className="text-2xl font-bold">{avg}</p>
                      <p className="text-xs text-muted-foreground">{ratings.length} rating{ratings.length !== 1 ? "s" : ""}</p>
                    </div>
                  </div>
                  {ratings.map((r, i) => (
                    <div key={i} className="border rounded-lg p-3 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{r.fromName}</span>
                        <div className="flex gap-0.5">{[1,2,3,4,5].map(n => <Star key={n} className={"h-3.5 w-3.5 " + (n <= r.overall ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground")} />)}</div>
                      </div>
                      <div className="flex gap-4 text-xs text-muted-foreground">
                        <span>Speed: {r.speed}⭐</span>
                        <span>Communication: {r.communication}⭐</span>
                      </div>
                      {r.comment && <p className="text-xs text-muted-foreground italic">"{r.comment}"</p>}
                    </div>
                  ))}
                </>;
              })()}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
