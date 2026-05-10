# HERMES-ORBIT Communication Protocol — 04-may-2026

## Objetivo
Establecer canal de comunicación bidireccional, persistente y sin ruido entre Hermes (orquestador) y ORBIT (ejecutor).

## Análisis de opciones (por Hermes)

| Opción | Canal | Pros | Contras | Resultado |
|--------|-------|------|---------|-----------|
| 1 | Sub-agente | Contexto compartido | Latencia, sin persistencia | ❌ NO |
| 2 | **Sesión persistente + MCP sessions_send()** | Rápido, bidireccional | Setup MCP | **✅ ELEGIDO** |
| 3 | Telegram | Simple | Ruidoso, no escalable | ❌ NO |

## Decisión final: AMBOS canales

### Flujo de tarea
```
José solicita → Hermes escribe a agent_tasks + sesión a ORBIT
              ↓
ORBIT recibe vía sessions_send("Hermes-TaskWorker", {task})
              ↓
ORBIT ejecuta + escribe a agent_events + responde via session
              ↓
Hermes recibe respuesta inmediata + updatea dashboard
```

## Lo que ORBIT necesita de José (HOY)

### 1️⃣ Sesión persistente "Hermes-TaskWorker"
```bash
# José debe crear:
openclaw sessions spawn \
  --label "Hermes-TaskWorker" \
  --agentId hermes \
  --mode run
  
# Resultado: sessionKey = ??? (eso es lo que necesito)
```

**Qué pasa:** Hermes mantendrá esa sesión abierta indefinidamente, escuchando mensajes que ORBIT le envíe vía `sessions_send()`.

### 2️⃣ Verificar Supabase project "agent-floor-3d"
- 4 tablas: `agent_tasks`, `agent_events`, `agent_config`, `agent_logs`
- RLS policies activas (ORBIT puede escribir/leer ambas)
- Connection string en `.env` de workspace de ORBIT

### 3️⃣ Autorizar a ORBIT
- ✅ Terminal access completo
- ✅ Subagents spawn (via `sessions_spawn`)
- ✅ 5-min timeout por tarea
- ✅ Max 5 concurrent tasks
- ✅ Alertas por Telegram si sobrecarga

## Promesa de ORBIT (una vez configurado)

1. **Escucho a Hermes** vía `sessions_send()` sin polling
2. **Ejecuto rápido** (< 100ms latencia)
3. **Reporto siempre** con estado actualizado en Supabase
4. **Manejo errores** con retry automático × 3
5. **Cero ruido en Telegram** — solo alertas críticas

## Status
⏳ Esperando que José:
1. Cree sesión "Hermes-TaskWorker" y dé sessionKey
2. Confirme Supabase RLS y connection string
3. Autorice permisos (ya acordado con Hermes)

Una vez listo: ORBIT implementa listener en < 30 min.

## Primeros tests (plan)
1. Hermes envía: `{"task": "test_integration", "steps": 5}`
2. ORBIT ejecuta: cada paso escribe a agent_events
3. Hermes verifica: todo en dashboard actualizado en tiempo-real
4. Éxito: pasar a Phase 3 production
