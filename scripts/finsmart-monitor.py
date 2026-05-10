#!/usr/bin/env python3
"""
finsmart-monitor.py — Monitorea FinSmartCR y guarda snapshots financieros

Uso: python3 finsmart-monitor.py [--save|--last|--monthly]
"""

import json
import os
import sys
from datetime import datetime, timedelta
from pathlib import Path

SNAPSHOTS_DIR = Path(os.path.expanduser("~/.openclaw/workspace/finsmart-snapshots"))
SNAPSHOTS_DIR.mkdir(exist_ok=True)

def save_snapshot(data):
    """Guarda un snapshot del día actual."""
    today = datetime.now().strftime("%Y-%m-%d")
    snapshot_file = SNAPSHOTS_DIR / f"{today}.json"
    
    with open(snapshot_file, "w") as f:
        json.dump({
            "timestamp": datetime.now().isoformat(),
            "date": today,
            "data": data
        }, f, indent=2, ensure_ascii=False)
    
    return snapshot_file

def get_last_snapshot():
    """Lee el último snapshot disponible."""
    snapshots = sorted(SNAPSHOTS_DIR.glob("*.json"), reverse=True)
    if snapshots:
        with open(snapshots[0]) as f:
            return json.load(f)
    return None

def monthly_summary(month_str=None):
    """Genera resumen mensual (ej: 2026-04)."""
    if not month_str:
        today = datetime.now()
        month_str = today.strftime("%Y-%m")
    
    month_snapshots = list(SNAPSHOTS_DIR.glob(f"{month_str}-*.json"))
    if not month_snapshots:
        return None
    
    # Tomar el último del mes
    last_snap = sorted(month_snapshots, reverse=True)[0]
    with open(last_snap) as f:
        return json.load(f)

def main():
    if len(sys.argv) < 2:
        print("Uso: python3 finsmart-monitor.py [--save|--last|--monthly|--track]")
        sys.exit(1)
    
    action = sys.argv[1]
    
    if action == "--last":
        last = get_last_snapshot()
        if last:
            print(json.dumps(last, indent=2, ensure_ascii=False))
        else:
            print("No snapshots found")
    
    elif action == "--monthly":
        month = sys.argv[2] if len(sys.argv) > 2 else None
        summary = monthly_summary(month)
        if summary:
            print(json.dumps(summary, indent=2, ensure_ascii=False))
        else:
            print("No monthly data found")
    
    elif action == "--save":
        # Placeholder: en producción, esto sería llamado por cron con datos de FinSmartCR
        sample_data = {
            "periodo": "30-abr-2026",
            "ingresos": 7828407,
            "gastos": 3622491,
            "balance": 4205916,
            "transacciones": 162
        }
        file = save_snapshot(sample_data)
        print(f"Snapshot saved: {file}")
    
    elif action == "--track":
        print("FinSmartCR Monitor - Financial Tracking")
        print(f"Snapshots directory: {SNAPSHOTS_DIR}")
        print(f"Total snapshots: {len(list(SNAPSHOTS_DIR.glob('*.json')))}")

if __name__ == "__main__":
    main()
