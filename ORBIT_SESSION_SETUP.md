# ORBIT SESSION SETUP — Bidirectional Communication

**Propósito:** Crear sesión persistente para ORBIT para que Hermes pueda enviarle mensajes  
**Responsable:** José (setup) + ORBIT (crear sesión)  
**Fecha:** 04-may-2026

---

## 🎯 Objetivo

Establecer comunicación **bidireccional** entre Hermes y ORBIT:
- ✅ Hermes → ORBIT (tareas)
- ✅ ORBIT → Hermes (resultados)
- ✅ Ambos ↔ Supabase (histórico persistente)

---

## 📋 PASO 1: Crear Tabla `agent_messages` en Supabase

**Archivo:** `/Users/nextaisolutionscr/.openclaw/workspace/agent_messages_table.sql`

**Acción:**
1. Abre Supabase SQL Editor
2. Copia contenido de `agent_messages_table.sql`
3. Pega en editor
4. Click "Run"
5. Verifica tabla existe:
   ```sql
   SELECT tablename FROM pg_tables WHERE tablename = 'agent_messages';
   ```

**Resultado:** Tabla `agent_messages` con índices + stored procedures

---

## 🖥️ PASO 2: ORBIT Crea Sesión Persistente

**Comando a ejecutar (desde sesión ORBIT):**

```bash
openclaw sessions spawn \
  --label "ORBIT-Worker" \
  --agentId orbit \
  --mode run \
  --task "start listening for messages" \
  --lightContext
```

**Expected Output:**
```
✅ Session spawned: agent:orbit:worker:abcd1234
Session ID: abcd1234-...
Listening for: sessions_send() messages
```

**¿Qué es esto?**
- Abre una sesión nueva con label "ORBIT-Worker"
- ORBIT corre un listener que espera mensajes
- Hermes puede enviar tareas vía `sessions_send()`

---

## 📝 PASO 3: Registrar Session IDs

**Después de completar PASO 2, guardar:**

```markdown
# Session IDs (Agent Floor 3D)

**Hermes Session** (ya existe)
- Session ID: hermes-taskworker-e122e1c7-4f7f-4d87-bbc9-ad6997b7a6dd
- Created: 04-may-2026
- Status: LISTENING

**ORBIT Session** (nuevo)
- Session ID: [COMPLETAR DESPUÉS DE PASO 2]
- Created: [FECHA]
- Status: LISTENING
```

---

## 🔄 PASO 4: Implementar Hermes-ORBIT Sync Loop

**Archivo:** `~/.hermes/scripts/hermes-orbit-sync.sh`

**Propósito:** Polling loop que sincroniza ambos agentes vía Supabase

```bash
#!/bin/bash

# hermes-orbit-sync.sh — Bidirectional sync every 30 seconds

set -e

HERMES_AGENT_ID="[HERMES_SESSION_ID]"
ORBIT_AGENT_ID="[ORBIT_SESSION_ID]"
SUPABASE_URL="$SUPABASE_URL"
SUPABASE_KEY="$SUPABASE_KEY"

echo "🔄 Starting Hermes ↔ ORBIT sync loop..."

while true; do
  echo "[$(date)] Syncing..."
  
  # 1. Hermes: Check for messages from ORBIT
  echo "  → Checking Hermes inbox..."
  HERMES_MESSAGES=$(curl -s "${SUPABASE_URL}/rest/v1/agent_messages" \
    -H "Authorization: Bearer ${SUPABASE_KEY}" \
    -H "Content-Type: application/json" \
    --data-urlencode "select=*" \
    --data-urlencode "filters=to_agent.eq.hermes,and(status.eq.unread)" \
    | jq -r '.[] | @base64')
  
  if [ ! -z "$HERMES_MESSAGES" ]; then
    echo "  ✉️  Found $(echo "$HERMES_MESSAGES" | wc -l) message(s) for Hermes"
    
    for msg in $HERMES_MESSAGES; do
      MSG_JSON=$(echo "$msg" | base64 -d)
      MSG_ID=$(echo "$MSG_JSON" | jq -r '.id')
      
      # Send to Hermes session
      openclaw sessions send \
        --sessionKey "$HERMES_AGENT_ID" \
        --message "$MSG_JSON"
      
      # Mark as read
      curl -s -X PATCH "${SUPABASE_URL}/rest/v1/agent_messages?id=eq.${MSG_ID}" \
        -H "Authorization: Bearer ${SUPABASE_KEY}" \
        -H "Content-Type: application/json" \
        -d "{\"status\": \"read\", \"read_at\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"}"
    done
  fi
  
  # 2. ORBIT: Check for messages from Hermes
  echo "  → Checking ORBIT inbox..."
  ORBIT_MESSAGES=$(curl -s "${SUPABASE_URL}/rest/v1/agent_messages" \
    -H "Authorization: Bearer ${SUPABASE_KEY}" \
    -H "Content-Type: application/json" \
    --data-urlencode "select=*" \
    --data-urlencode "filters=to_agent.eq.orbit,and(status.eq.unread)" \
    | jq -r '.[] | @base64')
  
  if [ ! -z "$ORBIT_MESSAGES" ]; then
    echo "  ✉️  Found $(echo "$ORBIT_MESSAGES" | wc -l) message(s) for ORBIT"
    
    for msg in $ORBIT_MESSAGES; do
      MSG_JSON=$(echo "$msg" | base64 -d)
      MSG_ID=$(echo "$MSG_JSON" | jq -r '.id')
      
      # Send to ORBIT session
      openclaw sessions send \
        --sessionKey "$ORBIT_AGENT_ID" \
        --message "$MSG_JSON"
      
      # Mark as read
      curl -s -X PATCH "${SUPABASE_URL}/rest/v1/agent_messages?id=eq.${MSG_ID}" \
        -H "Authorization: Bearer ${SUPABASE_KEY}" \
        -H "Content-Type: application/json" \
        -d "{\"status\": \"read\", \"read_at\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"}"
    done
  fi
  
  echo "  ✅ Sync complete"
  sleep 30
done
```

---

## 🎯 Flujo Completo

```
HERMES                      SUPABASE                        ORBIT
────────────────────────────────────────────────────────────────
                          agent_messages
                          (empty, polling)
                                │
Tarea: Deploy ROI         CREATE msg                     Listening
├─ Valida                 (from=hermes, to=orbit)        │
├─ INSERT agent_tasks     status=unread            ◄─────┤
└─ Espera respuesta                                       │
                                │                         │
hermes-orbit-sync.sh                                      │
├─ Detecta msg para ORBIT ├────────────────────────────►│
├─ sessions_send(ORBIT)                             Recibe
└─ Mark read              ├─────┐                       │
                                │                         │
                         UPDATE agent_messages ◄─────── Procesa
                         status=read             (dequeue, execute)
                                │                         │
                          INSERT result ◄───────────────┤
                          (from=orbit,                   │
                           to=hermes,                    │
                           status=unread)                │
                                │                         │
hermes-orbit-sync.sh                                      │
├─ Detecta msg para Hermes                              │
├─ sessions_send(HERMES)                                │
└─ Mark read             ├───────────────────────────►  │
                                │
Recibe resultado
├─ Deploy completado
├─ Mark as acked
└─ Telegram: "✅ Deploy done"
```

---

## 📊 Message Schema

### Task Message (Hermes → ORBIT)
```json
{
  "id": "abc123...",
  "from_agent": "hermes",
  "to_agent": "orbit",
  "message_type": "task",
  "content": {
    "task_id": "task-123",
    "title": "Deploy ROI Calculator",
    "task_type": "deploy",
    "priority": "high",
    "input_data": {
      "repo": "agent-floor-3d",
      "branch": "main",
      "target": "vercel"
    }
  },
  "status": "unread",
  "created_at": "2026-05-04T14:30:00Z"
}
```

### Result Message (ORBIT → Hermes)
```json
{
  "id": "xyz789...",
  "from_agent": "orbit",
  "to_agent": "hermes",
  "message_type": "result",
  "content": {
    "task_id": "task-123",
    "status": "completed",
    "output_data": {
      "deployment_url": "https://roicalculator.vercel.app",
      "deployment_time": "2m 15s",
      "logs": "https://vercel.com/logs/..."
    },
    "timestamp": "2026-05-04T14:32:15Z"
  },
  "status": "unread",
  "created_at": "2026-05-04T14:32:15Z"
}
```

---

## ✅ Verificación Final

**Después de todos los pasos, ejecutar:**

```bash
# Verificar tabla exists
psql -c "SELECT * FROM agent_messages LIMIT 1;"

# Verificar stored procedures
psql -c "SELECT proname FROM pg_proc WHERE proname LIKE 'agent_%';"

# Verificar índices
psql -c "SELECT indexname FROM pg_indexes WHERE tablename = 'agent_messages';"

# Verificar sesiones activas
openclaw sessions list --active
```

---

## 🚀 Próximos Steps

1. José: Ejecuta `agent_messages_table.sql` en Supabase
2. ORBIT: Crea sesión "ORBIT-Worker"
3. Hermes: Implementa polling loop (hermes-orbit-sync.sh)
4. Test: Hermes envía tarea → ORBIT dequeue → responde
5. Go-live: Dashboard muestra todo en tiempo-real

---

## 📞 Troubleshooting

**P: La tabla no aparece en Supabase**
A: Verifica que ejecutaste el SQL completo (sin truncar)

**P: Sessions_send falla**
A: Confirma session ID correcto y usuario autenticado

**P: Mensajes no llegan**
A: Check hermes-orbit-sync.sh logs: `tail -f ~/.hermes/sync.log`

**P: Performance lenta**
A: Reduce polling interval (actualmente 30s, puede ser 10s)

---

**Status:** 📋 READY FOR IMPLEMENTATION  
**Blocker:** José ejecuta agent_messages_table.sql  
**ETA:** 30 minutos setup + 1 hora testing

🚀 **Bidirectional communication lista.**
