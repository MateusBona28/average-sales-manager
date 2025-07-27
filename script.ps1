# script.ps1
$nodeProcess = Start-Process -FilePath "node.exe" -ArgumentList ".next\standalone\server.js" -WindowStyle Hidden -PassThru
$chromeProcess = Start-Process "chrome.exe" "--app=http://localhost:3000" -PassThru
$chromeProcess.WaitForExit()
Stop-Process -Id $nodeProcess.Id