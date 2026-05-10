# 🔄 MCP BIDIRECTIONAL COMMUNICATION — Hermes ↔ ORBIT

**Objetivo:** Establecer canal MCP bidireccional ANTES de Supabase  
**Responsable:** José (crear sesiones) + ORBIT (implementar listeners)  
**Estado:** SETUP PHASE (antes de código)

---

## 🎯 Arquitectura

```
HERMES Session A                    ORBIT Session B
(escucha de ORBIT)         ↔        (escucha de Hermes)
       │                                   │
       ├─ sessions_send(B, msg) ──────────┤
       │                                   │
       └─ recibe result ◄──────essions_send(A, result)
```

**Sin Supabase** (por ahora solo MCP)
**Sin polling loops** (push-based vía sessions_send)
**Directo y sincrónico** (cuando sea posible)

---

## 📋 PASO 1: Verificar Sesión Hermes (YA EXISTE)

**Status actual:**
```
Session ID: hermes-taskworker-e122e1c7-4f7f-4d87-bbc9-ad6997b7a6dd
Agente: Hermes
Estado: LISTENING
```

**Verificar que está activa:**
```bash
openclaw sessions list --agentId hermes
```

Debe retornar: sesión con label "Hermes-TaskWorker" y status "active"

---

## 🖥️ PASO 2: Crear Sesión ORBIT (NUEVO)

**José ejecuta:**
```bash
openclaw sessions spawn \
  --label "ORBIT-Worker" \
  --agentId orbit \
  --mode run \
  --task "Listen for messages from Hermes" \
  --lightContext
```

**Expected output:**
```
✅ Spawned subagent session
Session Key: agent:orbit:worker:[UUID]
Session ID: [complete-key]
Status: LISTENING
```

**Guardar el Session Key completo** (lo necesitamos para próximo paso)

---

## 📝 PASO 3: Registrar Ambas Sesiones

**Crear archivo:** `/Users/nextaisolutionscr/.openclaw/workspace/MCP_SESSION_REGISTRY.json`

```json
{
  "hermes": {
    "sessionKey": "hermes-taskworker-e122e1c7-4f7f-4d87-bbc9-ad6997b7a6dd",
    "agentId": "hermes",
    "role": "orchestrator",
    "created": "2026-05-04T08:35:00Z",
    "status": "listening"
  },
  "orbit": {
    "sessionKey": "[COMPLETAR-DESPUÉS-DE-PASO-2]",
    "agentId": "orbit",
    "role": "executor",
    "created": "[COMPLETAR-DESPUÉS-DE-PASO-2]",
    "status": "listening"
  }
}
```

---

## 🔄 PASO 4: Implementar Listeners (ORBIT + Hermes)

### ORBIT Listener (qué ORBIT hace cuando recibe mensaje)

**Archivo:** `/Users/nextaisolutionscr/.openclaw/workspace/orbit-mcp-listener.ts`

```typescript
import { sessions_send } from '@openclaw/sdk';

interface Message {
  id: string;
  from: 'hermes' | 'orbit';
  type: 'task' | 'result' | 'status' | 'error';
  payload: Record<string, any>;
  timestamp: Date;
}

class ORBITMCPListener {
  private hermesSessionKey = process.env.HERMES_SESSION_KEY;
  
  async onMessageReceived(message: Message) {
    console.log(`📨 ORBIT received from Hermes:`, message.type);
    
    switch (message.type) {
      case 'task':
        return await this.handleTask(message.payload);
      case 'status':
        return await this.handleStatusQuery(message.payload);
      case 'error':
        return await this.handleError(message.payload);
      default:
        console.warn(`Unknown message type: ${message.type}`);
    }
  }
  
  private async handleTask(payload: any) {
    console.log(`🚀 Executing task:`, payload.task_id);
    
    try {
      // 1. Execute task
      const result = await this.executeTask(payload);
      
      // 2. Send result back to Hermes via MCP
      const response: Message = {
        id: `response-${payload.task_id}`,
        from: 'orbit',
        type: 'result',
        payload: {
          task_id: payload.task_id,
          status: 'completed',
          result: result,
          timestamp: new Date(),
        },
        timestamp: new Date(),
      };
      
      await sessions_send(
        this.hermesSessionKey,
        JSON.stringify(response)
      );
      
      console.log(`✅ Result sent back to Hermes`);
    } catch (error) {
      console.error(`❌ Task failed:`, error);
      
      // Send error back
      const errorResponse: Message = {
        id: `error-${payload.task_id}`,
        from: 'orbit',
        type: 'error',
        payload: {
          task_id: payload.task_id,
          error: error.message,
          timestamp: new Date(),
        },
        timestamp: new Date(),
      };
      
      await sessions_send(
        this.hermesSessionKey,
        JSON.stringify(errorResponse)
      );
    }
  }
  
  private async executeTask(payload: any) {
    // Task execution logic here
    // For now: placeholder
    return { success: true, output: 'Task executed' };
  }
  
  private async handleStatusQuery(payload: any) {
    return { status: 'ready', tasks_pending: 0 };
  }
  
  private async handleError(payload: any) {
    console.error(`Error from Hermes:`, payload);
  }
}

export default new ORBITMCPListener();
```

### Hermes Listener (qué Hermes hace cuando recibe mensaje)

**Archivo:** `/Users/nextaisolutionscr/.openclaw/workspace/hermes-mcp-listener.ts`

```typescript
import { sessions_send } from '@openclaw/sdk';

interface Message {
  id: string;
  from: 'hermes' | 'orbit';
  type: 'task' | 'result' | 'status' | 'error';
  payload: Record<string, any>;
  timestamp: Date;
}

class HermesMCPListener {
  private orbitSessionKey = process.env.ORBIT_SESSION_KEY;
  
  async onMessageReceived(message: Message) {
    console.log(`📨 Hermes received from ORBIT:`, message.type);
    
    switch (message.type) {
      case 'result':
        return await this.handleTaskResult(message.payload);
      case 'status':
        return await this.handleStatusUpdate(message.payload);
      case 'error':
        return await this.handleTaskError(message.payload);
      default:
        console.warn(`Unknown message type: ${message.type}`);
    }
  }
  
  async sendTask(task: any) {
    console.log(`📤 Hermes sending task to ORBIT:`, task.task_id);
    
    const message: Message = {
      id: `task-${task.id}`,
      from: 'hermes',
      type: 'task',
      payload: task,
      timestamp: new Date(),
    };
    
    try {
      await sessions_send(
        this.orbitSessionKey,
        JSON.stringify(message)
      );
      console.log(`✅ Task sent to ORBIT`);
    } catch (error) {
      console.error(`❌ Failed to send task:`, error);
      throw error;
    }
  }
  
  private async handleTaskResult(payload: any) {
    console.log(`✅ Task completed:`, payload.task_id);
    
    // Update task status
    // Send to Telegram
    // Update dashboard
    
    return {
      ack: true,
      task_id: payload.task_id,
      message: 'Result received and processed',
    };
  }
  
  private async handleStatusUpdate(payload: any) {
    console.log(`📊 Status update from ORBIT:`, payload);
  }
  
  private async handleTaskError(payload: any) {
    console.error(`❌ Task error from ORBIT:`, payload);
    
    // Implement retry logic here
    // Update UI
    // Alert user
  }
}

export default new HermesMCPListener();
```

---

## 🔌 PASO 5: Conectar Listeners a Sessions

### Para ORBIT:
```bash
# En sesión ORBIT:
HERMES_SESSION_KEY="hermes-taskworker-e122e1c7-4f7f-4d87-bbc9-ad6997b7a6dd" \
node orbit-mcp-listener.ts
```

### Para Hermes:
```bash
# En sesión Hermes:
ORBIT_SESSION_KEY="[session-key-de-ORBIT]" \
node hermes-mcp-listener.ts
```

---

## 🧪 PASO 6: Test Bidireccional

### Test 1: Hermes envía tarea a ORBIT

```bash
# Desde sesión Hermes:
curl -X POST http://localhost:3001/api/send-task \
  -H "Content-Type: application/json" \
  -d '{
    "task_id": "test-1",
    "title": "Echo hello",
    "type": "terminal",
    "command": "echo hello"
  }'
```

**Expected:**
1. Hermes crea Message tipo "task"
2. Envía vía sessions_send() a ORBIT
3. ORBIT recibe
4. ORBIT ejecuta comando
5. ORBIT crea Message tipo "result"
6. ORBIT envía vía sessions_send() a Hermes
7. Hermes recibe resultado
8. Hermes logs: "✅ Task completed: test-1"

---

### Test 2: Error Handling

```bash
# Enviar tarea que falla:
curl -X POST http://localhost:3001/api/send-task \
  -H "Content-Type: application/json" \
  -d '{
    "task_id": "test-error",
    "type": "terminal",
    "command": "false"  # Este comando falla
  }'
```

**Expected:**
1. ORBIT intenta ejecutar
2. Comando falla
3. ORBIT crea Message tipo "error"
4. ORBIT envía error a Hermes
5. Hermes recibe y procesa error

---

## 📊 Message Flow (MCP Only)

```
Hermes                           ORBIT
───────────────────────────────────────

1. User: "Deploy app"

   ├─ Validate
   ├─ Create task object
   └─ sessions_send(ORBIT_KEY, {
       type: 'task',
       payload: { task_id, command, ... }
     })
                                  │
                            ◄─────┤ Receive message
                                  │
                            2. Parse JSON
                               Execute command
                               Create result object
                               
                            ├─ sessions_send(HERMES_KEY, {
                            │   type: 'result',
                            │   payload: { task_id, output, ... }
                            │ })
                                  │
   ◄─────────────────────────────┤
   3. Receive message
      Parse JSON
      Update task status
      Send Telegram: "✅ Done"

Done. Full cycle.
```

---

## ✅ Checklist

- [ ] Hermes sesión verificada (ya existe)
- [ ] ORBIT sesión creada
- [ ] Ambas session keys registradas en MCP_SESSION_REGISTRY.json
- [ ] ORBIT listener implementado (orbit-mcp-listener.ts)
- [ ] Hermes listener implementado (hermes-mcp-listener.ts)
- [ ] Listeners iniciados en ambas sesiones
- [ ] Test 1 completado (task → execute → result)
- [ ] Test 2 completado (error handling)
- [ ] Bidireccional confirmado ✅

---

## 🎯 Próximo Paso

Cuando AMBAS sesiones estén escuchándose y el bidireccional funcione:
- **ENTONCES** agregamos Supabase para persistencia
- **ENTONCES** escalamos a 100+ tareas
- **ENTONCES** escalamos a dashboard

Por ahora: **Solo MCP. Sin Supabase. Sin polling. Push-based.**

---

**Status:** 📋 SETUP READY  
**Blocker:** José crea sesión ORBIT  
**ETA:** 1 hora setup + 30 min testing = ✅ MCP bidireccional operativo
