import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Plus, Clock, Building2, MapPin, CheckCircle, AlertTriangle, Send,
  User, Briefcase, Ban, Search, Zap, MessageCircle, Star, Award,
  Upload, ThumbsUp, Link2, Link2Off, ArrowUp, Info
} from "lucide-react";
import {
  getProfile, getRequests, createRequest, acceptRequest, refereeConfirm,
  requesterConfirm, boostRequest, submitRating, sendPermanentConnection,
  processExpiredRequests, isBanned, getChats, sendChat,
  costForRole, labelForRole, ROLE_TIERS, MAX_ACTIVE_ACCEPTS,
  type ReferralRequest, type Rating,
} from "@/lib/userStore";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow, formatDistanceToNowStrict } from "date-fns";

// ─── Countdown ────────────────────────────────────────────────────────────────
function TimeCountdown({ deadlineAt }: { deadlineAt: number }) {
  const [left, setLeft] = useState("");
  useEffect(() => {
    const tick = () => {
      const ms = deadlineAt - Date.now();
      if (ms <= 0) { setLeft("Expired"); return; }
      const h = Math.floor(ms / 3600000);
      const m = Math.floor((ms % 3600000) / 60000);
      const s = Math.floor((ms % 60000) / 1000);
      setLeft(`${h}h ${m}m ${s}s`);
    };
    tick(); const t = setInterval(tick, 1000); return () => clearInterval(t);
  }, [deadlineAt]);
  const urgent = deadlineAt - Date.now() < 2 * 3600000;
  return (
    <Badge variant="outline" className={urgent ? "border-red-400 text-red-600 animate-pulse" : "border-amber-400 text-amber-700"}>
      <Clock className="h-3 w-3 mr-1" />{left}
    </Badge>
  );
}

// ─── Star Rating Input ────────────────────────────────────────────────────────
function StarInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex gap-1">
      {[1,2,3,4,5].map(n => (
        <Star key={n} className={`h-5 w-5 cursor-pointer ${n <= value ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}`}
          onClick={() => onChange(n)} />
      ))}
    </div>
  );
}

// ─── Temp Chat ────────────────────────────────────────────────────────────────
function TempChat({ req, currentUserId, currentUserName }: { req: ReferralRequest; currentUserId: string; currentUserName: string }) {
  const [msgs, setMsgs] = useState(getChats(req.id));
  const [text, setText] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = () => setMsgs(getChats(req.id));
    window.addEventListener("chakri_chat_" + req.id, handler);
    return () => window.removeEventListener("chakri_chat_" + req.id, handler);
  }, [req.id]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs]);

  const send = () => {
    if (!text.trim()) return;
    sendChat(req.id, currentUserId, currentUserName, text.trim());
    setText("");
  };

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="bg-muted/50 px-3 py-2 flex items-center gap-2 text-xs font-medium">
        <MessageCircle className="h-3.5 w-3.5" />
        Temporary Chat — connection ends when referral completes
        <Link2 className="h-3 w-3 text-green-500 ml-auto" />
      </div>
      <div className="h-40 overflow-y-auto p-3 space-y-2 bg-background">
        {msgs.length === 0 && <p className="text-xs text-center text-muted-foreground pt-4">No messages yet. Say hi!</p>}
        {msgs.map(m => (
          <div key={m.id} className={`flex ${m.senderId === currentUserId ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[75%] px-3 py-1.5 rounded-xl text-sm ${m.senderId === currentUserId ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
              {m.senderId !== currentUserId && <p className="text-xs font-medium mb-0.5 opacity-70">{m.senderName}</p>}
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

// ─── Rating Dialog ────────────────────────────────────────────────────────────
function RatingDialog({ open, onClose, onSubmit, targetName }: {
  open: boolean; onClose: () => void;
  onSubmit: (r: { speed: number; communication: number; overall: number; comment: string }) => void;
  targetName: string;
}) {
  const [speed, setSpeed] = useState(5);
  const [comm, setComm] = useState(5);
  const [overall, setOverall] = useState(5);
  const [comment, setComment] = useState("");
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Rate your experience with {targetName}</DialogTitle>
          <DialogDescription>Your feedback helps the community.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          {[["Speed of Referral", speed, setSpeed], ["Communication", comm, setComm], ["Overall Experience", overall, setOverall]].map(([label, val, setter]) => (
            <div key={label as string}>
              <Label className="text-sm">{label as string}</Label>
              <StarInput value={val as number} onChange={setter as (v: number) => void} />
            </div>
          ))}
          <div>
            <Label>Comment (optional)</Label>
            <Textarea placeholder="Share your experience..." rows={2} value={comment} onChange={e => setComment(e.target.value)} />
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={onClose}>Skip</Button>
            <Button onClick={() => { onSubmit({ speed, communication: comm, overall, comment }); onClose(); }}>
              <Star className="h-4 w-4 mr-1" />Submit Rating
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Request Card ─────────────────────────────────────────────────────────────
function RequestCard({ req, currentUserId, currentUserName, onRefresh }: {
  req: ReferralRequest; currentUserId: string; currentUserName: string; onRefresh: () => void;
}) {
  const { toast } = useToast();
  const isMyRequest = req.requesterId === currentUserId;
  const isAcceptedByMe = req.acceptedById === currentUserId;
  const showChat = req.connectionActive && (isMyRequest || isAcceptedByMe);
  const [showConfirmNote, setShowConfirmNote] = useState(false);
  const [note, setNote] = useState("");
  const [showRating, setShowRating] = useState(false);
  const [showBoost, setShowBoost] = useState(false);
  const [boostCoins, setBoostCoins] = useState(100);
  const profile = getProfile();

  const statusColors: Record<ReferralRequest["status"], string> = {
    open:                "bg-blue-100 text-blue-700",
    accepted:            "bg-amber-100 text-amber-700",
    referee_confirmed:   "bg-purple-100 text-purple-700",
    requester_confirmed: "bg-teal-100 text-teal-700",
    completed:           "bg-green-100 text-green-700",
    expired:             "bg-red-100 text-red-700",
    cancelled:           "bg-gray-100 text-gray-600",
  };
  const statusLabels: Record<ReferralRequest["status"], string> = {
    open: "Open", accepted: "In Progress", referee_confirmed: "Awaiting Your Confirmation",
    requester_confirmed: "Confirmed", completed: "Completed ✓", expired: "Expired", cancelled: "Cancelled",
  };

  const handleRefereeConfirm = () => {
    const r = refereeConfirm(req.id, note);
    if (r.ok) { toast({ title: "Submitted! Waiting for requester to confirm." }); setShowConfirmNote(false); onRefresh(); }
    else toast({ title: r.msg, variant: "destructive" });
  };

  const handleRequesterConfirm = () => {
    const r = requesterConfirm(req.id);
    if (r.ok) { toast({ title: "🎉 " + r.msg }); setShowRating(true); onRefresh(); }
    else toast({ title: r.msg, variant: "destructive" });
  };

  const handleBoost = () => {
    const r = boostRequest(req.id, boostCoins);
    toast({ title: r.ok ? "🚀 " + r.msg : r.msg, variant: r.ok ? "default" : "destructive" });
    setShowBoost(false); onRefresh();
  };

  const handlePermanentConnect = () => {
    const otherName = isMyRequest ? req.acceptedByName! : req.requesterName;
    const otherId = isMyRequest ? req.acceptedById! : req.requesterId;
    sendPermanentConnection(otherId, otherName);
    toast({ title: `Connected with ${otherName}!`, description: "Permanent connection added." });
  };

  return (
    <Card className="hover:shadow-md transition-all">
      <CardContent className="p-4 space-y-3">
        {/* Header row */}
        <div className="flex items-start gap-3 flex-wrap">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Building2 className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold">{req.position}</h3>
              <Badge className={statusColors[req.status]}>{statusLabels[req.status]}</Badge>
              {req.queuePosition > 1 && req.status === "open" && (
                <Badge variant="outline" className="text-xs">Queue #{req.queuePosition}</Badge>
              )}
              {isMyRequest && <Badge variant="outline" className="text-xs border-primary/40 text-primary">Your Request</Badge>}
            </div>
            <p className="text-sm text-muted-foreground">{req.targetCompany}</p>
            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
              <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{req.location || "Any"}</span>
              <span className="flex items-center gap-1"><User className="h-3 w-3" />{req.requesterName}</span>
              <span>{formatDistanceToNow(new Date(req.createdAt), { addSuffix: true })}</span>
              <span className="flex items-center gap-1"><Award className="h-3 w-3 text-yellow-500" />{req.coinsCost} coins</span>
            </div>
            {req.message && <p className="text-xs mt-1 italic text-muted-foreground">"{req.message}"</p>}
            {req.acceptedByName && req.status !== "completed" && (
              <p className="text-xs mt-1 text-blue-600 font-medium">Accepted by: {req.acceptedByName}</p>
            )}
          </div>

          {/* Right side actions */}
          <div className="flex flex-col gap-2 items-end shrink-0">
            {req.status === "accepted" && req.deadlineAt && <TimeCountdown deadlineAt={req.deadlineAt} />}

            {/* Referee: mark referred */}
            {isAcceptedByMe && req.status === "accepted" && (
              <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={() => setShowConfirmNote(true)}>
                <Upload className="h-3.5 w-3.5 mr-1" />Mark as Referred
              </Button>
            )}

            {/* Requester: confirm referral */}
            {isMyRequest && req.status === "referee_confirmed" && (
              <Button size="sm" className="bg-teal-600 hover:bg-teal-700 text-white" onClick={handleRequesterConfirm}>
                <ThumbsUp className="h-3.5 w-3.5 mr-1" />Confirm I Was Referred
              </Button>
            )}

            {/* Completed — offer permanent connection if temp was active */}
            {req.status === "completed" && (isMyRequest || isAcceptedByMe) && (
              <Button size="sm" variant="outline" onClick={handlePermanentConnect}>
                <Link2 className="h-3.5 w-3.5 mr-1" />Keep Connection
              </Button>
            )}

            {/* Boost queue (requester only, open status) */}
            {isMyRequest && req.status === "open" && req.queuePosition > 1 && (
              <Button size="sm" variant="outline" onClick={() => setShowBoost(true)}>
                <Zap className="h-3.5 w-3.5 mr-1 text-yellow-500" />Boost Queue
              </Button>
            )}
          </div>
        </div>

        {/* Referee confirmation note dialog */}
        {showConfirmNote && (
          <div className="border rounded-lg p-3 bg-muted/30 space-y-2">
            <p className="text-sm font-medium">Add a note or paste your referral confirmation link</p>
            <Textarea placeholder="e.g. 'Submitted referral on Workday. Ref #ABC123' or paste a screenshot description..." rows={2}
              value={note} onChange={e => setNote(e.target.value)} />
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setShowConfirmNote(false)}>Cancel</Button>
              <Button size="sm" onClick={handleRefereeConfirm}><Send className="h-3.5 w-3.5 mr-1" />Submit Confirmation</Button>
            </div>
          </div>
        )}

        {/* Boost dialog */}
        {showBoost && (
          <div className="border rounded-lg p-3 bg-muted/30 space-y-2">
            <p className="text-sm font-medium flex items-center gap-1.5">
              <Zap className="h-4 w-4 text-yellow-500" />Boost your queue position
            </p>
            <p className="text-xs text-muted-foreground">Every 50 coins moves you up 1 position. You have {profile.points} coins.</p>
            <div className="flex gap-2 items-center">
              <Input type="number" className="h-8 w-24 text-sm" value={boostCoins} min={50} step={50}
                onChange={e => setBoostCoins(Number(e.target.value))} />
              <span className="text-sm text-muted-foreground">coins → +{Math.floor(boostCoins / 50)} positions up</span>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setShowBoost(false)}>Cancel</Button>
              <Button size="sm" onClick={handleBoost}><ArrowUp className="h-3.5 w-3.5 mr-1" />Boost Now</Button>
            </div>
          </div>
        )}

        {/* Temp chat */}
        {showChat && (
          <TempChat req={req} currentUserId={currentUserId} currentUserName={currentUserName} />
        )}

        {/* Connection ended notice */}
        {req.status === "completed" && (isMyRequest || isAcceptedByMe) && !req.connectionActive && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 rounded p-2">
            <Link2Off className="h-3.5 w-3.5" />
            Temporary connection ended. Click "Keep Connection" to stay connected permanently.
          </div>
        )}
      </CardContent>

      {/* Rating dialog */}
      <RatingDialog open={showRating} onClose={() => setShowRating(false)} targetName={req.acceptedByName || "the referee"}
        onSubmit={r => submitRating(req.id, "referee", { ...r, fromId: currentUserId, fromName: currentUserName })} />
    </Card>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Referrals() {
  const { toast } = useToast();
  const [profile] = useState(getProfile());
  const [requests, setRequests] = useState<ReferralRequest[]>([]);
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ targetCompany: "", position: "", location: "", message: "" });
  const [estimatedCost, setEstimatedCost] = useState(0);
  const banned = isBanned();

  const reload = () => { processExpiredRequests(); setRequests(getRequests()); };

  useEffect(() => {
    reload();
    window.addEventListener("chakri_requests_updated", reload);
    const t = setInterval(reload, 15000);
    return () => { window.removeEventListener("chakri_requests_updated", reload); clearInterval(t); };
  }, []);

  useEffect(() => {
    setEstimatedCost(costForRole(form.position));
  }, [form.position]);

  const myActive = requests.filter(r => r.requesterId === profile.id && (r.status === "open" || r.status === "accepted" || r.status === "referee_confirmed"));
  const myAccepted = requests.filter(r => r.acceptedById === profile.id && (r.status === "accepted" || r.status === "referee_confirmed"));
  const incomingOpen = requests.filter(r =>
    r.requesterId !== profile.id &&
    r.acceptedById !== profile.id &&
    r.status === "open" &&
    (!profile.company || r.targetCompany.toLowerCase() === profile.company.toLowerCase())
  ).filter(r => !search || r.position.toLowerCase().includes(search.toLowerCase()) || r.targetCompany.toLowerCase().includes(search.toLowerCase()))
   .sort((a, b) => a.queuePosition - b.queuePosition);

  const handleCreate = () => {
    if (!form.targetCompany.trim() || !form.position.trim()) {
      toast({ title: "Company and Position are required", variant: "destructive" }); return;
    }
    const r = createRequest({
      requesterId: profile.id, requesterName: profile.name || "Anonymous",
      requesterHeadline: profile.headline || "",
      targetCompany: form.targetCompany, position: form.position,
      location: form.location, message: form.message,
    });
    if (!r.ok) { toast({ title: r.msg, variant: "destructive" }); return; }
    setForm({ targetCompany: "", position: "", location: "", message: "" });
    setShowNewDialog(false);
    toast({ title: "Request posted! 🎉", description: r.msg });
  };

  const handleAccept = (req: ReferralRequest) => {
    if (banned) { toast({ title: "You are temporarily banned.", variant: "destructive" }); return; }
    const r = acceptRequest(req.id, profile.id, profile.name || "Someone");
    toast({ title: r.ok ? "Accepted! ✅" : r.msg, description: r.ok ? "You have 24 hours to complete the referral." : undefined, variant: r.ok ? "default" : "destructive" });
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      {/* Ban / Strike banners */}
      {banned && (
        <Card className="mb-4 border-destructive bg-destructive/5">
          <CardContent className="p-4 flex items-center gap-3">
            <Ban className="h-5 w-5 text-destructive" />
            <div>
              <p className="font-semibold text-destructive">Account Temporarily Banned</p>
              <p className="text-sm text-muted-foreground">Expires in {formatDistanceToNowStrict(new Date(profile.bannedUntil!))}.</p>
            </div>
          </CardContent>
        </Card>
      )}
      {!banned && profile.strikes > 0 && (
        <Card className="mb-4 border-amber-400 bg-amber-50 dark:bg-amber-950/20">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            <p className="text-sm text-amber-700"><strong>{profile.strikes}/3 strikes</strong> — 3 strikes = 1 week ban.</p>
          </CardContent>
        </Card>
      )}

      <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
        <h1 className="text-3xl font-bold">Referral Center</h1>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground flex items-center gap-1">
            <Award className="h-4 w-4 text-yellow-500" />{profile.points} coins
          </span>
          <Button onClick={() => setShowNewDialog(true)} disabled={banned}>
            <Plus className="h-4 w-4 mr-2" />Ask for Referral
          </Button>
        </div>
      </div>

      {/* Limit indicator */}
      <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
        <Info className="h-4 w-4" />
        <span>Your active requests: <strong className={myActive.length >= 3 ? "text-destructive" : "text-primary"}>{myActive.length}/3</strong></span>
        <span className="mx-2">·</span>
        <span>Active referrals you're handling: <strong className={myAccepted.length >= MAX_ACTIVE_ACCEPTS ? "text-destructive" : "text-primary"}>{myAccepted.length}/{MAX_ACTIVE_ACCEPTS}</strong></span>
      </div>

      <Tabs defaultValue="incoming" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="incoming">
            <Briefcase className="h-4 w-4 mr-1.5" />Refer Someone
            {incomingOpen.length > 0 && <Badge className="ml-1.5 h-5 px-1.5 text-xs">{incomingOpen.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="mine">
            <User className="h-4 w-4 mr-1.5" />My Requests
            {myActive.length > 0 && <Badge variant="outline" className="ml-1.5 h-5 px-1.5 text-xs">{myActive.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="inprogress">
            <Clock className="h-4 w-4 mr-1.5" />In Progress
            {myAccepted.length > 0 && <Badge className="ml-1.5 h-5 px-1.5 text-xs bg-amber-500">{myAccepted.length}</Badge>}
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: Refer Someone */}
        <TabsContent value="incoming" className="space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <p className="text-sm text-muted-foreground">
              {profile.company ? `Open requests for referrals at ${profile.company}` : "Set your company in Profile to see targeted requests"}
            </p>
            <div className="relative w-52">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input className="pl-8 h-8 text-sm" placeholder="Filter..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          </div>
          {incomingOpen.length === 0 ? (
            <Card><CardContent className="py-12 text-center text-muted-foreground">
              <Briefcase className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No open requests right now</p>
              <p className="text-sm mt-1">Update your company in Profile to see relevant ones</p>
            </CardContent></Card>
          ) : incomingOpen.map(req => (
            <div key={req.id} className="space-y-1">
              <RequestCard req={req} currentUserId={profile.id} currentUserName={profile.name} onRefresh={reload} />
              <div className="flex justify-end pr-1">
                <Button size="sm" variant="default" onClick={() => handleAccept(req)} disabled={myAccepted.length >= MAX_ACTIVE_ACCEPTS}>
                  <CheckCircle className="h-4 w-4 mr-1" />Accept & Refer
                  {myAccepted.length >= MAX_ACTIVE_ACCEPTS && " (limit reached)"}
                </Button>
              </div>
            </div>
          ))}
        </TabsContent>

        {/* TAB 2: My Requests */}
        <TabsContent value="mine" className="space-y-3">
          <p className="text-sm text-muted-foreground">Requests you posted (max 3 active at a time)</p>
          {myActive.length === 0 && requests.filter(r => r.requesterId === profile.id).length === 0 ? (
            <Card><CardContent className="py-12 text-center text-muted-foreground">
              <User className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No requests yet</p>
              <p className="text-sm mt-1">Click "Ask for Referral" to get started</p>
            </CardContent></Card>
          ) : requests.filter(r => r.requesterId === profile.id).map(req => (
            <RequestCard key={req.id} req={req} currentUserId={profile.id} currentUserName={profile.name} onRefresh={reload} />
          ))}
        </TabsContent>

        {/* TAB 3: In Progress (accepted by me as referee) */}
        <TabsContent value="inprogress" className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Requests you accepted — complete within 24 hrs or earn a strike. Max {MAX_ACTIVE_ACCEPTS} at once.
          </p>
          {myAccepted.length === 0 ? (
            <Card><CardContent className="py-12 text-center text-muted-foreground">
              <CheckCircle className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="font-medium">Nothing in progress</p>
              <p className="text-sm mt-1">Go to "Refer Someone" tab to accept requests</p>
            </CardContent></Card>
          ) : myAccepted.map(req => (
            <RequestCard key={req.id} req={req} currentUserId={profile.id} currentUserName={profile.name} onRefresh={reload} />
          ))}
        </TabsContent>
      </Tabs>

      {/* New Request Dialog */}
      <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Ask for a Referral</DialogTitle>
            <DialogDescription>
              Coins are deducted upfront based on the seniority of the role. You can boost your queue position later.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label>Target Company *</Label>
              <Input placeholder="e.g. Google, Microsoft, Infosys"
                value={form.targetCompany} onChange={e => setForm(p => ({ ...p, targetCompany: e.target.value }))} />
            </div>
            <div>
              <Label>Role / Position *</Label>
              <Input placeholder="e.g. Senior Software Engineer, VP Product"
                value={form.position} onChange={e => setForm(p => ({ ...p, position: e.target.value }))} />
              {form.position && (
                <div className="mt-1.5 flex items-center gap-2 text-xs text-muted-foreground">
                  <Badge variant="outline" className="text-xs">{labelForRole(form.position)}</Badge>
                  <span className="flex items-center gap-1">
                    <Award className="h-3 w-3 text-yellow-500" />Costs <strong>{estimatedCost} Chakri Coins</strong>
                    {profile.points < estimatedCost && <span className="text-destructive ml-1">(you have {profile.points})</span>}
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
              <Textarea placeholder="Why are you a good fit? Add context for the referrer..." rows={2}
                value={form.message} onChange={e => setForm(p => ({ ...p, message: e.target.value }))} />
            </div>

            {/* Role cost table */}
            <div className="border rounded-lg overflow-hidden text-xs">
              <div className="bg-muted/50 px-3 py-1.5 font-medium">Chakri Coin Cost by Role</div>
              <div className="divide-y max-h-36 overflow-y-auto">
                {ROLE_TIERS.map(t => (
                  <div key={t.label} className="flex justify-between px-3 py-1.5">
                    <span className="text-muted-foreground">{t.label}</span>
                    <span className="font-medium flex items-center gap-1"><Award className="h-3 w-3 text-yellow-500" />{t.cost}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowNewDialog(false)}>Cancel</Button>
              <Button onClick={handleCreate} disabled={profile.points < estimatedCost && form.position.length > 0}>
                <Send className="h-4 w-4 mr-2" />Post ({estimatedCost} coins)
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
