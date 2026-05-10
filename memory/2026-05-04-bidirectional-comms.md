# BIDIRECTIONAL COMMUNICATION SYSTEM — 04-may-2026 15:00 CST

## 🔄 Architecture

**Problem:** Comunicación anterior era solo Hermes → ORBIT. Necesitamos bidireccional.

**Solution:**
1. ✅ Tabla `agent_messages` en Supabase (persistencia)
2. ✅ Sesión "ORBIT-Worker" (sesión propia de ORBIT)
3. ✅ Hermes polling loop (sincronización cada 30s)
4. ✅ ORBIT polling loop (sincronización cada 30s)

---

## 📝 Tabla agent_messages

**Estructura:**
```
id: UUID (PK)
from_agent: 'hermes' | 'orbit'
to_agent: 'hermes' | 'orbit'
message_type: 'task' | 'result' | 'status' | 'alert' | 'ack' | 'error'
content: JSONB (mensaje + datos)
status: 'unread' | 'read' | 'acked' | 'failed'
created_at: timestamp
read_at: timestamp (cuando se leyó)
acked_at: timestamp (cuando se confirmó)
```

**Índices:** 3 (optimizados para queries frecuentes)

**Stored Procedures:** 3
- `get_unread_messages(agent_id)` → fetch inbox
- `mark_message_read(msg_id)` → mark as read
- `send_message(from, to, type, content)` → create message

**Real-time:** Habilitada (para dashboard live updates)

---

## 🖥️ Sesiones Persistentes

### Hermes Session (ya existe)
- ID: `hermes-taskworker-e122e1c7-4f7f-4d87-bbc9-ad6997b7a6dd`
- Estado: LISTENING
- Responsabilidad: Validar, monitorear, reportar
- Escucha: Messages vía hermes-orbit-sync.sh

### ORBIT Session (nuevo - pendiente crear)
- Comando: `openclaw sessions spawn --label "ORBIT-Worker" --agentId orbit --mode run`
- Estado: PENDING (creación)
- Responsabilidad: Ejecutar tareas, reportar resultados
- Escucha: Messages vía hermes-orbit-sync.sh

---

## 🔄 Sincronización Loop (hermes-orbit-sync.sh)

**Propósito:** Polling bidireccional cada 30 segundos

**Flujo:**
1. Conecta a Supabase API
2. Query: `SELECT * FROM agent_messages WHERE to_agent='hermes' AND status='unread'`
3. Para cada mensaje:
   - `sessions_send(HERMES_SESSION_ID, message_json)`
   - `UPDATE agent_messages SET status='read' WHERE id=...`
4. Query: `SELECT * FROM agent_messages WHERE to_agent='orbit' AND status='unread'`
5. Para cada mensaje:
   - `sessions_send(ORBIT_SESSION_ID, message_json)`
   - `UPDATE agent_messages SET status='read' WHERE id=...`
6. Sleep 30 segundos
7. Repeat

**Ubicación:** ~/.hermes/scripts/hermes-orbit-sync.sh (pendiente crear)

---

## 📊 Message Types

### Task (Hermes → ORBIT)
```json
{
  "message_type": "task",
  "task_id": "task-123",
  "title": "Deploy ROI Calculator",
  "task_type": "deploy",
  "priority": "high",
  "input_data": { ... }
}
```

### Result (ORBIT → Hermes)
```json
{
  "message_type": "result",
  "task_id": "task-123",
  "status": "completed",
  "output_data": { ... }
}
```

### Status (ORBIT → Hermes)
```json
{
  "message_type": "status",
  "task_id": "task-123",
  "progress": "80%",
  "current_step": "Uploading to Vercel..."
}
```

### Alert (ORBIT → Hermes)
```json
{
  "message_type": "alert",
  "severity": "critical",
  "message": "Task timeout - retrying..."
}
```

### Error (ORBIT → Hermes)
```json
{
  "message_type": "error",
  "task_id": "task-123",
  "error_code": "DEPLOY_FAILED",
  "error_message": "npm run build failed"
}
```

### ACK (Both ways)
```json
{
  "message_type": "ack",
  "ack_for_message_id": "msg-789",
  "timestamp": "2026-05-04T15:00:00Z"
}
```

---

## 🎯 Complete Flow Example

```
0. SETUP
   ├─ José ejecuta agent_messages_table.sql
   ├─ ORBIT crea sesión "ORBIT-Worker"
   ├─ Hermes corre hermes-orbit-sync.sh
   └─ ORBIT corre similar loop

1. HERMES CREA TAREA
   ├─ Valida input (TaskValidator)
   ├─ CREATE en agent_tasks (status=pending)
   ├─ INSERT en agent_messages:
   │  {from: 'hermes', to: 'orbit', type: 'task', status: 'unread'}
   └─ Espera respuesta

2. HERMES-ORBIT-SYNC LOOP (cada 30s)
   ├─ Detecta msg para ORBIT (unread)
   ├─ sessions_send(ORBIT_SESSION, message_json)
   ├─ UPDATE agent_messages SET status='read'
   └─ ORBIT recibe en su sesión

3. ORBIT PROCESA TAREA
   ├─ Recibe mensaje vía sesión
   ├─ Dequeue de agent_tasks
   ├─ Ejecuta (terminal, deploy, etc.)
   ├─ Escribe a agent_events (progreso)
   └─ Prepara resultado

4. ORBIT REPORTA RESULTADO
   ├─ INSERT en agent_messages:
   │  {from: 'orbit', to: 'hermes', type: 'result', status: 'unread'}
   └─ Espera ACK

5. HERMES-ORBIT-SYNC LOOP (cada 30s)
   ├─ Detecta msg para HERMES (unread)
   ├─ sessions_send(HERMES_SESSION, result_json)
   ├─ UPDATE agent_messages SET status='read'
   └─ HERMES recibe en su sesión

6. HERMES ACTUALIZA ESTADO
   ├─ Recibe resultado vía sesión
   ├─ UPDATE agent_tasks (status=completed)
   ├─ Inserta en agent_events (task_completed)
   ├─ INSERT en agent_messages (ack):
   │  {from: 'hermes', to: 'orbit', type: 'ack', ack_for: result_msg_id}
   └─ Envía a Telegram: "✅ Deploy completado"

7. HERMES-ORBIT-SYNC LOOP (cada 30s)
   ├─ Detecta ACK para ORBIT
   ├─ sessions_send(ORBIT_SESSION, ack_json)
   └─ ORBIT marca como completado

RESULTADO: Task flujo completo, persistente, auditable, escalable
```

---

## 🔐 Security + Reliability

**Security:**
- RLS: Cada agente accede solo sus mensajes
- Validación: CHECK constraints en types + agents
- Constraint: from_agent != to_agent (no auto-mensajes)

**Reliability:**
- Persistent: Todo en Supabase (no volátil)
- Auditable: agent_messages + agent_events = historial completo
- Retry-able: Si falla sessions_send(), loop reintenta en próximo ciclo
- Async-safe: Polling vs push = no race conditions

**Performance:**
- Índices: 3 índices específicos para queries rápidas
- Polling interval: 30s (configurable)
- Real-time: Supabase real-time para dashboard

---

## 📋 TODO (Próximos pasos)

1. José ejecuta `agent_messages_table.sql` en Supabase
2. ORBIT crea sesión "ORBIT-Worker"
3. Hermes implementa `hermes-orbit-sync.sh`
4. Test end-to-end (crear tarea → dequeue → ejecutar → reportar)
5. Go-live Phase 2

---

## 💾 Files Created

- ✅ `/workspace/agent_messages_table.sql` (table + procedures)
- ✅ `/workspace/ORBIT_SESSION_SETUP.md` (setup guide)
- ✅ `/memory/2026-05-04-bidirectional-comms.md` (this file)

---

**Status:** 📋 READY FOR IMPLEMENTATION  
**Blocker:** José ejecuta agent_messages_table.sql  
**Próximo milestone:** ORBIT crea sesión + test messaging
