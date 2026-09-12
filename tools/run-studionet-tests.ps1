$ErrorActionPreference = "Stop"

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot ".." )).Path
$stableRoot = Join-Path $env:LOCALAPPDATA "Beacon\studionet-stable-harness"
$stableHome = Join-Path $stableRoot "home"
$venvPath = Join-Path $stableRoot "venv"
$pythonPath = Join-Path $venvPath "Scripts\python.exe"
$gltestPath = Join-Path $venvPath "Scripts\gltest.exe"
$genvmCache = Join-Path $stableHome ".cache\gltest-direct"
$genvmArchive = Join-Path $genvmCache "genvm-universal-v0.3.0-rc7.tar.xz"
$genvmUrl = "https://github.com/genlayerlabs/genvm/releases/download/v0.3.0-rc7/genvm-universal.tar.xz"

New-Item -ItemType Directory -Force -Path $stableRoot, $stableHome, $genvmCache | Out-Null
if (-not (Test-Path $pythonPath)) {
  py -3 -m venv $venvPath
}

& $pythonPath -m pip install --disable-pip-version-check --upgrade pip==26.2.1
& $pythonPath -m pip install --disable-pip-version-check --no-deps -r (Join-Path $repoRoot "requirements-studionet.txt")
if (-not (Test-Path $genvmArchive)) {
  $sharedArchive = Join-Path $env:USERPROFILE ".cache\gltest-direct\genvm-universal-v0.3.0-rc7.tar.xz"
  if (Test-Path $sharedArchive) {
    Copy-Item -LiteralPath $sharedArchive -Destination $genvmArchive
  } else {
    $downloaded = $false
    for ($attempt = 1; $attempt -le 3 -and -not $downloaded; $attempt += 1) {
      try {
        Invoke-WebRequest -Uri $genvmUrl -OutFile $genvmArchive -UseBasicParsing
        $downloaded = $true
      } catch {
        if (Test-Path $genvmArchive) { Remove-Item -LiteralPath $genvmArchive -Force }
        if ($attempt -eq 3) { throw }
      }
    }
  }
}

$oldUserProfile = $env:USERPROFILE
$oldStableSource = $env:BEACON_V8_TEST_SOURCE
$oldStableHarness = $env:BEACON_STABLE_HARNESS
try {
  $env:USERPROFILE = $stableHome
  $env:BEACON_V8_TEST_SOURCE = "contracts/beacon_v8_studionet.py"
  $env:BEACON_STABLE_HARNESS = "1"
  Push-Location $repoRoot
  & $gltestPath test/test_beacon_v8.py test/test_deployment_source.py --network studionet --chain-type studionet --rpc-url https://studio.genlayer.com/api --tb=short -q
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}
finally {
  Pop-Location
  $env:USERPROFILE = $oldUserProfile
  $env:BEACON_V8_TEST_SOURCE = $oldStableSource
  $env:BEACON_STABLE_HARNESS = $oldStableHarness
}
