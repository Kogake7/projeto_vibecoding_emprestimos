[CmdletBinding()]
param([Parameter(Mandatory)][string]$Round)

# Arquivo evita perda de aspas/arrays ao atravessar pnpm.cmd e PowerShell.
# Executar da raiz com pnpm 11.19.0; testes previamente revisados: só loopback.
$scopeFiles = @(
    'docs/PRD.md', 'docs/adr/001-stacks.md', 'docs/adr/002-design-system.md',
    'docs/adr/003-layout-empresti.md', 'docs/andar-zero.md', 'rules/secrets.md',
    'rules/migration.md', 'rules/operacao.md', 'src/shared/login.ts',
    'src/server/env.ts', 'src/server/db.ts', 'src/server/services/access.ts',
    'src/server/services/login.ts', 'src/server/auth/supabase.ts',
    'src/server/auth/proxy.ts', 'src/server/api/context.ts',
    'src/server/api/handler.ts', 'src/server/api/trpc.ts', 'src/server/api/root.ts',
    'src/server/api/routers/auth.ts', 'src/proxy.ts', 'src/trpc/react.tsx',
    'src/components/login-screen.tsx', 'src/components/access-screen.tsx',
    'src/app/layout.tsx', 'src/app/page.tsx', 'src/app/login/page.tsx',
    'src/app/app/page.tsx', 'src/app/api/trpc/[trpc]/route.ts',
    'src/test-support/postgres.ts', 'src/test-support/login-fixture.ts',
    'prisma/schema.prisma',
    'prisma/migrations/20260914110000_initial/migration.sql',
    'prisma/migrations/20260914110100_constraints/migration.sql',
    'docs/evidencias/login-t02-t03-2026-11-09.md',
    'src/test-support/login-browser-checks.ts',
    'docs/evidencias/login-browser-ca01-ca02-2026-11-09.md'
)
$testFiles = @(
    'src/server/services/access.test.ts', 'src/server/api/authorization.test.ts',
    'src/server/auth/supabase.test.ts', 'src/server/auth/login-flow.test.ts',
    'src/components/login-screen.test.tsx'
)
& (Join-Path $PSScriptRoot 'verificar-spec.ps1') -Spec 'docs/specs/001-login/spec.md' `
    -ScopeFiles $scopeFiles -TestFiles $testFiles -Round $Round -LocalTestsReviewed
