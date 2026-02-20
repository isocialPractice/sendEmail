#!/usr/bin/env bash
# bin/sendEmail.sh
# Unix/macOS shell script wrapper for the sendEmail CLI.
#
# Usage: ./bin/sendEmail.sh [options]
# Or add to PATH: sendEmail [options]
#
# This script finds the sendEmail root and calls Node.js.

set -euo pipefail

# Resolve the directory containing this script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

# Find node executable
if ! command -v node &>/dev/null; then
  echo "[sendEmail] Error: 'node' not found in PATH."
  echo "  Install Node.js (>=18) from https://nodejs.org"
  exit 1
fi

# Check Node.js version
NODE_VERSION=$(node --version 2>/dev/null | sed 's/v//')
NODE_MAJOR=$(echo "$NODE_VERSION" | cut -d. -f1)

if [ "$NODE_MAJOR" -lt 18 ] 2>/dev/null; then
  echo "[sendEmail] Warning: Node.js $NODE_VERSION detected. Version 18+ recommended."
fi

# Run the entry point
exec node "$ROOT_DIR/bin/sendEmail.js" "$@"
