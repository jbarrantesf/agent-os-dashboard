#!/bin/bash
# cost-report-send.sh — Genera reporte de costos y lo manda por Telegram
# Cron: 9 AM Costa Rica (America/Costa_Rica = UTC-6 = 15:00 UTC)

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PYTHON_SCRIPT="$SCRIPT_DIR/cost-tracker.py"
LOG_FILE="$SCRIPT_DIR/../memory/cost-tracker.log"

# Generar el reporte
REPORT=$(python3 "$PYTHON_SCRIPT" --save --alert-threshold 5.0 2>&1)
EXIT_CODE=$?

# Log local
echo "$(date -u '+%Y-%m-%dT%H:%M:%SZ') exit=$EXIT_CODE" >> "$LOG_FILE"

if [ $EXIT_CODE -ne 0 ]; then
  MESSAGE="⚠️ Error al generar reporte de costos:\n$REPORT"
else
  MESSAGE="$REPORT"
fi

# Enviar por Telegram a José
/opt/homebrew/bin/openclaw message broadcast \
  --channel telegram \
  --targets "7889292153" \
  --message "$MESSAGE" \
  2>> "$LOG_FILE"
