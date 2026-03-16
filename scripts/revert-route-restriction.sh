#!/usr/bin/env bash
# REVERT: Removes the route restriction added to middleware.ts
# Usage: bash scripts/revert-route-restriction.sh
# Or ask the AI: "Run scripts/revert-route-restriction.sh to revert route restrictions"

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
MIDDLEWARE="$PROJECT_ROOT/src/middleware.ts"
BACKUP="$SCRIPT_DIR/middleware.ts.pre-route-restriction"

if [ ! -f "$BACKUP" ]; then
  echo "ERROR: Backup file not found at $BACKUP"
  exit 1
fi

cp "$BACKUP" "$MIDDLEWARE"
echo "SUCCESS: middleware.ts restored to pre-route-restriction state."
echo "Don't forget to redeploy after reverting."
