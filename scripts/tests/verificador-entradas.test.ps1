$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot '../verificador-runtime.ps1')
$temporaryBase = [System.IO.Path]::GetFullPath([System.IO.Path]::GetTempPath())
$testRoot = Join-Path $temporaryBase ('verificador-entradas-' + [guid]::NewGuid().ToString('N'))
$repo = Join-Path $testRoot 'repo'
$utf8 = [System.Text.UTF8Encoding]::new($false)
$caseCount = 0
$junction = $null

function Assert-InputCase([string]$Name, [scriptblock]$Action, [bool]$Reject = $false) {
    $rejected = $false
    try { $null = & $Action } catch {
        if (-not $Reject) { throw }
        $rejected = $true
    }
    if ($Reject -and -not $rejected) { throw "Entrada insegura foi aceita: $Name" }
    $script:caseCount++
    Write-Output "PASS: $Name"
}

try {
    foreach ($folder in @('src', 'scripts', 'docs/evidencias', 'public/equipment', 'outside')) {
        $null = New-Item -ItemType Directory -Path (Join-Path $repo $folder) -Force
    }
    foreach ($file in @('src/exemplo.test.ts', 'src/dados.json', 'scripts/preparar.py', 'scripts/local.ps1', 'scripts/manifesto.mjs')) {
        [System.IO.File]::WriteAllText((Join-Path $repo $file), 'fixture sem credencial', $utf8)
        Assert-InputCase "aceita fonte explícita $file" { Resolve-VerificadorInputPath -RepoRoot $repo -Relative $file }
    }
    foreach ($file in @('../fora.json', '.env', 'auth.json', '.codex/config.json', 'src/pixabay-api-key.json', 'src/arquivo.exe')) {
        Assert-InputCase "recusa caminho/tipo sensível $file" { Resolve-VerificadorInputPath -RepoRoot $repo -Relative $file } $true
    }
    Assert-InputCase 'recusa fonte absoluta' { Resolve-VerificadorInputPath -RepoRoot $repo -Relative (Join-Path $repo 'src/dados.json') } $true
    $expected = [ordered]@{}
    foreach ($file in @('src/exemplo.test.ts', 'src/dados.json')) {
        $expected[$file] = (Get-FileHash -LiteralPath (Join-Path $repo $file) -Algorithm SHA256).Hash
    }
    $baseReceipt = [ordered]@{
        testExit = 0; testOutput = 'Dois testes locais passaram.'
        testFiles = @('src/exemplo.test.ts'); sourceHashes = $expected
        command = 'pnpm test src/exemplo.test.ts'; node = 'v24.22.1'; pnpm = '11.19.0'
        completedAtUtc = [DateTime]::UtcNow.ToString('o'); workingDirectory = $repo
    }
    $relativeReceipt = 'docs/evidencias/checks-fixture.json'
    $receiptPath = Join-Path $repo $relativeReceipt
    function Write-Receipt($Candidate) {
        [System.IO.File]::WriteAllText($receiptPath, ($Candidate | ConvertTo-Json -Depth 8), $utf8)
    }
    function Read-Receipt {
        Read-VerificadorChecksReceipt -RepoRoot $repo -Relative $relativeReceipt `
            -RequiredTestFiles @('src/exemplo.test.ts') -ExpectedSourceHashes $expected
    }
    Write-Receipt $baseReceipt
    Assert-InputCase 'aceita recibo completo e preserva hash do próprio recibo' {
        $result = Read-Receipt
        if ($result.sha256 -ne (Get-FileHash -LiteralPath $receiptPath -Algorithm SHA256).Hash) { throw 'Hash do recibo divergiu.' }
    }
    $badReceipts = @(
        @{ name = 'testes falhando'; field = 'testExit'; value = 1 },
        @{ name = 'exit string em vez de número'; field = 'testExit'; value = '0' },
        @{ name = 'saída vazia'; field = 'testOutput'; value = '' },
        @{ name = 'teste pedido ausente'; field = 'testFiles'; value = @('src/outro.test.ts') },
        @{ name = 'testFiles escalar'; field = 'testFiles'; value = 'src/exemplo.test.ts' },
        @{ name = 'hash do escopo ausente'; field = 'sourceHashes'; value = @{} },
        @{ name = 'hash adulterado'; field = 'sourceHashes'; value = @{ 'src/exemplo.test.ts' = ('A' * 64); 'src/dados.json' = ('A' * 64) } },
        @{ name = 'Node principal divergente'; field = 'node'; value = 'v22.0.0' },
        @{ name = 'pnpm divergente'; field = 'pnpm'; value = '11.25.0' },
        @{ name = 'data sem UTC'; field = 'completedAtUtc'; value = '2026-11-11' },
        @{ name = 'data futura'; field = 'completedAtUtc'; value = [DateTime]::UtcNow.AddHours(1).ToString('o') },
        @{ name = 'diretório relativo'; field = 'workingDirectory'; value = 'src' },
        @{ name = 'conexão com senha na saída'; field = 'testOutput'; value = 'postgresql://fixture:private-fixture@localhost/test' },
        @{ name = 'token em URL na saída'; field = 'testOutput'; value = 'https://pixabay.com/api/?key=fixture-sensitive-value' }
    )
    foreach ($case in $badReceipts) {
        $candidate = $baseReceipt | ConvertTo-Json -Depth 8 | ConvertFrom-Json -AsHashtable
        $candidate[$case.field] = $case.value
        Write-Receipt $candidate
        Assert-InputCase "recibo recusa $($case.name)" { Read-Receipt } $true
    }
    Write-Receipt $baseReceipt
    [System.IO.File]::AppendAllText((Join-Path $repo 'src/dados.json'), 'alterado', $utf8)
    Assert-InputCase 'recusa fonte alterada mesmo com hash esperado antigo' { Read-Receipt } $true
    [System.IO.File]::WriteAllText((Join-Path $repo 'src/dados.json'), 'fixture sem credencial', $utf8)
    [System.IO.File]::WriteAllText($receiptPath, '{}', $utf8)
    Assert-InputCase 'recusa campos obrigatórios ausentes' { Read-Receipt } $true
    [System.IO.File]::WriteAllText($receiptPath, '{json quebrado', $utf8)
    Assert-InputCase 'recusa JSON inválido' { Read-Receipt } $true
    Assert-InputCase 'recusa recibo fora de docs/evidencias' {
        Read-VerificadorChecksReceipt -RepoRoot $repo -Relative 'src/dados.json' -RequiredTestFiles @('src/exemplo.test.ts') -ExpectedSourceHashes $expected
    } $true
    [System.IO.File]::WriteAllBytes($receiptPath, [byte[]]::new(2MB + 1))
    Assert-InputCase 'recusa recibo maior que 2 MiB' { Read-Receipt } $true

    $png = Join-Path $repo 'public/equipment/TI-0001.png'
    [System.IO.File]::WriteAllBytes($png, [Convert]::FromBase64String('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aWQAAAABJRU5ErkJggg=='))
    Assert-InputCase 'aceita PNG explícito com assinatura válida' { Resolve-VerificadorInputPath -RepoRoot $repo -Relative 'public/equipment/TI-0001.png' -Kind Image }
    Assert-InputCase 'não permite imagem pelo canal textual' { Resolve-VerificadorInputPath -RepoRoot $repo -Relative 'public/equipment/TI-0001.png' -Kind Source } $true
    Assert-InputCase 'recusa imagem fora da pasta aprovada' { Resolve-VerificadorInputPath -RepoRoot $repo -Relative 'src/TI-0001.png' -Kind Image } $true
    [System.IO.File]::WriteAllText($png, 'texto nao e imagem', $utf8)
    Assert-InputCase 'recusa arquivo de texto disfarçado de PNG' { Resolve-VerificadorInputPath -RepoRoot $repo -Relative 'public/equipment/TI-0001.png' -Kind Image } $true
    [System.IO.File]::WriteAllBytes($png, [byte[]]::new(5MB + 1))
    Assert-InputCase 'recusa imagem maior que 5 MiB' { Resolve-VerificadorInputPath -RepoRoot $repo -Relative 'public/equipment/TI-0001.png' -Kind Image } $true

    $junction = Join-Path $repo 'src/linked'
    $linkType = if ([System.OperatingSystem]::IsWindows()) { 'Junction' } else { 'SymbolicLink' }
    $null = New-Item -ItemType $linkType -Path $junction -Target (Join-Path $repo 'outside')
    [System.IO.File]::WriteAllText((Join-Path $repo 'outside/canary.json'), '{}', $utf8)
    Assert-InputCase 'recusa fonte através de junction' { Resolve-VerificadorInputPath -RepoRoot $repo -Relative 'src/linked/canary.json' } $true
    Write-Output "$caseCount casos de entradas/recibos/imagens passaram; sem Codex, banco ou rede."
} finally {
    # Only our explicitly created temporary fixture can be removed here.
    $resolvedTestRoot = [System.IO.Path]::GetFullPath($testRoot)
    if (-not $resolvedTestRoot.StartsWith($temporaryBase, [System.StringComparison]::OrdinalIgnoreCase) -or
        [System.IO.Path]::GetFileName($resolvedTestRoot) -notlike 'verificador-entradas-*') {
        throw 'Limpeza recusada fora da fixture temporária.'
    }
    if ($junction -and (Test-Path -LiteralPath $junction)) { Remove-Item -LiteralPath $junction -Force }
    if (Test-Path -LiteralPath $resolvedTestRoot) { Remove-Item -LiteralPath $resolvedTestRoot -Recurse -Force }
}
