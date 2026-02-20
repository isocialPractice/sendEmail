@echo off
SetLocal EnableDelayedExpansion
REM send
:: Base batch to Send emails in a list of emails. Add statements for adding attachments as needed.

copy send.js runSendEmail.js > nul 2>nul
copy Text-EmailList.txt tempEmailList.txt > nul 2>nul
copy Text-NamesOnEmailList.txt tempNamesOnEmailList.txt > nul 2>nul

call getDate 0
::
:: FOR /F "TOKENS=1* DELIMS=" %%A IN ('DATE/T') DO set _getDate=%%A
::
:: set _getDate=%_getDate:* =%
:: set _getDate=%_getDate:/=-%
::
:: set _getDate=%_getDate:-20=-__TWENTY__%
:: set _getDate=%_getDate:-__TWENTY__-=-20-%
:: set _getDate=%_getDate:-__TWENTY__=-%
:: set _getDate=%_getDate: =%
::

FOR /F "usebackq tokens=*" %%A in ("Text-EmailList.txt") DO (
 copy Text-HTML.txt Text-NodeJSHTML.txt > nul 2>nul
 copy send.js runSendEmail.js > nul 2>nul

 FOR /l %%l in (1,1,1) DO @for /f "tokens=1,2* delims=:" %%a in ('findstr /n /r "^" tempEmailList.txt ^| findstr /r "^%%l:"') DO @set _toEmail=%%b
 FOR /l %%l in (1,1,1) DO @for /f "tokens=1,2* delims=:" %%a in ('findstr /n /r "^" tempNamesOnEmailList.txt ^| findstr /r "^%%l:"') DO @set _curName=%%b

  REM if "!_curName!"==" " (
  REM  set "_curName=There"
  REM )
  sed -i "s/CH-EMAILTO/!_toEmail!/" runSendEmail.js
  sed -i "s/CH-EMAILONLIST/!_curName!/" runSendEmail.js
  sed -i "s/CH-DATE/!_getDate!/g" runSendEmail.js

  sed -i "s|src='img/|src='cid:|g" Text-NodeJSHTML.txt
  sed -i "s|.jpg'/>|@example.com'/>|g" Text-NodeJSHTML.txt
  sed -i "s|CH-EMAILONLIST|!_curName!|g" Text-NodeJSHTML.txt

  node runSendEmail

  sed -i 1d tempEmailList.txt
  sed -i 1d tempNamesOnEmailList.txt
 )

del runSendEmail.js

del tempEmailList.txt
del tempNamesOnEmailList.txt
del Text-NodeJSHTML.txt

:: call :_checkOut

:_checkOut
 echo Check ouput
 echo ************************************
 echo:

 set /P _checkOut=
goto:eof

exit /b