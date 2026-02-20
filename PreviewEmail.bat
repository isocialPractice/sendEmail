@echo off
REM PreviewEmail
:: Run a local host to preview email.

chrome --new-window --profile-directory="Profile 1"
chrome "http://localhost:8000/PreviewEmail.html" --profile-directory="Profile 1"

php -S localhost:8000
