import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import {
  Plus, Clock, Building2, MapPin, CheckCircle, Send,
  User, Briefcase, Search, MessageCircle, Star, Award,
  Upload, ThumbsUp, Link2, ArrowUp, Info, Loader2, AlertTriangle
} from "lucide-react";
import { api, getCachedUser } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

// ── 4 simplified role tiers ───────────────────────────────────────────────
const ROLE_TIERS = [
  {
    label: "Software Engineer",
    desc: "Data Engineer, Data Scientist, SDE, Software Engineer",
    cost: 200,
  },
  {
    label: "Senior Software Engineer",
    desc: "Senior SDE, Tech Lead, Senior Engineer, Principal Engineer",
    cost: 300,
  },
  {
    label: "Staff Level",
    desc: "Staff Engineer, Principal, Architect, Distinguished Engineer",
    cost: 500,
  },
  {
    label: "Managerial",
    desc: "Engineering Manager, Senior Manager, Director, VP, SVP, CXO",
    cost: 1000,
  },
];

function costForRole(position: string): number {
  const lower = position.toLowerCase();
  // Managerial — check first (director/VP/CXO must not fall through to senior)
  if (["manager","director","vp ","svp","vice president","ceo","cto","coo","cfo","chief","partner"].some(k => lower.includes(k))) return 1000;
  // Staff level
  if (["staff","principal","architect","distinguished"].some(k => lower.includes(k))) return 500;
  // Senior
  if (["senior","lead","sr.","sr "].some(k => lower.includes(k))) return 300;
  // Default: Software Engineer tier
  return 200;
}

// ─── Countdown ────────────────────────────────────────────────────────────────
function TimeCountdown({ deadlineAt }: { deadlineAt: string }) {
  const [left, setLeft] = useState("");
  useEffect(() => {
    const tick = () => {
      const ms = new Date(deadlineAt).getTime() - Date.now();
      if (ms <= 0) { setLeft("Expired"); return; }
      const h = Math.floor(ms / 3600000);
      const m = Math.floor((ms % 3600000) / 60000);
      const s = Math.floor((ms % 60000) / 1000);
      setLeft(`${h}h ${m}m ${s}s`);
    };
    tick(); const t = setInterval(tick, 1000); return () => clearInterval(t);
  }, [deadlineAt]);
  const urgent = new Date(deadlineAt).getTime() - Date.now() < 2 * 3600000;
  return (
    <Badge variant="outline" className={urgent ? "border-red-400 text-red-600 animate-pulse" : "border-amber-400 text-amber-700"}>
      <Clock className="h-3 w-3 mr-1" />{left}
    </Badge>
  );
}

// ─── Temp Chat ────────────────────────────────────────────────────────────────
function TempChat({ requestId, me }: { requestId: string; me: any }) {
  const [msgs, setMsgs] = useState<any[]>([]);
  const [text, setText] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.chat.list(requestId).then(setMsgs).catch(() => {});
  }, [requestId]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs]);

  const send = async () => {
    if (!text.trim()) return;
    const msg = await api.chat.send(requestId, text.trim());
    setMsgs(prev => [...prev, msg]);
    setText("");
  };

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="bg-muted/50 px-3 py-2 flex items-center gap-2 text-xs font-medium">
        <MessageCircle className="h-3.5 w-3.5" />Temporary Chat
        <Link2 className="h-3 w-3 text-green-500 ml-auto" />
      </div>
      <div className="h-40 overflow-y-auto p-3 space-y-2 bg-background">
        {msgs.length === 0 && <p className="text-xs text-center text-muted-foreground pt-4">No messages yet. Say hi!</p>}
        {msgs.map(m => (
          <div key={m.id} className={`flex ${m.senderId === me?.id ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[75%] px-3 py-1.5 rounded-xl text-sm ${m.senderId === me?.id ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
              {m.senderId !== me?.id && <p className="text-xs font-medium mb-0.5 opacity-70">{m.senderName}</p>}
              {m.text}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <div className="flex gap-2 p-2 border-t">
        <Input className="h-8 text-sm" placeholder="Type a message..." value={text}
          onChange={e => setText(e.target.value)} onKeyDown={e => e.key === "Enter" && send()} />
        <Button size="sm" className="h-8 px-3" onClick={send}><Send className="h-3.5 w-3.5" /></Button>
      </div>
    </div>
  );
}

// ─── Request Card ─────────────────────────────────────────────────────────────
function RequestCard({ req, me, onRefresh, showAccept }: {
  req: any; me: any; onRefresh: () => void; showAccept?: boolean;
}) {
  const { toast } = useToast();
  const isMyRequest = req.requesterId === me?.id;
  const isAcceptedByMe = req.acceptedById === me?.id;
  const showChat = req.connectionActive && (isMyRequest || isAcceptedByMe);
  const [showNote, setShowNote] = useState(false);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  const statusColors: Record<string, string> = {
    open: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300",
    accepted: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300",
    referee_confirmed: "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300",
    completed: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300",
    expired: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300",
  };
  const statusLabels: Record<string, string> = {
    open: "Open", accepted: "In Progress",
    referee_confirmed: "Awaiting Confirmation",
    completed: "Completed ✓", expired: "Expired",
  };

  const handleAccept = async () => {
    setLoading(true);
    try {
      await api.requests.accept(req.id);
      toast({ title: "Accepted! ✅", description: "You have 24 hours to complete the referral." });
      onRefresh();
    } catch (e: any) { toast({ title: e.message, variant: "destructive" }); }
    finally { setLoading(false); }
  };

  const handleRefereeConfirm = async () => {
    setLoading(true);
    try {
      await api.requests.refereeConfirm(req.id, note);
      toast({ title: "Submitted! Waiting for requester to confirm." });
      setShowNote(false); onRefresh();
    } catch (e: any) { toast({ title: e.message, variant: "destructive" }); }
    finally { setLoading(false); }
  };

  const handleRequesterConfirm = async () => {
    setLoading(true);
    try {
      await api.requests.requesterConfirm(req.id);
      toast({ title: "🎉 Referral confirmed!" });
      onRefresh();
    } catch (e: any) { toast({ title: e.message, variant: "destructive" }); }
    finally { setLoading(false); }
  };

  return (
    <Card className="hover:shadow-md transition-all">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start gap-3 flex-wrap">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Building2 className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold">{req.position}</h3>
              <Badge className={statusColors[req.status] || "bg-gray-100 text-gray-600"}>
                {statusLabels[req.status] || req.status}
              </Badge>
              {isMyRequest && <Badge variant="outline" className="text-xs border-primary/40 text-primary">Your Request</Badge>}
            </div>
            <p className="text-sm text-muted-foreground">{req.targetCompany}</p>
            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
              {req.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{req.location}</span>}
              <span className="flex items-center gap-1"><User className="h-3 w-3" />{req.requesterName}</span>
              <span>{formatDistanceToNow(new Date(req.createdAt), { addSuffix: true })}</span>
              <span className="flex items-center gap-1"><Award className="h-3 w-3 text-yellow-500" />{req.coinsCost} coins</span>
            </div>
            {req.message && <p className="text-xs mt-1 italic text-muted-foreground">"{req.message}"</p>}
            {req.acceptedByName && req.status !== "completed" && (
              <p className="text-xs mt-1 text-blue-600 dark:text-blue-400 font-medium">Accepted by: {req.acceptedByName}</p>
            )}
            {/* Show resume link to referee so they have what they need to make the referral */}
            {isAcceptedByMe && req.resumeUrl && (
              <a
                href={req.resumeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs mt-1.5 inline-flex items-center gap-1 text-primary hover:underline font-medium"
              >
                📄 View Resume
              </a>
            )}
          </div>

          <div className="flex flex-col gap-2 items-end shrink-0">
            {req.status === "accepted" && req.deadlineAt && <TimeCountdown deadlineAt={req.deadlineAt} />}

            {/* Accept button for "Refer Someone" tab */}
            {showAccept && req.status === "open" && !isMyRequest && (
              <Button size="sm" onClick={handleAccept} disabled={loading}>
                {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <CheckCircle className="h-3.5 w-3.5 mr-1" />}
                Accept & Refer
              </Button>
            )}

            {/* Referee: mark referred */}
            {isAcceptedByMe && req.status === "accepted" && (
              <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={() => setShowNote(true)}>
                <Upload className="h-3.5 w-3.5 mr-1" />Mark as Referred
              </Button>
            )}

            {/* Requester: confirm referral */}
            {isMyRequest && req.status === "referee_confirmed" && (
              <Button size="sm" className="bg-teal-600 hover:bg-teal-700 text-white" onClick={handleRequesterConfirm} disabled={loading}>
                <ThumbsUp className="h-3.5 w-3.5 mr-1" />Confirm I Was Referred
              </Button>
            )}
          </div>
        </div>

        {/* Referee note input */}
        {showNote && (
          <div className="border rounded-lg p-3 bg-muted/30 space-y-2">
            <p className="text-sm font-medium">Add confirmation note</p>
            <Textarea placeholder="e.g. 'Submitted referral on Workday. Ref #ABC123'" rows={2}
              value={note} onChange={e => setNote(e.target.value)} />
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setShowNote(false)}>Cancel</Button>
              <Button size="sm" onClick={handleRefereeConfirm} disabled={loading}>
                {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Send className="h-3.5 w-3.5 mr-1" />}
                Submit
              </Button>
            </div>
          </div>
        )}

        {showChat && <TempChat requestId={req.id} me={me} />}
      </CardContent>
    </Card>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Referrals() {
  const { toast } = useToast();
  const [me, setMe] = useState<any>(getCachedUser());
  const [requests, setRequests] = useState<any[]>([]);
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ targetCompany: "", position: "", location: "", message: "" });
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [coverLetter, setCoverLetter] = useState("");
  const [estimatedCost, setEstimatedCost] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [companyWarning, setCompanyWarning] = useState<string | null>(null);

  // Check if anyone at target company is on Chakri
  useEffect(() => {
    const company = form.targetCompany.trim();
    if (!company) { setCompanyWarning(null); return; }
    const timer = setTimeout(() => {
      fetch(`/api/companies/exists?name=${encodeURIComponent(company)}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("chakri_token") || ""}` },
      })
        .then(r => r.json())
        .then(({ exists, count }) => {
          if (!exists) {
            setCompanyWarning(`No one from ${company} is on Chakri yet. Your request will be posted, but may take longer to get a referral.`);
          } else {
            setCompanyWarning(null);
          }
        })
        .catch(() => setCompanyWarning(null));
    }, 600);
    return () => clearTimeout(timer);
  }, [form.targetCompany]);

  const reload = async () => {
    const [reqs, user] = await Promise.all([
      api.requests.list().catch(() => []),
      api.auth.me().catch(() => me),
    ]);
    setRequests(reqs);
    setMe(user);
  };

  useEffect(() => { reload(); }, []);
  useEffect(() => { setEstimatedCost(costForRole(form.position)); }, [form.position]);

  // Requests I posted
  const myRequests = requests.filter(r => r.requesterId === me?.id);

  // Open requests at MY company that others posted — for me to refer
  const referSomeone = requests.filter(r =>
    r.requesterId !== me?.id &&
    r.status === "open" &&
    me?.company &&
    r.targetCompany.toLowerCase() === me.company.toLowerCase()
  ).filter(r =>
    !search ||
    r.position.toLowerCase().includes(search.toLowerCase()) ||
    r.requesterName.toLowerCase().includes(search.toLowerCase())
  ).sort((a: any, b: any) => a.queuePosition - b.queuePosition);

  // Requests I accepted as referee
  const inProgress = requests.filter(r =>
    r.acceptedById === me?.id &&
    (r.status === "accepted" || r.status === "referee_confirmed")
  );

  const handleCreate = async () => {
    if (!form.targetCompany.trim() || !form.position.trim()) {
      toast({ title: "Company and Position are required", variant: "destructive" }); return;
    }
    if (!resumeFile) {
      toast({ title: "Please attach your resume", variant: "destructive" }); return;
    }
    setSubmitting(true);
    try {
      // 1. Upload resume to Supabase Storage
      let resumeUrl = "";
      if (resumeFile) {
        const reader = new FileReader();
        const base64 = await new Promise<string>((resolve, reject) => {
          reader.onload = () => {
            const result = reader.result as string;
            resolve(result.split(",")[1]); // strip data:...;base64,
          };
          reader.onerror = reject;
          reader.readAsDataURL(resumeFile);
        });
        const tok = localStorage.getItem("chakri_token") || "";
        const upRes = await fetch("/api/upload/resume", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${tok}` },
          body: JSON.stringify({ base64, filename: resumeFile.name, mimeType: resumeFile.type }),
        });
        if (!upRes.ok) throw new Error("Resume upload failed. Please try again.");
        const { url } = await upRes.json();
        resumeUrl = url;
      }

      // 2. Create the referral request with the resume URL
      await api.requests.create({
        targetCompany: form.targetCompany,
        position: form.position,
        location: form.location,
        message: form.message,
        resumeUrl,
      });
      setForm({ targetCompany: "", position: "", location: "", message: "" });
      setResumeFile(null); setCoverLetter("");
      setShowNewDialog(false);
      toast({ title: "Request posted! 🎉" });
      reload();
    } catch (e: any) {
      toast({ title: e.message || "Failed to post request", variant: "destructive" });
    } finally { setSubmitting(false); }
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
        <h1 className="text-3xl font-bold">Referral Center</h1>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground flex items-center gap-1">
            <Award className="h-4 w-4 text-yellow-500" />{(me?.points || 0).toLocaleString()} coins
          </span>
          <Button onClick={() => setShowNewDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />Ask for Referral
          </Button>
        </div>
      </div>

      <Tabs defaultValue="refer" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="refer">
            <Briefcase className="h-4 w-4 mr-1.5" />Refer Someone
            {referSomeone.length > 0 && <Badge className="ml-1.5 h-5 px-1.5 text-xs">{referSomeone.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="mine">
            <User className="h-4 w-4 mr-1.5" />My Requests
            {myRequests.filter(r => r.status === "open" || r.status === "accepted").length > 0 &&
              <Badge variant="outline" className="ml-1.5 h-5 px-1.5 text-xs">
                {myRequests.filter(r => r.status === "open" || r.status === "accepted").length}
              </Badge>}
          </TabsTrigger>
          <TabsTrigger value="inprogress">
            <Clock className="h-4 w-4 mr-1.5" />In Progress
            {inProgress.length > 0 && <Badge className="ml-1.5 h-5 px-1.5 text-xs bg-amber-500">{inProgress.length}</Badge>}
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: Refer Someone */}
        <TabsContent value="refer" className="space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <p className="text-sm text-muted-foreground">
              {me?.company
                ? `Open referral requests at ${me.company}`
                : "Set your company in Profile to see requests you can fulfill"}
            </p>
            <div className="relative w-52">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input className="pl-8 h-8 text-sm" placeholder="Filter..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          </div>
          {!me?.company && (
            <Card className="border-amber-300 bg-amber-50 dark:bg-amber-950/20">
              <CardContent className="p-4 flex items-center gap-3">
                <Info className="h-5 w-5 text-amber-600 shrink-0" />
                <p className="text-sm text-amber-700">
                  You need to set your current company in your <strong>Profile</strong> so people who want referrals at your company can find you.
                </p>
              </CardContent>
            </Card>
          )}
          {referSomeone.length === 0 && me?.company && (
            <Card><CardContent className="py-12 text-center text-muted-foreground">
              <Briefcase className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No open requests for {me.company} right now</p>
              <p className="text-sm mt-1">Check back later or ask colleagues to sign up</p>
            </CardContent></Card>
          )}
          {referSomeone.map(req => (
            <RequestCard key={req.id} req={req} me={me} onRefresh={reload} showAccept />
          ))}
        </TabsContent>

        {/* TAB 2: My Requests */}
        <TabsContent value="mine" className="space-y-3">
          <p className="text-sm text-muted-foreground">Referral requests you posted (max 3 active)</p>
          {myRequests.length === 0 ? (
            <Card><CardContent className="py-12 text-center text-muted-foreground">
              <User className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No requests yet</p>
              <p className="text-sm mt-1">Click "Ask for Referral" to get started</p>
            </CardContent></Card>
          ) : myRequests.map(req => (
            <RequestCard key={req.id} req={req} me={me} onRefresh={reload} />
          ))}
        </TabsContent>

        {/* TAB 3: In Progress */}
        <TabsContent value="inprogress" className="space-y-3">
          <p className="text-sm text-muted-foreground">Requests you accepted — complete within 24 hrs</p>
          {inProgress.length === 0 ? (
            <Card><CardContent className="py-12 text-center text-muted-foreground">
              <CheckCircle className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="font-medium">Nothing in progress</p>
              <p className="text-sm mt-1">Go to "Refer Someone" to accept requests</p>
            </CardContent></Card>
          ) : inProgress.map(req => (
            <RequestCard key={req.id} req={req} me={me} onRefresh={reload} />
          ))}
        </TabsContent>
      </Tabs>

      {/* New Request Dialog */}
      <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
        <DialogContent className="sm:max-w-md max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Ask for a Referral</DialogTitle>
            <DialogDescription>Coins are deducted upfront based on role seniority.</DialogDescription>
          </DialogHeader>
          <div className="overflow-y-auto flex-1 pr-1 space-y-4 pt-2">
            <div>
              <Label>Target Company *</Label>
              <Input placeholder="e.g. Google, Microsoft"
                value={form.targetCompany} onChange={e => setForm(p => ({ ...p, targetCompany: e.target.value }))} />
              {companyWarning && (
                <div className="mt-1.5 flex items-start gap-2 text-xs text-amber-700 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 rounded-md px-3 py-2">
                  <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0 text-amber-500" />
                  <span>{companyWarning}</span>
                </div>
              )}
            </div>
            <div>
              <Label>Role / Position *</Label>
              <Input placeholder="e.g. Senior Software Engineer"
                value={form.position} onChange={e => setForm(p => ({ ...p, position: e.target.value }))} />
              {form.position && (
                <div className="mt-1.5 flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Award className="h-3 w-3 text-yellow-500" />Costs <strong>{estimatedCost} coins</strong>
                    {(me?.points || 0) < estimatedCost && <span className="text-destructive ml-1">(you have {me?.points || 0})</span>}
                  </span>
                </div>
              )}
            </div>
            <div>
              <Label>Location</Label>
              <Input placeholder="e.g. Bengaluru, Remote"
                value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))} />
            </div>
            <div>
              <Label>Message (optional)</Label>
              <Textarea placeholder="Why are you a good fit?" rows={2}
                value={form.message} onChange={e => setForm(p => ({ ...p, message: e.target.value }))} />
            </div>
            <div>
              <Label>Resume * <span className="text-destructive text-xs">required</span></Label>
              <label className={`mt-1.5 flex items-center gap-3 border-2 border-dashed rounded-lg p-3 cursor-pointer transition-colors ${resumeFile ? "border-green-400 bg-green-50 dark:bg-green-950/20" : "border-muted-foreground/30 hover:border-primary/50"}`}>
                <Upload className="h-5 w-5 shrink-0 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  {resumeFile
                    ? <p className="text-sm font-medium text-green-700 truncate">✓ {resumeFile.name}</p>
                    : <p className="text-sm text-muted-foreground">Click to upload PDF or DOC (max 5MB)</p>}
                </div>
                <input type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={e => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  if (file.size > 5 * 1024 * 1024) { toast({ title: "File too large. Max 5MB.", variant: "destructive" }); return; }
                  setResumeFile(file);
                }} />
              </label>
            </div>
            <div>
              <Label>Cover Letter <span className="text-muted-foreground text-xs">(optional)</span></Label>
              <Textarea placeholder="Brief cover letter for the referrer..." rows={3}
                value={coverLetter} onChange={e => setCoverLetter(e.target.value)} className="mt-1.5" />
            </div>
            <div className="border rounded-lg overflow-hidden text-xs">
              <div className="bg-muted/50 px-3 py-1.5 font-medium">Coin Cost by Role</div>
              <div className="divide-y">
                {ROLE_TIERS.map(t => (
                  <div key={t.label} className="flex justify-between items-start px-3 py-2 gap-3">
                    <div>
                      <p className="font-medium">{t.label}</p>
                      <p className="text-muted-foreground text-[11px] mt-0.5">{t.desc}</p>
                    </div>
                    <span className="font-medium flex items-center gap-1 shrink-0"><Award className="h-3 w-3 text-yellow-500" />{t.cost}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="flex gap-2 justify-end pt-3 border-t mt-2">
            <Button variant="outline" onClick={() => setShowNewDialog(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={submitting || ((me?.points || 0) < estimatedCost && form.position.length > 0)}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
              Post ({estimatedCost} coins)
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
