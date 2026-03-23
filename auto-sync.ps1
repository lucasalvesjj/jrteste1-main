$path = "C:\Users\lucas\Downloads\jr1-main 2203\jrteste1-main"
$bat = "C:\Users\lucas\Downloads\jr1-main 2203\jrteste1-main\sincronizar.bat"
$log = "C:\Users\lucas\Downloads\jr1-main 2203\jrteste1-main\sync-log.txt"

$delaySeconds = 20
$lastChange = Get-Date
$running = $false

$watcher = New-Object System.IO.FileSystemWatcher
$watcher.Path = $path
$watcher.IncludeSubdirectories = $true
$watcher.EnableRaisingEvents = $true

$action = {
    $global:lastChange = Get-Date
}

Register-ObjectEvent $watcher Changed -Action $action
Register-ObjectEvent $watcher Created -Action $action
Register-ObjectEvent $watcher Deleted -Action $action
Register-ObjectEvent $watcher Renamed -Action $action

Write-Host "Monitorando alterações..."

while ($true) {
    Start-Sleep -Seconds 5

    if ($running) { continue }

    $now = Get-Date
    $diff = ($now - $lastChange).TotalSeconds

    if ($diff -ge $delaySeconds) {

        $running = $true

        Add-Content $log "[$now] Sync iniciado"

        cmd /c $bat

        Add-Content $log "[$now] Sync finalizado`n"

        $lastChange = Get-Date
        $running = $false
    }
}