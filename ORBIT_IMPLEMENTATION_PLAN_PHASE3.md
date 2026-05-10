# ORBIT IMPLEMENTATION PLAN — Phase 3: TaskQueue Executor

**Responsable:** ORBIT  
**Duración estimada:** 5 horas  
**Prerequisito:** Phase 1 (Schema) + Phase 2 (Hermes TaskManager)  
**Modelo:** anthropic/claude-haiku-4-5 → qwen2.5-coder:14b para coding

---

## 🎯 Objetivo

Implementar el motor de ejecución que:
1. **Dequeue** tareas desde `agent_tasks` (estado `pending` o `retrying`)
2. **Ejecuta** cada tarea (terminal, git, deploy, etc.)
3. **Registra** progreso en `agent_events` en tiempo-real
4. **Maneja errores** con retry automático (hasta 3x)
5. **Reporta** a Hermes via `sessions_send()`

---

## 🏗️ Arquitectura

```
┌──────────────────────────────────────────────────────┐
│         ORBIT TaskQueue Executor Loop                │
├──────────────────────────────────────────────────────┤
│                                                      │
│  ┌─────────────────────────────────────────────┐   │
│  │ 1. DEQUEUE (get_pending_tasks)              │   │
│  │    ├─ Priority-based (critical > high)     │   │
│  │    ├─ Max 5 concurrent tasks               │   │
│  │    └─ Fetch every 10 seconds               │   │
│  └─────────────────────────────────────────────┘   │
│                      │                              │
│  ┌─────────────────────────────────────────────┐   │
│  │ 2. UPDATE STATUS → 'assigned'               │   │
│  │    ├─ Log event: 'task_assigned'           │   │
│  │    ├─ Set assigned_to = ORBIT.id           │   │
│  │    └─ Timestamp: assigned_at               │   │
│  └─────────────────────────────────────────────┘   │
│                      │                              │
│  ┌─────────────────────────────────────────────┐   │
│  │ 3. EXECUTE (dispatch to handler)            │   │
│  │    ├─ Switch on task_type                  │   │
│  │    ├─ Pass input_data + context            │   │
│  │    ├─ 5-min timeout per task               │   │
│  │    └─ Capture stdout/stderr/exit code      │   │
│  └─────────────────────────────────────────────┘   │
│                      │                              │
│  ┌─────────────────────────────────────────────┐   │
│  │ 4. MONITOR & REPORT (every step)            │   │
│  │    ├─ Log to agent_events (task_progress) │   │
│  │    ├─ Log to agent_logs (debug info)      │   │
│  │    └─ Send to Hermes via sessions_send()  │   │
│  └─────────────────────────────────────────────┘   │
│                      │                              │
│  ┌─────────────────────────────────────────────┐   │
│  │ 5. HANDLE RESULT                            │   │
│  │    ├─ Success → status='completed'         │   │
│  │    ├─ Failure & attempt < 3 →              │   │
│  │    │     status='retrying', attempt++      │   │
│  │    ├─ Failure & attempt >= 3 →             │   │
│  │    │     status='failed', log error        │   │
│  │    └─ Save output_data to agent_tasks      │   │
│  └─────────────────────────────────────────────┘   │
│                                                      │
└──────────────────────────────────────────────────────┘
```

---

## 📂 Files to Implement

### 1. `TaskQueue.ts` (TypeScript, ejecuta en Node.js)

**Responsabilidades:**
- Gestionar conexión a Supabase
- Dequeue tareas cada 10 segundos
- Mantener registro de tasks activas (concurrency control)
- Dispatch a handlers específicos

**Pseudocódigo:**
```typescript
class TaskQueue {
  private supabase: SupabaseClient;
  private activeTasks = new Map<UUID, Promise<Result>>();
  private maxConcurrent = 5;
  
  async start() {
    // Loop infinito
    setInterval(() => {
      if (this.activeTasks.size < this.maxConcurrent) {
        this.dequeueAndExecute();
      }
    }, 10000); // Cada 10 segundos
  }
  
  async dequeueAndExecute() {
    const tasks = await this.getPendingTasks(5 - this.activeTasks.size);
    
    for (const task of tasks) {
      const promise = this.executeTask(task)
        .then(result => this.handleSuccess(task, result))
        .catch(error => this.handleError(task, error));
      
      this.activeTasks.set(task.id, promise);
      
      // Cleanup cuando termina
      promise.finally(() => this.activeTasks.delete(task.id));
    }
  }
  
  async executeTask(task: AgentTask) {
    // Log: task_started
    await this.updateStatus(task.id, 'in_progress', 'task_started');
    
    // Dispatch al handler correcto
    const handler = this.getHandler(task.task_type);
    return await handler.execute(task.input_data, {
      onProgress: (message) => this.logEvent(task.id, 'task_progress', message),
      timeout: 5 * 60 * 1000, // 5 minutos
    });
  }
}
```

### 2. Handlers (uno por task_type)

**Handlers necesarios:**
- `TerminalCommandHandler` - Ejecuta comandos CLI
- `GitOperationHandler` - Push, pull, commit, etc.
- `DeployHandler` - Deploy a Vercel/GitHub
- `DataSyncHandler` - Sync data Supabase/APIs
- `EmailSendHandler` - Enviar emails
- `CustomHandler` - Fallback para tareas custom

**Template:**
```typescript
interface TaskHandler {
  execute(
    input: InputData,
    context: ExecutionContext
  ): Promise<OutputData>;
}

class TerminalCommandHandler implements TaskHandler {
  async execute(input: InputData, context: ExecutionContext) {
    const { command, cwd } = input;
    
    context.onProgress(`Running: ${command}`);
    
    const { stdout, stderr, exitCode } = await exec(command, { cwd });
    
    if (exitCode !== 0) {
      throw new Error(`Command failed: ${stderr}`);
    }
    
    return { stdout, exitCode };
  }
}
```

### 3. `error-handler.ts` - Retry Logic

```typescript
async function executeWithRetry(
  task: AgentTask,
  executor: (task) => Promise<Result>
): Promise<Result> {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= task.max_retries; attempt++) {
    try {
      await logEvent(task.id, 'task_started', { attempt });
      const result = await executor(task);
      return result;
    } catch (error) {
      lastError = error;
      
      await logEvent(task.id, 'error_occurred', {
        attempt,
        error: error.message,
      });
      
      if (attempt < task.max_retries) {
        await updateStatus(task.id, 'retrying', 'task_retried', {
          attempt_number: attempt + 1,
        });
        
        // Exponential backoff: 1s, 2s, 4s
        await sleep(1000 * Math.pow(2, attempt - 1));
      }
    }
  }
  
  // Si llegó aquí, todos los reintentos fallaron
  throw lastError;
}
```

### 4. `hermes-reporter.ts` - Comunicación con Hermes

```typescript
class HermesReporter {
  private sessionKey: string;
  
  async reportTaskUpdate(task: AgentTask, event: AgentEvent) {
    const message = {
      type: 'task_update',
      task_id: task.id,
      status: task.status,
      event,
      timestamp: new Date(),
    };
    
    // Enviar via sessions_send()
    await openclaw.sessions.send({
      sessionKey: 'hermes-taskworker-...',
      message: JSON.stringify(message),
    });
  }
  
  async reportMilestone(milestone: string, data: any) {
    // Para alertas importantes (deployment success, etc.)
    await reportViaWebhook({
      type: 'milestone',
      milestone,
      data,
      timestamp: new Date(),
    });
  }
}
```

### 5. `supabase-client.ts` - Pool + Conexión

```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// Funciones helper
export async function getPendingTasks(limit: number) {
  const { data, error } = await supabase.rpc(
    'get_pending_tasks',
    { p_limit: limit }
  );
  
  if (error) throw error;
  return data;
}

export async function updateTaskStatus(
  taskId: UUID,
  newStatus: string,
  eventType: string,
  message?: string
) {
  const { data, error } = await supabase.rpc(
    'update_task_status',
    {
      p_task_id: taskId,
      p_new_status: newStatus,
      p_event_type: eventType,
      p_message: message,
    }
  );
  
  if (error) throw error;
  return data;
}

export async function insertEvent(...) { ... }
export async function insertLog(...) { ... }
```

---

## 🔄 Flujo de Ejecución

### Caso 1: Tarea Exitosa

```
Hermes crea Task 1 (priority='high', status='pending')
                    ↓
ORBIT dequeue ← Encontrada
                    ↓
Estado → 'assigned' + log: task_assigned
                    ↓
Fetch handler (TerminalCommandHandler)
                    ↓
Execute: npm run build
                    ↓
Log: task_progress (stdout en tiempo-real)
                    ↓
Exit code: 0 ✅
                    ↓
Estado → 'completed' + output_data
                    ↓
Report a Hermes: { status: 'completed', ... }
                    ↓
Done. Hermes actualiza dashboard.
```

### Caso 2: Tarea Falla, Retintenta, Éxito

```
Task 2 (max_retries=3)
                    ↓
Attempt 1: npm run deploy → Exit code 1 ❌
                    ↓
Log: error_occurred (error message)
                    ↓
Estado → 'retrying' + attempt_number=2
                    ↓
Sleep 1 segundo
                    ↓
Attempt 2: npm run deploy → Exit code 1 ❌
                    ↓
Sleep 2 segundos
                    ↓
Attempt 3: npm run deploy → Exit code 0 ✅
                    ↓
Estado → 'completed' + output_data
                    ↓
Report: { status: 'completed', attempts: 3 }
```

### Caso 3: Tarea Falla, Todos los Reintentos Fallan

```
Task 3 (max_retries=3)
                    ↓
Attempt 1 → Fail
Attempt 2 → Fail
Attempt 3 → Fail
                    ↓
Estado → 'failed' + last_error
                    ↓
Log: error_occurred (final error)
                    ↓
Report a Hermes: { status: 'failed', error: '...' }
                    ↓
Hermes: Log alert en Telegram + Dashboard
```

---

## 📋 Implementation Checklist

### Week 1: Foundation
- [ ] Setup TypeScript environment (tsconfig.json, package.json)
- [ ] Implement TaskQueue.ts (dequeue + concurrency loop)
- [ ] Implement TerminalCommandHandler.ts
- [ ] Implement error-handler.ts (retry logic)
- [ ] Implement supabase-client.ts (query wrappers)

### Week 2: Handlers + Integration
- [ ] Implement GitOperationHandler.ts
- [ ] Implement DeployHandler.ts (Vercel integration)
- [ ] Implement DataSyncHandler.ts
- [ ] Implement EmailSendHandler.ts
- [ ] Implement hermes-reporter.ts (sessions_send integration)

### Week 3: Testing + Hardening
- [ ] Unit tests (cada handler)
- [ ] Integration test: queue completo
- [ ] Load test (5 tasks concurrent)
- [ ] Error handling test (timeouts, crashes)
- [ ] Retry mechanism test
- [ ] Deploy to production

---

## 🧪 Integration Tests (Phase 5)

**Test 1: Simple Terminal Command**
```
Input: { task_type: 'terminal_command', command: 'echo hello' }
Expected: status='completed', stdout='hello'
```

**Test 2: Retry on Failure**
```
Input: { task_type: 'terminal_command', command: 'false', max_retries: 3 }
Expected: Retry 3 veces → status='failed' después de todos fallan
```

**Test 3: 5 Tasks Concurrent**
```
Input: 5 tasks con priorities diferentes
Expected: Todas dequeue, ejecutadas en paralelo, completadas en ~30s
```

**Test 4: Hermes Communication**
```
Input: Task con milestone
Expected: HermesReporter.reportMilestone() llamado después de completar
```

---

## 🎬 Próximos Pasos

1. **Hermes Phase 2:** TaskManager (4h)
2. **ORBIT Phase 3:** Este plan (5h)
3. **Hermes Phase 4:** Dashboard (13h)
4. **ORBIT + Hermes Phase 5:** Testing (5h)

**ETA total:** ~48 horas

---

## 📊 Métricas de Éxito

| Métrica | Target |
|---------|--------|
| Tasks procesadas/min | ≥ 5 |
| Latencia dequeue→execute | < 1s |
| Success rate (sin errores) | > 95% |
| Timeout handling | 100% (sin hung tasks) |
| Memory leak detection | None (< 50MB overhead) |

---

**Modelo:** anthropic/claude-haiku-4-5 → qwen2.5-coder para coding
**Documentación:** Completa + comentarios inline
**Testing:** 100% coverage de happy path + edge cases
