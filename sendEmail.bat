@echo off
SetLocal EnableDelayedExpansion
REM sendEmail
:: Base batch to Send emails in a list of emails.

:: SHORTHAND NOTES
:: - At `## PATH` section, where variables are defined, the appendended folder names need to be created, and tools added
:: - ()=> call toExplorer is shorthand for use the computers default program to open the file

if [%_isTestEmails%]==[] (
 set _isTestEmails=0
 )

:: ## PATH
:: Define path and variables to current batch.
set "_callRootBatchFilesSendEmail=%~dp0"
:: use this to remove the trailing "\" from %~dp0
()=> set "_sendEmailPath=%_callRootBatchFilesSendEmail%"
set "_callLibraryBatchFiles=%_sendEmailPath%\lib"
set "_callRootConfigSendEmail=%_sendEmailPath%\config"
set "_callRootSendEmail=%_sendEmailPath%\bin"
set "_checkOptionsSendEmail=%_sendEmailPath%\bin\lib\checkOptions.bat"
set "_sendEmailLists=%_sendEmailPath%\lists"
set "_sendEmailText=%_sendEmailPath%\text"
set "_sendEmailTemp=%_sendEmailPath%\.tmp"

:: Variables from arguments.
set "_parOneSendEmail=%~1"
set "_checkParOneSendEmail=-%_parOneSendEmail%-"
set "_parTwoSendEmail=%~2"
set "_checkParTwoSendEmail=-%_parTwoSendEmail%-"
set "_parThreeSendEmail=%~3"
set "_checkParThreeSendEmail=-%_parThreeSendEmail%-"
set "_parFourSendEmail=%~4"
set "_checkParFourSendEmail=-%_parFourSendEmail%-"
set "_parFiveSendEmail=%~5"
set "_checkParFiveSendEmail=-%_parFiveSendEmail%-"
set "_parSixSendEmail=%~6"
set "_checkParSixSendEmail=-%_parSixSendEmail%-"
set "_parSevenSendEmail=%~7"
set "_checkParSevenSendEmail=-%_parSevenSendEmail%-"
set "_parEightSendEmail=%~8"
set "_checkParEightSendEmail=-%_parEightSendEmail%-"
set "_parNineSendEmail=%~9"
set "_checkParNineSendEmail=-%_parNineSendEmail%-"

if "%_parOneSendEmail%"=="/?" (
 if "%_parTwoSendEmail%"=="-e" (
  ()=> call toExplorer "%_sendEmailPath%\docs\HELP-%~n0.txt" | start "" notepad++
 ) else (
  type "%_sendEmailPath%\docs\HELP-%~n0.txt"
 )
 goto _removeBatchVariablesSendEmail
)
:: Edit File
if "%_parOneSendEmail%"=="-e" (
 set _muteExitSendEmail=1
 rem Get the date with librarty getDate
 :: ()=> === NEW_SCRIPT - tool for getting dates by day of the week: fully spelled and abbreviated; month: numeric and always 2 digits - so 1 for January would be 01, fully spelled , or conventional abbreviated string; year: four digit year or last two digits of the full digit year; fiscal quarter: numeric and always 2 digits - so 1 would be 01 - 2 to 02 - and so on, or string like 1st, 2nd, 3rd, 4th
 call "%_callLibraryBatchFiles%\getDate.bat"
 call "%_callLibraryBatchFiles%\editBatchFile.bat" "%~n0"
 if "%_parTwoSendEmail%"=="--edit-all" (
  ()=> call toExplorer "%_sendEmailPath%\docs\HELP-%~n0.txt" | start "" notepad++
 )
 goto _removeBatchVariablesSendEmail
)

call :_makeTempDirSendEmail 1
call "%_checkOptionsSendEmail%" "%_parOneSendEmail%" "%_tmpDirSendEmail%"

echo Starting Send Emails:
call :_startSendEmail
goto:eof

:_startSendEmail
 if "%_checkOptions%"=="/" (
  call :_sendEmailWithOptions & goto:eof
 ) else (
  call :_sendEmailWithoutOptions 1 & goto:eof
 )
 rem else
 exit /b
goto:eof


:_sendEmailWithOptions
 if "%_hasOptions%"=="/c" (
  if "%_checkParTwoSendEmail%"=="--" (
   if NOT EXIST "sendEmail" (
    xcopy /E/I "%_sendEmailPath%" "sendEmail"
   ) else (
    call callLibrary syntaxErr "%~n0" --exist
   )
  ) else (
   if NOT EXIST "%_parTwoSendEmail%\sendEmail" (
    xcopy /E/I "%_sendEmailPath%" "%_parTwoSendEmail%\sendEmail"
   ) else (
    call callLibrary syntaxErr "%~n0" --exist
   )
  )
  rem done
  goto _removeBatchVariablesSendEmail
 ) else (
  if "%_hasOptions%"=="/t" (
   sed -i "s|--_FROM-ADDRESS_--|name@site.com|g" "%_nodeSend%"
   sed -i "s|CHANGE_SEND_TO|%_parTwoSendEmail%|g" "%_nodeSend%"
   sed -i "s|var emailText|// var emailText|g" "%_nodeSend%"
   call :_runSendEmail 1 & goto:eof
  )
 )
 rem else
 goto _removeBatchVariablesSendEmail
goto:eof

:_sendEmailWithoutOptions
REM Config sending and set Lowcase to first argument.
 if "%1"=="1" (
  if "%_checkParTwoSendEmail%"=="--" (
   call callLibrary syntaxIncorrect "Without options at least two arguments required."
   goto _removeBatchVariablesSendEmail
  )
  if "%_checkParThreeSendEmail%"=="--" (
   set "_sendingWhat=2"
   call :_sendEmailWithoutOptions 2 & goto:eof
  )
  if "%_checkParFourSendEmail%"=="--" (
   set "_sendingWhat=3"
   call :_sendEmailWithoutOptions 2 & goto:eof
  )
  if "%_checkParFiveSendEmail%"=="--" (
   set "_sendingWhat=4"
   call :_sendEmailWithoutOptions 2 & goto:eof
  )
  if "%_checkParSixSendEmail%"=="--" (
   set "_sendingWhat=5"
   call :_sendEmailWithoutOptions 2 & goto:eof
  )
  rem else
  set "_sendingWhat=6"
  call :_sendEmailWithoutOptions 2 & goto:eof
 )
 rem set main variable
 if "%1"=="2" (
  sed -i "s|CHANGE_SEND_TO|%_parOneSendEmail%|" "%_nodeSend%"
  if EXIST "%_parTwoSendEmail%" (
   sed -i "s|CHANGE_MESSAGE_FILE|%_parTwoSendEmail%|" "%_nodeSend%"
  ) else (
   sed -i "s|html: emailText,||" "%_nodeSend%"
   sed -i "s|//html: -emailText-,|html: %_parTwoSendEmail%,|" "%_nodeSend%"
  )
  if "%_sendingWhat%"=="6" (
   if "%_parSixSendEmail%"=="--close" (
    call :_replaceByWhatIsSent 1
	echo SendEmail Complete: & echo:
	goto _removeBatchVariablesSendEmail
   ) else (
    call :_replaceByWhatIsSent 1
	call :_checkOut & goto:eof
   )
  )
  if "%_sendingWhat%"=="5" (
   if "%_parFiveSendEmail%"=="--close" (
    call :_replaceByWhatIsSent 1
    echo SendEmail Complete: & echo:
	goto _removeBatchVariablesSendEmail
   ) else (
    call :_replaceByWhatIsSent 1
	call :_checkOut & goto:eof
   )
  )
  if "%_sendingWhat%"=="4" (
   set "_parFiveSendEmail=name@site.com"
   if "%_parFourSendEmail%"=="--close" (
    call :_replaceByWhatIsSent 1
	echo SendEmail Complete: & echo:
	goto _removeBatchVariablesSendEmail	
   ) else (
	call :_replaceByWhatIsSent 1
	call :_checkOut & goto:eof
   )
  )
  if "%_sendingWhat%"=="3" (
   set "_parFiveSendEmail=name@site.com"
   set "_parFourSendEmail=name@site.com"
   if "%_parThreeSendEmail%"=="--close" (
    call :_replaceByWhatIsSent 1
	echo SendEmail Complete: & echo:
	goto _removeBatchVariablesSendEmail	
   ) else (
	call :_replaceByWhatIsSent 1
	call :_checkOut & goto:eof
   )
  )
  if "%_sendingWhat%"=="2" (
   set "_parFiveSendEmail=name@site.com"
   set "_parFourSendEmail=name@site.com"
   set "_parThreeSendEmail=Email Message"
   call :_replaceByWhatIsSent 1
   call :_checkOut & goto:eof
  )
  call :_sendEmailWithoutOptions 3 & goto:eof
 )
goto:eof

:_replaceByWhatIsSent
 if "%1"=="1" (
   sed -i "s|CHANGE_MESSAGE_HEADER|%_parThreeSendEmail%|" %_nodeSend%"
   sed -i "s|CHANGE_FROM_ADDRESS|%_parFourSendEmail%|" %_nodeSend%"
   sed -i "s|CHANGE_REPLY_TO|%_parFiveSendEmail%|" %_nodeSend%"
   call :_replaceByWhatIsSent 2 & goto:eof
 )
 if "%1"=="2" (
  node "%_nodeSend%"
 )
goto:eof

:_runSendEmail
 if "%1"=="1" (
  if EXIST "%_parThreeSendEmail%" (
   call commandVar /T "type '%_parThreeSendEmail%'" _sendEmailMessage
  ) else (
   call commandVar /T "echo '%_parThreeSendEmail%'" _sendEmailMessage
  )
  call :_runSendEmail 2 & goto:eof
 )
 if "%1"=="2" (
  sed -i "s|html: emailText,||" "%_nodeSend%"
  sed -i "s|//html: -emailText-, |html: %_sendEmailMessage%,|" "%_nodeSend%"
  call :_runSendEmail 3 & goto:eof
 )
 if "%1"=="3" (
  node "%_nodeSend%"
  if "%_parFourSendEmail%"=="--close" (
   echo sendEmail Complete: & echo:
  ) else (
   echo Check output. Press enter to exit.
   set /P _waitOne=
  )
  goto _removeBatchVariablesSendEmail
 )
goto:eof

:_checkOut
 set _isTestEmails=

 echo Check ouput:
 echo:
 echo Successful sends will be in GMAIL Sent folder.
 echo **********************************************
 echo:

 set /P _checkOut=

 goto _removeBatchVariablesSendEmail
goto:eof

:_makeTempDirSendEmail
 if "%1"=="1" (
  mkdir .tmp\%~n0 > nul 2>nul
  set "_tmpDirSendEmail=.tmp\%~n0"
  call :_makeTempDirSendEmail 2 & goto:eof
 )
 if "%1"=="2" (
  copy "%_sendEmailPath%\sendEmail.js" "%_tmpDirSendEmail%"
  rem use file for no option send
  if EXIST "%_parTwoSendEmail%" (
   copy "%_parTwoSendEmail%" "%_tmpDirSendEmail%"
   call :_makeTempDirSendEmail 3 & goto:eof
  )
  rem use file for option send
  if EXIST "%_parThreeSendEmail%" (
   copy "%_parThreeSendEmail%" "%_tmpDirSendEmail%"
   call :_makeTempDirSendEmail 3 & goto:eof
  )
  rem else
  call :_makeTempDirSendEmail 3 & goto:eof
 )
 if "%1"=="3" (
  set "_nodeSend=%_tmpDirSendEmail%\sendEmail.js"
 )
goto:eof


:_removeBatchVariablesSendEmail
 set _waitOne=
 set _checkOut=

 set _isTestEmails=

 :: Batch paths
 set _callRootBatchFilesSendEmail=
 set _callLibraryBatchFiles=
 set _callRootConfigBatchFiles=
 set _sendEmailPath=
 set _callRootConfigSendEmail=
 set _checkOptionsSendEmail=
 set _sendEmailPath=
 set _sendEmailLists=
 set _sendEmailText=
 set _sendEmailTemp=
 set _checkOptionsSendEmail=
 set _sendEmailPath=
 set _sendEmailLists=
 set _sendEmailText=
 set _sendEmailTemp=

 :: Variables from arguments.
 set _parOneSendEmail=
 set _checkParOneSendEmail=
 set _parTwoSendEmail=
 set _checkParTwoSendEmail=
 set _parThreeSendEmail=
 set _checkParThreeSendEmail=
 set _parFourSendEmail=
 set _checkParFourSendEmail=
 set _parFiveSendEmail=
 set _checkParFiveSendEmail=
 set _parSixSendEmail=
 set _checkParSixSendEmail=
 set _parSevenSendEmail=
 set _checkParSixSendEmail=
 set _checkParSevenSendEmail=
 set _parEightSendEmail=
 set _checkParEightSendEmail=
 set _parNineSendEmail=
 set _checkParNineSendEmail=

 if EXIST ".tmp\%~n0" (
  rmdir /s/q ".tmp\%~n0" > nul 2>nul
 )

 rem append new variables

 exit /b
goto:eof