#!/usr/bin/env python3
"""
FinSmartCR Daily Snapshot — Extrae datos vía API y envía a Telegram
"""

import os
import json
import requests
from datetime import datetime

# API Key desde .env
FINSMART_KEY = os.getenv("FINSMART_API_KEY", "fsc_363be1615a9aa218bfae3263022b960d2afbcee07a1af384")
if not FINSMART_KEY:
    print("❌ FINSMART_API_KEY no encontrada")
    exit(1)

BASE_URL = "https://finsmartcr.com"
headers = {"Authorization": f"Bearer {FINSMART_KEY}"}

print("🔄 Extrayendo datos de FinSmartCR...")

try:
    # Mes actual (YYYY-MM)
    month = datetime.now().strftime("%Y-%m")
    
    # Resumen financiero del mes
    summary = requests.get(f"{BASE_URL}/api/v1/summary?month={month}", headers=headers, timeout=10).json()
    
    # Categorías de gastos
    categories_resp = requests.get(f"{BASE_URL}/api/v1/categories?month={month}", headers=headers, timeout=10).json()
    categories_list = categories_resp.get("data", [])
    
    # Transacciones
    txns_resp = requests.get(f"{BASE_URL}/api/v1/transactions?month={month}&limit=50", headers=headers, timeout=10).json()
    txns_list = txns_resp.get("data", []) if isinstance(txns_resp, dict) else txns_resp
    
    # Perfil del usuario
    profile = requests.get(f"{BASE_URL}/api/v1/me", headers=headers, timeout=10).json()
    
    # Compilar snapshot
    snapshot = {
        "timestamp": datetime.now().isoformat(),
        "mes": month,
        "usuario": f"{profile.get('firstName')} {profile.get('lastName')}",
        "ingresos_total": summary.get("income", 0),
        "gastos_total": summary.get("expenses", 0),
        "ahorros": summary.get("savings", 0),
        "balance": summary.get("balance", 0),
        "transacciones_count": summary.get("transactionCount", 0),
        "presupuesto": {
            "limite": summary.get("budget", {}).get("limit", 0),
            "gastado": summary.get("budget", {}).get("spent", 0),
            "porcentaje": summary.get("budget", {}).get("percentage", 0),
            "status": summary.get("budget", {}).get("status", "unknown")
        },
        "top_categorias": categories_list[:5] if categories_list else [],
        "transacciones_muestra": txns_list[:10] if txns_list else []
    }
    
    # Guardar snapshot
    snapshot_dir = "/Users/nextaisolutionscr/.openclaw/workspace/finsmart-snapshots"
    os.makedirs(snapshot_dir, exist_ok=True)
    
    timestamp = datetime.now().strftime("%Y-%m-%d-%H%M%S")
    snapshot_file = f"{snapshot_dir}/snapshot-{timestamp}.json"
    
    with open(snapshot_file, "w") as f:
        json.dump(snapshot, f, indent=2, ensure_ascii=False)
    
    print(f"✅ Snapshot guardado: {snapshot_file}")
    
    # Mostrar resumen
    print(f"\n📊 FinSmartCR Snapshot — {snapshot['mes']}")
    print(f"Usuario: {snapshot['usuario']}")
    print(f"Ingresos: ₡{snapshot['ingresos_total']:,.0f}")
    print(f"Gastos: ₡{snapshot['gastos_total']:,.0f}")
    print(f"Ahorros: ₡{snapshot['ahorros']:,.0f}")
    print(f"Balance: ₡{snapshot['balance']:,.0f}")
    print(f"Transacciones: {snapshot['transacciones_count']}")
    
    print(f"\n💰 Presupuesto:")
    print(f"  Límite: ₡{snapshot['presupuesto']['limite']:,.0f}")
    print(f"  Gastado: ₡{snapshot['presupuesto']['gastado']:,.0f}")
    print(f"  Porcentaje: {snapshot['presupuesto']['porcentaje']}%")
    print(f"  Status: {snapshot['presupuesto']['status'].upper()}")
    
    if snapshot['top_categorias']:
        print(f"\n🏷️ Top Categorías:")
        for cat in snapshot['top_categorias']:
            print(f"  • {cat.get('category', 'N/A')}: ₡{cat.get('totalCRC', 0):,.0f}")
    
    print("\n✅ Éxito")
    
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()
    exit(1)
