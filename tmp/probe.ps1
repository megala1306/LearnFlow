$ErrorActionPreference = "Stop"
for ($i = 1; $i -le 5; $i++) {
    $res = curl.exe -s --max-time 5 -X POST http://localhost:8000/select-action -H "Content-Type: application/json" --data-binary "@c:\Users\marim\Downloads\Cap-Project\tmp\probe.json"
    $parsed = $res | ConvertFrom-Json
    Write-Host "Run $i | action=$($parsed.action) | source=$($parsed.source) | gap=$($parsed.confidence_gap)"
}
