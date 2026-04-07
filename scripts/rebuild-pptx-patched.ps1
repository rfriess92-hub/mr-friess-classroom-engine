param(
  [Parameter(Mandatory = $true)]
  [string]$Lesson
)

$ErrorActionPreference = 'Stop'

if (-not (Test-Path 'engine\pptx\render_pptx_patch.py')) {
  throw 'Missing engine\pptx\render_pptx_patch.py'
}

if (-not (Test-Path $Lesson)) {
  throw "Missing lesson file: $Lesson"
}

python engine\pptx\render_pptx_patch.py --lesson $Lesson --out output
Write-Host "Patched PPTX rebuilt into .\output for $Lesson"
