#!/bin/bash
# Post-clone setup script for sendEmail
# Creates config/accounts/_default.js from template or git history

set -e

_helperDir=$(dirname "$(readlink -f "$0")")
_targetDir="$_helperDir"/../../config

_targetFile=$_targetDir/accounts/_default.js

# Check if accounts does not exist.
if [ ! -e $_targetDir/accounts ]; then
 mkdir $_targetDir/accounts
fi

# Check if exists.
if [ -f $_targetFile ]; then
 echo The file "_default.js" exists in \`config/accounts\`.
else
 cp "$_helperDir/accounts/_default.js" $_targetFile
fi
echo Done
