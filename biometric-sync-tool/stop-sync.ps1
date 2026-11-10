$ErrorActionPreference = 'Stop'
try {
    $pidPath = Join-Path $PSScriptRoot 'sync.pid'
    if (-not (Test-Path -LiteralPath $pidPath)) {
        Write-Host '[INFO] No sync process is recorded.'
        exit 0
    }
    $syncProcessId = 0
    if (-not [int]::TryParse((Get-Content -LiteralPath $pidPath -Raw).Trim(), [ref]$syncProcessId) -or $syncProcessId -le 0) {
        throw 'Invalid sync.pid; no process was stopped'
    }
    $process = Get-CimInstance Win32_Process -Filter ('ProcessId = ' + $syncProcessId)
    if ($process) {
        $expectedScript = Join-Path $PSScriptRoot 'sync.py'
        $expectedCommand = '(?:^|[\s"])' + [regex]::Escape($expectedScript) + '(?:[\s"]|$)'
        if ($process.Name -notmatch '^pythonw?(\d+(\.\d+)*)?\.exe$' -or $process.CommandLine -notmatch $expectedCommand) {
            throw 'The recorded PID belongs to another program; no process was stopped'
        }
        Stop-Process -Id $syncProcessId -ErrorAction Stop
    }
    Remove-Item -LiteralPath $pidPath -Force
    Write-Host '[OK] Sync stopped. Other programs were not stopped.'
    exit 0
} catch {
    Write-Host ('[ERROR] ' + $_.Exception.Message)
    exit 1
}
