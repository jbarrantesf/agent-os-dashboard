# Auditoría Fase 1 MUNSO — 17-may-2026

## Resumen
Verificación read-only de Fase 1 AIOS Munso. Estructura completa, datos cargados, **sync Softland → Supabase caído desde 14-may**.

## Infra confirmada
- **GitHub:** `jbarrantesf/aios-munso` — main estable, 0 PRs/issues abiertos, último commit 11-may
- **Vercel:** `aios-munso-web` → https://aios-munso-web.vercel.app (deploy ready hace 7d, auth funcionando)
- **Supabase:** proyecto `zfgnxuvgdyiqgcdwwnxb` (aios-munso, East US Virginia)
  - 21 tablas creadas, 5 migraciones aplicadas
  - 1,456 clientes / 6,153 facturas / 8,460 documentos CxC
  - 27 clientes en vista `canal_moderno_aging`
  - 22 clientes Canal Moderno configurados

## 🚨 Problema activo: Sync caído
- Última sync exitosa: **14-may 06:34 UTC**
- Errores: 15, 16 y 17-may
- Error literal: `Failed to connect to 100.73.157.10:14330 in 15000ms`
- Causa probable: portproxy 14330 caído o Tailscale desconectado en server Windows de MUNSO
- Histórico: 60 errores / 72 éxitos (sync ya venía frágil)
- Conexión: Tailscale (migrado de ngrok el 28-abr-2026) + portproxy puerto 14330 (config del 29-abr)

## Estado vs contrato Fase 1
~95% completo estructuralmente. Falta:
- Restaurar sync diario
- 3 días consecutivos en verde antes de avanzar a Fase 2

## Siguiente acción
Contactar a **Kenneth Cubero** (IT MUNSO) mañana 18-may para verificar:
- Portproxy puerto 14330 activo
- Tailscale levantado en server Windows
- Server reinició recientemente?

## Credenciales/Refs
- Supabase project ref: `zfgnxuvgdyiqgcdwwnxb`
- Tailscale IP server MUNSO: `100.73.157.10`
- Puerto portproxy SQL Server: `14330`
- Conexión interna: SQL Server 2012 (Softland) en Windows Server 2012
- Usuario solo lectura: `aios_sync_reader`
