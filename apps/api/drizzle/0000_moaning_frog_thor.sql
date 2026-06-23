CREATE SCHEMA "data";
--> statement-breakpoint
CREATE SCHEMA "platform";
--> statement-breakpoint
CREATE TABLE "platform"."attachments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" text NOT NULL,
	"collection" text NOT NULL,
	"doc_id" uuid,
	"filename" text NOT NULL,
	"mime" text NOT NULL,
	"size" integer NOT NULL,
	"sha256" text NOT NULL,
	"uploaded_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "platform"."audit_events" (
	"seq" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "platform"."audit_events_seq_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"tenant_id" text NOT NULL,
	"at" timestamp with time zone DEFAULT now() NOT NULL,
	"actor_id" uuid,
	"actor_name" text NOT NULL,
	"actor_role" text,
	"action" text NOT NULL,
	"collection" text,
	"doc_id" uuid,
	"detail" jsonb,
	"mutation_id" uuid,
	"prev_hash" text,
	"hash" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "platform"."barangays" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"name" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "platform"."change_log" (
	"seq" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "platform"."change_log_seq_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"tenant_id" text NOT NULL,
	"collection" text NOT NULL,
	"doc_id" uuid NOT NULL,
	"op" text NOT NULL,
	"row_version" integer NOT NULL,
	"origin" text DEFAULT 'local' NOT NULL,
	"mutation_id" uuid,
	"at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "platform"."citizen_accounts" (
	"id" uuid PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"barangay_id" text,
	"mobile" text NOT NULL,
	"name" text NOT NULL,
	"resident_ref" text,
	"verified" boolean DEFAULT false NOT NULL,
	"consent_at" timestamp with time zone,
	"consent_version" text,
	"philsys_hash" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "platform"."data_grants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"grantee_tenant" text NOT NULL,
	"source_tenant" text NOT NULL,
	"collections" text[] NOT NULL,
	"purpose" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "data"."documents" (
	"tenant_id" text NOT NULL,
	"collection" text NOT NULL,
	"id" uuid NOT NULL,
	"ref" text,
	"doc" jsonb NOT NULL,
	"doc_version" integer DEFAULT 1 NOT NULL,
	"row_version" integer DEFAULT 1 NOT NULL,
	"barangay_id" text,
	"status" text GENERATED ALWAYS AS (doc->>'status') STORED,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" uuid,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "documents_tenant_id_collection_id_pk" PRIMARY KEY("tenant_id","collection","id")
);
--> statement-breakpoint
CREATE TABLE "platform"."memberships" (
	"user_id" uuid NOT NULL,
	"office" text NOT NULL,
	"office_role" text NOT NULL,
	CONSTRAINT "memberships_user_id_office_pk" PRIMARY KEY("user_id","office")
);
--> statement-breakpoint
CREATE TABLE "platform"."mutations" (
	"id" uuid PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"actor_kind" text NOT NULL,
	"actor_id" uuid NOT NULL,
	"device_id" text,
	"collection" text NOT NULL,
	"doc_id" uuid NOT NULL,
	"op" text NOT NULL,
	"base_version" integer,
	"payload" jsonb NOT NULL,
	"status" text NOT NULL,
	"result_version" integer,
	"error" jsonb,
	"received_at" timestamp with time zone DEFAULT now() NOT NULL,
	"applied_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "platform"."node_cursors" (
	"peer_id" text NOT NULL,
	"tenant_id" text NOT NULL,
	"cursor" bigint DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "node_cursors_peer_id_tenant_id_pk" PRIMARY KEY("peer_id","tenant_id")
);
--> statement-breakpoint
CREATE TABLE "data"."payment_orders" (
	"tenant_id" text NOT NULL,
	"id" uuid NOT NULL,
	"ref" text,
	"application_ref" text NOT NULL,
	"total_amount" integer NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"paid_at" timestamp with time zone,
	CONSTRAINT "payment_orders_tenant_id_id_pk" PRIMARY KEY("tenant_id","id")
);
--> statement-breakpoint
CREATE TABLE "data"."payments" (
	"tenant_id" text NOT NULL,
	"id" uuid NOT NULL,
	"order_id" uuid NOT NULL,
	"method" text NOT NULL,
	"or_no" text,
	"amount" integer NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "payments_tenant_id_id_pk" PRIMARY KEY("tenant_id","id")
);
--> statement-breakpoint
CREATE TABLE "platform"."ref_counters" (
	"tenant_id" text NOT NULL,
	"collection" text NOT NULL,
	"series" text NOT NULL,
	"next" integer DEFAULT 1 NOT NULL,
	CONSTRAINT "ref_counters_tenant_id_collection_series_pk" PRIMARY KEY("tenant_id","collection","series")
);
--> statement-breakpoint
CREATE TABLE "platform"."ref_leases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" text NOT NULL,
	"collection" text NOT NULL,
	"series" text NOT NULL,
	"device_id" text NOT NULL,
	"leased_to" uuid,
	"range_start" integer NOT NULL,
	"range_end" integer NOT NULL,
	"leased_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "platform"."sync_rejections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"mutation_id" uuid NOT NULL,
	"tenant_id" text NOT NULL,
	"reason" text NOT NULL,
	"detail" jsonb,
	"status" text DEFAULT 'open' NOT NULL,
	"resolved_by" uuid,
	"resolved_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "platform"."tenants" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"short_name" text NOT NULL,
	"province" text DEFAULT 'Zambales' NOT NULL,
	"type" text NOT NULL,
	"parent_tenant_id" text,
	"lgu_class" text,
	"enabled_offices" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"settings" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "platform"."users" (
	"id" uuid PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"username" text NOT NULL,
	"name" text NOT NULL,
	"role" text NOT NULL,
	"title" jsonb,
	"offices" text[] DEFAULT '{}'::text[] NOT NULL,
	"barangay_id" text,
	"initials" text DEFAULT '' NOT NULL,
	"password_hash" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "data"."vote_records" (
	"tenant_id" text NOT NULL,
	"collection" text DEFAULT 'sp.sanggunian.documents' NOT NULL,
	"doc_id" uuid NOT NULL,
	"stage" text NOT NULL,
	"yes" integer DEFAULT 0 NOT NULL,
	"no" integer DEFAULT 0 NOT NULL,
	"abstain" integer DEFAULT 0 NOT NULL,
	"absent" integer DEFAULT 0 NOT NULL,
	"date" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "vote_records_tenant_id_doc_id_stage_pk" PRIMARY KEY("tenant_id","doc_id","stage")
);
--> statement-breakpoint
CREATE TABLE "data"."workflow_events" (
	"seq" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "data"."workflow_events_seq_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"tenant_id" text NOT NULL,
	"collection" text NOT NULL,
	"doc_id" uuid NOT NULL,
	"step_key" text NOT NULL,
	"decision" text NOT NULL,
	"actor_id" uuid,
	"actor_name" text NOT NULL,
	"actor_role" text,
	"at" timestamp with time zone DEFAULT now() NOT NULL,
	"remarks" text
);
--> statement-breakpoint
CREATE TABLE "data"."workflow_instances" (
	"tenant_id" text NOT NULL,
	"collection" text NOT NULL,
	"doc_id" uuid NOT NULL,
	"def_key" text NOT NULL,
	"current_step" integer DEFAULT 0 NOT NULL,
	"completed" boolean DEFAULT false NOT NULL,
	"current_office" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "workflow_instances_tenant_id_collection_doc_id_pk" PRIMARY KEY("tenant_id","collection","doc_id")
);
--> statement-breakpoint
CREATE TABLE "data"."zone_counters" (
	"tenant_id" text NOT NULL,
	"zone_id" text NOT NULL,
	"used" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "zone_counters_tenant_id_zone_id_pk" PRIMARY KEY("tenant_id","zone_id")
);
--> statement-breakpoint
ALTER TABLE "platform"."attachments" ADD CONSTRAINT "attachments_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "platform"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform"."barangays" ADD CONSTRAINT "barangays_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "platform"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform"."citizen_accounts" ADD CONSTRAINT "citizen_accounts_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "platform"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform"."data_grants" ADD CONSTRAINT "data_grants_grantee_tenant_tenants_id_fk" FOREIGN KEY ("grantee_tenant") REFERENCES "platform"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform"."data_grants" ADD CONSTRAINT "data_grants_source_tenant_tenants_id_fk" FOREIGN KEY ("source_tenant") REFERENCES "platform"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "data"."documents" ADD CONSTRAINT "documents_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "platform"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform"."memberships" ADD CONSTRAINT "memberships_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "platform"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform"."sync_rejections" ADD CONSTRAINT "sync_rejections_mutation_id_mutations_id_fk" FOREIGN KEY ("mutation_id") REFERENCES "platform"."mutations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform"."tenants" ADD CONSTRAINT "tenants_parent_tenant_id_tenants_id_fk" FOREIGN KEY ("parent_tenant_id") REFERENCES "platform"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform"."users" ADD CONSTRAINT "users_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "platform"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "attachments_doc" ON "platform"."attachments" USING btree ("tenant_id","collection","doc_id");--> statement-breakpoint
CREATE INDEX "audit_tenant_at" ON "platform"."audit_events" USING btree ("tenant_id","at");--> statement-breakpoint
CREATE INDEX "change_log_pull" ON "platform"."change_log" USING btree ("tenant_id","seq");--> statement-breakpoint
CREATE UNIQUE INDEX "citizen_tenant_mobile" ON "platform"."citizen_accounts" USING btree ("tenant_id","mobile");--> statement-breakpoint
CREATE INDEX "data_grants_grantee" ON "platform"."data_grants" USING btree ("grantee_tenant","status");--> statement-breakpoint
CREATE UNIQUE INDEX "documents_ref" ON "data"."documents" USING btree ("tenant_id","collection","ref") WHERE ref IS NOT NULL;--> statement-breakpoint
CREATE INDEX "documents_feed" ON "data"."documents" USING btree ("tenant_id","collection","updated_at");--> statement-breakpoint
CREATE INDEX "documents_gin" ON "data"."documents" USING gin ("doc" jsonb_path_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "payment_orders_app" ON "data"."payment_orders" USING btree ("tenant_id","application_ref");--> statement-breakpoint
CREATE INDEX "payments_order" ON "data"."payments" USING btree ("tenant_id","order_id");--> statement-breakpoint
CREATE INDEX "tenants_parent" ON "platform"."tenants" USING btree ("parent_tenant_id");--> statement-breakpoint
CREATE UNIQUE INDEX "users_tenant_username" ON "platform"."users" USING btree ("tenant_id","username");--> statement-breakpoint
CREATE INDEX "wfe_doc" ON "data"."workflow_events" USING btree ("tenant_id","collection","doc_id");--> statement-breakpoint
CREATE INDEX "wfi_inbox" ON "data"."workflow_instances" USING btree ("tenant_id","current_office","completed");