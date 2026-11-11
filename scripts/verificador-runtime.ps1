# Funções do principal; não concedem ferramentas à sessão de verificação.
function Resolve-VerificadorInputPath {
    param(
        [Parameter(Mandatory)][string]$RepoRoot,
        [Parameter(Mandatory)][string]$Relative,
        [ValidateSet('Source', 'Receipt', 'Image', 'Hash')][string]$Kind = 'Source'
    )
    $normalized = $Relative.Replace('\', '/')
    if ([System.IO.Path]::IsPathRooted($Relative) -or $normalized -match ':' -or
        $normalized -match '(^|/)\.\.(/|$)' -or
        $normalized -match '(^|/)(\.env[^/]*|auth\.json|node_modules|\.git|\.codex|\.credentials|\.secrets)(/|$)' -or
        $normalized -match '(^|/)[^/]*(credential|secret|password|api[-_]?key|access[-_]?token|refresh[-_]?token)[^/]*\.json$') {
        throw "Entrada não permitida: $Relative"
    }
    if (($Kind -eq 'Source' -and $normalized -notmatch '\.(md|tsx?|prisma|sql|json|py|ps1|mjs)$') -or
        ($Kind -eq 'Receipt' -and $normalized -notmatch '^docs/evidencias/[a-zA-Z0-9_.-]+\.json$') -or
        ($Kind -eq 'Image' -and $normalized -notmatch '^public/equipment/[a-zA-Z0-9_-]+\.(jpe?g|png)$')) {
        throw "Tipo ou localização de entrada não permitidos: $Relative"
    }
    $root = [System.IO.Path]::GetFullPath($RepoRoot).TrimEnd([System.IO.Path]::DirectorySeparatorChar)
    $resolved = (Resolve-Path -LiteralPath (Join-Path $root $normalized)).Path
    $comparison = if ([System.OperatingSystem]::IsWindows()) {
        [System.StringComparison]::OrdinalIgnoreCase
    } else { [System.StringComparison]::Ordinal }
    if (-not $resolved.StartsWith($root + [System.IO.Path]::DirectorySeparatorChar, $comparison)) {
        throw "Entrada fora do repositório: $Relative"
    }
    $item = Get-Item -LiteralPath $resolved -Force
    $maximumBytes = switch ($Kind) { 'Image' { 5MB } 'Receipt' { 2MB } 'Hash' { 20MB } default { 256KB } }
    if ($item.PSIsContainer -or $item.LinkType -or $item.Length -gt $maximumBytes) {
        throw "Entrada inválida, link ou maior que o limite: $Relative"
    }
    # Cloud placeholders are real OneDrive files; symbolic links/junctions are not.
    $parent = $item.Directory
    while ($null -ne $parent) {
        if ($parent.LinkType) { throw "Entrada atravessa link de diretório: $Relative" }
        if ($parent.FullName.Equals($root, $comparison)) { break }
        $parent = $parent.Parent
    }
    if ($null -eq $parent) { throw "Entrada fora do repositório: $Relative" }
    if ($Kind -eq 'Image') {
        if ($item.Length -lt 8) { throw "Imagem inválida: $Relative" }
        $stream = [System.IO.File]::OpenRead($resolved)
        try {
            $header = [byte[]]::new(8)
            $null = $stream.Read($header, 0, 8)
        } finally { $stream.Dispose() }
        $signature = [System.BitConverter]::ToString($header)
        if (($normalized -match '\.png$' -and $signature -ne '89-50-4E-47-0D-0A-1A-0A') -or
            ($normalized -match '\.jpe?g$' -and -not $signature.StartsWith('FF-D8-FF'))) {
            throw "Assinatura de imagem inválida: $Relative"
        }
    }
    return $resolved
}

function Read-VerificadorChecksReceipt {
    param(
        [Parameter(Mandatory)][string]$RepoRoot,
        [Parameter(Mandatory)][string]$Relative,
        [Parameter(Mandatory)][string[]]$RequiredTestFiles,
        [Parameter(Mandatory)][System.Collections.IDictionary]$ExpectedSourceHashes
    )
    $path = Resolve-VerificadorInputPath -RepoRoot $RepoRoot -Relative $Relative -Kind Receipt
    $rawReceipt = [System.IO.File]::ReadAllText($path)
    try { $receipt = $rawReceipt | ConvertFrom-Json -AsHashtable -ErrorAction Stop }
    catch { throw 'Recibo de checks não é JSON válido.' }
    if ($receipt -isnot [System.Collections.IDictionary]) { throw 'Recibo de checks precisa ser um objeto JSON.' }
    foreach ($field in @('testExit', 'testOutput', 'testFiles', 'sourceHashes', 'command', 'node', 'pnpm', 'completedAtUtc', 'workingDirectory')) {
        if (-not $receipt.Contains($field)) { throw "Recibo sem campo obrigatório: $field" }
    }
    # ConvertFrom-Json may coerce ISO strings into DateTime. Preserve JSON string
    # types independently of the PowerShell version's date parsing defaults.
    $document = [System.Text.Json.JsonDocument]::Parse($rawReceipt)
    try {
        foreach ($field in @('testOutput', 'command', 'node', 'pnpm', 'completedAtUtc', 'workingDirectory')) {
            $element = $document.RootElement.GetProperty($field)
            if ($element.ValueKind -eq [System.Text.Json.JsonValueKind]::String) {
                $receipt[$field] = $element.GetString()
            }
        }
    } finally { $document.Dispose() }
    if ($receipt.testExit -is [string] -or $receipt.testExit -is [bool] -or $receipt.testExit -ne 0) {
        throw 'Recibo rejeitado: testes precisam ter exit numérico zero.'
    }
    foreach ($field in @('testOutput', 'command', 'node', 'pnpm', 'completedAtUtc', 'workingDirectory')) {
        if ($receipt[$field] -isnot [string] -or [string]::IsNullOrWhiteSpace($receipt[$field])) {
            throw "Campo textual inválido no recibo: $field"
        }
    }
    if ($receipt.testOutput.Length -gt 1MB -or $receipt.node -notmatch '^v?24\.\d+\.\d+$' -or $receipt.pnpm -ne '11.19.0') {
        throw 'Recibo com saída excessiva ou versões diferentes de Node 24/pnpm 11.19.0.'
    }
    if ($receipt.testFiles -isnot [array] -or $receipt.testFiles.Count -eq 0 -or
        $receipt.sourceHashes -isnot [System.Collections.IDictionary]) {
        throw 'Recibo precisa conter listas de testes e hashes explícitas.'
    }
    foreach ($test in $receipt.testFiles) {
        if ($test -isnot [string] -or $test -notmatch '^src/.+\.test\.tsx?$') { throw 'Teste não permitido no recibo.' }
        $null = Resolve-VerificadorInputPath -RepoRoot $RepoRoot -Relative $test -Kind Source
    }
    foreach ($test in $RequiredTestFiles) {
        if ($test -cnotin $receipt.testFiles) { throw "Recibo não cobre o teste pedido: $test" }
    }
    foreach ($source in $receipt.sourceHashes.Keys) {
        $null = Resolve-VerificadorInputPath -RepoRoot $RepoRoot -Relative ([string]$source) -Kind Hash
        if ($receipt.sourceHashes[$source] -isnot [string] -or $receipt.sourceHashes[$source] -notmatch '^[a-fA-F0-9]{64}$') {
            throw 'Hash SHA-256 inválido no recibo.'
        }
    }
    foreach ($source in $ExpectedSourceHashes.Keys) {
        $currentPath = Resolve-VerificadorInputPath -RepoRoot $RepoRoot -Relative ([string]$source) -Kind Hash
        $currentHash = (Get-FileHash -LiteralPath $currentPath -Algorithm SHA256).Hash
        if (-not $receipt.sourceHashes.Contains($source) -or $receipt.sourceHashes[$source] -ne $ExpectedSourceHashes[$source] -or
            $currentHash -ne $ExpectedSourceHashes[$source]) {
            throw "Recibo não corresponde ao snapshot atual: $source"
        }
    }
    $completed = [System.DateTimeOffset]::MinValue
    if (-not $receipt.completedAtUtc.EndsWith('Z') -or
        -not [System.DateTimeOffset]::TryParse($receipt.completedAtUtc, [System.Globalization.CultureInfo]::InvariantCulture,
            [System.Globalization.DateTimeStyles]::None, [ref]$completed) -or
        $completed -gt [System.DateTimeOffset]::UtcNow.AddMinutes(5)) {
        throw 'Data UTC de conclusão inválida no recibo.'
    }
    if (-not [System.IO.Path]::IsPathFullyQualified($receipt.workingDirectory) -or
        -not (Test-Path -LiteralPath $receipt.workingDirectory -PathType Container)) {
        throw 'Diretório local de execução do recibo inválido.'
    }
    $sensitiveText = @($receipt.testOutput, $receipt.command, $receipt.workingDirectory) -join "`n"
    if ($sensitiveText -match '(?i)\bpostgres(?:ql)?://[^/\s:@]+:[^@\s/]+@' -or
        $sensitiveText -match '\bsk-[a-zA-Z0-9_-]{20,}' -or
        $sensitiveText -match '\beyJ[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+' -or
        $sensitiveText -match '(?i)https?://[^\s]*[?&](key|api[_-]?key|token)=[^&\s"'']{8,}') {
        throw 'Recibo recusado por possível credencial na saída ou comando.'
    }
    [pscustomobject]@{
        path = $path
        relativePath = $Relative
        sha256 = (Get-FileHash -LiteralPath $path -Algorithm SHA256).Hash
        data = $receipt
    }
}

function Get-VerificadorEnvironment {
    param([System.Collections.IDictionary]$Environment)
    # Apenas inicialização do processo e autenticação interna do CLI por arquivo.
    # Nenhuma variável de banco, aplicação ou provedor é encaminhada.
    $allowedNames = @('PATH', 'PATHEXT', 'SystemRoot', 'SystemDrive', 'WINDIR',
        'COMSPEC', 'TEMP', 'TMP', 'TMPDIR', 'USERPROFILE', 'HOME', 'APPDATA',
        'LOCALAPPDATA', 'PROGRAMDATA', 'PROGRAMFILES', 'PROGRAMFILES(X86)',
        'CODEX_HOME', 'LANG', 'LC_ALL', 'TZ')
    $filtered = [System.Collections.Generic.Dictionary[string, string]]::new([System.StringComparer]::OrdinalIgnoreCase)
    foreach ($key in $Environment.Keys) {
        if ([string]$key -in $allowedNames -and $null -ne $Environment[$key]) {
            $filtered[[string]$key] = [string]$Environment[$key]
        }
    }
    return ,$filtered
}

function Invoke-VerificadorProcess {
    param(
        [Parameter(Mandatory)][string]$Executable,
        [Parameter(Mandatory)][string[]]$Arguments,
        [Parameter(Mandatory)][AllowEmptyString()][string]$InputText,
        [Parameter(Mandatory)][string]$WorkingDirectory,
        [ValidateRange(1, 600)][int]$TimeoutSeconds = 600
    )
    $environment = Get-VerificadorEnvironment ([System.Environment]::GetEnvironmentVariables())
    $start = [System.Diagnostics.ProcessStartInfo]::new()
    $start.FileName = $Executable
    $start.WorkingDirectory = $WorkingDirectory
    $start.UseShellExecute = $false
    $start.CreateNoWindow = $true
    $start.RedirectStandardInput = $true
    $start.RedirectStandardOutput = $true
    $start.RedirectStandardError = $true
    $start.StandardInputEncoding = [System.Text.UTF8Encoding]::new($false)
    $start.StandardOutputEncoding = [System.Text.UTF8Encoding]::new($false)
    $start.StandardErrorEncoding = [System.Text.UTF8Encoding]::new($false)
    $start.Environment.Clear()
    foreach ($key in $environment.Keys) { $start.Environment[$key] = $environment[$key] }
    foreach ($argument in $Arguments) { $start.ArgumentList.Add($argument) }
    $process = [System.Diagnostics.Process]::new()
    $process.StartInfo = $start
    $started = $false
    try {
        $started = $process.Start()
        $stdout = $process.StandardOutput.ReadToEndAsync()
        $stderr = $process.StandardError.ReadToEndAsync()
        $timer = [System.Diagnostics.Stopwatch]::StartNew()
        $inputWrite = $process.StandardInput.WriteAsync($InputText)
        while (-not $inputWrite.Wait(1000)) {
            if ($timer.Elapsed.TotalSeconds -ge $TimeoutSeconds) {
                throw 'Processo do verificador excedeu o tempo limite; nenhuma aprovação emitida.'
            }
        }
        $process.StandardInput.Close()
        while (-not $process.WaitForExit(1000)) {
            if ($timer.Elapsed.TotalSeconds -ge $TimeoutSeconds) {
                $process.Kill($true)
                throw 'Processo do verificador excedeu o tempo limite; nenhuma aprovação emitida.'
            }
        }
        if (-not [System.Threading.Tasks.Task]::WhenAll([System.Threading.Tasks.Task[]]@($stdout, $stderr)).Wait(10000)) {
            throw 'Saída do verificador não foi encerrada; nenhuma aprovação emitida.'
        }
        [pscustomobject]@{
            exitCode = $process.ExitCode
            stdout = $stdout.GetAwaiter().GetResult()
            stderr = $stderr.GetAwaiter().GetResult()
            environmentNames = @($environment.Keys | Sort-Object)
        }
    } finally {
        try { if ($started -and -not $process.HasExited) { $process.Kill($true) } }
        finally { $process.Dispose() }
    }
}

function Get-VerificadorCliArgs {
    @('exec', '--ignore-user-config', '--ephemeral', '--sandbox', 'read-only',
        '--disable', 'apps', '--disable', 'plugins', '--disable', 'shell_tool',
        '--disable', 'multi_agent', '--disable', 'computer_use',
        '--disable', 'browser_use', '--disable', 'browser_use_external',
        '--disable', 'browser_use_full_cdp_access', '--disable', 'code_mode_host',
        '--disable', 'hooks', '--disable', 'image_generation',
        '-c', 'mcp_servers.supabase_projeto_leitura.url="https://mcp.supabase.com/mcp"',
        '-c', 'mcp_servers.supabase_projeto_leitura.enabled=false',
        '-c', 'approval_policy="never"', '-c', 'web_search="disabled"')
}

function Get-VerificadorDecision {
    param(
        [AllowEmptyString()][string]$Report,
        [string[]]$CriterionIds,
        [int]$TestExit,
        [int]$CliExit,
        [bool]$SourcesUnchanged
    )
    $reasons = [System.Collections.Generic.List[string]]::new()
    if ($TestExit -ne 0) { $reasons.Add('Testes locais falharam.') }
    if ($CliExit -ne 0) { $reasons.Add('CLI falhou.') }
    if (-not $SourcesUnchanged) { $reasons.Add('Fontes mudaram durante a rodada.') }
    if (-not $CriterionIds -or @($CriterionIds | Sort-Object -Unique).Count -ne $CriterionIds.Count) {
        $reasons.Add('Spec sem IDs de CA ou com IDs duplicados.')
    }
    $verdicts = [regex]::Matches($Report, '(?m)^Veredito:\s*(PRONTA|NÃO PRONTA)\s*$')
    $verdict = $null
    if ($verdicts.Count -ne 1) { $reasons.Add('Relatório sem veredito único no formato exigido.') }
    else {
        $verdict = $verdicts[0].Groups[1].Value
        if ($verdict -ne 'PRONTA') { $reasons.Add('Verificador declarou NÃO PRONTA.') }
    }
    $rows = [regex]::Matches($Report, '(?m)^\|\s*(CA-\d+)\s*\|([^\r\n]*)$')
    $statuses = [ordered]@{}
    foreach ($id in $CriterionIds) {
        $found = @($rows | Where-Object { $_.Groups[1].Value -eq $id })
        if ($found.Count -ne 1) { $reasons.Add("$id ausente ou duplicado na tabela."); continue }
        $cells = $found[0].Groups[2].Value.Split('|')
        if ($cells.Count -lt 3 -or [string]::IsNullOrWhiteSpace($cells[0])) {
            $reasons.Add("$id sem evidência tabular válida."); continue
        }
        $status = $cells[1].Trim()
        $statuses[$id] = $status
        if ($status -ne 'ATENDIDO') { $reasons.Add("$id não está ATENDIDO.") }
    }
    foreach ($row in $rows) {
        if ($row.Groups[1].Value -notin $CriterionIds) { $reasons.Add('Tabela contém CA fora da spec.') }
    }
    [pscustomobject]@{
        passed = ($reasons.Count -eq 0)
        verdict = $verdict
        criterionStatuses = $statuses
        reasons = @($reasons)
    }
}
