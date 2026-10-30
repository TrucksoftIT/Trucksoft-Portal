# Add the Portal site to the shared Caddy on the production host, safely:
# back up -> append -> validate -> reload via the admin API (127.0.0.1:2020).
# Restores the backup if validation or reload fails. Never restarts the service
# (PayFlow, CMSv6, Forms, Recruitment and the ERP share this Caddy).
#
#   scp deploy/add-caddy-site.ps1 trucksoft:C:/ops/portal/add-caddy-site.ps1
#   ssh trucksoft "powershell -NoProfile -ExecutionPolicy Bypass -File C:\ops\portal\add-caddy-site.ps1"
#
# (Run it as a file: piping a script to `-Command -` breaks here-strings.)
# 'Continue': Caddy logs to stderr, which 5.1 would otherwise turn into a
# terminating error. Native results are checked through $LASTEXITCODE.
$ErrorActionPreference = 'Continue'
$caddy = 'C:\Caddy\caddy.exe'
$file = 'C:\Caddy\Caddyfile'
$site = 'portals.trucksoft.com.ng'

if (Select-String -Path $file -SimpleMatch "$site {" -Quiet) {
  Write-Output "$site is already in the Caddyfile; nothing to do."
  return
}

$backup = "$file.bak-$(Get-Date -Format 'yyyyMMdd-HHmm')-portals"
Copy-Item $file $backup -ErrorAction Stop
Write-Output "Backed up to $backup"

$block = @"

# Staff Portal (front door): WSL Docker, loopback only. Deploy kit: Trucksoft-Portal/deploy.
$site {
	encode gzip zstd
	reverse_proxy 127.0.0.1:8040
}
"@
# Append as UTF-8 without a BOM (Add-Content -Encoding utf8 can insert one).
[System.IO.File]::AppendAllText($file, $block, (New-Object System.Text.UTF8Encoding $false))

& $caddy validate --config $file --adapter caddyfile 2>&1 | Select-Object -Last 2
if ($LASTEXITCODE -ne 0) {
  Copy-Item $backup $file -Force
  Write-Output 'Validation failed; restored the backup. Nothing was reloaded.'
  exit 1
}

& $caddy reload --config $file --adapter caddyfile --address 127.0.0.1:2020 2>&1 | Select-Object -Last 2
if ($LASTEXITCODE -ne 0) {
  Copy-Item $backup $file -Force
  & $caddy reload --config $file --adapter caddyfile --address 127.0.0.1:2020
  Write-Output 'Reload failed; restored and reloaded the backup.'
  exit 1
}
Write-Output "Reloaded Caddy with $site -> 127.0.0.1:8040"
