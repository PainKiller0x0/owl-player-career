$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$sourceRoot = Join-Path $repoRoot 'dev-public\dev'
$publicRoot = Join-Path $repoRoot 'public'
$utf8NoBom = [System.Text.UTF8Encoding]::new($false)

if (-not (Test-Path -LiteralPath (Join-Path $sourceRoot 'index.html'))) {
    throw 'dev-public\dev\index.html is missing.'
}

if (Test-Path -LiteralPath $publicRoot) {
    Remove-Item -LiteralPath $publicRoot -Recurse -Force
}
New-Item -ItemType Directory -Path $publicRoot | Out-Null
Copy-Item -LiteralPath (Join-Path $sourceRoot 'index.html') -Destination (Join-Path $publicRoot 'index.html')
Copy-Item -LiteralPath (Join-Path $sourceRoot 'src') -Destination $publicRoot -Recurse

$qaScript = Join-Path $publicRoot 'src\patches\096-qa-tools.js'
$qaStyle = Join-Path $publicRoot 'src\styles\31-qa-tools.css'
Remove-Item -LiteralPath $qaScript,$qaStyle -Force -ErrorAction SilentlyContinue

$indexPath = Join-Path $publicRoot 'index.html'
$index = [System.IO.File]::ReadAllText($indexPath)
$index = $index.Replace('<link rel="stylesheet" href="src/styles/31-qa-tools.css">', '')
$index = $index.Replace('<script src="src/patches/096-qa-tools.js?v=age18-worldcup-20260826"></script>', '')
$slotWord = [char]0x4E2A + [char]0x6863 + [char]0x4F4D
$slotPhrase = [char]0x4E2A + [char]0x69FD + [char]0x4F4D
$index = $index.Replace("10$slotWord", "3$slotWord").Replace("10$slotPhrase", "3$slotPhrase")
[System.IO.File]::WriteAllText($indexPath, $index, $utf8NoBom)

$savePath = Join-Path $publicRoot 'src\patches\044-inline.js'
$save = [System.IO.File]::ReadAllText($savePath)
$save = $save.Replace('const SLOT_COUNT=10;', 'const SLOT_COUNT=3;')
$save = $save.Replace("10$slotWord", "3$slotWord").Replace("10$slotPhrase", "3$slotPhrase")
[System.IO.File]::WriteAllText($savePath, $save, $utf8NoBom)

Write-Output "Production assets built at $publicRoot"
