@echo off
:: bin/sendEmail.cmd
:: Windows CMD wrapper for the sendEmail CLI.
::
:: Usage: sendEmail [options]
:: Add the bin/ directory (or root) to PATH for system-wide access.

setlocal EnableDelayedExpansion

:: Find this script's directory and the root
set "SCRIPT_DIR=%~dp0"
set "ROOT_DIR=%SCRIPT_DIR%.."

:: Check for node
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [sendEmail] Error: 'node' not found in PATH.
    echo   Install Node.js ^(^>=18^) from https://nodejs.org
    exit /b 1
)

:: Run the entry point, passing all arguments
node "%ROOT_DIR%\bin\sendEmail.js" %*
exit /b %ERRORLEVEL%
