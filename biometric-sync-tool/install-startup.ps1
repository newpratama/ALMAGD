$ErrorActionPreference = 'Stop'
try {
    $launcher = Join-Path $PSScriptRoot 'run-silent.vbs'
    if (-not (Test-Path -LiteralPath $launcher)) { throw 'run-silent.vbs is missing' }
    $startup = [Environment]::GetFolderPath('Startup')
    if (-not $startup) { throw 'Windows Startup folder is unavailable' }
    $shell = New-Object -ComObject WScript.Shell
    $shortcutPath = Join-Path $startup 'AlmagdBiometricSync.lnk'
    $shortcut = $shell.CreateShortcut($shortcutPath)
    $shortcut.TargetPath = Join-Path $env:SystemRoot 'System32\wscript.exe'
    $shortcut.Arguments = [char]34 + $launcher + [char]34
    $shortcut.WorkingDirectory = $PSScriptRoot
    $shortcut.WindowStyle = 7
    $shortcut.Save()
    if (-not (Test-Path -LiteralPath $shortcutPath)) { throw 'Startup shortcut was not created' }
    Write-Host '[OK] Automatic startup registered for this Windows account.'
    exit 0
} catch {
    Write-Host ('[ERROR] Could not register automatic startup: ' + $_.Exception.Message)
    exit 1
}
