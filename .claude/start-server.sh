#!/bin/bash
# Starts the NAZORA server on http://localhost:3000 when a Claude Code session begins.
# Does nothing if something is already listening on the port.
cd "${CLAUDE_PROJECT_DIR:-$(dirname "$0")/..}" || exit 0
PORT="${PORT:-3000}"
if curl -s -o /dev/null "http://localhost:$PORT/"; then
  exit 0
fi
nohup node server.js > /tmp/nazora-server.log 2>&1 &
echo "NAZORA server: http://localhost:$PORT (log: /tmp/nazora-server.log)"
