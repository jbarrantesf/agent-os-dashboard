# 🔄 MCP BIDIRECCIONAL — 3 PASOS

**Objetivo:** Hermes ↔ ORBIT comunicación MCP (sin Supabase por ahora)  
**Tiempo:** 1 hora setup + 30 min testing

---

## PASO 1: Crear Sesión ORBIT

**Ejecuta en terminal:**
```bash
openclaw sessions spawn \
  --label "ORBIT-Worker" \
  --agentId orbit \
  --mode run \
  --task "Listen for messages from Hermes"
```

**Resultado esperado:**
```
✅ Spawned session
Session Key: agent:orbit:worker:XXXXXXXX
```

**Guardar ese Session Key** (lo necesitamos para Paso 2)

---

## PASO 2: Registrar Session Keys

**Archivo:** `/Users/nextaisolutionscr/.openclaw/workspace/MCP_SESSION_REGISTRY.json`

```json
{
  "hermes_session_key": "hermes-taskworker-e122e1c7-4f7f-4d87-bbc9-ad6997b7a6dd",
  "orbit_session_key": "[PEGAR SESSION KEY DEL PASO 1]"
}
```

---

## PASO 3: Implementar Listeners

**ORBIT hace:**
1. Recibe message desde Hermes
2. Ejecuta task (terminal, git, deploy, etc.)
3. Envía resultado back a Hermes

**Hermes hace:**
1. Recibe resultado desde ORBIT
2. Procesa
3. Envía a Telegram

---

## 🧪 TEST

### Test 1: Simple Task

```bash
# Hermes envía: "echo hello"
curl -X POST http://localhost:3001/send-task \
  -d '{"task_id": "test-1", "command": "echo hello"}'
```

**Expected flow:**
1. Hermes → ORBIT: "Execute: echo hello"
2. ORBIT ejecuta: hello
3. ORBIT → Hermes: "Result: hello"
4. Hermes: "✅ Task done"

---

### Test 2: Error Handling

```bash
# Hermes envía: comando que falla
curl -X POST http://localhost:3001/send-task \
  -d '{"task_id": "test-2", "command": "false"}'
```

**Expected flow:**
1. Hermes → ORBIT: "Execute: false"
2. ORBIT ejecuta: ❌ error
3. ORBIT → Hermes: "Error: command failed"
4. Hermes: "❌ Task failed"

---

## ✅ Verificación

Cuando ambos tests pasen:
- [ ] Bidireccional funcionando
- [ ] MCP push-based (sin polling)
- [ ] Error handling OK

**ENTONCES:** Agregamos Supabase para persistencia + escalabilidad

---

**Status:** 📋 READY  
**Blocker:** Paso 1 (crear sesión ORBIT)  
**ETA:** ~90 minutos total

Documento completo: `MCP_BIDIRECTIONAL_SETUP.md`
