import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Edit, MapPin, Building2, Award, Save, X, Star, ThumbsUp, Plus, Trash2, GraduationCap, Briefcase, FileText } from "lucide-react";
import { api, getCachedUser } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

export default function Profile() {
  const { toast } = useToast();
  const [profile, setProfile] = useState<any>(getCachedUser() || {});
  const [recs, setRecs] = useState<any[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState<any>({});
  const [newSkill, setNewSkill] = useState("");

  useEffect(() => {
    api.auth.me().then(u => { setProfile(u); setDraft(u); });
    if (getCachedUser()?.id) api.users.recommendations(getCachedUser().id).then(setRecs);
  }, []);

  const save = async () => {
    const updated = await api.auth.update(draft);
    setProfile(updated); setIsEditing(false);
    toast({ title: "Profile saved!" });
  };

  const setField = (field: string, value: any) => setDraft((p: any) => ({ ...p, [field]: value }));

  const addSkill = () => {
    const s = newSkill.trim();
    if (s && !(draft.skills || []).includes(s)) {
      setField("skills", [...(draft.skills || []), s]);
      setNewSkill("");
    }
  };

  const removeSkill = (s: string) => setField("skills", (draft.skills || []).filter((x: string) => x !== s));

  // Work history helpers
  const addWork = () => setField("workHistory", [...(draft.workHistory || []), { company: "", role: "", period: "", description: "" }]);
  const updateWork = (i: number, key: string, val: string) => {
    const arr = [...(draft.workHistory || [])];
    arr[i] = { ...arr[i], [key]: val };
    setField("workHistory", arr);
  };
  const removeWork = (i: number) => setField("workHistory", (draft.workHistory || []).filter((_: any, idx: number) => idx !== i));

  // Education helpers
  const addEdu = () => setField("education", [...(draft.education || []), { institution: "", degree: "", year: "" }]);
  const updateEdu = (i: number, key: string, val: string) => {
    const arr = [...(draft.education || [])];
    arr[i] = { ...arr[i], [key]: val };
    setField("education", arr);
  };
  const removeEdu = (i: number) => setField("education", (draft.education || []).filter((_: any, idx: number) => idx !== i));

  // Cert helpers
  const addCert = () => setField("certifications", [...(draft.certifications || []), { name: "", issuer: "", year: "" }]);
  const updateCert = (i: number, key: string, val: string) => {
    const arr = [...(draft.certifications || [])];
    arr[i] = { ...arr[i], [key]: val };
    setField("certifications", arr);
  };
  const removeCert = (i: number) => setField("certifications", (draft.certifications || []).filter((_: any, idx: number) => idx !== i));

  const d = isEditing ? draft : profile;
  const initials = (d?.name || "?").split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();
  const avgExp = recs.length ? (recs.reduce((a: number, r: any) => a + r.experience, 0) / recs.length).toFixed(1) : null;

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
                      <Input placeholder="Full Name" value={draft.name || ""} onChange={e => setField("name", e.target.value)} />
                      <Input placeholder="Headline (e.g. SDE-2 at Google)" value={draft.headline || ""} onChange={e => setField("headline", e.target.value)} />
                      <div className="grid grid-cols-2 gap-2">
                        <Input placeholder="Company" value={draft.company || ""} onChange={e => setField("company", e.target.value)} />
                        <Input placeholder="Location" value={draft.location || ""} onChange={e => setField("location", e.target.value)} />
                      </div>
                      <Input placeholder="Phone" value={draft.phone || ""} onChange={e => setField("phone", e.target.value)} />
                      <Textarea placeholder="Bio" value={draft.bio || ""} onChange={e => setField("bio", e.target.value)} rows={3} />
                    </div>
                  ) : (
                    <>
                      <h1 className="text-2xl font-bold">{d?.name || "Your Name"}</h1>
                      <p className="text-muted-foreground mt-1">{d?.headline || "Add your headline"}</p>
                      <div className="flex flex-wrap gap-3 mt-2 text-sm text-muted-foreground">
                        {d?.company && <span className="flex items-center gap-1"><Building2 className="h-3.5 w-3.5" />{d.company}</span>}
                        {d?.location && <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{d.location}</span>}
                      </div>
                      {d?.bio && <p className="text-sm mt-3 text-muted-foreground">{d.bio}</p>}
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
                      <Edit className="h-3.5 w-3.5 mr-1" />Edit Profile
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

      <Tabs defaultValue="experience">
        <TabsList className="mb-4 grid grid-cols-4 w-full">
          <TabsTrigger value="experience"><Briefcase className="h-3.5 w-3.5 mr-1 hidden sm:inline" />Experience</TabsTrigger>
          <TabsTrigger value="education"><GraduationCap className="h-3.5 w-3.5 mr-1 hidden sm:inline" />Education</TabsTrigger>
          <TabsTrigger value="skills">Skills</TabsTrigger>
          <TabsTrigger value="certifications"><FileText className="h-3.5 w-3.5 mr-1 hidden sm:inline" />Certs</TabsTrigger>
        </TabsList>

        {/* Experience */}
        <TabsContent value="experience" className="space-y-3">
          <div className="flex gap-2">
            {!isEditing && <Button size="sm" variant="outline" onClick={() => { setDraft(profile); setIsEditing(true); }}><Edit className="h-3.5 w-3.5 mr-1" />Edit</Button>}
            {isEditing && <Button size="sm" onClick={addWork}><Plus className="h-3.5 w-3.5 mr-1" />Add Experience</Button>}
            {isEditing && <Button size="sm" variant="outline" onClick={save}><Save className="h-3.5 w-3.5 mr-1" />Save</Button>}
          </div>
          {(isEditing ? draft.workHistory : profile.workHistory || [])?.map((w: any, i: number) => (
            <Card key={i}><CardContent className="p-4">
              {isEditing ? (
                <div className="space-y-2">
                  <div className="flex justify-between"><Input placeholder="Company" value={w.company} onChange={e => updateWork(i, "company", e.target.value)} /><Button size="sm" variant="ghost" onClick={() => removeWork(i)} className="ml-2"><Trash2 className="h-4 w-4 text-destructive" /></Button></div>
                  <Input placeholder="Role / Title" value={w.role} onChange={e => updateWork(i, "role", e.target.value)} />
                  <Input placeholder="Period (e.g. Jan 2022 – Present)" value={w.period} onChange={e => updateWork(i, "period", e.target.value)} />
                  <Textarea placeholder="Description" value={w.description} onChange={e => updateWork(i, "description", e.target.value)} rows={2} />
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-start">
                    <div><p className="font-semibold">{w.role}</p><p className="text-sm text-muted-foreground">{w.company}</p></div>
                    <span className="text-xs text-muted-foreground">{w.period}</span>
                  </div>
                  {w.description && <p className="text-sm mt-2 text-muted-foreground">{w.description}</p>}
                </>
              )}
            </CardContent></Card>
          ))}
          {!isEditing && !(profile.workHistory || []).length && <p className="text-sm text-muted-foreground">No experience added yet. Click Edit Profile to add.</p>}
        </TabsContent>

        {/* Education */}
        <TabsContent value="education" className="space-y-3">
          <div className="flex gap-2">
            {!isEditing && <Button size="sm" variant="outline" onClick={() => { setDraft(profile); setIsEditing(true); }}><Edit className="h-3.5 w-3.5 mr-1" />Edit</Button>}
            {isEditing && <Button size="sm" onClick={addEdu}><Plus className="h-3.5 w-3.5 mr-1" />Add Education</Button>}
            {isEditing && <Button size="sm" variant="outline" onClick={save}><Save className="h-3.5 w-3.5 mr-1" />Save</Button>}
          </div>
          {(isEditing ? draft.education : profile.education || [])?.map((e: any, i: number) => (
            <Card key={i}><CardContent className="p-4">
              {isEditing ? (
                <div className="space-y-2">
                  <div className="flex justify-between"><Input placeholder="Institution" value={e.institution} onChange={ev => updateEdu(i, "institution", ev.target.value)} /><Button size="sm" variant="ghost" onClick={() => removeEdu(i)} className="ml-2"><Trash2 className="h-4 w-4 text-destructive" /></Button></div>
                  <Input placeholder="Degree / Course" value={e.degree} onChange={ev => updateEdu(i, "degree", ev.target.value)} />
                  <Input placeholder="Year (e.g. 2019–2023)" value={e.year} onChange={ev => updateEdu(i, "year", ev.target.value)} />
                </div>
              ) : (
                <div className="flex justify-between items-start">
                  <div><p className="font-semibold">{e.degree}</p><p className="text-sm text-muted-foreground">{e.institution}</p></div>
                  <span className="text-xs text-muted-foreground">{e.year}</span>
                </div>
              )}
            </CardContent></Card>
          ))}
          {!isEditing && !(profile.education || []).length && <p className="text-sm text-muted-foreground">No education added yet. Click Edit Profile to add.</p>}
        </TabsContent>

        {/* Skills */}
        <TabsContent value="skills">
          <Card><CardContent className="p-4 space-y-3">
            {isEditing && (
              <div className="flex gap-2">
                <Input placeholder="Add a skill (e.g. React, Python)" value={newSkill} onChange={e => setNewSkill(e.target.value)} onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addSkill())} />
                <Button size="sm" onClick={addSkill}><Plus className="h-4 w-4" /></Button>
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              {(isEditing ? draft.skills : profile.skills || [])?.map((s: string) => (
                <Badge key={s} variant="secondary" className="gap-1">
                  {s}
                  {isEditing && <button onClick={() => removeSkill(s)}><X className="h-3 w-3" /></button>}
                </Badge>
              ))}
              {!(isEditing ? draft.skills : profile.skills || [])?.length && <p className="text-sm text-muted-foreground">No skills added yet.</p>}
            </div>
          </CardContent></Card>
        </TabsContent>

        {/* Certifications */}
        <TabsContent value="certifications" className="space-y-3">
          <div className="flex gap-2">
            {!isEditing && <Button size="sm" variant="outline" onClick={() => { setDraft(profile); setIsEditing(true); }}><Edit className="h-3.5 w-3.5 mr-1" />Edit</Button>}
            {isEditing && <Button size="sm" onClick={addCert}><Plus className="h-3.5 w-3.5 mr-1" />Add Certification</Button>}
            {isEditing && <Button size="sm" variant="outline" onClick={save}><Save className="h-3.5 w-3.5 mr-1" />Save</Button>}
          </div>
          {(isEditing ? draft.certifications : profile.certifications || [])?.map((c: any, i: number) => (
            <Card key={i}><CardContent className="p-4">
              {isEditing ? (
                <div className="space-y-2">
                  <div className="flex justify-between"><Input placeholder="Certification Name" value={c.name} onChange={e => updateCert(i, "name", e.target.value)} /><Button size="sm" variant="ghost" onClick={() => removeCert(i)} className="ml-2"><Trash2 className="h-4 w-4 text-destructive" /></Button></div>
                  <Input placeholder="Issuer (e.g. AWS, Google)" value={c.issuer} onChange={e => updateCert(i, "issuer", e.target.value)} />
                  <Input placeholder="Year" value={c.year} onChange={e => updateCert(i, "year", e.target.value)} />
                </div>
              ) : (
                <div className="flex justify-between items-start">
                  <div><p className="font-semibold">{c.name}</p><p className="text-sm text-muted-foreground">{c.issuer}</p></div>
                  <span className="text-xs text-muted-foreground">{c.year}</span>
                </div>
              )}
            </CardContent></Card>
          ))}
          {!isEditing && !(profile.certifications || []).length && <p className="text-sm text-muted-foreground">No certifications added yet. Click Edit Profile to add.</p>}
        </TabsContent>

        {/* Recommendations */}
        <TabsContent value="recommendations">
          {recs.length === 0 ? (
            <Card><CardContent className="py-12 text-center text-muted-foreground">
              <ThumbsUp className="h-10 w-10 mx-auto mb-3 opacity-20" />
              <p className="font-medium">No recommendations yet</p>
              <p className="text-sm mt-1">Recommendations appear here after you successfully refer someone</p>
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
