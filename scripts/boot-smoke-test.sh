#!/usr/bin/env bash
# Boots the real API process and fails unless it becomes healthy.
#
# typecheck, build and unit tests all stayed green while the API crashed at
# import time, because none of them start the server. This does. It needs no
# database: /health is DB-free and a failed startup DB check only logs a warning.
#
# Usage: scripts/boot-smoke-test.sh   (expects the env vars the API validates)
set -euo pipefail

PORT="${PORT:-8080}"
LOG="$(mktemp)"

node --import tsx apps/api/src/index.ts >"$LOG" 2>&1 &
API_PID=$!
trap 'kill "$API_PID" 2>/dev/null || true' EXIT

for _ in $(seq 1 30); do
  if ! kill -0 "$API_PID" 2>/dev/null; then
    echo "API process exited during startup:"
    cat "$LOG"
    exit 1
  fi
  if curl -sf "http://localhost:$PORT/health" >/dev/null; then
    # The OpenAPI spec is generated at startup; make sure it lists routes.
    curl -sf "http://localhost:$PORT/openapi.json" | grep -q '"/forms/{slug}"'
    curl -sf -o /dev/null "http://localhost:$PORT/docs"
    echo "API booted and is healthy."
    exit 0
  fi
  sleep 1
done

echo "API did not become healthy within 30 seconds:"
cat "$LOG"
exit 1
