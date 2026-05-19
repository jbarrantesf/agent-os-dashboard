#!/bin/bash
# Daily cost monitoring script
# Usa: ./daily-cost-check.sh para ver gasto de hoy

DATE=$(date +%Y-%m-%d)
COST_LOG="$HOME/.openclaw/workspace/memory/cost-tracker.json"

echo "=========================================="
echo "📊 COSTO DIARIO: $DATE"
echo "=========================================="

if [ -f "$COST_LOG" ]; then
    python3 <<EOF
import json
from datetime import datetime, timedelta

with open("$COST_LOG") as f:
    data = json.load(f)

today = "$DATE"
yesterday = (datetime.strptime(today, '%Y-%m-%d') - timedelta(1)).strftime('%Y-%m-%d')

if today in data.get('days', {}):
    today_cost = data['days'][today]['total']
    print(f"✅ HOY ({today}): \${today_cost:.2f}")
else:
    print(f"❌ HOY ({today}): No data yet")

if yesterday in data.get('days', {}):
    yesterday_cost = data['days'][yesterday]['total']
    print(f"📈 AYER ({yesterday}): \${yesterday_cost:.2f}")

print(f"\n💰 TOTAL MES: \${data.get('grand_total', 0):.2f}")

# Mostrar breakdown por modelo hoy
if today in data.get('days', {}):
    print(f"\nModelos hoy:")
    for model, stats in data['days'][today].get('models', {}).items():
        print(f"  {model[:30]:30s} \${stats.get('total', 0):.2f}")
EOF
else
    echo "⚠️  No cost tracking file found"
fi

echo ""
echo "📍 Verificar Claude Console: https://platform.claude.com/cost"
echo "⏰ Última actualización: $(date)"
