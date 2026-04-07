$ErrorActionPreference = 'Stop'

if (-not (Test-Path 'engine\pptx\render_pptx_patch.py')) {
  throw 'Missing engine\pptx\render_pptx_patch.py'
}

if (-not (Test-Path 'engine\content\science9_interconnected_spheres.json')) {
  throw 'Missing engine\content\science9_interconnected_spheres.json'
}

python engine\pptx\render_pptx_patch.py --lesson engine\content\science9_interconnected_spheres.json --out output
Write-Host 'Patched Science PPTX rebuilt into .\output'
