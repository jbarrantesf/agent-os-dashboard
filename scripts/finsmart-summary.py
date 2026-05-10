#!/usr/bin/env python3
"""
finsmart-summary.py — Extrae datos de FinSmartCR y genera resumen financiero
Uso: python3 finsmart-summary.py
Requiere: .finsmart_cookies.json en el workspace
"""

import json
import subprocess
import sys
import os
from datetime import datetime, timezone

COOKIES_FILE = os.path.expanduser("~/.openclaw/workspace/.finsmart_cookies.json")
BASE_URL = "https://finsmartcr.com"

def load_cookies():
    if not os.path.exists(COOKIES_FILE):
        print("ERROR: No hay cookies guardadas. Re-autenticá en FinSmart.", file=sys.stderr)
        sys.exit(1)
    with open(COOKIES_FILE) as f:
        return json.load(f)

def cookies_to_header(cookies):
    return "; ".join(f"{c['name']}={c['value']}" for c in cookies)

def fetch(path, cookies):
    """Fetch via curl usando las cookies de sesión."""
    cookie_str = cookies_to_header(cookies)
    result = subprocess.run(
        ["curl", "-s", "-L",
         "-H", f"Cookie: {cookie_str}",
         "-H", "Accept: application/json",
         "-H", "Content-Type: application/json",
         f"{BASE_URL}{path}"],
        capture_output=True, text=True, timeout=15
    )
    if result.returncode != 0:
        return None
    try:
        return json.loads(result.stdout)
    except:
        return {"raw": result.stdout[:500]}

def main():
    cookies = load_cookies()

    # Verificar sesión activa
    me = fetch("/api/user/me", cookies)
    if not me or "email" not in str(me):
        print("SESION_EXPIRADA")
        sys.exit(2)

    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")

    # Obtener transacciones recientes
    txns = fetch("/api/transactions?limit=50&sort=date_desc", cookies)

    # Obtener resumen/dashboard
    dashboard = fetch("/api/dashboard", cookies)

    # Obtener bancos
    banks = fetch("/api/banks", cookies)

    output = {
        "fecha": today,
        "usuario": me,
        "transacciones": txns,
        "dashboard": dashboard,
        "bancos": banks
    }

    print(json.dumps(output, ensure_ascii=False, indent=2))

if __name__ == "__main__":
    main()
