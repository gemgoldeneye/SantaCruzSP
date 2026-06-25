-- 0003 — drop tenancy. One database per municipality: remove the tenant concept
-- entirely (no tenants table, no tenant_id columns, no RLS tenant-isolation).
-- Hand-authored (NOT the raw `drizzle-kit generate` body): the generator omits the
-- RLS policy drops (those live in 0001_rls.sql) and uses unguarded DROP … CASCADE.
-- EVERY statement here is guarded with IF EXISTS so this is safe to apply to a
-- fresh, partially-migrated, or fully-tenanted database. The meta snapshot +
-- journal entry WERE produced by the generator (accurate), so future
-- `db:generate` diffs cleanly. Also cleans up the orphan federation tables
-- (data_grants, node_cursors) Phase A left behind, so platform.tenants drops.

-- ── (1) Drop the tenant-isolation RLS policies + disable RLS (14 tables) ──────
ALTER TABLE IF EXISTS data.documents DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation ON data.documents;--> statement-breakpoint
ALTER TABLE IF EXISTS data.workflow_instances DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation ON data.workflow_instances;--> statement-breakpoint
ALTER TABLE IF EXISTS data.workflow_events DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation ON data.workflow_events;--> statement-breakpoint
ALTER TABLE IF EXISTS data.vote_records DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation ON data.vote_records;--> statement-breakpoint
ALTER TABLE IF EXISTS data.payment_orders DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation ON data.payment_orders;--> statement-breakpoint
ALTER TABLE IF EXISTS data.payments DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation ON data.payments;--> statement-breakpoint
ALTER TABLE IF EXISTS data.zone_counters DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation ON data.zone_counters;--> statement-breakpoint
ALTER TABLE IF EXISTS platform.mutations DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation ON platform.mutations;--> statement-breakpoint
ALTER TABLE IF EXISTS platform.change_log DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation ON platform.change_log;--> statement-breakpoint
ALTER TABLE IF EXISTS platform.sync_rejections DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation ON platform.sync_rejections;--> statement-breakpoint
ALTER TABLE IF EXISTS platform.audit_events DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation ON platform.audit_events;--> statement-breakpoint
ALTER TABLE IF EXISTS platform.ref_counters DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation ON platform.ref_counters;--> statement-breakpoint
ALTER TABLE IF EXISTS platform.ref_leases DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation ON platform.ref_leases;--> statement-breakpoint
ALTER TABLE IF EXISTS platform.citizen_accounts DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation ON platform.citizen_accounts;--> statement-breakpoint

-- ── (2) Drop the FK constraints referencing platform.tenants ─────────────────
ALTER TABLE IF EXISTS platform.attachments DROP CONSTRAINT IF EXISTS "attachments_tenant_id_tenants_id_fk";--> statement-breakpoint
ALTER TABLE IF EXISTS platform.barangays DROP CONSTRAINT IF EXISTS "barangays_tenant_id_tenants_id_fk";--> statement-breakpoint
ALTER TABLE IF EXISTS platform.citizen_accounts DROP CONSTRAINT IF EXISTS "citizen_accounts_tenant_id_tenants_id_fk";--> statement-breakpoint
ALTER TABLE IF EXISTS platform.roles DROP CONSTRAINT IF EXISTS "roles_tenant_id_tenants_id_fk";--> statement-breakpoint
ALTER TABLE IF EXISTS platform.users DROP CONSTRAINT IF EXISTS "users_tenant_id_tenants_id_fk";--> statement-breakpoint
ALTER TABLE IF EXISTS data.documents DROP CONSTRAINT IF EXISTS "documents_tenant_id_tenants_id_fk";--> statement-breakpoint
-- Orphan federation tables (Phase A removed them from the model); drop their FKs +
-- the tables so platform.tenants has no remaining dependents.
ALTER TABLE IF EXISTS platform.data_grants DROP CONSTRAINT IF EXISTS "data_grants_grantee_tenant_tenants_id_fk";--> statement-breakpoint
ALTER TABLE IF EXISTS platform.data_grants DROP CONSTRAINT IF EXISTS "data_grants_source_tenant_tenants_id_fk";--> statement-breakpoint
ALTER TABLE IF EXISTS platform.tenants DROP CONSTRAINT IF EXISTS "tenants_parent_tenant_id_tenants_id_fk";--> statement-breakpoint
DROP TABLE IF EXISTS platform.data_grants;--> statement-breakpoint
DROP TABLE IF EXISTS platform.node_cursors;--> statement-breakpoint

-- ── (3) Drop the tenant-embedding indexes ────────────────────────────────────
DROP INDEX IF EXISTS platform."attachments_doc";--> statement-breakpoint
DROP INDEX IF EXISTS platform."audit_tenant_at";--> statement-breakpoint
DROP INDEX IF EXISTS platform."change_log_pull";--> statement-breakpoint
DROP INDEX IF EXISTS platform."citizen_tenant_mobile";--> statement-breakpoint
DROP INDEX IF EXISTS data."documents_ref";--> statement-breakpoint
DROP INDEX IF EXISTS data."documents_feed";--> statement-breakpoint
DROP INDEX IF EXISTS data."payment_orders_app";--> statement-breakpoint
DROP INDEX IF EXISTS data."payments_order";--> statement-breakpoint
DROP INDEX IF EXISTS platform."tenants_parent";--> statement-breakpoint
DROP INDEX IF EXISTS platform."users_tenant_username";--> statement-breakpoint
DROP INDEX IF EXISTS data."wfe_doc";--> statement-breakpoint
DROP INDEX IF EXISTS data."wfi_inbox";--> statement-breakpoint
DROP INDEX IF EXISTS platform."roles_tenant_key";--> statement-breakpoint

-- ── (4) Re-key the 7 composite-PK tables without tenant_id ───────────────────
ALTER TABLE IF EXISTS data.documents DROP CONSTRAINT IF EXISTS "documents_tenant_id_collection_id_pk";--> statement-breakpoint
ALTER TABLE IF EXISTS data.documents ADD CONSTRAINT "documents_collection_id_pk" PRIMARY KEY("collection","id");--> statement-breakpoint
ALTER TABLE IF EXISTS data.workflow_instances DROP CONSTRAINT IF EXISTS "workflow_instances_tenant_id_collection_doc_id_pk";--> statement-breakpoint
ALTER TABLE IF EXISTS data.workflow_instances ADD CONSTRAINT "workflow_instances_collection_doc_id_pk" PRIMARY KEY("collection","doc_id");--> statement-breakpoint
ALTER TABLE IF EXISTS data.vote_records DROP CONSTRAINT IF EXISTS "vote_records_tenant_id_doc_id_stage_pk";--> statement-breakpoint
ALTER TABLE IF EXISTS data.vote_records ADD CONSTRAINT "vote_records_doc_id_stage_pk" PRIMARY KEY("doc_id","stage");--> statement-breakpoint
ALTER TABLE IF EXISTS data.payment_orders DROP CONSTRAINT IF EXISTS "payment_orders_tenant_id_id_pk";--> statement-breakpoint
ALTER TABLE IF EXISTS data.payment_orders ADD CONSTRAINT "payment_orders_id_pk" PRIMARY KEY("id");--> statement-breakpoint
ALTER TABLE IF EXISTS data.payments DROP CONSTRAINT IF EXISTS "payments_tenant_id_id_pk";--> statement-breakpoint
ALTER TABLE IF EXISTS data.payments ADD CONSTRAINT "payments_id_pk" PRIMARY KEY("id");--> statement-breakpoint
ALTER TABLE IF EXISTS data.zone_counters DROP CONSTRAINT IF EXISTS "zone_counters_tenant_id_zone_id_pk";--> statement-breakpoint
ALTER TABLE IF EXISTS data.zone_counters ADD CONSTRAINT "zone_counters_zone_id_pk" PRIMARY KEY("zone_id");--> statement-breakpoint
ALTER TABLE IF EXISTS platform.ref_counters DROP CONSTRAINT IF EXISTS "ref_counters_tenant_id_collection_series_pk";--> statement-breakpoint
ALTER TABLE IF EXISTS platform.ref_counters ADD CONSTRAINT "ref_counters_collection_series_pk" PRIMARY KEY("collection","series");--> statement-breakpoint

-- ── (5) Drop tenant_id on all 18 tables ──────────────────────────────────────
ALTER TABLE IF EXISTS platform.barangays DROP COLUMN IF EXISTS "tenant_id";--> statement-breakpoint
ALTER TABLE IF EXISTS platform.users DROP COLUMN IF EXISTS "tenant_id";--> statement-breakpoint
ALTER TABLE IF EXISTS platform.roles DROP COLUMN IF EXISTS "tenant_id";--> statement-breakpoint
ALTER TABLE IF EXISTS platform.citizen_accounts DROP COLUMN IF EXISTS "tenant_id";--> statement-breakpoint
ALTER TABLE IF EXISTS platform.attachments DROP COLUMN IF EXISTS "tenant_id";--> statement-breakpoint
ALTER TABLE IF EXISTS platform.mutations DROP COLUMN IF EXISTS "tenant_id";--> statement-breakpoint
ALTER TABLE IF EXISTS platform.change_log DROP COLUMN IF EXISTS "tenant_id";--> statement-breakpoint
ALTER TABLE IF EXISTS platform.sync_rejections DROP COLUMN IF EXISTS "tenant_id";--> statement-breakpoint
ALTER TABLE IF EXISTS platform.audit_events DROP COLUMN IF EXISTS "tenant_id";--> statement-breakpoint
ALTER TABLE IF EXISTS platform.ref_counters DROP COLUMN IF EXISTS "tenant_id";--> statement-breakpoint
ALTER TABLE IF EXISTS platform.ref_leases DROP COLUMN IF EXISTS "tenant_id";--> statement-breakpoint
ALTER TABLE IF EXISTS data.documents DROP COLUMN IF EXISTS "tenant_id";--> statement-breakpoint
ALTER TABLE IF EXISTS data.workflow_instances DROP COLUMN IF EXISTS "tenant_id";--> statement-breakpoint
ALTER TABLE IF EXISTS data.workflow_events DROP COLUMN IF EXISTS "tenant_id";--> statement-breakpoint
ALTER TABLE IF EXISTS data.vote_records DROP COLUMN IF EXISTS "tenant_id";--> statement-breakpoint
ALTER TABLE IF EXISTS data.payment_orders DROP COLUMN IF EXISTS "tenant_id";--> statement-breakpoint
ALTER TABLE IF EXISTS data.payments DROP COLUMN IF EXISTS "tenant_id";--> statement-breakpoint
ALTER TABLE IF EXISTS data.zone_counters DROP COLUMN IF EXISTS "tenant_id";--> statement-breakpoint

-- ── (6) Recreate the non-tenant indexes ──────────────────────────────────────
CREATE UNIQUE INDEX IF NOT EXISTS "users_username" ON platform.users USING btree ("username");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "roles_key" ON platform.roles USING btree ("key");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "citizen_mobile" ON platform.citizen_accounts USING btree ("mobile");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "attachments_doc" ON platform.attachments USING btree ("collection","doc_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audit_at" ON platform.audit_events USING btree ("at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "change_log_pull" ON platform.change_log USING btree ("seq");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "documents_ref" ON data.documents USING btree ("collection","ref") WHERE ref IS NOT NULL;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "documents_feed" ON data.documents USING btree ("collection","updated_at");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "payment_orders_app" ON data.payment_orders USING btree ("application_ref");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "payments_order" ON data.payments USING btree ("order_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "wfe_doc" ON data.workflow_events USING btree ("collection","doc_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "wfi_inbox" ON data.workflow_instances USING btree ("current_office","completed");--> statement-breakpoint

-- ── (7) Drop the tenants table ───────────────────────────────────────────────
DROP TABLE IF EXISTS platform.tenants;
