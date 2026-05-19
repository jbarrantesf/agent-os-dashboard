#!/usr/bin/env python3
"""
FinSmartCR Detailed Report — Completo con desglose por transacción
CRC + USD separados, de lo general a lo específico
"""

import os
import json
import requests
from datetime import datetime
from collections import defaultdict

# API Key
FINSMART_KEY = os.getenv("FINSMART_API_KEY", "fsc_363be1615a9aa218bfae3263022b960d2afbcee07a1af384")
BASE_URL = "https://finsmartcr.com"
headers = {"Authorization": f"Bearer {FINSMART_KEY}"}

# Tasa de cambio (aproximada, podría ser dinámica)
USD_TO_CRC = 520  # Aproximadamente

print("🔄 Extrayendo reporte detallado de FinSmartCR...\n")

try:
    month = datetime.now().strftime("%Y-%m")
    
    # 1. RESUMEN GENERAL
    summary = requests.get(f"{BASE_URL}/api/v1/summary?month={month}", headers=headers, timeout=10).json()
    
    # 2. CATEGORÍAS CON DESGLOSE
    categories_resp = requests.get(f"{BASE_URL}/api/v1/categories?month={month}", headers=headers, timeout=10).json()
    categories_list = categories_resp.get("data", [])
    
    # 3. TODAS LAS TRANSACCIONES (sin límite)
    txns_resp = requests.get(f"{BASE_URL}/api/v1/transactions?month={month}&limit=200", headers=headers, timeout=10).json()
    txns_list = txns_resp.get("data", []) if isinstance(txns_resp, dict) else txns_resp
    
    # 4. PERFIL
    profile = requests.get(f"{BASE_URL}/api/v1/me", headers=headers, timeout=10).json()
    
    print("=" * 100)
    print(f"📊 REPORTE FINANCIERO DETALLADO — {month.upper()}")
    print(f"Usuario: {profile.get('firstName')} {profile.get('lastName')}")
    print(f"Suscripción: {profile.get('subscriptionTier', 'N/A').upper()}")
    print(f"Generado: {datetime.now().strftime('%Y-%m-%d %H:%M:%S CST')}")
    print("=" * 100)
    
    # ============ NIVEL 1: RESUMEN GENERAL ============
    print("\n" + "▬" * 100)
    print("📈 NIVEL 1: RESUMEN GENERAL")
    print("▬" * 100)
    
    ingresos_crc = summary.get("income", 0)
    gastos_crc = summary.get("expenses", 0)
    ahorros_crc = summary.get("savings", 0)
    balance_crc = summary.get("balance", 0)
    
    ingresos_usd = ingresos_crc / USD_TO_CRC
    gastos_usd = gastos_crc / USD_TO_CRC
    ahorros_usd = ahorros_crc / USD_TO_CRC
    balance_usd = balance_crc / USD_TO_CRC
    
    print(f"\n{'MÉTRICA':<30} {'CRC':>20} {'USD':>20}")
    print("-" * 70)
    print(f"{'Ingresos':<30} ₡{ingresos_crc:>18,.0f} ${ingresos_usd:>18,.2f}")
    print(f"{'Gastos':<30} ₡{gastos_crc:>18,.0f} ${gastos_usd:>18,.2f}")
    print(f"{'Ahorros':<30} ₡{ahorros_crc:>18,.0f} ${ahorros_usd:>18,.2f}")
    print(f"{'Balance':<30} ₡{balance_crc:>18,.0f} ${balance_usd:>18,.2f}")
    
    # Presupuesto
    print("\n📊 PRESUPUESTO:")
    budget_limit_crc = summary.get("budget", {}).get("limit", 0)
    budget_spent_crc = summary.get("budget", {}).get("spent", 0)
    budget_pct = summary.get("budget", {}).get("percentage", 0)
    budget_status = summary.get("budget", {}).get("status", "unknown")
    
    budget_limit_usd = budget_limit_crc / USD_TO_CRC
    budget_spent_usd = budget_spent_crc / USD_TO_CRC
    
    print(f"  Límite:   ₡{budget_limit_crc:>15,.0f}  /  ${budget_limit_usd:>15,.2f}")
    print(f"  Gastado:  ₡{budget_spent_crc:>15,.0f}  /  ${budget_spent_usd:>15,.2f}")
    print(f"  % Usado:  {budget_pct}%")
    print(f"  Status:   {budget_status.upper()}")
    
    print(f"\n📌 Total Transacciones: {summary.get('transactionCount', 0)}")
    
    # ============ NIVEL 2: DESGLOSE POR CATEGORÍA ============
    print("\n" + "▬" * 100)
    print("📊 NIVEL 2: DESGLOSE POR CATEGORÍA (Ordenado por monto)")
    print("▬" * 100)
    
    # Ordenar categorías por monto
    categories_sorted = sorted(categories_list, key=lambda x: x.get("totalCRC", 0), reverse=True)
    
    print(f"\n{'#':<3} {'CATEGORÍA':<25} {'MONTO CRC':>20} {'MONTO USD':>18} {'%':>8} {'TRANS':>8}")
    print("-" * 100)
    
    total_crc = sum(c.get("totalCRC", 0) for c in categories_sorted)
    
    for idx, cat in enumerate(categories_sorted, 1):
        cat_name = cat.get("category", "N/A")
        cat_crc = cat.get("totalCRC", 0)
        cat_usd = cat_crc / USD_TO_CRC
        cat_pct = (cat_crc / total_crc * 100) if total_crc > 0 else 0
        cat_count = cat.get("count", 0)
        
        print(f"{idx:<3} {cat_name:<25} ₡{cat_crc:>18,.0f} ${cat_usd:>16,.2f} {cat_pct:>7.1f}% {cat_count:>8}")
    
    print("-" * 100)
    total_usd = total_crc / USD_TO_CRC
    print(f"{'TOTAL':<29} ₡{total_crc:>18,.0f} ${total_usd:>16,.2f} {'100.0%':>7} {sum(c.get('count', 0) for c in categories_sorted):>8}")
    
    # ============ NIVEL 3: DETALLE POR TRANSACCIÓN ============
    print("\n" + "▬" * 100)
    print(f"📋 NIVEL 3: DETALLE POR TRANSACCIÓN ({len(txns_list)} transacciones)")
    print("▬" * 100)
    
    # Agrupar por categoría
    txns_by_category = defaultdict(list)
    for txn in txns_list:
        cat = txn.get("category", "Sin categoría")
        txns_by_category[cat].append(txn)
    
    # Mostrar por categoría (ordenadas por total gasto)
    category_totals = {cat: sum(t.get("amountCRC", 0) for t in txns) for cat, txns in txns_by_category.items()}
    sorted_cats = sorted(category_totals.items(), key=lambda x: x[1], reverse=True)
    
    for cat_name, cat_total in sorted_cats:
        txns = txns_by_category[cat_name]
        cat_total_usd = cat_total / USD_TO_CRC
        
        print(f"\n  🏷️  {cat_name.upper()} — ₡{cat_total:,.0f} / ${cat_total_usd:,.2f} ({len(txns)} transacciones)")
        print(f"  {'Fecha':<12} {'Descripción':<40} {'CRC':>15} {'USD':>15}")
        print(f"  {'-'*95}")
        
        for txn in sorted(txns, key=lambda x: x.get("date", ""), reverse=True):
            fecha = txn.get("date", "N/A")[:10]  # Solo YYYY-MM-DD
            desc = txn.get("description", "N/A")[:39]
            monto_str = txn.get("amount", "0")
            monto_crc = float(monto_str) if monto_str else 0
            monto_usd = monto_crc / USD_TO_CRC
            
            print(f"  {fecha:<12} {desc:<40} ₡{monto_crc:>13,.0f} ${monto_usd:>13,.2f}")
    
    # ============ GUARDANDO REPORTE ============
    print("\n" + "=" * 100)
    print("✅ Reporte completado\n")
    
    # Guardar JSON con estructura completa
    report_data = {
        "timestamp": datetime.now().isoformat(),
        "mes": month,
        "usuario": f"{profile.get('firstName')} {profile.get('lastName')}",
        "suscripcion": profile.get('subscriptionTier'),
        "resumen": {
            "ingresos": {"crc": ingresos_crc, "usd": ingresos_usd},
            "gastos": {"crc": gastos_crc, "usd": gastos_usd},
            "ahorros": {"crc": ahorros_crc, "usd": ahorros_usd},
            "balance": {"crc": balance_crc, "usd": balance_usd},
            "transacciones_total": summary.get("transactionCount", 0)
        },
        "presupuesto": {
            "limite": {"crc": budget_limit_crc, "usd": budget_limit_usd},
            "gastado": {"crc": budget_spent_crc, "usd": budget_spent_usd},
            "porcentaje": budget_pct,
            "status": budget_status
        },
        "categorias": [
            {
                "categoria": cat.get("category"),
                "monto": {"crc": cat.get("totalCRC", 0), "usd": cat.get("totalCRC", 0) / USD_TO_CRC},
                "transacciones": cat.get("count", 0),
                "porcentaje": (cat.get("totalCRC", 0) / total_crc * 100) if total_crc > 0 else 0
            }
            for cat in categories_sorted
        ],
        "transacciones": [
            {
                "fecha": txn.get("date"),
                "categoria": txn.get("category"),
                "descripcion": txn.get("description"),
                "monto": {
                    "crc": float(txn.get("amount", "0")) if txn.get("amount") else 0,
                    "usd": txn.get("amountCRC", 0) / USD_TO_CRC
                },
                "tipo": txn.get("type")
            }
            for txn in txns_list
        ]
    }
    
    # Guardar
    report_dir = "/Users/nextaisolutionscr/.openclaw/workspace/finsmart-reports"
    os.makedirs(report_dir, exist_ok=True)
    
    timestamp = datetime.now().strftime("%Y-%m-%d-%H%M%S")
    report_file = f"{report_dir}/detailed-{timestamp}.json"
    
    with open(report_file, "w") as f:
        json.dump(report_data, f, indent=2, ensure_ascii=False)
    
    print(f"📁 Reporte guardado: {report_file}\n")
    
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()
    exit(1)
