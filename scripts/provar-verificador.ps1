[CmdletBinding()]
param([Parameter(Mandatory)][ValidatePattern('^[a-zA-Z0-9_-]+$')][string]$Round)
$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path -Parent $PSScriptRoot
$componentPath = Join-Path $repoRoot 'src/components/login-screen.tsx'
$testPath = Join-Path $repoRoot 'src/components/login-screen.test.tsx'
$summaryPath = Join-Path $repoRoot "docs/evidencias/prova-verificador-$Round.json"
$utf8 = [System.Text.UTF8Encoding]::new($false)
if ((& pnpm --version | Out-String).Trim() -ne '11.19.0') { throw 'Execute com pnpm 11.19.0 no PATH.' }
foreach ($suffix in @('base', 'plantado', 'restaurado')) {
    $prefix = Join-Path $repoRoot "docs/evidencias/verificador-$Round-$suffix"
    foreach ($extension in @('.md', '.json', '.jsonl')) {
        if (Test-Path -LiteralPath ($prefix + $extension)) { throw 'Rodada já existe.' }
    }
}
if (Test-Path -LiteralPath $summaryPath) { throw 'Resumo já existe.' }
$original = [System.IO.File]::ReadAllBytes($componentPath)
$text = [System.Text.Encoding]::UTF8.GetString($original)
$anchor = '            <form'
if ([regex]::Matches($text, [regex]::Escape($anchor)).Count -ne 1) { throw 'Âncora do formulário não é única.' }
$before = (Get-FileHash -LiteralPath $componentPath -Algorithm SHA256).Hash
$testBefore = (Get-FileHash -LiteralPath $testPath -Algorithm SHA256).Hash
$plantedHash = $null
$results = [ordered]@{}
function Restore-ProofComponent {
    $currentHash = (Get-FileHash -LiteralPath $componentPath -Algorithm SHA256).Hash
    if ($currentHash -ne $before -and $currentHash -ne $script:plantedHash) {
        throw 'Edição concorrente detectada; não sobrescrever o componente.'
    }
    [System.IO.File]::WriteAllBytes($componentPath, $original)
}
function Invoke-ProofRound([string]$Suffix) {
    try {
        & (Join-Path $PSScriptRoot 'verificar-spec.ps1') `
            -Spec 'docs/specs/001-login/spec.md' `
            -ScopeFiles @('src/components/login-screen.tsx', 'src/app/page.tsx', 'src/app/login/page.tsx', 'src/shared/login.ts', 'src/trpc/react.tsx') `
            -TestFiles @('src/components/login-screen.test.tsx') `
            -Round "$Round-$Suffix" -LocalTestsReviewed
    } catch {
        # Escopo de interface é deliberadamente insuficiente para aprovar a spec inteira.
        Write-Output "Rodada $Suffix não liberou a spec; conferir decisão e CA-08 no relatório."
    }
    $metaPath = Join-Path $repoRoot "docs/evidencias/verificador-$Round-$Suffix.json"
    if (-not (Test-Path -LiteralPath $metaPath)) { throw 'Rodada sem metadados; prova interrompida.' }
    $meta = Get-Content -LiteralPath $metaPath -Raw | ConvertFrom-Json
    if ($meta.cliExit -ne 0 -or -not $meta.sourcesUnchanged -or -not $meta.decision) { throw 'Rodada incompleta.' }
    [pscustomobject]@{
        testExit = $meta.testExit
        ca08 = $meta.decision.criterionStatuses.'CA-08'
        passed = $meta.decision.passed
        componentHash = $meta.sourceHashes.'src/components/login-screen.tsx'
    }
}
Push-Location $repoRoot
try {
    $baseOutput = @(Invoke-ProofRound 'base')
    $results['base'] = $baseOutput[-1]
    try {
        $changed = $text.Replace($anchor, "            <a href=`"/cadastro`">Criar conta</a>`n$anchor")
        [System.IO.File]::WriteAllText($componentPath, $changed, $utf8)
        $script:plantedHash = (Get-FileHash -LiteralPath $componentPath -Algorithm SHA256).Hash
        $plantedOutput = @(Invoke-ProofRound 'plantado')
        $results['plantado'] = $plantedOutput[-1]
    } finally {
        Restore-ProofComponent
    }
    $restoredOutput = @(Invoke-ProofRound 'restaurado')
    $results['restaurado'] = $restoredOutput[-1]
} finally {
    # Também restaura se alguma rodada falhar antes de produzir metadados.
    Restore-ProofComponent
    $summary = [ordered]@{
        round = $Round; componentBefore = $before
        componentAfter = (Get-FileHash -LiteralPath $componentPath -Algorithm SHA256).Hash
        testBefore = $testBefore
        testAfter = (Get-FileHash -LiteralPath $testPath -Algorithm SHA256).Hash
        rounds = $results; commitsCreated = $false
    }
    [System.IO.File]::WriteAllText($summaryPath, ($summary | ConvertTo-Json -Depth 8), $utf8)
    Pop-Location
}
if ($summary.componentBefore -ne $summary.componentAfter -or $summary.testBefore -ne $summary.testAfter) { throw 'Hash de restauração divergente.' }
if ($results.base.testExit -ne 0 -or $results.plantado.testExit -eq 0 -or $results.restaurado.testExit -ne 0) { throw 'Sequência dos testes incorreta.' }
if ($results.base.ca08 -ne 'ATENDIDO' -or $results.plantado.ca08 -ne 'REPROVADO' -or $results.restaurado.ca08 -ne 'ATENDIDO') { throw 'Sequência CA-08 incorreta.' }
Write-Output 'Prova local confirmou ATENDIDO → REPROVADO → ATENDIDO e restauração byte a byte. Nenhum commit criado.'
