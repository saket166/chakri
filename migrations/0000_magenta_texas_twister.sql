CREATE TABLE "chat_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"request_id" uuid NOT NULL,
	"sender_id" uuid NOT NULL,
	"sender_name" text NOT NULL,
	"text" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "direct_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"from_id" uuid NOT NULL,
	"from_name" text NOT NULL,
	"to_id" uuid NOT NULL,
	"text" text NOT NULL,
	"read" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "feed_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" text NOT NULL,
	"text" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "recommendations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"request_id" uuid NOT NULL,
	"from_id" uuid NOT NULL,
	"from_name" text NOT NULL,
	"for_id" uuid NOT NULL,
	"text" text NOT NULL,
	"speed" integer DEFAULT 5 NOT NULL,
	"experience" integer DEFAULT 5 NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "referral_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"requester_id" uuid NOT NULL,
	"requester_name" text NOT NULL,
	"requester_headline" text DEFAULT '',
	"target_company" text NOT NULL,
	"position" text NOT NULL,
	"location" text DEFAULT '',
	"message" text DEFAULT '',
	"queue_position" integer DEFAULT 1 NOT NULL,
	"coins_cost" integer DEFAULT 200 NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"accepted_by_id" uuid,
	"accepted_by_name" text,
	"accepted_at" timestamp,
	"deadline_at" timestamp,
	"screenshot_note" text,
	"connection_active" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"name" text DEFAULT '' NOT NULL,
	"phone" text DEFAULT '',
	"headline" text DEFAULT '',
	"location" text DEFAULT '',
	"company" text DEFAULT '',
	"bio" text DEFAULT '',
	"avatar_url" text DEFAULT '',
	"points" integer DEFAULT 500 NOT NULL,
	"strikes" integer DEFAULT 0 NOT NULL,
	"banned_until" timestamp,
	"skills" jsonb DEFAULT '[]'::jsonb,
	"work_history" jsonb DEFAULT '[]'::jsonb,
	"education" jsonb DEFAULT '[]'::jsonb,
	"certifications" jsonb DEFAULT '[]'::jsonb,
	"permanent_connections" jsonb DEFAULT '[]'::jsonb,
	"password_hash" text DEFAULT '',
	"otp_code" text DEFAULT '',
	"otp_expires_at" timestamp,
	"email_verified" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_request_id_referral_requests_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."referral_requests"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_sender_id_users_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "direct_messages" ADD CONSTRAINT "direct_messages_from_id_users_id_fk" FOREIGN KEY ("from_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "direct_messages" ADD CONSTRAINT "direct_messages_to_id_users_id_fk" FOREIGN KEY ("to_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recommendations" ADD CONSTRAINT "recommendations_request_id_referral_requests_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."referral_requests"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recommendations" ADD CONSTRAINT "recommendations_from_id_users_id_fk" FOREIGN KEY ("from_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recommendations" ADD CONSTRAINT "recommendations_for_id_users_id_fk" FOREIGN KEY ("for_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referral_requests" ADD CONSTRAINT "referral_requests_requester_id_users_id_fk" FOREIGN KEY ("requester_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referral_requests" ADD CONSTRAINT "referral_requests_accepted_by_id_users_id_fk" FOREIGN KEY ("accepted_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;