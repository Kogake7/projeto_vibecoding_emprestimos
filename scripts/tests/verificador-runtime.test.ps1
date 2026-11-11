$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot '../verificador-runtime.ps1')
$validReport = @'
| CA | evidência | status | observação |
| --- | --- | --- | --- |
| CA-01 | src/exemplo.test.ts:1 | ATENDIDO | teste local |
| CA-02 | src/exemplo.test.ts:2 | ATENDIDO | teste local |
Veredito: PRONTA
'@
$cases = @(
    @{ name = 'aprova somente parecer completo com checks verdes'; changes = @{}; expected = $true },
    @{ name = 'rejeita NÃO PRONTA mesmo com CLI exit zero'; changes = @{ Report = $validReport.Replace('Veredito: PRONTA', 'Veredito: NÃO PRONTA') }; expected = $false },
    @{ name = 'rejeita teste falhando com parecer positivo'; changes = @{ TestExit = 1 }; expected = $false },
    @{ name = 'rejeita falha do CLI'; changes = @{ CliExit = 1 }; expected = $false },
    @{ name = 'rejeita fonte alterada'; changes = @{ SourcesUnchanged = $false }; expected = $false },
    @{ name = 'rejeita CA ausente'; changes = @{ Report = ($validReport -replace '(?m)^\| CA-02[^\r\n]*\r?\n?', '') }; expected = $false },
    @{ name = 'rejeita CA duplicado'; changes = @{ Report = ($validReport + "`n| CA-01 | teste:1 | ATENDIDO | duplicado |") }; expected = $false },
    @{ name = 'rejeita CA extra'; changes = @{ Report = ($validReport + "`n| CA-03 | teste:3 | ATENDIDO | extra |") }; expected = $false },
    @{ name = 'rejeita SEM TESTE'; changes = @{ Report = $validReport.Replace('| ATENDIDO |', '| SEM TESTE |') }; expected = $false },
    @{ name = 'rejeita evidência vazia'; changes = @{ Report = $validReport.Replace('src/exemplo.test.ts:1', '') }; expected = $false },
    @{ name = 'rejeita dois vereditos'; changes = @{ Report = ($validReport + "`nVeredito: PRONTA") }; expected = $false },
    @{ name = 'rejeita relatório vazio'; changes = @{ Report = '' }; expected = $false },
    @{ name = 'rejeita spec sem CAs'; changes = @{ CriterionIds = @() }; expected = $false },
    @{ name = 'rejeita IDs repetidos na spec'; changes = @{ CriterionIds = @('CA-01', 'CA-01') }; expected = $false }
)
foreach ($case in $cases) {
    $parameters = @{ Report = $validReport; CriterionIds = @('CA-01', 'CA-02'); TestExit = 0; CliExit = 0; SourcesUnchanged = $true }
    foreach ($key in $case.changes.Keys) { $parameters[$key] = $case.changes[$key] }
    $result = Get-VerificadorDecision @parameters
    if ($result.passed -ne $case.expected) { throw "Falhou: $($case.name)" }
    if (-not $case.expected -and $result.reasons.Count -eq 0) { throw 'Recusa sem motivo.' }
    Write-Output "PASS: $($case.name)"
}
$environment = Get-VerificadorEnvironment @{
    Path = '/caminho de teste'; HOME = '/perfil'; CODEX_HOME = '/codex'
    DATABASE_URL = 'sentinela'; DIRECT_URL = 'sentinela'
    SUPABASE_SERVICE_ROLE_KEY = 'sentinela'; PIXABAY_API_KEY = 'sentinela'
    OPENAI_API_KEY = 'sentinela'; GITHUB_TOKEN = 'sentinela'; OUTRA_VARIAVEL = 'sentinela'
}
if (@($environment.Keys).Count -ne 3 -or $environment['Path'] -ne '/caminho de teste' -or
    $environment['HOME'] -ne '/perfil' -or $environment['CODEX_HOME'] -ne '/codex') {
    throw 'Filtro não preservou somente as variáveis de inicialização previstas.'
}
Write-Output 'PASS: ambiente mínimo recusa credenciais de banco, aplicação e provedores'

$canaryName = 'VERIFICADOR_TEST_CANARY'
$previous = [System.Environment]::GetEnvironmentVariable($canaryName)
try {
    [System.Environment]::SetEnvironmentVariable($canaryName, 'sentinela-sem-credencial')
    # Reproduz o comportamento anterior da invocação nativa, sem mostrar valores.
    $inherited = & (Get-Process -Id $PID).Path -NoProfile -NonInteractive -Command `
        "if ([Environment]::GetEnvironmentVariable('VERIFICADOR_TEST_CANARY')) { 'HERDOU' } else { 'AUSENTE' }"
    if ($LASTEXITCODE -ne 0 -or $inherited -ne 'HERDOU') { throw 'A comparação com a invocação anterior não reproduziu a herança.' }
    $childCode = @'
if ([Environment]::GetEnvironmentVariable('VERIFICADOR_TEST_CANARY')) { exit 91 }
[Console]::Out.Write([Console]::In.ReadToEnd())
[Console]::Error.Write('diagnostico-controlado')
exit 7
'@
    $processResult = Invoke-VerificadorProcess -Executable (Get-Process -Id $PID).Path `
        -Arguments @('-NoProfile', '-NonInteractive', '-Command', $childCode) `
        -InputText 'entrada com acentuação e espaço' -WorkingDirectory $PSScriptRoot -TimeoutSeconds 30
    if ($processResult.exitCode -ne 7 -or $processResult.stdout -ne 'entrada com acentuação e espaço' -or
        $processResult.stderr -ne 'diagnostico-controlado' -or $canaryName -in $processResult.environmentNames) {
        throw 'Processo filho não preservou transporte/exit ou herdou a sentinela.'
    }
    if ([System.Environment]::GetEnvironmentVariable($canaryName) -ne 'sentinela-sem-credencial') {
        throw 'Execução do filho alterou o ambiente do principal.'
    }
    Write-Output 'PASS: invocação anterior herda sentinela; processo filtrado não herda, preservando stdin UTF-8, stderr e exit'
} finally { [System.Environment]::SetEnvironmentVariable($canaryName, $previous) }

$timedOut = $false
try {
    $null = Invoke-VerificadorProcess -Executable (Get-Process -Id $PID).Path `
        -Arguments @('-NoProfile', '-NonInteractive', '-Command', 'Start-Sleep -Seconds 30') `
        -InputText '' -WorkingDirectory $PSScriptRoot -TimeoutSeconds 1
} catch {
    if ($_.Exception.Message -notlike '*excedeu o tempo limite*') { throw }
    $timedOut = $true
}
if (-not $timedOut) { throw 'Processo sem resposta não foi recusado.' }
Write-Output 'PASS: processo sem resposta é encerrado e recusado'
Write-Output "$($cases.Count + 3) casos técnicos passaram; sem Codex, banco ou rede."
& (Join-Path $PSScriptRoot 'verificador-entradas.test.ps1')
