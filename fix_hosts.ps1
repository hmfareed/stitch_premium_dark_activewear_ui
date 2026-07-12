$hostsPath = "C:\Windows\System32\drivers\etc\hosts"
$entries = @(
    "",
    "# MongoDB Atlas clusterfareed DNS bypass (added for local dev)",
    "65.62.37.57  ac-rggzz72-shard-00-00.4aw02aj.mongodb.net",
    "65.62.37.71  ac-rggzz72-shard-00-01.4aw02aj.mongodb.net",
    "65.62.37.64  ac-rggzz72-shard-00-02.4aw02aj.mongodb.net"
)
Add-Content -Path $hostsPath -Value $entries
Write-Host "Done! Hosts file updated."
Get-Content $hostsPath | Select-Object -Last 10
