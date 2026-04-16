#!/bin/bash
# Launch T3 Code dev build — starts dev server + desktop app
# Pin this to your dock via the Automator wrapper below

set -euo pipefail

T3CODE_DIR="/Users/alecramosnv/Projects/t3code"
LOG_DIR="$HOME/.t3/dev/logs"
mkdir -p "$LOG_DIR"

cd "$T3CODE_DIR"

# Kill any existing dev processes
pkill -f "t3code-dev-root" 2>/dev/null || true
pkill -f "dev-runner.ts dev:desktop" 2>/dev/null || true
sleep 1

# Launch the full desktop dev build (server + web + electron)
exec bun run dev:desktop > "$LOG_DIR/dev-launch.log" 2>&1
