import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { api, getCachedUser, setSession } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Trash2, ArrowRight, ArrowLeft, CheckCircle } from "lucide-react";

export default function Onboarding() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const user = getCachedUser();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Step 1: Basics
  const [headline, setHeadline] = useState(user?.headline || "");
  const [company, setCompany] = useState(user?.company || "");
  const [userLoc, setUserLoc] = useState(user?.location || "");

  // Step 2: Experience
  const [workHistory, setWorkHistory] = useState<any[]>(user?.workHistory || []);
  const [expRole, setExpRole] = useState("");
  const [expCompany, setExpCompany] = useState("");
  const [expPeriod, setExpPeriod] = useState("");

  // Step 3: Education
  const [education, setEducation] = useState<any[]>(user?.education || []);
  const [eduDegree, setEduDegree] = useState("");
  const [eduInst, setEduInst] = useState("");
  const [eduYear, setEduYear] = useState("");

  const addExp = () => {
    if (!expRole || !expCompany) return;
    setWorkHistory([...workHistory, { role: expRole, company: expCompany, period: expPeriod }]);
    setExpRole(""); setExpCompany(""); setExpPeriod("");
  };

  const addEdu = () => {
    if (!eduDegree || !eduInst) return;
    setEducation([...education, { degree: eduDegree, institution: eduInst, year: eduYear }]);
    setEduDegree(""); setEduInst(""); setEduYear("");
  };

  const handleComplete = async () => {
    setLoading(true);
    try {
      const updatedUser = await api.auth.update({
        headline,
        company,
        location: userLoc,
        workHistory,
        education,
        onboarded: true,
      });
      // Update local cache
      const token = localStorage.getItem("chakri_token") || "";
      setSession(updatedUser.id, updatedUser, token);
      toast({ title: "Welcome to Chakri! 🎉" });
      window.location.href = "/home";
    } catch (e: any) {
      toast({ title: e.message || "Failed to save profile", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-primary/10 to-background px-4 py-12">
      <Card className="w-full max-w-xl shadow-lg">
        <CardHeader className="text-center pb-2">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className={`h-2.5 flex-1 rounded-full ${step >= 1 ? "bg-primary" : "bg-muted"}`} />
            <div className={`h-2.5 flex-1 rounded-full ${step >= 2 ? "bg-primary" : "bg-muted"}`} />
            <div className={`h-2.5 flex-1 rounded-full ${step >= 3 ? "bg-primary" : "bg-muted"}`} />
          </div>
          <CardTitle className="text-2xl">Complete your profile</CardTitle>
          <CardDescription>This helps people find you and give you referrals.</CardDescription>
        </CardHeader>
        
        <CardContent className="pt-6">
          {step === 1 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
              <div className="space-y-2">
                <Label>Current Role / Headline</Label>
                <Input placeholder="e.g. Senior Software Engineer" value={headline} onChange={e => setHeadline(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Current Company</Label>
                <Input placeholder="e.g. Google" value={company} onChange={e => setCompany(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Location</Label>
                <Input placeholder="e.g. Bengaluru, India" value={userLoc} onChange={e => setUserLoc(e.target.value)} />
              </div>
              <Button className="w-full mt-6" onClick={() => setStep(2)}>
                Continue <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
              <div className="space-y-3 mb-6">
                {workHistory.map((w, i) => (
                  <div key={i} className="flex justify-between items-center p-3 border rounded-lg bg-muted/30">
                    <div>
                      <p className="font-semibold text-sm">{w.role}</p>
                      <p className="text-xs text-muted-foreground">{w.company} • {w.period}</p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => setWorkHistory(h => h.filter((_, idx) => idx !== i))}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>

              <div className="p-4 border rounded-lg bg-background space-y-3">
                <h3 className="font-medium text-sm">Add Experience</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5"><Label className="text-xs">Role</Label><Input className="h-8 text-sm" placeholder="SDE II" value={expRole} onChange={e => setExpRole(e.target.value)} /></div>
                  <div className="space-y-1.5"><Label className="text-xs">Company</Label><Input className="h-8 text-sm" placeholder="Amazon" value={expCompany} onChange={e => setExpCompany(e.target.value)} /></div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Period</Label>
                  <Input className="h-8 text-sm" placeholder="2020 - Present" value={expPeriod} onChange={e => setExpPeriod(e.target.value)} />
                </div>
                <Button variant="outline" size="sm" className="w-full" onClick={addExp} disabled={!expRole || !expCompany}>
                  <Plus className="h-3.5 w-3.5 mr-1" /> Add
                </Button>
              </div>

              <div className="flex gap-3 mt-6">
                <Button variant="outline" onClick={() => setStep(1)}><ArrowLeft className="h-4 w-4 mr-2" /> Back</Button>
                <Button className="flex-1" onClick={() => setStep(3)}>Continue <ArrowRight className="h-4 w-4 ml-2" /></Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
              <div className="space-y-3 mb-6">
                {education.map((e, i) => (
                  <div key={i} className="flex justify-between items-center p-3 border rounded-lg bg-muted/30">
                    <div>
                      <p className="font-semibold text-sm">{e.degree}</p>
                      <p className="text-xs text-muted-foreground">{e.institution} • {e.year}</p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => setEducation(ed => ed.filter((_, idx) => idx !== i))}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>

              <div className="p-4 border rounded-lg bg-background space-y-3">
                <h3 className="font-medium text-sm">Add Education</h3>
                <div className="space-y-1.5">
                  <Label className="text-xs">Institution</Label>
                  <Input className="h-8 text-sm" placeholder="IIT Bombay" value={eduInst} onChange={e => setEduInst(e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5"><Label className="text-xs">Degree</Label><Input className="h-8 text-sm" placeholder="B.Tech CS" value={eduDegree} onChange={e => setEduDegree(e.target.value)} /></div>
                  <div className="space-y-1.5"><Label className="text-xs">Year</Label><Input className="h-8 text-sm" placeholder="2016 - 2020" value={eduYear} onChange={e => setEduYear(e.target.value)} /></div>
                </div>
                <Button variant="outline" size="sm" className="w-full" onClick={addEdu} disabled={!eduDegree || !eduInst}>
                  <Plus className="h-3.5 w-3.5 mr-1" /> Add
                </Button>
              </div>

              <div className="flex gap-3 mt-6">
                <Button variant="outline" onClick={() => setStep(2)}><ArrowLeft className="h-4 w-4 mr-2" /> Back</Button>
                <Button className="flex-1" onClick={handleComplete} disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                  Finish Setup
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
