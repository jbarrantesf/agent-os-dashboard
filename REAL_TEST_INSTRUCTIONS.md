# 🚀 REAL MCP INTEGRATION TEST — Step by Step

**Objetivo:** Probar listeners reales con comunicación bidireccional  
**Tiempo:** ~5 minutos  
**Prerequisitos:** 3 terminales abiertas

---

## 📋 INSTRUCCIONES

### PASO 1: Terminal A — Inicia ORBIT Listener

```bash
cd /Users/nextaisolutionscr/.openclaw/workspace
node orbit-listener.ts
```

**Expected output:**
```
🚀 ORBIT Listener initializing...
   Hermes Session: hermes-taskworker-e122e1c7-4f7f-4d87-bbc9-ad6997b7a6dd
   ORBIT Session: agent:orbit:explicit:ORBIT-Worker

📡 ORBIT Listener started. Waiting for messages from Hermes...
```

✅ **Déjala corriendo en esta terminal**

---

### PASO 2: Terminal B — Inicia Hermes Listener

```bash
cd /Users/nextaisolutionscr/.openclaw/workspace
node hermes-listener.ts
```

**Expected output:**
```
🚀 Hermes Listener initializing...
   Hermes Session: hermes-taskworker-e122e1c7-4f7f-4d87-bbc9-ad6997b7a6dd
   ORBIT Session: agent:orbit:explicit:ORBIT-Worker

📡 Hermes Listener started. Waiting for messages from ORBIT...
```

✅ **Déjala corriendo en esta terminal**

---

### PASO 3: Terminal C — Envía Test Commands

```bash
cd /Users/nextaisolutionscr/.openclaw/workspace
bash run-real-test.sh commands
```

Este script enviará 4 tareas:
1. **Echo** — Comando simple que funciona
2. **PWD** — Muestra el directorio actual
3. **LS** — Lista archivos TypeScript
4. **Error** — Comando que falla (para probar error handling)

---

## 🔍 QUÉ VER EN CADA TERMINAL

### Terminal A (ORBIT) — Verá:
```
📨 ORBIT received message: task
   From: hermes
   ID: task-real-1

🚀 Executing task: real-1
   Title: Real Test - Echo
   Command: echo 'Hello from real test'

✅ Task completed: real-1
   Output: Hello from real test

📤 ORBIT sending to Hermes: result
   Message ID: result-real-1
```

### Terminal B (Hermes) — Verá:
```
📨 Hermes received message: result
   From: orbit
   ID: result-real-1

✅ Task completed: real-1
   Exit code: 0
   Output: Hello from real test...

📱 [TELEGRAM TO JOSÉ]
   ✅ Task real-1 completed
   Hello from real test
   Time: [timestamp]
```

### Terminal C (Test) — Verá:
```
📤 TEST 1: Simple echo
📤 TEST 2: Show current directory
📤 TEST 3: List files
📤 TEST 4: Error test

✅ Test commands sent!
   Check Terminal A (ORBIT) for execution logs
   Check Terminal B (Hermes) for result processing
```

---

## 📊 Flujo Completo

```
Terminal C (Test CLI)
     │
     ├─ Envía: task-real-1 (echo)
     │
     ▼
Terminal A (ORBIT Listener)
     ├─ Recibe task JSON
     ├─ Ejecuta: echo 'Hello from real test'
     ├─ Captura output
     ├─ Crea resultado
     └─ Envía respuesta
     │
     ▼
Terminal B (Hermes Listener)
     ├─ Recibe resultado JSON
     ├─ Procesa output
     ├─ Log: "✅ Task real-1 completed"
     └─ Simula Telegram: mensaje a José
```

---

## ✅ Verificación Paso a Paso

### ✓ Test 1: Echo (Happy Path)
- [ ] Terminal A: Task received ✅
- [ ] Terminal A: Command executed ✅
- [ ] Terminal A: Output captured ✅
- [ ] Terminal B: Result received ✅
- [ ] Terminal B: Output processed ✅
- [ ] Status: SUCCESS ✅

### ✓ Test 2: PWD (Directory)
- [ ] Terminal A: Command executed ✅
- [ ] Terminal A: Output = /Users/nextaisolutionscr/.openclaw/workspace ✅
- [ ] Terminal B: Result received ✅
- [ ] Status: SUCCESS ✅

### ✓ Test 3: LS (File List)
- [ ] Terminal A: Command executed ✅
- [ ] Terminal A: Output shows .ts files ✅
- [ ] Terminal B: Result received ✅
- [ ] Status: SUCCESS ✅

### ✓ Test 4: Error (Error Handling)
- [ ] Terminal A: Command fails (false) ✅
- [ ] Terminal A: Exit code 1 ✅
- [ ] Terminal A: Error sent to Hermes ✅
- [ ] Terminal B: Error received ✅
- [ ] Terminal B: Error logged ✅
- [ ] Status: SUCCESS ✅

---

## 🎯 Resultado Esperado

**Si todo funciona:**
```
Terminal A: 4 tasks ejecutadas
Terminal B: 4 resultados procesados
Terminal C: "Test commands sent!"

✅ ALL INTEGRATION TESTS PASSED
```

**Si algo falla:**
```
Terminal A or B: Mensaje de error
→ Revisar logs
→ Verificar session keys
→ Reintentar
```

---

## 🔧 Troubleshooting

### "Node command not found"
```bash
# Instala Node.js
brew install node
```

### "Cannot find module"
```bash
# Instala dependencias
npm install
```

### "Permission denied"
```bash
# Hazlo ejecutable
chmod +x run-real-test.sh
```

### "ORBIT not listening"
- Verifica que Terminal A esté corriendo
- Verifica session key en ORBIT_SESSION

### "Hermes not receiving"
- Verifica que Terminal B esté corriendo
- Verifica session key en HERMES_SESSION

---

## 📁 Files Needed

```
✅ orbit-listener.ts
✅ hermes-listener.ts
✅ run-real-test.sh
✅ REAL_TEST_INSTRUCTIONS.md (este)
```

---

## 🚀 Próximo Paso

Después de que pasen todos los tests:

1. ✅ Confirma: "All integration tests passed"
2. → Podemos agregar Supabase (persistencia)
3. → O pasar a Phase 2 Backend (Express + React)

---

**Tiempo estimado:** 5 minutos  
**Dificultad:** Fácil (solo ejecutar scripts)  
**Resultado:** MCP bidireccional CONFIRMADO

🎉 **Vamos a hacerlo!**
