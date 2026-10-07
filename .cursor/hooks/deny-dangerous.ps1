$inputText = [Console]::In.ReadToEnd()
try {
    $data = $inputText | ConvertFrom-Json
    $command = [string]$data.command
} catch {
    Write-Output '{"permission":"allow"}'
    exit 0
}

$denyPatterns = @(
    'rm\s+-rf',
    'git\s+push\s+--force',
    'git\s+reset\s+--hard',
    'kubectl\s+delete',
    'DROP\s+TABLE'
)

foreach ($pattern in $denyPatterns) {
    if ($command -match $pattern) {
        $response = @{
            permission = 'deny'
            user_message = 'This command is blocked by SDLC Kit security hooks (.cursor/hooks.json).'
            agent_message = "Blocked dangerous shell pattern: $pattern"
        } | ConvertTo-Json -Compress
        Write-Output $response
        exit 2
    }
}

Write-Output '{"permission":"allow"}'
exit 0
