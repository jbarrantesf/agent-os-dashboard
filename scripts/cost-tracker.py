#!/usr/bin/env python3
"""
cost-tracker.py — Control de costos de IA por proyecto
NexAI Solutions CR — Orbit 🪐

Uso:
  python3 cost-tracker.py --log --project "MUNSO" --model "claude-sonnet" --tokens-in 5000 --tokens-out 800
  python3 cost-tracker.py --report
  python3 cost-tracker.py --report --project "MUNSO"
  python3 cost-tracker.py --save   (imprime resumen para el briefing)
"""

import json
import os
import sys
import argparse
from datetime import datetime, date
from pathlib import Path

# ── Precios por 1M tokens (USD) ──────────────────────────────────────────────
PRICING = {
    "claude-sonnet": {"input": 3.00, "output": 15.00, "cache_read": 0.30},
    "claude-haiku":  {"input": 0.80, "output": 4.00,  "cache_read": 0.08},
    "claude-opus":   {"input": 15.0, "output": 75.00, "cache_read": 1.50},
    "gpt-4o":        {"input": 2.50, "output": 10.00, "cache_read": 1.25},
    "gpt-4o-mini":   {"input": 0.15, "output": 0.60,  "cache_read": 0.075},
    "kimi-k2":       {"input": 0.60, "output": 2.50,  "cache_read": 0.15},
    "qwen-local":    {"input": 0.00, "output": 0.00,  "cache_read": 0.00},
}

PROJECTS = ["MUNSO", "Coybo", "NexAI-Internal", "Piano", "Sydney-Events", "Mission-Board", "General"]

DATA_FILE = Path(__file__).parent / "cost-log.jsonl"


def log_cost(project: str, model: str, tokens_in: int, tokens_out: int,
             tokens_cache: int = 0, description: str = ""):
    """Registra un uso de API."""
    pricing = PRICING.get(model, {"input": 0, "output": 0, "cache_read": 0})
    cost = (
        tokens_in * pricing["input"] / 1_000_000 +
        tokens_out * pricing["output"] / 1_000_000 +
        tokens_cache * pricing["cache_read"] / 1_000_000
    )
    entry = {
        "ts": datetime.now().isoformat(),
        "date": date.today().isoformat(),
        "project": project,
        "model": model,
        "tokens_in": tokens_in,
        "tokens_out": tokens_out,
        "tokens_cache": tokens_cache,
        "cost_usd": round(cost, 6),
        "description": description,
    }
    with open(DATA_FILE, "a") as f:
        f.write(json.dumps(entry) + "\n")
    print(f"✅ Logged: {project} | {model} | ${cost:.4f}")
    return cost


def load_entries(project_filter=None, date_filter=None):
    if not DATA_FILE.exists():
        return []
    entries = []
    with open(DATA_FILE) as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                e = json.loads(line)
                if project_filter and e.get("project") != project_filter:
                    continue
                if date_filter and e.get("date") != date_filter:
                    continue
                entries.append(e)
            except:
                pass
    return entries


def report(project_filter=None):
    """Genera reporte de costos."""
    today = date.today().isoformat()
    all_entries = load_entries(project_filter=project_filter)
    today_entries = [e for e in all_entries if e.get("date") == today]

    def summarize(entries, label):
        if not entries:
            return f"  {label}: $0.0000"
        total = sum(e.get("cost_usd", 0) for e in entries)
        by_project = {}
        by_model = {}
        for e in entries:
            p = e.get("project", "?")
            m = e.get("model", "?")
            by_project[p] = by_project.get(p, 0) + e.get("cost_usd", 0)
            by_model[m] = by_model.get(m, 0) + e.get("cost_usd", 0)
        lines = [f"  {label}: ${total:.4f}"]
        for p, c in sorted(by_project.items(), key=lambda x: -x[1]):
            lines.append(f"    📁 {p}: ${c:.4f}")
        for m, c in sorted(by_model.items(), key=lambda x: -x[1]):
            lines.append(f"    🤖 {m}: ${c:.4f}")
        return "\n".join(lines)

    # Monthly
    month = today[:7]
    month_entries = [e for e in all_entries if e.get("date", "").startswith(month)]

    print(f"\n{'='*50}")
    print(f"💰 REPORTE DE COSTOS IA — NexAI Solutions CR")
    print(f"{'='*50}")
    print(f"\n📅 HOY ({today}):")
    print(summarize(today_entries, "Total hoy"))
    print(f"\n📆 ESTE MES ({month}):")
    print(summarize(month_entries, "Total mes"))
    print(f"\n📊 HISTÓRICO TOTAL:")
    print(summarize(all_entries, "Total general"))
    print(f"\n{'='*50}\n")


def save_summary():
    """Versión compacta para el Morning Briefing."""
    today = date.today().isoformat()
    month = today[:7]
    all_entries = load_entries()
    today_entries = [e for e in all_entries if e.get("date") == today]
    month_entries = [e for e in all_entries if e.get("date", "").startswith(month)]

    today_total = sum(e.get("cost_usd", 0) for e in today_entries)
    month_total = sum(e.get("cost_usd", 0) for e in month_entries)

    by_project_month = {}
    for e in month_entries:
        p = e.get("project", "?")
        by_project_month[p] = by_project_month.get(p, 0) + e.get("cost_usd", 0)

    lines = [f"**Hoy:** ${today_total:.4f} | **Mes:** ${month_total:.4f}"]
    if by_project_month:
        lines.append("Por proyecto (mes):")
        for p, c in sorted(by_project_month.items(), key=lambda x: -x[1]):
            lines.append(f"  • {p}: ${c:.4f}")
    print("\n".join(lines))


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Cost tracker NexAI")
    parser.add_argument("--log", action="store_true")
    parser.add_argument("--report", action="store_true")
    parser.add_argument("--save", action="store_true")
    parser.add_argument("--project", default="General")
    parser.add_argument("--model", default="claude-sonnet")
    parser.add_argument("--tokens-in", type=int, default=0)
    parser.add_argument("--tokens-out", type=int, default=0)
    parser.add_argument("--tokens-cache", type=int, default=0)
    parser.add_argument("--description", default="")
    args = parser.parse_args()

    if args.log:
        log_cost(args.project, args.model, args.tokens_in, args.tokens_out,
                 args.tokens_cache, args.description)
    elif args.report:
        report(project_filter=args.project if args.project != "General" else None)
    elif args.save:
        save_summary()
    else:
        report()
