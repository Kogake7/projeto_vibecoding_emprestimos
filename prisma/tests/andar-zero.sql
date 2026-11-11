-- Teste AZ-03: executar somente no Compose local isolado das aulas.
-- Fixtures sintéticas e assertions; não é migration nem fonte de schema.
-- Todas as inserções são revertidas no fim, inclusive em caso de erro do psql.
\set ON_ERROR_STOP on
BEGIN;
DO $$
BEGIN
  IF current_database() <> 'equipamentos' OR current_user <> 'equipamentos' THEN
    RAISE EXCEPTION 'Use exclusivamente o banco descartável do Compose local';
  END IF;
  IF (SELECT count(*) FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
      WHERE n.nspname='public' AND c.relname IN
        ('Tenant','Membership','Equipment','Loan','AuditEvent') AND c.relrowsecurity) <> 5 THEN
    RAISE EXCEPTION 'AZ-03: RLS ausente em tabela de domínio';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public') THEN
    RAISE EXCEPTION 'AZ-03: era esperado deny-by-default sem policies públicas';
  END IF;
END $$;

INSERT INTO "Tenant" (id,slug,name) VALUES
  ('00000000-0000-4000-8000-000000000001','az_prova_a','Prova local A'),
  ('00000000-0000-4000-8000-000000000002','az_prova_b','Prova local B');
INSERT INTO "Membership" (tenant_id,user_id) VALUES
  ('00000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000011'),
  ('00000000-0000-4000-8000-000000000002','00000000-0000-4000-8000-000000000012');
INSERT INTO "Equipment" (id,tenant_id,"assetTag",name,category) VALUES
  ('00000000-0000-4000-8000-000000000021','00000000-0000-4000-8000-000000000001','AZ-A','Prova A','Teste'),
  ('00000000-0000-4000-8000-000000000022','00000000-0000-4000-8000-000000000002','AZ-B','Prova B','Teste');

DO $$
BEGIN
  BEGIN
    INSERT INTO "Loan" (id,tenant_id,"equipmentId","userId","issuedAt","dueAt") VALUES
      ('00000000-0000-4000-8000-000000000031','00000000-0000-4000-8000-000000000001',
       '00000000-0000-4000-8000-000000000022','00000000-0000-4000-8000-000000000011',
       '2026-01-01Z','2026-01-15Z');
    RAISE EXCEPTION 'AZ-03: FK aceitou equipamento de outro tenant';
  EXCEPTION WHEN foreign_key_violation THEN NULL;
  END;
  BEGIN
    INSERT INTO "Loan" (id,tenant_id,"equipmentId","userId","issuedAt","dueAt") VALUES
      ('00000000-0000-4000-8000-000000000031','00000000-0000-4000-8000-000000000001',
       '00000000-0000-4000-8000-000000000021','00000000-0000-4000-8000-000000000012',
       '2026-01-01Z','2026-01-15Z');
    RAISE EXCEPTION 'AZ-03: FK aceitou usuário de outro tenant';
  EXCEPTION WHEN foreign_key_violation THEN NULL;
  END;
  BEGIN
    INSERT INTO "Loan" (id,tenant_id,"equipmentId","userId","issuedAt","dueAt") VALUES
      ('00000000-0000-4000-8000-000000000031','00000000-0000-4000-8000-000000000001',
       '00000000-0000-4000-8000-000000000021','00000000-0000-4000-8000-000000000011',
       '2026-01-15Z','2026-01-01Z');
    RAISE EXCEPTION 'AZ-03: check aceitou prazo anterior à emissão';
  EXCEPTION WHEN check_violation THEN NULL;
  END;
END $$;

INSERT INTO "Loan" (id,tenant_id,"equipmentId","userId","issuedAt","dueAt") VALUES
  ('00000000-0000-4000-8000-000000000031','00000000-0000-4000-8000-000000000001',
   '00000000-0000-4000-8000-000000000021','00000000-0000-4000-8000-000000000011',
   '2026-01-01Z','2026-01-15Z');
DO $$
BEGIN
  BEGIN
    INSERT INTO "Loan" (id,tenant_id,"equipmentId","userId","issuedAt","dueAt") VALUES
      ('00000000-0000-4000-8000-000000000032','00000000-0000-4000-8000-000000000001',
       '00000000-0000-4000-8000-000000000021','00000000-0000-4000-8000-000000000011',
       '2026-01-01Z','2026-01-15Z');
    RAISE EXCEPTION 'AZ-03: índice aceitou dois empréstimos abertos';
  EXCEPTION WHEN unique_violation THEN NULL;
  END;
  BEGIN
    UPDATE "Loan" SET "returnedAt"='2025-12-31Z'
      WHERE id='00000000-0000-4000-8000-000000000031';
    RAISE EXCEPTION 'AZ-03: check aceitou devolução anterior à emissão';
  EXCEPTION WHEN check_violation THEN NULL;
  END;
END $$;

INSERT INTO "AuditEvent" (id,tenant_id,"actorId",action,"resourceId") VALUES
  ('00000000-0000-4000-8000-000000000041','00000000-0000-4000-8000-000000000001',
   '00000000-0000-4000-8000-000000000011','TESTE_LOCAL','00000000-0000-4000-8000-000000000021');
DO $$
BEGIN
  BEGIN
    UPDATE "AuditEvent" SET action='ALTERADO'
      WHERE id='00000000-0000-4000-8000-000000000041';
    RAISE EXCEPTION USING ERRCODE='XX000', MESSAGE='AZ-03: auditoria permitiu update';
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM <> 'Audit events are append-only' THEN RAISE; END IF;
  END;
  BEGIN
    DELETE FROM "AuditEvent" WHERE id='00000000-0000-4000-8000-000000000041';
    RAISE EXCEPTION USING ERRCODE='XX000', MESSAGE='AZ-03: auditoria permitiu delete';
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM <> 'Audit events are append-only' THEN RAISE; END IF;
  END;
END $$;

-- O mesmo dado existe para o proprietário; o role leitor, sem BYPASSRLS,
-- não pode enxergá-lo. Não são criados roles, grants, policies ou tabelas.
SET LOCAL ROLE pg_read_all_data;
DO $$
BEGIN
  IF EXISTS (SELECT FROM "Tenant") OR EXISTS (SELECT FROM "Membership")
     OR EXISTS (SELECT FROM "Equipment") OR EXISTS (SELECT FROM "Loan")
     OR EXISTS (SELECT FROM "AuditEvent") THEN
    RAISE EXCEPTION 'AZ-03: RLS permitiu leitura ao role sem autorização';
  END IF;
END $$;
RESET ROLE;
ROLLBACK;
SELECT 'AZ-03: constraints, tenants, RLS e auditoria passaram; fixtures revertidas' AS resultado;
