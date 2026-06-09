import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api, getCachedUser } from "@/lib/api";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { ShieldCheck, Plus, Briefcase, ExternalLink, Loader2 } from "lucide-react";

const SAKET_EMAIL = "saketengland@gmail.com";

export default function CurateNewsletter() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const user = getCachedUser();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [queue, setQueue] = useState<any[]>([]);

  const [form, setForm] = useState({
    companyName: "",
    roleTitle: "",
    jobLink: "",
    referrerName: "",
    requiredSkills: ""
  });

  useEffect(() => {
    // Access control redirect
    if (!user || user.email !== SAKET_EMAIL) {
      setLocation("/home");
      return;
    }
    fetchQueue();
  }, [user, setLocation]);

  const fetchQueue = async () => {
    try {
      const q = await api.newsletter.queue();
      setQueue(q);
    } catch (e: any) {
      toast({ title: "Failed to load queue", description: e.message, variant: "destructive" });
    } finally {
      setFetching(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.companyName || !form.roleTitle || !form.jobLink) {
      toast({ title: "Missing fields", description: "Company, Role, and Link are required.", variant: "destructive" });
      return;
    }
    
    setLoading(true);
    try {
      await api.newsletter.addJob(form);
      toast({ title: "Added to Queue! ✅" });
      setForm({ companyName: "", roleTitle: "", jobLink: "", referrerName: "", requiredSkills: "" });
      fetchQueue();
    } catch (e: any) {
      toast({ title: "Error saving job", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return <div className="p-8 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" /></div>;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-10 w-10 bg-indigo-100 rounded-lg flex items-center justify-center">
          <ShieldCheck className="h-6 w-6 text-indigo-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Curate Weekly Newsletter</h1>
          <p className="text-muted-foreground text-sm">Add top jobs to the queue. Only Saket has access.</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Form Card */}
        <Card className="border-indigo-100 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Plus className="h-4 w-4 text-indigo-500" /> Add Job to Queue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <Label>Company Name *</Label>
                <Input value={form.companyName} onChange={e => setForm({...form, companyName: e.target.value})} placeholder="e.g. Google" />
              </div>
              <div>
                <Label>Role Title *</Label>
                <Input value={form.roleTitle} onChange={e => setForm({...form, roleTitle: e.target.value})} placeholder="e.g. Senior Frontend Engineer" />
              </div>
              <div>
                <Label>Job Link (URL) *</Label>
                <Input value={form.jobLink} onChange={e => setForm({...form, jobLink: e.target.value})} placeholder="https://careers.google.com/..." type="url" />
              </div>
              <div>
                <Label>Referrer Name</Label>
                <Input value={form.referrerName} onChange={e => setForm({...form, referrerName: e.target.value})} placeholder="e.g. John Doe (Optional)" />
              </div>
              <div>
                <Label>Required Skills / Tags</Label>
                <Input value={form.requiredSkills} onChange={e => setForm({...form, requiredSkills: e.target.value})} placeholder="e.g. React, Node.js, 5+ YOE" />
              </div>
              <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Save to Queue
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Queue Display Card */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-primary" /> Current Queue
            </CardTitle>
            <CardDescription>{queue.length} jobs waiting for next blast</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 max-h-[500px] overflow-y-auto">
            {queue.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground border border-dashed rounded-lg">
                <p>Queue is empty.</p>
              </div>
            ) : (
              queue.map((job, idx) => (
                <div key={idx} className="p-3 border rounded-lg bg-muted/30">
                  <div className="text-xs font-bold text-muted-foreground uppercase">{job.companyName}</div>
                  <div className="font-semibold">{job.roleTitle}</div>
                  <div className="text-xs mt-1 text-muted-foreground line-clamp-1">{job.requiredSkills}</div>
                  <a href={job.jobLink} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-600 flex items-center gap-1 mt-2 font-medium hover:underline">
                    View Link <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
