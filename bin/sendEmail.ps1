#!/usr/bin/env pwsh
# bin/sendEmail.ps1
# Cross-platform PowerShell wrapper for the sendEmail CLI.
# Works on Windows, Linux, and macOS with PowerShell Core (pwsh).
#
# Usage: ./bin/sendEmail.ps1 [options]
# Or add to PATH: sendEmail [options]

param(
    [Parameter(ValueFromRemainingArguments = $true)]
    [string[]]$Arguments
)

$ErrorActionPreference = 'Stop'

# Resolve root path
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RootDir = Split-Path -Parent $ScriptDir

# Check for node
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Error "[sendEmail] Error: 'node' not found in PATH. Install Node.js (>=18) from https://nodejs.org"
    exit 1
}

# Run the entry point
$EntryPoint = Join-Path $RootDir 'bin' 'sendEmail.js'

try {
    & node $EntryPoint @Arguments
    exit $LASTEXITCODE
} catch {
    Write-Error "[sendEmail] Fatal error: $_"
    exit 1
}
