import { sql } from "drizzle-orm";
import { pgTable, text, integer, boolean, timestamp, jsonb, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";

export const users = pgTable("users", {
  id:                   uuid("id").primaryKey().defaultRandom(),
  email:                text("email").notNull().unique(),
  name:                 text("name").notNull().default(""),
  phone:                text("phone").default(""),
  headline:             text("headline").default(""),
  location:             text("location").default(""),
  company:              text("company").default(""),
  bio:                  text("bio").default(""),
  avatarUrl:            text("avatar_url").default(""),
  points:               integer("points").notNull().default(500),
  strikes:              integer("strikes").notNull().default(0),
  bannedUntil:          timestamp("banned_until"),
  skills:               jsonb("skills").default([]),
  workHistory:          jsonb("work_history").default([]),
  education:            jsonb("education").default([]),
  certifications:       jsonb("certifications").default([]),
  permanentConnections: jsonb("permanent_connections").default([]),
  passwordHash:         text("password_hash").default(""),
  otpCode:              text("otp_code").default(""),
  otpExpiresAt:         timestamp("otp_expires_at"),
  emailVerified:        boolean("email_verified").default(false),
  createdAt:            timestamp("created_at").defaultNow(),
});

export const referralRequests = pgTable("referral_requests", {
  id:                uuid("id").primaryKey().defaultRandom(),
  requesterId:       uuid("requester_id").notNull().references(() => users.id),
  requesterName:     text("requester_name").notNull(),
  requesterHeadline: text("requester_headline").default(""),
  targetCompany:     text("target_company").notNull(),
  position:          text("position").notNull(),
  location:          text("location").default(""),
  message:           text("message").default(""),
  queuePosition:     integer("queue_position").notNull().default(1),
  coinsCost:         integer("coins_cost").notNull().default(200),
  status:            text("status").notNull().default("open"),
  acceptedById:      uuid("accepted_by_id").references(() => users.id),
  acceptedByName:    text("accepted_by_name"),
  acceptedAt:        timestamp("accepted_at"),
  deadlineAt:        timestamp("deadline_at"),
  screenshotNote:    text("screenshot_note"),
  resumeUrl:         text("resume_url").default(""),
  connectionActive:  boolean("connection_active").default(false),
  createdAt:         timestamp("created_at").defaultNow(),
});

export const feedItems = pgTable("feed_items", {
  id:        uuid("id").primaryKey().defaultRandom(),
  type:      text("type").notNull(),
  text:      text("text").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const recommendations = pgTable("recommendations", {
  id:         uuid("id").primaryKey().defaultRandom(),
  requestId:  uuid("request_id").notNull().references(() => referralRequests.id),
  fromId:     uuid("from_id").notNull().references(() => users.id),
  fromName:   text("from_name").notNull(),
  forId:      uuid("for_id").notNull().references(() => users.id),
  text:       text("text").notNull(),
  speed:      integer("speed").notNull().default(5),
  experience: integer("experience").notNull().default(5),
  createdAt:  timestamp("created_at").defaultNow(),
});

export const directMessages = pgTable("direct_messages", {
  id:        uuid("id").primaryKey().defaultRandom(),
  fromId:    uuid("from_id").notNull().references(() => users.id),
  fromName:  text("from_name").notNull(),
  toId:      uuid("to_id").notNull().references(() => users.id),
  text:      text("text").notNull(),
  read:      boolean("read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const chatMessages = pgTable("chat_messages", {
  id:         uuid("id").primaryKey().defaultRandom(),
  requestId:  uuid("request_id").notNull().references(() => referralRequests.id),
  senderId:   uuid("sender_id").notNull().references(() => users.id),
  senderName: text("sender_name").notNull(),
  text:       text("text").notNull(),
  createdAt:  timestamp("created_at").defaultNow(),
});

export const notifications = pgTable("notifications", {
  id:        uuid("id").primaryKey().defaultRandom(),
  userId:    uuid("user_id").notNull().references(() => users.id),
  type:      text("type").notNull(),
  title:     text("title").notNull(),
  body:      text("body").notNull(),
  read:      boolean("read").default(false),
  linkUrl:   text("link_url").default(""),
  createdAt: timestamp("created_at").defaultNow(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type ReferralRequest = typeof referralRequests.$inferSelect;
export type FeedItem = typeof feedItems.$inferSelect;
export type Recommendation = typeof recommendations.$inferSelect;
export type DirectMessage = typeof directMessages.$inferSelect;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type Notification = typeof notifications.$inferSelect;

export const insertUserSchema = createInsertSchema(users).pick({ email: true, name: true });

export const connectionRequests = pgTable("connection_requests", {
  id:         uuid("id").primaryKey().defaultRandom(),
  fromId:     uuid("from_id").notNull().references(() => users.id),
  fromName:   text("from_name").notNull(),
  fromHeadline: text("from_headline").default(""),
  fromCompany:  text("from_company").default(""),
  toId:       uuid("to_id").notNull().references(() => users.id),
  status:     text("status").notNull().default("pending"), // pending | accepted | rejected
  createdAt:  timestamp("created_at").defaultNow(),
});

export type ConnectionRequest = typeof connectionRequests.$inferSelect;
