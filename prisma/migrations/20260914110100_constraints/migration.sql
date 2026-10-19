CREATE UNIQUE INDEX "Loan_one_open_per_equipment"
ON "Loan"("tenant_id", "equipmentId") WHERE "returnedAt" IS NULL;

ALTER TABLE "Loan" ADD CONSTRAINT "Loan_due_after_issue" CHECK ("dueAt" > "issuedAt");
ALTER TABLE "Loan" ADD CONSTRAINT "Loan_return_after_issue" CHECK ("returnedAt" IS NULL OR "returnedAt" >= "issuedAt");

-- No public policies: domain data must be accessed through the server.
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
CREATE TRIGGER audit_append_only BEFORE UPDATE OR DELETE OR TRUNCATE ON "AuditEvent"
FOR EACH STATEMENT EXECUTE FUNCTION prevent_audit_change();
