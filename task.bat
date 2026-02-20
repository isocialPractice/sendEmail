@echo off
REM task
::  Start VS Code workspace.
set "_lineCountTask=3"

REM Start Instructions:
	:: 1. Change toExplorer 
 :: 2. All else as needed.

:: Define path and variables to current batch.
set "_callRootTask=D:\Users\johnh\Documents\GitHub\isocialPractice\sendEmail"
set "_taskPath=D:\Users\johnh\Documents\GitHub\isocialPractice\sendEmail"

set "_parOneTask=%~1"
set "_checkParOneTask=-%_parOneTask%-"
set "_parTwoTask=%~2"
set "_checkParTwoTask=-%_parTwoTask%-"
set "_parThreeTask=%~3"
set "_checkParThreeTask=-%_parThreeTask%-"
set "_parFourTask=%~4"                                        
set "_checkParFourTask=-%_parFourTask%-"
set "_parFiveTask=%~5"                                        
set "_checkParFiveTask=-%_parFiveTask%-"
set "_parSixTask=%~6"                                        
set "_checkParSixTask=-%_parSixTask%-"
set "_parSevenTask=%~7"                                        
set "_checkParSevenTask=-%_parSevenTask%-"
set "_parEightTask=%~8"                                        
set "_checkParEightTask=-%_parEightTask%-"
set "_parNineTask=%~9"                                        
set "_checkParNineTask=-%_parNineTask%-"

:: GETTING START - change/update variable "_taskFilesTaskToExplorer"
::                 and run. 
::                 If more calls change variable "_oneAndDonTask", and
::                 edit subroutine as needed.

:: Edit and help conditions.
if "%_parOneTask%"=="-e" (
 set "_closeOutTask=1"
 start notepad++ "%~dp0%~n0.bat"
 goto _removeBatchVariablesTask
) else if "%_parOneTask%"=="--edit" (
 set "_closeOutTask=1"
 start notepad++ "%~dp0%~n0.bat"
 goto _removeBatchVariablesTask 
) else if "%_parOneTask%"=="-h" (
 set "_closeOutTask=1"
 call callLibrary makeShiftHelp "%~dp0%~n0.bat" %_lineCountTask%
 goto _removeBatchVariablesTask
) else if "%_parOneTask%"=="--help" (
 set "_closeOutTask=1"
 call callLibrary makeShiftHelp "%~dp0%~n0.bat" %_lineCountTask%
 goto _removeBatchVariablesTask
) else if "%_parOneTask%"=="/?" (
 set "_closeOutTask=1"
 call callLibrary makeShiftHelp "%~dp0%~n0.bat" %_lineCountTask%
 goto _removeBatchVariablesTask 
)


cd /D "%~dp0"
call parDir _taskParTask 0

:: Executable toExplorer Files.
:: NOTE - use --exec start or --exec start [options] i.e. --exec start --exec start php -S localhost:9090 -t <folder>
::        to run the start command.
:: NOTE - _dirWhereCalledToFolder to change back.
:: IMPORTANT - do not enclose in parenthesis, and leave --exec last or before --chrome.
set _taskFilesTaskToExplorer="%cd%" *.code-workspace 
set "_oneAndDonTask=1"  & rem 1 (default) 0 call next subroutine
set "_changeBackTask=1"

:: If needed
REM call :_makeTempDirTask 1
REM call batchbin --set globalVariables

call :_startTask 1
goto:eof


:: START TASK STATEMENT - NO DOCUMENTING
:_startTask
 if "%1"=="1" (
  rem backup instance
  rem if EXIST "zipFilesCall.bat" call zipFilesCall.bat
  
  rem check if toExplorer variable set 
  call :_checkToExplorerTask 1
  
  if "%_oneAndDonTask%"=="1" (
   rem done
   goto _removeBatchVariablesTask
  ) else (
   set _taskFilesTaskToExplorer=0
   call :_startTask 2 & goto:eof
  )
 )
 if "%1"=="2" (
  call :_checkToExplorerTask 1
  
  set _taskFilesTaskToExplorer=0
  call :_startTask 3 & goto:eof
 )
 if "%1"=="3" (
  rem AS NEEDED
  rem echo Make Edits to Task File as Needed:
  rem notepad++ %~n0.bat
  rem call :_startTask  & goto:eof
  rem goto _removeBatchVariablesTask
 )
 call :_removeBatchVariablesTask
goto:eof

:_checkToExplorerTask
 if "%1"=="1" (
  call toExplorer %_taskFilesTaskToExplorer%
 )
goto:eof

:_makeTempDirTask
 if "%1"=="1" (
  if NOT EXIST ".tmp\" (
   mkdir .tmp >nul 2>nul
  )
  call :_makeTempDirTask 2 & goto:eof
 )
 if "%1"=="2" (
  if NOT EXIST ".tmp\%~n0" (
   mkdir .tmp\%~n0 >nul 2>nul
  )
  set "_tmpDirTask=.tmp\%~n0"
 )
goto:eof
:: END TASK STATEMENT - NO DOCUMENTING


:_removeBatchVariablesTask
 set _callRootTask=
 set _taskPath=
 set _parOneTask=
 set _checkParOneTask=
 set _parTwoTask=
 set _checkParTwoTask=
 set _parThreeTask=
 set _checkParThreeTask=
 set _parFourTask=
 set _checkParFourTask=
 set _parFiveTask=
 set _checkParFiveTask=
 set _parSixTask=
 set _checkParSixTask=
 set _parSevenTask=
 set _checkParSevenTask=
 set _parEightTask=
 set _checkParEightTask=
 set _parNineTask=
 set _checkParNineTask=
 set _taskFilesTaskToExplorer=
 
 if EXIST ".tmp\%~n0" (
  rmdir /S/Q .tmp\%~n0
 ) 
 set _tmpDirTask=
 
 rem append new variables
 set _oneAndDonTask=
 set _lineCountTask=
 set _newTypeCheckToFolder=
 set _typeCheckToFolder=
  
 call callLibrary removeBatchVariables --dump
 
 rem IMPORTANT - leave last
 if NOT DEFINED _closeOutTask (
  rem use for any final commands that need to run at end.
  if "%_changeBackTask%"=="1" (
   if DEFINED _dirWhereCalledToFolder ( 
    start "%_taskParTask%"
    cd /D "%_dirWhereCalledToFolder%"
   )
  )
 )
 set _closeOutTask=
 set _changeBackTask=
 set _taskParTask=
 set _dirWhereCalledToFolder=
 
 exit /b
goto:eof 
 