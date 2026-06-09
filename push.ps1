param(
    [Parameter(Mandatory = $true, Position = 0)]
    [string]$RemoteUrl,

    [Parameter(Position = 1)]
    [string]$Message = "chore: update project"
)

$ErrorActionPreference = "Stop"

function Invoke-Git {
    param([string[]]$GitArgs)

    & git @GitArgs
    if ($LASTEXITCODE -ne 0) {
        throw "git $($GitArgs -join ' ') failed"
    }
}

if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    throw "Git is not installed or not available in PATH."
}

$insideWorkTree = $false
try {
    $insideWorkTree = ((& git rev-parse --is-inside-work-tree 2>$null) -eq "true")
} catch {
    $insideWorkTree = $false
}

if (-not $insideWorkTree) {
    Invoke-Git @("init")
}

$branch = (& git branch --show-current).Trim()
if ([string]::IsNullOrWhiteSpace($branch)) {
    $branch = "master"
    Invoke-Git @("checkout", "-B", $branch)
}

$originUrl = (& git remote get-url origin 2>$null)
if ($LASTEXITCODE -eq 0) {
    Invoke-Git @("remote", "set-url", "origin", $RemoteUrl)
} else {
    Invoke-Git @("remote", "add", "origin", $RemoteUrl)
}

Invoke-Git @("add", "-A")

& git diff --cached --quiet
if ($LASTEXITCODE -ne 0) {
    Invoke-Git @("commit", "-m", $Message)
}

Invoke-Git @("push", "-u", "origin", $branch)

$commitId = (& git rev-parse HEAD).Trim()
Write-Output "Commit ID: $commitId"
