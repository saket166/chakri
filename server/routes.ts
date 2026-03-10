import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { db } from "./db";
import { users, referralRequests, feedItems, recommendations, directMessages, chatMessages } from "@shared/schema";
import { eq, and, or, ilike, desc, sql } from "drizzle-orm";
import { randomUUID } from "crypto";

function uid() { return randomUUID(); }

// ─── Cost by role ─────────────────────────────────────────────────────────────
const ROLE_COSTS = [
  { keywords: ["intern","fresher","trainee","graduate"],        cost: 100 },
  { keywords: ["junior","sde-1","sde1","analyst"],              cost: 200 },
  { keywords: ["senior","sde-2","sde2","lead","specialist"],    cost: 400 },
  { keywords: ["staff","principal","architect","sde-3","sde3"], cost: 700 },
  { keywords: ["manager","engineering manager"],                  cost: 1000 },
  { keywords: ["senior manager","sr. manager"],                  cost: 1500 },
  { keywords: ["director"],                                       cost: 2500 },
  { keywords: ["vp","svp","vice president"],                     cost: 4000 },
  { keywords: ["ceo","cto","coo","cfo","chief","partner"],       cost: 6000 },
];
function costForRole(position: string): number {
  const lower = position.toLowerCase();
  for (const tier of ROLE_COSTS) {
    if (tier.keywords.some(k => lower.includes(k))) return tier.cost;
  }
  return 300;
}

// Simple auth middleware — reads userId from header set by frontend
function getUser(req: Request): string | null {
  return (req.headers["x-user-id"] as string) || null;
}

export async function registerRoutes(app: Express): Promise<Server> {

  // ── Users ──────────────────────────────────────────────────────────────────

  // Upsert user on login (called after Google OAuth)
  app.post("/api/users/upsert", async (req: Request, res: Response) => {
    const { id, email, name, avatarUrl } = req.body;
    if (!id || !email) return res.status(400).json({ error: "id and email required" });
    try {
      const existing = await db.select().from(users).where(eq(users.id, id)).limit(1);
      if (existing.length === 0) {
        const [user] = await db.insert(users).values({ id, email, name: name || "", avatarUrl: avatarUrl || "", points: 500 }).returning();
        // Welcome feed item
        await db.insert(feedItems).values({ type: "new_member", text: `${name || email} just joined Chakri! 👋` });
        return res.json(user);
      }
      // Update name/avatar if changed
      const [user] = await db.update(users).set({ name: name || existing[0].name, avatarUrl: avatarUrl || existing[0].avatarUrl }).where(eq(users.id, id)).returning();
      return res.json(user);
    } catch (e: any) { return res.status(500).json({ error: e.message }); }
  });

  // Get my profile
  app.get("/api/users/me", async (req: Request, res: Response) => {
    const userId = getUser(req);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user) return res.status(404).json({ error: "User not found" });
    return res.json(user);
  });

  // Update my profile
  app.patch("/api/users/me", async (req: Request, res: Response) => {
    const userId = getUser(req);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    const allowed = ["name","phone","headline","location","company","bio","avatarUrl","skills","workHistory","education","certifications"];
    const updates: Record<string, any> = {};
    allowed.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });
    const [user] = await db.update(users).set(updates).where(eq(users.id, userId)).returning();
    return res.json(user);
  });

  // Search users by name or company
  app.get("/api/users/search", async (req: Request, res: Response) => {
    const q = (req.query.q as string || "").trim();
    if (q.length < 2) return res.json([]);
    const results = await db.select({
      id: users.id, name: users.name, headline: users.headline,
      company: users.company, location: users.location, avatarUrl: users.avatarUrl,
    }).from(users).where(
      or(ilike(users.name, `%${q}%`), ilike(users.company, `%${q}%`), ilike(users.headline, `%${q}%`))
    ).limit(20);
    return res.json(results);
  });

  // Add permanent connection
  app.post("/api/users/connect", async (req: Request, res: Response) => {
    const userId = getUser(req);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    const { toId } = req.body;
    const [me] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!me) return res.status(404).json({ error: "User not found" });
    const conns: string[] = (me.permanentConnections as string[]) || [];
    if (!conns.includes(toId)) {
      await db.update(users).set({ permanentConnections: [...conns, toId] }).where(eq(users.id, userId));
    }
    return res.json({ ok: true });
  });

  // Get my connections (full user objects)
  app.get("/api/users/connections", async (req: Request, res: Response) => {
    const userId = getUser(req);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    const [me] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!me) return res.json([]);
    const ids: string[] = (me.permanentConnections as string[]) || [];
    if (ids.length === 0) return res.json([]);
    const conns = await db.select({ id: users.id, name: users.name, headline: users.headline, company: users.company, avatarUrl: users.avatarUrl })
      .from(users).where(sql`${users.id} = ANY(${ids})`);
    return res.json(conns);
  });

  // ── Referral Requests ──────────────────────────────────────────────────────

  // Create request — private, only visible to same-company employees
  app.post("/api/requests", async (req: Request, res: Response) => {
    const userId = getUser(req);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    const [me] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!me) return res.status(404).json({ error: "User not found" });

    const { targetCompany, position, location, message } = req.body;
    if (!targetCompany || !position) return res.status(400).json({ error: "Company and position required" });

    const cost = costForRole(position);
    if (me.points < cost) return res.status(400).json({ error: `Need ${cost} coins (you have ${me.points})` });

    // Max 3 active per user
    const myActive = await db.select().from(referralRequests).where(
      and(eq(referralRequests.requesterId, userId), sql`status IN ('open','accepted','referee_confirmed')`)
    );
    if (myActive.length >= 3) return res.status(400).json({ error: "Max 3 active requests at a time" });

    // Queue position for this company
    const existing = await db.select().from(referralRequests).where(
      and(ilike(referralRequests.targetCompany, targetCompany), sql`status IN ('open','accepted')`)
    );
    const queuePosition = existing.length + 1;

    // Deduct coins
    await db.update(users).set({ points: me.points - cost }).where(eq(users.id, userId));

    const [req2] = await db.insert(referralRequests).values({
      requesterId: userId, requesterName: me.name, requesterHeadline: me.headline || "",
      targetCompany, position, location: location || "", message: message || "",
      queuePosition, coinsCost: cost, status: "open",
    }).returning();

    return res.json(req2);
  });

  // Get requests visible to me (my own + open at my company)
  app.get("/api/requests", async (req: Request, res: Response) => {
    const userId = getUser(req);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    const [me] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!me) return res.json([]);

    // My own requests
    const mine = await db.select().from(referralRequests).where(eq(referralRequests.requesterId, userId));

    // Open requests at my company (so I can refer)
    let incoming: typeof mine = [];
    if (me.company) {
      incoming = await db.select().from(referralRequests).where(
        and(ilike(referralRequests.targetCompany, me.company), eq(referralRequests.status, "open"), sql`requester_id != ${userId}`)
      );
    }

    // Requests I've accepted
    const accepted = await db.select().from(referralRequests).where(
      and(eq(referralRequests.acceptedById, userId), sql`status IN ('accepted','referee_confirmed')`)
    );

    // Merge, dedup
    const all = [...mine, ...incoming, ...accepted].reduce((acc, r) => {
      if (!acc.find((x: any) => x.id === r.id)) acc.push(r);
      return acc;
    }, [] as typeof mine);

    return res.json(all);
  });

  // Accept a request
  app.post("/api/requests/:id/accept", async (req: Request, res: Response) => {
    const userId = getUser(req);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    // Check active accepts limit
    const myActive = await db.select().from(referralRequests).where(
      and(eq(referralRequests.acceptedById, userId), eq(referralRequests.status, "accepted"))
    );
    if (myActive.length >= 3) return res.status(400).json({ error: "Max 3 active referrals at once" });

    const [me] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    const now = new Date();
    const deadline = new Date(now.getTime() + 86400000);

    const [updated] = await db.update(referralRequests).set({
      status: "accepted", acceptedById: userId, acceptedByName: me.name,
      acceptedAt: now, deadlineAt: deadline, connectionActive: true,
    }).where(and(eq(referralRequests.id, req.params.id), eq(referralRequests.status, "open"))).returning();

    if (!updated) return res.status(400).json({ error: "Request not available" });

    await db.insert(feedItems).values({ type: "referral_accepted" as any, text: `${me.name} is helping someone get a referral at ${updated.targetCompany}.` });
    return res.json(updated);
  });

  // Referee confirms they referred
  app.post("/api/requests/:id/referee-confirm", async (req: Request, res: Response) => {
    const userId = getUser(req);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    const [updated] = await db.update(referralRequests).set({
      status: "referee_confirmed", screenshotNote: req.body.note || "",
    }).where(and(eq(referralRequests.id, req.params.id), eq(referralRequests.acceptedById, userId))).returning();
    return res.json(updated);
  });

  // Requester confirms they were referred — triggers coins + opens recommendation
  app.post("/api/requests/:id/requester-confirm", async (req: Request, res: Response) => {
    const userId = getUser(req);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const [r] = await db.select().from(referralRequests).where(eq(referralRequests.id, req.params.id)).limit(1);
    if (!r) return res.status(404).json({ error: "Not found" });

    const [updated] = await db.update(referralRequests).set({ status: "completed", connectionActive: false })
      .where(eq(referralRequests.id, req.params.id)).returning();

    // Credit referee
    const reward = Math.round(r.coinsCost * 1.5);
    if (r.acceptedById) {
      const [referee] = await db.select().from(users).where(eq(users.id, r.acceptedById)).limit(1);
      if (referee) await db.update(users).set({ points: referee.points + reward }).where(eq(users.id, r.acceptedById));
    }

    await db.insert(feedItems).values({ type: "referral_completed" as any, text: `${r.requesterName} was successfully referred for ${r.position} at ${r.targetCompany}! 🎉` });
    return res.json({ updated, reward });
  });

  // Boost queue position
  app.post("/api/requests/:id/boost", async (req: Request, res: Response) => {
    const userId = getUser(req);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    const { coins } = req.body;
    const [me] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!me || me.points < coins) return res.status(400).json({ error: "Not enough coins" });
    const [r] = await db.select().from(referralRequests).where(eq(referralRequests.id, req.params.id)).limit(1);
    if (!r) return res.status(404).json({ error: "Not found" });
    const newPos = Math.max(1, r.queuePosition - Math.floor(coins / 50));
    await db.update(referralRequests).set({ queuePosition: newPos }).where(eq(referralRequests.id, req.params.id));
    await db.update(users).set({ points: me.points - coins }).where(eq(users.id, userId));
    return res.json({ queuePosition: newPos });
  });

  // ── Feed ───────────────────────────────────────────────────────────────────

  app.get("/api/feed", async (_req: Request, res: Response) => {
    const items = await db.select().from(feedItems).orderBy(desc(feedItems.createdAt)).limit(50);
    return res.json(items);
  });

  // ── Recommendations ────────────────────────────────────────────────────────

  // Post recommendation — only if you were the requester on a completed referral
  app.post("/api/recommendations", async (req: Request, res: Response) => {
    const userId = getUser(req);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    const { requestId, text, speed, experience } = req.body;

    const [r] = await db.select().from(referralRequests).where(
      and(eq(referralRequests.id, requestId), eq(referralRequests.requesterId, userId), eq(referralRequests.status, "completed"))
    ).limit(1);
    if (!r || !r.acceptedById) return res.status(403).json({ error: "Can only recommend after a completed referral you received" });

    const [me] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    const [rec] = await db.insert(recommendations).values({
      requestId, fromId: userId, fromName: me.name, forId: r.acceptedById,
      text, speed: speed || 5, experience: experience || 5,
    }).returning();

    await db.insert(feedItems).values({ type: "milestone" as any, text: `${me.name} recommended ${r.acceptedByName} for their referral at ${r.targetCompany} ⭐` });
    return res.json(rec);
  });

  // Get recommendations for a user
  app.get("/api/recommendations/:userId", async (req: Request, res: Response) => {
    const recs = await db.select().from(recommendations).where(eq(recommendations.forId, req.params.userId)).orderBy(desc(recommendations.createdAt));
    return res.json(recs);
  });

  // ── Direct Messages ────────────────────────────────────────────────────────

  app.get("/api/messages/:withId", async (req: Request, res: Response) => {
    const userId = getUser(req);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    const msgs = await db.select().from(directMessages).where(
      or(and(eq(directMessages.fromId, userId), eq(directMessages.toId, req.params.withId)),
         and(eq(directMessages.fromId, req.params.withId), eq(directMessages.toId, userId)))
    ).orderBy(directMessages.createdAt);
    return res.json(msgs);
  });

  app.post("/api/messages", async (req: Request, res: Response) => {
    const userId = getUser(req);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    const [me] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    const [msg] = await db.insert(directMessages).values({
      fromId: userId, fromName: me.name, toId: req.body.toId, text: req.body.text,
    }).returning();
    return res.json(msg);
  });

  app.get("/api/messages", async (req: Request, res: Response) => {
    const userId = getUser(req);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    // Get all threads: latest message per conversation
    const msgs = await db.select().from(directMessages).where(
      or(eq(directMessages.fromId, userId), eq(directMessages.toId, userId))
    ).orderBy(desc(directMessages.createdAt));
    return res.json(msgs);
  });

  // ── Temp Chat ──────────────────────────────────────────────────────────────

  app.get("/api/chat/:requestId", async (req: Request, res: Response) => {
    const msgs = await db.select().from(chatMessages).where(eq(chatMessages.requestId, req.params.requestId)).orderBy(chatMessages.createdAt);
    return res.json(msgs);
  });

  app.post("/api/chat/:requestId", async (req: Request, res: Response) => {
    const userId = getUser(req);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    const [me] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    const [msg] = await db.insert(chatMessages).values({
      requestId: req.params.requestId, senderId: userId, senderName: me.name, text: req.body.text,
    }).returning();
    return res.json(msg);
  });

  const httpServer = createServer(app);
  return httpServer;
}
