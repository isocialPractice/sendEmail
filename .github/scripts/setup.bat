@echo off
:: Post-clone setup script for sendEmail
:: Creates config\accounts\_default.js from template or git history

set "_helperDir=%~dp0"
set "_targetDir=%~dp0..\..\config"
set "_targetFile=%_targetDir%\accounts\_default.js"

:: Check if accounts does not exist.
if NOT EXIST "%_targetDir%\accounts" mkdir "%_targetDir%\accounts"

:: Check if exists.
if EXIST "%_targetFile%" (
 echo The file "_defautl.js" exists in `config\accounts`.
) else (
 copy "%_helperDir%\accounts\_default.js" "%_targetFile%"
)
echo Done
