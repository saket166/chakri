export interface WorkItem { company: string; position: string; duration: string; description: string; }
export interface EduItem { institution: string; degree: string; duration: string; }
export interface CertItem { name: string; issuer: string; year: string; }
export interface Redemption { itemName: string; pointsSpent: number; date: string; }

export const ROLE_TIERS = [
  { label: "Intern / Fresher",       keywords: ["intern","fresher","trainee","graduate"],        cost: 100  },
  { label: "Junior / Engineer",      keywords: ["junior","engineer","sde-1","sde1","analyst"],   cost: 200  },
  { label: "Senior Engineer / SDE-2",keywords: ["senior","sde-2","sde2","lead","specialist"],    cost: 400  },
  { label: "Staff / Principal",      keywords: ["staff","principal","architect","sde-3","sde3"], cost: 700  },
  { label: "Manager / EM",           keywords: ["manager","em ","engineering manager"],           cost: 1000 },
  { label: "Senior Manager",         keywords: ["senior manager","group","sr. manager"],          cost: 1500 },
  { label: "Director",               keywords: ["director"],                                       cost: 2500 },
  { label: "VP / SVP",               keywords: ["vp","svp","vice president"],                     cost: 4000 },
  { label: "CXO / Partner",          keywords: ["ceo","cto","coo","cfo","chief","partner"],       cost: 6000 },
] as const;

export function costForRole(position: string): number {
  const lower = position.toLowerCase();
  for (const tier of ROLE_TIERS) {
    if (tier.keywords.some(k => lower.includes(k))) return tier.cost;
  }
  return 300;
}
export function labelForRole(position: string): string {
  const lower = position.toLowerCase();
  for (const tier of ROLE_TIERS) {
    if (tier.keywords.some(k => lower.includes(k))) return tier.label;
  }
  return "Mid-level";
}

export interface Rating {
  fromId: string; fromName: string; requestId: string;
  speed: number; communication: number; overall: number; comment: string; createdAt: number;
}

export interface ChatMessage {
  id: string; requestId: string; senderId: string; senderName: string; text: string; sentAt: number;
}

export interface DirectMessage {
  id: string; fromId: string; fromName: string; toId: string; text: string; sentAt: number; read: boolean;
}

export interface ReferralRequest {
  id: string; requesterId: string; requesterName: string; requesterHeadline: string;
  targetCompany: string; position: string; location: string; message: string;
  createdAt: number; queuePosition: number; coinsCost: number;
  status: "open"|"accepted"|"referee_confirmed"|"requester_confirmed"|"completed"|"expired"|"cancelled";
  acceptedById?: string; acceptedByName?: string; acceptedAt?: number; deadlineAt?: number;
  screenshotNote?: string; refereeRating?: Rating; requesterRating?: Rating; connectionActive?: boolean;
}

export interface UserProfile {
  id: string; name: string; email: string; phone: string; headline: string;
  location: string; company: string; bio: string; points: number; strikes: number;
  bannedUntil?: number; avgRating?: number; ratingCount?: number;
  skills: string[]; workHistory: WorkItem[]; education: EduItem[];
  certifications: CertItem[]; redemptions: Redemption[];
  permanentConnections: string[];
  avatarUrl?: string;
}

export interface FeedItem {
  id: string;
  type: "referral_accepted"|"referral_completed"|"new_member"|"company_news"|"milestone"|"rating";
  text: string; time: number;
}

const PROFILE_KEY  = "chakri_profile";
const SESSION_KEY  = "chakri_logged_in";
const REQUESTS_KEY = "chakri_requests";
const FEED_KEY     = "chakri_feed";
const CHAT_KEY     = "chakri_chats";
const RATINGS_KEY  = "chakri_ratings";
const DM_KEY       = "chakri_dms";

function uid() { return Math.random().toString(36).slice(2) + Date.now().toString(36); }
function emit(e: string) { window.dispatchEvent(new Event(e)); }

// ─── Session ──────────────────────────────────────────────────────────────────
export function isLoggedIn() { return localStorage.getItem(SESSION_KEY) === "true"; }
export function setLoggedIn(v: boolean) {
  v ? localStorage.setItem(SESSION_KEY, "true") : localStorage.removeItem(SESSION_KEY);
}
export function logout() { setLoggedIn(false); }

// ─── Profile ──────────────────────────────────────────────────────────────────
const DEFAULT: UserProfile = {
  id: uid(), name: "", email: "", phone: "", headline: "",
  location: "", company: "", bio: "", points: 500, strikes: 0,
  skills: [], workHistory: [], education: [], certifications: [],
  redemptions: [], permanentConnections: [],
};

export function getProfile(): UserProfile {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    return raw ? { ...DEFAULT, ...JSON.parse(raw) } : { ...DEFAULT };
  } catch { return { ...DEFAULT }; }
}
export function saveProfile(data: Partial<UserProfile>): UserProfile {
  const updated = { ...getProfile(), ...data };
  localStorage.setItem(PROFILE_KEY, JSON.stringify(updated));
  emit("chakri_profile_updated");
  return updated;
}
export function isBanned(): boolean {
  const p = getProfile();
  if (!p.bannedUntil) return false;
  if (Date.now() > p.bannedUntil) { saveProfile({ bannedUntil: undefined, strikes: 0 }); return false; }
  return true;
}

// ─── Requests ─────────────────────────────────────────────────────────────────
export function getRequests(): ReferralRequest[] {
  try { return JSON.parse(localStorage.getItem(REQUESTS_KEY) || "[]"); } catch { return []; }
}
function saveRequests(reqs: ReferralRequest[]) {
  localStorage.setItem(REQUESTS_KEY, JSON.stringify(reqs));
  emit("chakri_requests_updated");
}

export const MAX_ACTIVE_ACCEPTS = 3;

export function createRequest(data: Omit<ReferralRequest,"id"|"createdAt"|"status"|"queuePosition"|"coinsCost">): { ok: boolean; msg: string; req?: ReferralRequest } {
  const profile = getProfile();
  const cost = costForRole(data.position);
  if (profile.points < cost) return { ok: false, msg: `You need ${cost} Chakri Coins for this role (you have ${profile.points}).` };
  const reqs = getRequests();
  const myActive = reqs.filter(r => r.requesterId === profile.id && ["open","accepted","referee_confirmed"].includes(r.status));
  if (myActive.length >= 3) return { ok: false, msg: "You already have 3 active requests. Wait for one to complete." };
  const queuePos = reqs.filter(r => r.targetCompany.toLowerCase() === data.targetCompany.toLowerCase() && ["open","accepted"].includes(r.status)).length + 1;
  saveProfile({ points: profile.points - cost });
  const req: ReferralRequest = { ...data, id: uid(), createdAt: Date.now(), status: "open", queuePosition: queuePos, coinsCost: cost, connectionActive: false };
  saveRequests([req, ...reqs]);
  addFeedItem({ type: "referral_accepted", text: `${data.requesterName} is seeking a referral at ${data.targetCompany} for ${data.position}.` });
  return { ok: true, msg: "Request posted!", req };
}

export function boostRequest(requestId: string, coinsToSpend: number): { ok: boolean; msg: string } {
  const profile = getProfile();
  if (profile.points < coinsToSpend) return { ok: false, msg: "Not enough Chakri Coins." };
  const reqs = getRequests();
  const idx = reqs.findIndex(r => r.id === requestId);
  if (idx === -1) return { ok: false, msg: "Request not found." };
  const req = reqs[idx];
  const newPos = Math.max(1, req.queuePosition - Math.floor(coinsToSpend / 50));
  reqs.forEach((r, i) => {
    if (i !== idx && r.targetCompany === req.targetCompany && r.queuePosition >= newPos && r.queuePosition < req.queuePosition)
      reqs[i] = { ...r, queuePosition: r.queuePosition + 1 };
  });
  reqs[idx] = { ...req, queuePosition: newPos };
  saveProfile({ points: profile.points - coinsToSpend });
  saveRequests(reqs);
  return { ok: true, msg: `Boosted to queue #${newPos}!` };
}

export function acceptRequest(requestId: string, acceptorId: string, acceptorName: string): { ok: boolean; msg: string } {
  const reqs = getRequests();
  const myAccepted = reqs.filter(r => r.acceptedById === acceptorId && r.status === "accepted");
  if (myAccepted.length >= MAX_ACTIVE_ACCEPTS) return { ok: false, msg: `You can only handle ${MAX_ACTIVE_ACCEPTS} referrals at a time.` };
  const idx = reqs.findIndex(r => r.id === requestId);
  if (idx === -1 || reqs[idx].status !== "open") return { ok: false, msg: "Request is no longer available." };
  const now = Date.now();
  reqs[idx] = { ...reqs[idx], status: "accepted", acceptedById: acceptorId, acceptedByName: acceptorName, acceptedAt: now, deadlineAt: now + 86400000, connectionActive: true };
  saveRequests(reqs);
  addFeedItem({ type: "referral_accepted", text: `${acceptorName} accepted a referral for ${reqs[idx].position} at ${reqs[idx].targetCompany}.` });
  return { ok: true, msg: "Accepted! You have 24 hours to refer." };
}

export function refereeConfirm(requestId: string, note: string): { ok: boolean; msg: string } {
  const reqs = getRequests();
  const idx = reqs.findIndex(r => r.id === requestId);
  if (idx === -1) return { ok: false, msg: "Not found." };
  reqs[idx] = { ...reqs[idx], status: "referee_confirmed", screenshotNote: note };
  saveRequests(reqs);
  return { ok: true, msg: "Submitted! Waiting for requester to confirm." };
}

export function requesterConfirm(requestId: string): { ok: boolean; msg: string } {
  const reqs = getRequests();
  const idx = reqs.findIndex(r => r.id === requestId);
  if (idx === -1) return { ok: false, msg: "Not found." };
  const req = reqs[idx];
  reqs[idx] = { ...req, status: "completed", connectionActive: false };
  saveRequests(reqs);
  const profile = getProfile();
  const reward = Math.round(req.coinsCost * 1.5);
  if (req.acceptedById === profile.id) saveProfile({ points: profile.points + reward });
  addFeedItem({ type: "referral_completed", text: `Referral confirmed for ${req.position} at ${req.targetCompany}! 🎉` });
  return { ok: true, msg: `Confirmed! Referee earned ${reward} Chakri Coins.` };
}

export function submitRating(requestId: string, forRole: "referee"|"requester", rating: Omit<Rating,"requestId"|"createdAt">): void {
  const reqs = getRequests();
  const idx = reqs.findIndex(r => r.id === requestId);
  if (idx === -1) return;
  const full: Rating = { ...rating, requestId, createdAt: Date.now() };
  reqs[idx] = forRole === "referee" ? { ...reqs[idx], refereeRating: full } : { ...reqs[idx], requesterRating: full };
  saveRequests(reqs);
  try {
    const all: Rating[] = JSON.parse(localStorage.getItem(RATINGS_KEY) || "[]");
    localStorage.setItem(RATINGS_KEY, JSON.stringify([...all, full]));
  } catch {}
  addFeedItem({ type: "rating", text: `${rating.fromName} left a ${rating.overall}⭐ rating after a referral at ${reqs[idx]?.targetCompany}.` });
}

export function getUserRatings(): Rating[] {
  try { return JSON.parse(localStorage.getItem(RATINGS_KEY) || "[]"); } catch { return []; }
}

export function sendPermanentConnection(toId: string, toName: string): void {
  const p = getProfile();
  if (!p.permanentConnections.includes(toId)) saveProfile({ permanentConnections: [...p.permanentConnections, toId] });
  addFeedItem({ type: "new_member", text: `${p.name} connected with ${toName} after a successful referral.` });
}

export function processExpiredRequests() {
  const reqs = getRequests();
  const profile = getProfile();
  let changed = false, newStrikes = profile.strikes;
  reqs.forEach((r, i) => {
    if (r.status === "accepted" && r.deadlineAt && Date.now() > r.deadlineAt) {
      reqs[i] = { ...r, status: "open", acceptedById: undefined, acceptedByName: undefined, acceptedAt: undefined, deadlineAt: undefined, connectionActive: false };
      changed = true;
      if (r.acceptedById === profile.id) newStrikes = Math.min(newStrikes + 1, 3);
    }
  });
  if (changed) {
    saveRequests(reqs);
    if (newStrikes !== profile.strikes) saveProfile({ strikes: newStrikes, bannedUntil: newStrikes >= 3 ? Date.now() + 604800000 : undefined });
  }
}

// ─── Temp Chat ────────────────────────────────────────────────────────────────
export function getChats(requestId: string): ChatMessage[] {
  try { return (JSON.parse(localStorage.getItem(CHAT_KEY) || "{}"))[requestId] || []; } catch { return []; }
}
export function sendChat(requestId: string, senderId: string, senderName: string, text: string): ChatMessage {
  const msg: ChatMessage = { id: uid(), requestId, senderId, senderName, text, sentAt: Date.now() };
  try {
    const all = JSON.parse(localStorage.getItem(CHAT_KEY) || "{}");
    all[requestId] = [...(all[requestId] || []), msg];
    localStorage.setItem(CHAT_KEY, JSON.stringify(all));
    emit("chakri_chat_" + requestId);
  } catch {}
  return msg;
}

// ─── Direct Messages ──────────────────────────────────────────────────────────
export function getDMs(withUserId: string): DirectMessage[] {
  try {
    const myId = getProfile().id;
    const all: DirectMessage[] = JSON.parse(localStorage.getItem(DM_KEY) || "[]");
    return all.filter(m => (m.fromId === myId && m.toId === withUserId) || (m.fromId === withUserId && m.toId === myId))
              .sort((a, b) => a.sentAt - b.sentAt);
  } catch { return []; }
}
export function getAllDMThreads(): { userId: string; name: string; lastMsg: DirectMessage }[] {
  try {
    const myId = getProfile().id;
    const all: DirectMessage[] = JSON.parse(localStorage.getItem(DM_KEY) || "[]");
    const threads: Record<string, { userId: string; name: string; lastMsg: DirectMessage }> = {};
    all.filter(m => m.fromId === myId || m.toId === myId).forEach(m => {
      const otherId = m.fromId === myId ? m.toId : m.fromId;
      const otherName = m.fromId === myId ? "You → " + m.toId : m.fromName;
      if (!threads[otherId] || m.sentAt > threads[otherId].lastMsg.sentAt)
        threads[otherId] = { userId: otherId, name: otherName, lastMsg: m };
    });
    return Object.values(threads).sort((a, b) => b.lastMsg.sentAt - a.lastMsg.sentAt);
  } catch { return []; }
}
export function sendDM(toId: string, toName: string, text: string): DirectMessage {
  const profile = getProfile();
  const msg: DirectMessage = { id: uid(), fromId: profile.id, fromName: profile.name, toId, text, sentAt: Date.now(), read: false };
  try {
    const all: DirectMessage[] = JSON.parse(localStorage.getItem(DM_KEY) || "[]");
    localStorage.setItem(DM_KEY, JSON.stringify([...all, msg]));
    emit("chakri_dm_updated");
  } catch {}
  return msg;
}
export function getUnreadDMCount(): number {
  try {
    const myId = getProfile().id;
    const all: DirectMessage[] = JSON.parse(localStorage.getItem(DM_KEY) || "[]");
    return all.filter(m => m.toId === myId && !m.read).length;
  } catch { return 0; }
}

// ─── Feed — NO seed data, real activity only ─────────────────────────────────
export function getFeed(): FeedItem[] {
  try { return JSON.parse(localStorage.getItem(FEED_KEY) || "[]").sort((a: FeedItem, b: FeedItem) => b.time - a.time); }
  catch { return []; }
}
export function addFeedItem(data: Omit<FeedItem,"id"|"time">) {
  const item: FeedItem = { ...data, id: uid(), time: Date.now() };
  try {
    const stored: FeedItem[] = JSON.parse(localStorage.getItem(FEED_KEY) || "[]");
    localStorage.setItem(FEED_KEY, JSON.stringify([item, ...stored].slice(0, 100)));
    emit("chakri_feed_updated");
  } catch {}
}
