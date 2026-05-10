# 🧪 TEST MCP BIDIRECCIONAL — Step by Step

**Objetivo:** Probar que Hermes ↔ ORBIT se comunican via MCP  
**Tiempo:** ~10 minutos  
**Prerequisitos:** Ambas sesiones listening (ya están)

---

## 🎯 Método 1: Test Simple (5 minutos)

### PASO 1: En una terminal, abre sesión de ORBIT

```bash
# Terminal 1 — ORBIT Side
cd /Users/nextaisolutionscr/.openclaw/workspace

# Inicia listener de ORBIT
node orbit-listener.ts
```

**Expected output:**
```
🚀 ORBIT Listener initializing...
   Hermes Session: hermes-taskworker-e122e1c7-4f7f-4d87-bbc9-ad6997b7a6dd
   ORBIT Session: agent:orbit:explicit:ORBIT-Worker

📡 ORBIT Listener started. Waiting for messages from Hermes...
```

---

### PASO 2: En otra terminal, abre sesión de Hermes

```bash
# Terminal 2 — HERMES Side
cd /Users/nextaisolutionscr/.openclaw/workspace

# Inicia listener de Hermes
node hermes-listener.ts
```

**Expected output:**
```
🚀 Hermes Listener initializing...
   Hermes Session: hermes-taskworker-e122e1c7-4f7f-4d87-bbc9-ad6997b7a6dd
   ORBIT Session: agent:orbit:explicit:ORBIT-Worker

📡 Hermes Listener started. Waiting for messages from ORBIT...
```

---

### PASO 3: En una TERCERA terminal, envía un task

```bash
# Terminal 3 — Test CLI
cd /Users/nextaisolutionscr/.openclaw/workspace

# Envía un task JSON a Hermes
cat << 'EOF' | node
const { hermesListener } = require('./hermes-listener.ts');

(async () => {
  await hermesListener.sendTaskToORBIT({
    task_id: 'test-1',
    title: 'Echo Hello',
    command: 'echo "Hello from Hermes"'
  });
})();
EOF
```

---

### ¿QUÉ PASA?

**Terminal 1 (ORBIT):**
```
📨 ORBIT received message: task
   From: hermes
   ID: task-test-1

🚀 Executing task: test-1
   Title: Echo Hello
   Command: echo "Hello from Hermes"

✅ Task completed: test-1
   Output: Hello from Hermes
   
📤 ORBIT sending to Hermes: result
   Message ID: result-test-1

[MESSAGE_TO_HERMES]
{"type":"result","payload":{"task_id":"test-1","output":"Hello from Hermes"}}
[/MESSAGE_TO_HERMES]
```

**Terminal 2 (Hermes):**
```
📨 Hermes received message: result
   From: orbit
   ID: result-test-1

✅ Task completed: test-1
   Exit code: 0
   Output: Hello from Hermes...

📱 [TELEGRAM TO JOSÉ]
   ✅ Task test-1 completed
   Hello from Hermes
```

---

## 🎯 Método 2: Test Automatizado (3 minutos)

```bash
# Ejecuta test script
bash test-mcp-bidirectional.sh
```

**Output esperado:**
```
TEST 1: Simple Echo Task
📤 Hermes sends task to ORBIT:
{task_id: "test-echo-...", command: "echo..."}

⏳ ORBIT receives and executes...

✅ ORBIT returns result to Hermes:
{status: "completed", output: "Hello from ORBIT"}

TEST 2: Error Handling
📤 Hermes sends failing task to ORBIT:
{command: "false"}

❌ ORBIT returns error to Hermes:
{status: "failed", error: "Command failed..."}

✅ BIDIRECCIONAL TEST PASSED
```

---

## 🎯 Método 3: Integración Completa (Real Sessions)

### PASO 1: Usa OpenClaw para enviar a ORBIT

```bash
# Desde sesión main (ORBIT):
openclaw sessions send \
  --sessionKey "hermes-taskworker-e122e1c7-4f7f-4d87-bbc9-ad6997b7a6dd" \
  --message '{
    "type": "task",
    "payload": {
      "task_id": "deploy-1",
      "title": "Deploy ROI Calculator",
      "command": "npm run build"
    }
  }'
```

### PASO 2: Observa Hermes recibir

En sesión Hermes, verás:
```
📨 Hermes received message: task
   From: orbit
   
🚀 Executing task: deploy-1
```

### PASO 3: ORBIT responde

```bash
# Desde sesión ORBIT:
openclaw sessions send \
  --sessionKey "agent:orbit:explicit:ORBIT-Worker" \
  --message '{
    "type": "result",
    "payload": {
      "task_id": "deploy-1",
      "status": "completed",
      "output": "Build successful"
    }
  }'
```

### PASO 4: Hermes recibe resultado

```
📨 Hermes received message: result

✅ Task completed: deploy-1
📱 [TELEGRAM TO JOSÉ]
   ✅ Deploy ROI Calculator completed
```

---

## 🎯 Método 4: Manual Test (Interactive)

Abre dos terminales:

**Terminal A (ORBIT):**
```bash
node orbit-listener.ts
```

**Terminal B (Hermes):**
```bash
# Usa REPL para enviar
node -i -e "const listener = require('./hermes-listener.ts'); global.listener = listener;"

# En el REPL:
> await global.listener.hermesListener.sendTaskToORBIT({
    task_id: 'manual-1',
    title: 'Test task',
    command: 'whoami'
  })
```

Terminal A recibirá la tarea, la ejecutará, y devolverá el resultado.

---

## 📊 Checklist de Prueba

### Test 1: Echo (Happy Path)
- [ ] Hermes envía: `echo "hello"`
- [ ] ORBIT recibe y ejecuta
- [ ] ORBIT devuelve output
- [ ] Hermes recibe resultado
- [ ] Status: ✅ OK

### Test 2: Error Handling
- [ ] Hermes envía: comando que falla
- [ ] ORBIT intenta ejecutar
- [ ] Comando falla con exit code 1
- [ ] ORBIT envía error a Hermes
- [ ] Hermes procesa error
- [ ] Status: ✅ OK

### Test 3: Multiple Tasks
- [ ] Hermes envía 5 tareas
- [ ] ORBIT ejecuta secuencialmente (o concurrent)
- [ ] Todas retornan resultados
- [ ] Hermes recibe todos
- [ ] Status: ✅ OK

### Test 4: Timeout
- [ ] Hermes envía: `sleep 10` con timeout 2s
- [ ] ORBIT cancela después de 2s
- [ ] ORBIT envía timeout error
- [ ] Hermes recibe error
- [ ] Status: ✅ OK

---

## 🔧 Debugging

Si algo falla:

### "ORBIT no recibe el mensaje"
```bash
# Verifica que Hermes está escuchando
ps aux | grep node | grep listener

# Verifica logs
tail -f /tmp/orbit-listener.log
```

### "No se puede parsear JSON"
```bash
# Verifica que el JSON es válido
echo '{...}' | jq .
```

### "Timeout en ejecución"
```bash
# Verifica que el comando existe
which npm
npm run build --help
```

### "SessionKey incorrecto"
```bash
# Verifica session keys
cat MCP_SESSION_REGISTRY.json | jq .
```

---

## 📊 Expected vs Actual

| Aspecto | Expected | Actual | Status |
|---------|----------|--------|--------|
| Hermes recibe | ✅ yes | ? | ? |
| ORBIT recibe | ✅ yes | ? | ? |
| Command executes | ✅ yes | ? | ? |
| Result returns | ✅ yes | ? | ? |
| Error handled | ✅ yes | ? | ? |

---

## 🚀 Resumen

**Opción más rápida:** Método 2 (test script)
```bash
bash test-mcp-bidirectional.sh
```

**Opción más visible:** Método 1 (dos terminales)
```bash
# Terminal 1
node orbit-listener.ts

# Terminal 2
node hermes-listener.ts

# Terminal 3
# Envía un task JSON
```

**Opción más realista:** Método 3 (con sessions_send)
```bash
openclaw sessions send --sessionKey "..." --message '{...}'
```

---

**Próximo paso:** Elige un método y hazlo. Dame el resultado y continuamos.
