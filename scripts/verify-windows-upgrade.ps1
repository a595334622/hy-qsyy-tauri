param(
    [Parameter(Mandatory = $true)][string]$Installer,
    [Parameter(Mandatory = $true)][ValidateSet("x64", "x86")][string]$Architecture
)

$ErrorActionPreference = "Stop"
$work = Join-Path $env:RUNNER_TEMP "qsyy-upgrade-$Architecture"
New-Item -ItemType Directory -Force $work | Out-Null
$engine = New-Object -ComObject WindowsInstaller.Installer

# 安装包属性读取
# 通过 Windows Installer 自身读取真实产品版本和升级标识。
function Read-MsiProperties([string]$Path) {
    $database = $engine.OpenDatabase($Path, 0)
    $view = $database.OpenView('SELECT `Property`, `Value` FROM `Property`')
    $view.Execute()
    $values = @{}
    while ($null -ne ($row = $view.Fetch())) {
        $values[$row.StringData(1)] = $row.StringData(2)
        [void][Runtime.InteropServices.Marshal]::FinalReleaseComObject($row)
    }
    $view.Close()
    [void][Runtime.InteropServices.Marshal]::FinalReleaseComObject($view)
    [void][Runtime.InteropServices.Marshal]::FinalReleaseComObject($database)
    return $values
}

# 安装状态读取
# 使用产品代码确认旧版本被实际移除，避免触发 WMI 的修复安装。
function Read-ProductState([string]$Code) {
    return $engine.GetType().InvokeMember("ProductState", "GetProperty", $null, $engine, @($Code))
}

# 静默安装执行
# 记录日志并禁止自动启动页面，只验证 Windows 安装与升级行为。
function Invoke-Msi([string]$Operation, [string]$PathOrCode, [string]$Label) {
    $log = Join-Path $work "$Label.log"
    $arguments = @($Operation, "`"$PathOrCode`"", "/qn", "/norestart", "/l*v", "`"$log`"", "WVRTINSTALLED=1", "WIXUI_EXITDIALOGOPTIONALCHECKBOX=0")
    $process = Start-Process msiexec.exe -ArgumentList $arguments -Wait -PassThru
    if ($process.ExitCode -notin @(0, 3010)) {
        Get-Content $log -Tail 100 | Write-Host
        throw "$Label failed with exit code $($process.ExitCode)"
    }
}

$Installer = (Resolve-Path $Installer).Path
$current = Read-MsiProperties $Installer
$config = Get-Content (Join-Path $PSScriptRoot "../src-tauri/tauri.conf.json") -Raw | ConvertFrom-Json
if ($current.ProductVersion -ne $config.package.version -or $current.ProductName -ne "洽思英语" -or $current.UpgradeCode -ne "{4D083623-775C-5996-9C2F-123E87C3441B}") {
    throw "Unexpected version or current MSI upgrade identity"
}
$previous = @{}
foreach ($version in @("0.1.3", "0.1.4")) {
    $path = Join-Path $work "qsyy-$version-$Architecture.msi"
    Invoke-WebRequest "https://www.qiasieng.com/desktop-updates/$version/qsyy_${version}_${Architecture}_zh-CN.msi" -OutFile $path
    $properties = Read-MsiProperties $path
    if ($properties.ProductVersion -ne $version) { throw "Downloaded unexpected MSI version" }
    $previous[$version] = @{ Path = $path; Properties = $properties }
}
if ($previous["0.1.3"].Properties.UpgradeCode -ne $current.UpgradeCode) {
    throw "0.1.3 and current MSI must share an upgrade identity"
}
if ($previous["0.1.4"].Properties.UpgradeCode -ne "{6BBDB433-93A4-58A9-9BFD-5C7A0207E900}") {
    throw "Unexpected 0.1.4 MSI upgrade identity"
}

$settings = Join-Path $env:APPDATA "pro.heyue.qsyy\setting.json"
New-Item -ItemType Directory -Force (Split-Path $settings) | Out-Null
$sentinel = '{"Secret":"upgrade-test-preserve-local-setting"}'
[IO.File]::WriteAllText($settings, $sentinel)
$shell = New-Object -ComObject WScript.Shell
$desktopDirectories = @([Environment]::GetFolderPath("Desktop"), [Environment]::GetFolderPath("CommonDesktopDirectory"))

foreach ($scenario in @("legacy", "current", "both")) {
    $versions = switch ($scenario) {
        "legacy" { @("0.1.3") }
        "current" { @("0.1.4") }
        "both" { @("0.1.3", "0.1.4") }
    }
    foreach ($version in $versions) {
        $old = $previous[$version]
        Invoke-Msi "/i" $old.Path "$scenario-install-$version"
        if ((Read-ProductState $old.Properties.ProductCode) -ne 5) { throw "Old product was not installed" }
    }

    Invoke-Msi "/i" $Installer "$scenario-upgrade"
    if ((Read-ProductState $current.ProductCode) -ne 5) { throw "New product was not installed" }
    foreach ($version in $versions) {
        if ((Read-ProductState $previous[$version].Properties.ProductCode) -ne -1) {
            throw "$scenario left $version installed alongside the new version"
        }
    }
    $installLocation = $engine.GetType().InvokeMember("ProductInfo", "GetProperty", $null, $engine, @($current.ProductCode, "InstallLocation"))
    $executable = Join-Path $installLocation "洽思英语.exe"
    if (!(Test-Path $executable) -or [Diagnostics.FileVersionInfo]::GetVersionInfo($executable).ProductVersion -ne $current.ProductVersion) {
        throw "Installed executable is missing or has the wrong version: $executable"
    }
    $shortcuts = @($desktopDirectories | ForEach-Object { Join-Path $_ "洽思英语.lnk" } | Where-Object { Test-Path $_ })
    if ($shortcuts.Count -eq 0) { throw "New desktop shortcut is missing" }
    foreach ($shortcut in $shortcuts) {
        $target = $shell.CreateShortcut($shortcut).TargetPath
        if ($target -and $target -ne $executable) {
            throw "New shortcut points outside the installed app: $target"
        }
    }
    foreach ($directory in $desktopDirectories) {
        if (Test-Path (Join-Path $directory "单词速记.lnk")) { throw "Stale 0.1.4 desktop shortcut remains" }
    }
    if ([IO.File]::ReadAllText($settings) -ne $sentinel) { throw "Local activation settings were changed" }
    Write-Host "$Architecture $scenario upgrade passed: old products removed, new executable and shortcut installed, activation settings preserved"
    Invoke-Msi "/x" $current.ProductCode "$scenario-uninstall"
}
