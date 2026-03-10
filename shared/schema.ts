import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ─── Users ────────────────────────────────────────────────────────────────────
export const users = pgTable("users", {
  id:           varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email:        text("email").notNull().unique(),
  name:         text("name").notNull().default(""),
  phone:        text("phone").default(""),
  headline:     text("headline").default(""),
  location:     text("location").default(""),
  company:      text("company").default(""),
  bio:          text("bio").default(""),
  avatarUrl:    text("avatar_url").default(""),
  points:       integer("points").notNull().default(500),
  strikes:      integer("strikes").notNull().default(0),
  bannedUntil:  timestamp("banned_until"),
  skills:       jsonb("skills").default([]),
  workHistory:  jsonb("work_history").default([]),
  education:    jsonb("education").default([]),
  certifications: jsonb("certifications").default([]),
  permanentConnections: jsonb("permanent_connections").default([]),
  createdAt:    timestamp("created_at").defaultNow(),
});

// ─── Referral Requests ────────────────────────────────────────────────────────
export const referralRequests = pgTable("referral_requests", {
  id:               varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  requesterId:      varchar("requester_id").notNull().references(() => users.id),
  requesterName:    text("requester_name").notNull(),
  requesterHeadline:text("requester_headline").default(""),
  targetCompany:    text("target_company").notNull(),
  position:         text("position").notNull(),
  location:         text("location").default(""),
  message:          text("message").default(""),
  queuePosition:    integer("queue_position").notNull().default(1),
  coinsCost:        integer("coins_cost").notNull().default(200),
  status:           text("status").notNull().default("open"),
  // open | accepted | referee_confirmed | completed | expired | cancelled
  acceptedById:     varchar("accepted_by_id").references(() => users.id),
  acceptedByName:   text("accepted_by_name"),
  acceptedAt:       timestamp("accepted_at"),
  deadlineAt:       timestamp("deadline_at"),
  screenshotNote:   text("screenshot_note"),
  connectionActive: boolean("connection_active").default(false),
  createdAt:        timestamp("created_at").defaultNow(),
});

// ─── Feed (shared activity, no private details) ───────────────────────────────
export const feedItems = pgTable("feed_items", {
  id:        varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  type:      text("type").notNull(),
  // referral_completed | new_member | company_news | milestone
  text:      text("text").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// ─── Recommendations (only from successfully referred users) ──────────────────
export const recommendations = pgTable("recommendations", {
  id:          varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  requestId:   varchar("request_id").notNull().references(() => referralRequests.id),
  fromId:      varchar("from_id").notNull().references(() => users.id),
  fromName:    text("from_name").notNull(),
  forId:       varchar("for_id").notNull().references(() => users.id),
  // who the recommendation is FOR (the referee)
  text:        text("text").notNull(),
  speed:       integer("speed").notNull().default(5),       // 1-5
  experience:  integer("experience").notNull().default(5),  // 1-5
  createdAt:   timestamp("created_at").defaultNow(),
});

// ─── Direct Messages ──────────────────────────────────────────────────────────
export const directMessages = pgTable("direct_messages", {
  id:        varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  fromId:    varchar("from_id").notNull().references(() => users.id),
  fromName:  text("from_name").notNull(),
  toId:      varchar("to_id").notNull().references(() => users.id),
  text:      text("text").notNull(),
  read:      boolean("read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// ─── Temp Chat (tied to a referral, expires after completion) ─────────────────
export const chatMessages = pgTable("chat_messages", {
  id:        varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  requestId: varchar("request_id").notNull().references(() => referralRequests.id),
  senderId:  varchar("sender_id").notNull().references(() => users.id),
  senderName:text("sender_name").notNull(),
  text:      text("text").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// ─── Types ────────────────────────────────────────────────────────────────────
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type ReferralRequest = typeof referralRequests.$inferSelect;
export type FeedItem = typeof feedItems.$inferSelect;
export type Recommendation = typeof recommendations.$inferSelect;
export type DirectMessage = typeof directMessages.$inferSelect;
export type ChatMessage = typeof chatMessages.$inferSelect;

export const insertUserSchema = createInsertSchema(users).pick({ email: true, name: true });
