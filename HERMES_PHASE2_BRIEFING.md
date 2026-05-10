# HERMES PHASE 2 BRIEFING — TaskManager Implementation

**Para:** Hermes (Orquestador)  
**De:** ORBIT (Ejecutor)  
**Fecha:** 04-may-2026  
**Duración estimada:** 4 horas  
**Prerequisito:** Phase 1 (Schema SQL) ✅ COMPLETADO

---

## 🎯 Tu Misión en Phase 2

**Objetivo:** Implementar el TaskManager que:
1. **Valida** tareas (formato, permisos, viabilidad)
2. **Crea** tareas en Supabase con estado `pending`
3. **Monitorea** ejecución en tiempo-real
4. **Reporta** a José vía Telegram (milestones solo)
5. **Maneja errores** sin interrumpir el flujo

---

## 📋 Scope de Phase 2

### ✅ Responsabilidades Tuyas (Hermes)

| Tarea | Descripción | Archivo |
|-------|-----------|---------|
| Task Validation | Validar campos requeridos, permisos, viabilidad | TaskValidator.ts |
| Task Creation | INSERT en agent_tasks (Supabase) | TaskManager.ts |
| Session Listener | Esperar messages de ORBIT, deserializar JSON | SessionListener.ts |
| Status Monitoring | Pool agent_events para updates | StatusMonitor.ts |
| Telegram Reporter | Enviar milestones a José | TelegramReporter.ts |

### ❌ NO es tu responsabilidad (Phase 3 de ORBIT)

- ❌ Ejecutar tareas (dequeue, ejecutar, error handling)
- ❌ Integración con handlers (terminal, git, deploy)
- ❌ Retry automático

---

## 🏗️ Arquitectura Phase 2

```
┌──────────────────────────────────────────────────────┐
│         HERMES TaskManager (Phase 2)                 │
├──────────────────────────────────────────────────────┤
│                                                      │
│  José request                                        │
│      ↓                                               │
│  ┌──────────────────────────────────────────────┐   │
│  │ TaskValidator.ts                             │   │
│  │ ├─ Validate schema                           │   │
│  │ ├─ Check permissions                         │   │
│  │ ├─ Check resource availability               │   │
│  │ └─ Return: valid ✅ or error ❌             │   │
│  └──────────────────────────────────────────────┘   │
│      │                                              │
│      ├─ If invalid: respond con error a José      │
│      │                                              │
│      ├─ If valid: continue                         │
│      ↓                                              │
│  ┌──────────────────────────────────────────────┐   │
│  │ TaskManager.ts                               │   │
│  │ ├─ Generate UUID + timestamps                │   │
│  │ ├─ Set status='pending'                      │   │
│  │ ├─ INSERT into agent_tasks (Supabase)       │   │
│  │ └─ Return: task_id                           │   │
│  └──────────────────────────────────────────────┘   │
│      ↓                                              │
│  ┌──────────────────────────────────────────────┐   │
│  │ SessionListener.ts (background)              │   │
│  │ ├─ await messages de ORBIT                   │   │
│  │ ├─ Parse JSON: {task_id, status, event}     │   │
│  │ └─ Forward a StatusMonitor                   │   │
│  └──────────────────────────────────────────────┘   │
│      ↓                                              │
│  ┌──────────────────────────────────────────────┐   │
│  │ StatusMonitor.ts (background)                │   │
│  │ ├─ Poll agent_events cada 5 segundos        │   │
│  │ ├─ Detectar cambios de status                │   │
│  │ ├─ Evaluar si es milestone                   │   │
│  │ └─ Forward a TelegramReporter si aplica      │   │
│  └──────────────────────────────────────────────┘   │
│      ↓                                              │
│  ┌──────────────────────────────────────────────┐   │
│  │ TelegramReporter.ts                          │   │
│  │ ├─ Check: es importante?                     │   │
│  │ ├─ Si sí: enviar resumen a José             │   │
│  │ └─ Si no: log solo                           │   │
│  └──────────────────────────────────────────────┘   │
│                                                      │
└──────────────────────────────────────────────────────┘
```

---

## 📂 Archivos a Implementar

### 1. `TaskValidator.ts`

**Responsabilidad:** Validar que una tarea sea legal + viable

```typescript
interface TaskValidationRequest {
  title: string;
  task_type: 'terminal_command' | 'git_operation' | 'deploy' | 'data_sync' | 'email' | 'custom';
  priority: 'critical' | 'high' | 'normal' | 'low';
  input_data: Record<string, any>;
  max_retries?: number;
}

interface ValidationResult {
  valid: boolean;
  errors?: string[];
  warnings?: string[];
}

class TaskValidator {
  validate(request: TaskValidationRequest): ValidationResult {
    // Check 1: Todos los campos requeridos están presentes
    if (!request.title || !request.task_type) {
      return { valid: false, errors: ['Missing required fields'] };
    }
    
    // Check 2: task_type es válido
    const validTypes = ['terminal_command', 'git_operation', 'deploy', 'data_sync', 'email', 'custom'];
    if (!validTypes.includes(request.task_type)) {
      return { valid: false, errors: [`Invalid task_type: ${request.task_type}`] };
    }
    
    // Check 3: Dependiendo del tipo, validar input_data
    if (request.task_type === 'terminal_command') {
      if (!request.input_data.command) {
        return { valid: false, errors: ['terminal_command requires "command" in input_data'] };
      }
    }
    
    if (request.task_type === 'git_operation') {
      if (!request.input_data.operation) {
        return { valid: false, errors: ['git_operation requires "operation" in input_data'] };
      }
    }
    
    // Check 4: Permisos (podría expandirse)
    // Por ahora: José tiene acceso a todo
    
    return { valid: true };
  }
}
```

### 2. `TaskManager.ts`

**Responsabilidad:** Crear tareas en Supabase

```typescript
class TaskManager {
  private supabase: SupabaseClient;
  
  async createTask(request: TaskValidationRequest): Promise<UUID> {
    const taskId = uuid();
    
    const { error } = await this.supabase.from('agent_tasks').insert({
      id: taskId,
      task_id: taskId,
      title: request.title,
      task_type: request.task_type,
      priority: request.priority,
      input_data: request.input_data,
      status: 'pending',
      max_retries: request.max_retries || 3,
      created_at: new Date(),
      created_by: this.hermesAgentId,
    });
    
    if (error) throw error;
    
    // Log the event
    await this.supabase.from('agent_events').insert({
      task_id: taskId,
      event_type: 'task_created',
      message: `Task created: ${request.title}`,
      agent_id: this.hermesAgentId,
    });
    
    return taskId;
  }
  
  async getTaskStatus(taskId: UUID): Promise<TaskStatus> {
    const { data, error } = await this.supabase
      .from('agent_tasks')
      .select('status, updated_at, last_error')
      .eq('id', taskId)
      .single();
    
    if (error) throw error;
    return data as TaskStatus;
  }
}
```

### 3. `SessionListener.ts`

**Responsabilidad:** Esperar mensajes de ORBIT

```typescript
interface ORBITMessage {
  type: 'task_update' | 'milestone' | 'error';
  task_id: UUID;
  status: string;
  event: AgentEvent;
  timestamp: Date;
}

class SessionListener {
  private sessionKey: string;
  private statusMonitor: StatusMonitor;
  
  async start() {
    // Este loop espera mensajes de ORBIT
    // En OpenClaw, esto podría ser:
    // - Webhook listener en un puerto
    // - Event listener en Supabase realtime
    // - Long polling a una tabla "messages"
    
    // Opción 1: Webhook (más rápido)
    this.startWebhookServer(port: 3001);
    
    // Opción 2: Supabase realtime (alternativa)
    this.subscribeToSupabaseChanges();
  }
  
  private async handleORBITMessage(message: ORBITMessage) {
    console.log(`📨 Received from ORBIT: task_id=${message.task_id}, status=${message.status}`);
    
    // Forward a StatusMonitor
    await this.statusMonitor.processStatusUpdate(message);
  }
}
```

### 4. `StatusMonitor.ts`

**Responsabilidad:** Monitorear cambios, detectar milestones

```typescript
class StatusMonitor {
  private supabase: SupabaseClient;
  private telegramReporter: TelegramReporter;
  private taskStates = new Map<UUID, string>();
  
  async startMonitoring() {
    // Poll every 5 seconds
    setInterval(() => {
      this.checkForStatusChanges();
    }, 5000);
  }
  
  private async checkForStatusChanges() {
    const { data: tasks } = await this.supabase
      .from('agent_tasks')
      .select('id, status, title')
      .in('status', ['assigned', 'in_progress', 'completed', 'failed', 'retrying']);
    
    for (const task of tasks || []) {
      const previousStatus = this.taskStates.get(task.id);
      
      if (previousStatus !== task.status) {
        // Status cambió!
        console.log(`🔄 Task ${task.id} changed: ${previousStatus} → ${task.status}`);
        this.taskStates.set(task.id, task.status);
        
        // Es milestone?
        if (this.isMilestone(task.status)) {
          await this.telegramReporter.reportMilestone(task);
        }
      }
    }
  }
  
  private isMilestone(status: string): boolean {
    // Solo enviar milestones en estos casos
    return ['completed', 'failed'].includes(status);
  }
}
```

### 5. `TelegramReporter.ts`

**Responsabilidad:** Enviar updates a José via Telegram

```typescript
class TelegramReporter {
  private telegramBotToken: string;
  private joseUserId: string = '7889292153';
  
  async reportMilestone(task: AgentTask) {
    let emoji = '✅';
    if (task.status === 'failed') emoji = '❌';
    if (task.status === 'in_progress') emoji = '⏳';
    
    const message = `
${emoji} **${task.title}**
Status: ${task.status}
Task ID: ${task.id}
Updated: ${new Date().toLocaleString()}
    `;
    
    await this.sendTelegram(joseUserId, message);
  }
  
  private async sendTelegram(userId: string, message: string) {
    // Usar himalaya o curl
    // await exec(`himalaya message send ${userId} "${message}"`);
  }
}
```

---

## 🔄 Flujo End-to-End (Phase 2)

### Escenario: José pide "Deploy ROI Calculator"

```
1. José (via Telegram): "Deploy ROI Calculator a Vercel"
   
2. Hermes recibe mensaje
   ├─ TaskValidator.validate()
   │  └─ Retorna: ✅ valid
   │
   ├─ TaskManager.createTask()
   │  ├─ Genera UUID (task_id)
   │  ├─ INSERT en agent_tasks (status='pending')
   │  ├─ Log event: 'task_created'
   │  └─ Retorna: task_id = abc123
   │
   ├─ Responde a José: "✅ Task creada. ID: abc123"
   │
   └─ StatusMonitor comienza a monitorear
      │
      ├─ (espera 10 segundos)
      │
      ├─ ORBIT dequeue ← task_id=abc123
      │
      ├─ SessionListener recibe:
      │  { type: 'task_update', status: 'assigned', ... }
      │
      ├─ StatusMonitor detecta cambio: pending → assigned
      │
      ├─ (no es milestone, no avisa)
      │
      ├─ ORBIT ejecuta deployment
      │  └─ task_progress events: "npm run build", "Uploading...", etc.
      │
      ├─ SessionListener recibe: status='in_progress'
      │
      ├─ (no es milestone)
      │
      ├─ 2 minutos después...
      │
      ├─ SessionListener recibe: status='completed'
      │
      ├─ StatusMonitor detecta: in_progress → completed ✅ MILESTONE!
      │
      └─ TelegramReporter.reportMilestone()
         └─ Telegram a José: "✅ Deploy ROI Calculator. URL: https://..."
```

---

## ✅ Checklist Phase 2

### Code
- [ ] TaskValidator.ts (validación completa)
- [ ] TaskManager.ts (create + status queries)
- [ ] SessionListener.ts (message receiver)
- [ ] StatusMonitor.ts (polling + milestone detection)
- [ ] TelegramReporter.ts (mensaje a José)

### Tests
- [ ] Unit test: TaskValidator valida correctamente
- [ ] Unit test: TaskManager inserta en Supabase
- [ ] Integration test: End-to-end (create → monitor → report)

### Documentación
- [ ] Código comentado
- [ ] README con ejemplos
- [ ] API documentation

### Deployment
- [ ] Environment variables (.env)
- [ ] Connection string Supabase
- [ ] Telegram bot token
- [ ] Listo para start()

---

## 📊 Arquitectura de Datos (Phase 2 + Phase 1)

```
Hermes                          Supabase                        ORBIT
──────────────────────────────────────────────────────────────────────
Create Task
├─ Validate
├─ INSERT agent_tasks ────┐
└─ Respond to José        │
                          ├─ agent_tasks (status=pending)
                          │
                          ├─ agent_events (task_created)
                          │                                      
                    agent_config                          Fetch pending tasks
                    ├─ Hermes (info)      ←────────────── SELECT via get_pending_tasks()
                    └─ ORBIT (info)                                │
                                                          UPDATE status='assigned'
                                                          INSERT agent_events
                                                                  │
                                                          EXECUTE task
                                                                  │
    Monitor status ◄──────── UPDATE agent_events (task_progress)
         │                           │
         ├─ Detect milestone         │
         │  (completed/failed)       │
         │                    TASK DONE
         └─ Send Telegram to José
```

---

## 🎯 Key Principles

1. **Fail Fast, Log Everything** → Si hay error, loguear y pausar, no continuar en silencio
2. **Stateless Operations** → Cada operación debería ser idempotente
3. **Single Responsibility** → Cada clase hace UNA cosa bien
4. **Testable Code** → Inyectar dependencias, mockear Supabase en tests

---

## 🚀 Próximos Steps

### Después de Phase 2
1. ORBIT comienza Phase 3 (TaskQueue executor)
2. Tú ayudas con debugging si ORBIT se traba

### Integración con ORBIT
- Acuerda formato de mensajes (JSON schema)
- Acuerda endpoint/webhook para ORBITmessages
- Test end-to-end: send task → dequeue → execute → report

---

## 💬 Comunicación

**Canal:** Esta sesión persistente (hermes-taskworker-...)  
**Próximo check-in:** Cuando completes Phase 2 (ETA 18:00 hoy)  
**Si hay bloqueos:** Avisa inmediatamente  

---

## 📝 Summary

| Aspecto | Detalle |
|--------|---------|
| **Duración** | 4 horas |
| **Archivos** | 5 TypeScript files |
| **Tablas** | Usa 3 tablas (config, tasks, events) |
| **Dependencias** | @supabase/supabase-js + himalaya (Telegram) |
| **Tests** | 3 mínimo (validate, create, integration) |
| **Deployment** | Node.js + .env config |

---

**Misión:** Implementar TaskManager que sea robusto, rápido, y sin ruido técnico.

**Éxito = José solo recibe milestones importantes en Telegram.**

Go! 🚀
