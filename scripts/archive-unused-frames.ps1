$ErrorActionPreference = 'Stop'
$workspaceRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$assetRoot = (Resolve-Path -LiteralPath (Join-Path $workspaceRoot 'public\frames')).Path
$manifestRoot = (Resolve-Path -LiteralPath (Join-Path $workspaceRoot 'src\frames\manifests')).Path
$archiveRoot = [System.IO.Path]::GetFullPath((Join-Path $workspaceRoot '.frame-archive'))
if (-not $archiveRoot.StartsWith($workspaceRoot + '\', [System.StringComparison]::OrdinalIgnoreCase)) { throw 'Archive target outside workspace' }
New-Item -ItemType Directory -Path $archiveRoot -Force | Out-Null
$archiveAssets = Join-Path $archiveRoot 'frames'
$archiveManifests = Join-Path $archiveRoot 'manifests'
New-Item -ItemType Directory -Path $archiveAssets,$archiveManifests -Force | Out-Null
Push-Location $workspaceRoot
try {
  $retainedIds = (node --input-type=module -e "import { definitions } from './src/frames/definitions.ts'; console.log(JSON.stringify(definitions.map(f=>f.id)));" | ConvertFrom-Json)
  if ($LASTEXITCODE -ne 0 -or $retainedIds.Count -ne 60) { throw 'Expected the curated 60-frame catalog' }
  $archived = 0
  foreach ($directory in Get-ChildItem -LiteralPath $assetRoot -Directory) {
    $manifestPath = Join-Path $directory.FullName 'v1\manifest.json'
    if (-not (Test-Path -LiteralPath $manifestPath)) { continue }
    $data = Get-Content -LiteralPath $manifestPath -Raw | ConvertFrom-Json
    if (-not $data.artwork -or $data.id -in $retainedIds) { continue }
    if ($data.id -ne $directory.Name -or $data.id -notmatch '^[a-z0-9-]+$') { throw 'Unexpected generated frame identity' }
    $source = (Resolve-Path -LiteralPath $directory.FullName).Path
    $destination = [System.IO.Path]::GetFullPath((Join-Path $archiveAssets $data.id))
    if (-not $source.StartsWith($assetRoot + '\', [System.StringComparison]::OrdinalIgnoreCase) -or -not $destination.StartsWith($archiveRoot + '\', [System.StringComparison]::OrdinalIgnoreCase)) { throw 'Move target outside intended directories' }
    Move-Item -LiteralPath $source -Destination $destination
    $sourceManifest = [System.IO.Path]::GetFullPath((Join-Path $manifestRoot ($data.id + '.json')))
    $destinationManifest = [System.IO.Path]::GetFullPath((Join-Path $archiveManifests ($data.id + '.json')))
    if (-not $sourceManifest.StartsWith($manifestRoot + '\', [System.StringComparison]::OrdinalIgnoreCase) -or -not $destinationManifest.StartsWith($archiveRoot + '\', [System.StringComparison]::OrdinalIgnoreCase)) { throw 'Manifest move outside intended directories' }
    if (Test-Path -LiteralPath $sourceManifest) { Move-Item -LiteralPath $sourceManifest -Destination $destinationManifest }
    $archived++
  }
  Write-Output "Archived $archived generated packages outside the 60-frame scope."
} finally { Pop-Location }
