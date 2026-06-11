$ErrorActionPreference = "Stop"

$adapterName = "以太网"
$ipAddress = "192.168.99.100"
$prefixLength = 24

$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole(
  [Security.Principal.WindowsBuiltInRole]::Administrator
)

if (-not $isAdmin) {
  Write-Host "请右键以管理员身份运行此脚本。"
  Write-Host "需要把电脑有线网卡设置到 YE6275D 所在网段：$ipAddress/$prefixLength"
  pause
  exit 1
}

$adapter = Get-NetAdapter -Name $adapterName -ErrorAction Stop

Get-NetIPAddress -InterfaceAlias $adapterName -AddressFamily IPv4 -ErrorAction SilentlyContinue |
  Where-Object { $_.IPAddress -ne $ipAddress } |
  Remove-NetIPAddress -Confirm:$false

if (-not (Get-NetIPAddress -InterfaceAlias $adapterName -AddressFamily IPv4 -ErrorAction SilentlyContinue |
  Where-Object { $_.IPAddress -eq $ipAddress })) {
  New-NetIPAddress -InterfaceAlias $adapterName -IPAddress $ipAddress -PrefixLength $prefixLength | Out-Null
}

Set-DnsClientServerAddress -InterfaceAlias $adapterName -ResetServerAddresses

Write-Host "已设置 $($adapter.Name)：$ipAddress/$prefixLength"
Write-Host "YE6275D 手册默认设备地址：192.168.99.121"
Write-Host "下一步：确认网线连接和采集器上电，然后在 YE7602 中添加 YE6275D，设备地址填 192.168.99.121。"
pause
