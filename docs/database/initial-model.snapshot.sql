-- SNAPSHOT DOCUMENTAL. NAO E FONTE DE MIGRATION OU DEPLOY.
-- Gerado em 2026-10-02 a partir de:
--   prisma/migrations/20260914110000_initial/migration.sql
--   prisma/migrations/20260914110100_constraints/migration.sql
-- Aplique o schema somente com `pnpm db:deploy`.

CREATE SCHEMA IF NOT EXISTS "public";

CREATE TYPE "Role" AS ENUM ('COLLABORATOR', 'ADMIN');
CREATE TYPE "EquipmentStatus" AS ENUM ('AVAILABLE', 'LOANED', 'MAINTENANCE');

CREATE TABLE "Tenant" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    CONSTRAINT "Tenant_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Membership" (
    "user_id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'COLLABORATOR',
    CONSTRAINT "Membership_pkey" PRIMARY KEY ("tenant_id", "user_id")
);

CREATE TABLE "Equipment" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "assetTag" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "status" "EquipmentStatus" NOT NULL DEFAULT 'AVAILABLE',
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Equipment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Loan" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "equipmentId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "issuedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueAt" TIMESTAMPTZ(3) NOT NULL,
    "returnedAt" TIMESTAMPTZ(3),
    CONSTRAINT "Loan_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AuditEvent" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "actorId" UUID NOT NULL,
    "action" TEXT NOT NULL,
    "resourceId" UUID NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditEvent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Tenant_slug_key" ON "Tenant"("slug");
CREATE INDEX "Membership_user_id_idx" ON "Membership"("user_id");
CREATE UNIQUE INDEX "Equipment_tenant_id_id_key" ON "Equipment"("tenant_id", "id");
CREATE UNIQUE INDEX "Equipment_tenant_id_assetTag_key" ON "Equipment"("tenant_id", "assetTag");
CREATE INDEX "Loan_tenant_id_userId_returnedAt_idx" ON "Loan"("tenant_id", "userId", "returnedAt");
CREATE INDEX "Loan_tenant_id_returnedAt_id_idx" ON "Loan"("tenant_id", "returnedAt", "id");
CREATE INDEX "AuditEvent_tenant_id_createdAt_idx" ON "AuditEvent"("tenant_id", "createdAt");
CREATE UNIQUE INDEX "Loan_one_open_per_equipment"
ON "Loan"("tenant_id", "equipmentId") WHERE "returnedAt" IS NULL;

ALTER TABLE "Membership"
ADD CONSTRAINT "Membership_tenant_id_fkey"
FOREIGN KEY ("tenant_id") REFERENCES "Tenant"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Equipment"
ADD CONSTRAINT "Equipment_tenant_id_fkey"
FOREIGN KEY ("tenant_id") REFERENCES "Tenant"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Loan"
ADD CONSTRAINT "Loan_tenant_id_equipmentId_fkey"
FOREIGN KEY ("tenant_id", "equipmentId")
REFERENCES "Equipment"("tenant_id", "id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Loan"
ADD CONSTRAINT "Loan_tenant_id_userId_fkey"
FOREIGN KEY ("tenant_id", "userId")
REFERENCES "Membership"("tenant_id", "user_id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "AuditEvent"
ADD CONSTRAINT "AuditEvent_tenant_id_fkey"
FOREIGN KEY ("tenant_id") REFERENCES "Tenant"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Loan"
ADD CONSTRAINT "Loan_due_after_issue" CHECK ("dueAt" > "issuedAt");

ALTER TABLE "Loan"
ADD CONSTRAINT "Loan_return_after_issue"
CHECK ("returnedAt" IS NULL OR "returnedAt" >= "issuedAt");

ALTER TABLE "Tenant" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Membership" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Equipment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Loan" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AuditEvent" ENABLE ROW LEVEL SECURITY;

CREATE FUNCTION prevent_audit_change() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'Audit events are append-only';
END;
$$;

CREATE TRIGGER audit_append_only
BEFORE UPDATE OR DELETE OR TRUNCATE ON "AuditEvent"
FOR EACH STATEMENT EXECUTE FUNCTION prevent_audit_change();
