# 🪐 ORBIT IMPLEMENTATION PLAN — Phase 2-3

**Responsable:** ORBIT (yo)  
**Status:** Ready to implement  
**Bloqueador:** Phase 1 SQL deployment (Hermes)  
**ETA:** Comienza cuando Hermes confirme "Phase 1 ✅"

---

## 🎯 MI ROL EN ESTE PLAN

```
HERMES (Cerebro)          ORBIT (Ejecutor)
───────────────────────────────────────
Delegación de tareas  →   Recibe evento DELEGATE_TASK
                     ←    Reporta progreso cada 5s
                     ←    Completa tarea con costos
```

---

## 🏗️ PHASE 2: HERMES TASKMANAGER (Hermes hace esto)

**Duración:** 4 horas  
**Costo:** $0.30

Hermes implementará:
```typescript
class TaskManager {
  delegateTaskToOrbit(goal: string, context: string) {
    // 1. Crea tarea en Supabase
    const task = await supabase
      .from('tasks')
      .insert({ goal, context, status: 'QUEUED', ... })
    
    // 2. Emite evento WebSocket
    ws.emit('DELEGATE_TASK', { taskId, goal, ... })
    
    // 3. Subscribe a updates
    this.subscribeToUpdates(taskId)
  }
  
  subscribeToUpdates(taskId: string) {
    // Escucha TASK_STATUS_UPDATE
    supabase
      .from('task_events')
      .on('INSERT', (payload) => {
        if (payload.new.task_id === taskId) {
          this.handleUpdate(payload.new)
        }
      })
      .subscribe()
  }
}
```

---

## 🚀 PHASE 3: ORBIT IMPLEMENTATION (Mi parte — **YO HAGO ESTO**)

**Duración:** 5 horas  
**Costo:** $0.40  
**Dependencia:** Phase 1 ✅ + Phase 2 ✅

### Qué voy a implementar:

```typescript
// 1. TaskQueue class
class TaskQueue {
  private tasks: Map<string, Task> = new Map()
  private isExecuting = false
  
  async start() {
    while (true) {
      const task = await this.dequeue() // Get from Supabase
      if (task) {
        await this.executeTask(task)
      }
      await sleep(100) // Poll every 100ms
    }
  }
}

// 2. Execute task
async executeTask(task: Task) {
  // UPDATE status = EXECUTING
  // Run the task (code, deploy, subagents, etc)
  // Report progress every 5s
  // UPDATE status = COMPLETED
  // Emit EXECUTION_COMPLETE
}

// 3. Progress reporting
async reportProgress(taskId: string, progress: number, cost: number) {
  // INSERT task_events (progress update)
  // Keep Hermes updated in real-time
}

// 4. Error handling
async handleError(taskId: string, error: Error) {
  // Retry logic (if retry_count < max)
  // Or mark as FAILED
  // Notify Hermes
}
```

---

## 📋 IMPLEMENTATION CHECKLIST (Phase 3)

### Step 1: Create TaskQueue Service
```
□ Create /src/services/TaskQueue.ts
□ Implement dequeue() from Supabase
□ Implement executeTask() wrapper
□ Connect to existing task execution logic
□ Add error handling + retry logic
```

### Step 2: Event Handling
```
□ Subscribe to 'DELEGATE_TASK' events
□ Listen for capacity updates
□ Handle ORBIT overload (queue full)
□ Implement backpressure mechanism
```

### Step 3: Progress Tracking
```
□ Create reportProgress() function
□ Insert task_events every 5s
□ Track tokens used
□ Track actual_cost incrementally
□ Update progress_percent
```

### Step 4: WebSocket Integration
```
□ Listen for DELEGATE_TASK from Hermes
□ Emit TASK_STATUS_UPDATE (progress)
□ Emit EXECUTION_COMPLETE (final)
□ Handle reconnection gracefully
```

### Step 5: Subagent Delegation
```
□ When task requires subagent → delegate via ORBIT
□ Wait for subagent response
□ Aggregate costs (ORBIT + subagent)
□ Report combined result to Hermes
```

### Step 6: Database Integration
```
□ Query tasks table (QUEUED status)
□ Update tasks table (status transitions)
□ Insert task_events (audit trail)
□ Query agent_capacity (check limits)
```

### Step 7: Testing
```
□ Test dequeue (simulate Hermes delegation)
□ Test executeTask (run a real task)
□ Test progress reporting (verify events)
□ Test error handling (simulate failures)
□ Test timeout handling (5 min limit)
```

---

## 🔄 IMPLEMENTATION SEQUENCE

```
1. Create TaskQueue class skeleton
   └─ dequeue(), executeTask(), reportProgress()

2. Connect to Supabase
   └─ Query 'tasks' table
   └─ Insert 'task_events'
   └─ Subscribe to updates

3. Implement executeTask() loop
   └─ Mark as EXECUTING
   └─ Run task (re-use existing logic)
   └─ Catch errors
   └─ Mark as COMPLETED/FAILED

4. Add progress reporting
   └─ Every 5 seconds: INSERT task_events
   └─ Update actual_cost
   └─ Update progress_percent

5. Add WebSocket events
   └─ Emit TASK_STATUS_UPDATE
   └─ Emit EXECUTION_COMPLETE

6. Test end-to-end
   └─ Hermes delegates → ORBIT executes → Hermes receives update
```

---

## 📊 SUCCESS CRITERIA

```
✅ When a task is delegated:
   □ ORBIT receives event within 100ms
   □ Task status changes to EXECUTING
   □ Progress reported every 5s
   □ Final cost and result sent back
   
✅ When task completes:
   □ Hermes notified within 100ms
   □ 3D floor updates (new animation)
   □ Cost aggregated correctly
   □ Audit trail in task_events
   
✅ When error occurs:
   □ Automatic retry (if applicable)
   □ Fallback handling
   □ Hermes notified of failure
   □ No data loss
```

---

## 🎯 MY TIMELINE

**Today (May 2):**
- [ ] Hermes confirms Phase 1 deployment ✅
- [ ] I create TaskQueue skeleton
- [ ] Test Supabase connection

**Tomorrow (May 3):**
- [ ] Implement dequeue() + executeTask()
- [ ] Add progress reporting
- [ ] Test local execution

**Day 3-4:**
- [ ] WebSocket integration
- [ ] End-to-end test with Hermes
- [ ] Error handling + retry logic

**Day 5:**
- [ ] Performance testing (multiple concurrent tasks)
- [ ] Code review + cleanup
- [ ] Ready for Phase 4 (Dashboard integration)

---

## 💻 CODE STRUCTURE

```
src/
├─ services/
│  ├─ TaskQueue.ts ............... Main queue handler
│  ├─ TaskExecutor.ts ............ Execution logic
│  └─ TaskReporter.ts ............ Progress reporting
│
├─ types/
│  ├─ Task.ts .................... Task interface
│  └─ TaskEvent.ts ............... Event types
│
└─ utils/
   └─ supabaseClient.ts .......... Supabase connection
```

---

## 🔗 DEPENDENCIES

**From Phase 1 (Hermes):**
- ✅ Database schema (`tasks`, `task_events`, `agent_capacity`)
- ✅ Realtime subscriptions enabled

**From Phase 2 (Hermes):**
- ✅ TaskManager class emitting DELEGATE_TASK
- ✅ WebSocket server ready

**From existing codebase:**
- ✅ Task execution logic (Git, Vercel, etc.)
- ✅ Subagent delegation mechanism
- ✅ Error handling utilities

---

## 📈 ESTIMATED METRICS

**After Phase 3:**

| Metric | Before | After |
|--------|--------|-------|
| Task dequeue time | Manual | <2 seconds |
| Progress visibility | Telegram | Real-time (WebSocket) |
| Concurrent tasks | 1 | 5+ |
| Throughput | 1/min | 3+/min |
| Communication latency | 30s | <100ms |
| Cost tracking | Manual | Automatic |

---

## 🚨 RISK MITIGATION

**Risk:** Database overload (too many inserts)  
**Mitigation:** Batch task_events inserts every 5s instead of per-event

**Risk:** WebSocket disconnection mid-task  
**Mitigation:** Supabase polling fallback (every 5s)

**Risk:** Task timeout (stuck execution)  
**Mitigation:** Hard kill after 5 min, mark TIMEOUT, retry or escalate

**Risk:** Cost explosion (task uses too many tokens)  
**Mitigation:** Track incremental cost, alert if over budget, can terminate

---

## ✅ READINESS CHECK

- [x] Understand Hermes' plan
- [x] Know my role (Phase 2-3)
- [x] Have Supabase schema (Phase 1)
- [x] Have TaskManager class (Phase 2)
- [ ] **WAITING:** Hermes Phase 1 ✅
- [ ] **WAITING:** Hermes Phase 2 ✅

Once both are done → **I start Phase 3 immediately**

---

## 📞 COMMUNICATION

**With Hermes:**
- If task delegation fails → Hermes is notified automatically (task_events INSERT)
- If ORBIT is full → Hermes waits or gets alert
- Status updates every 5s via task_events table + WebSocket

**With José (if needed):**
- Telegram alert if task > 5 min (timeout)
- Telegram alert if cost > budget
- Daily summary in MEMORY.md

---

## 🎬 NEXT STEP

**Waiting for:**
1. Hermes completes Phase 1 deployment ✅
2. José confirms 5 decisions ✅ (DONE)
3. Hermes starts Phase 2 (TaskManager)

**Then:** I begin Phase 3 immediately.

---

**Status:** Ready to go. Waiting on Hermes. 🚀

**Created:** 2026-05-02  
**Updated:** When Hermes finishes Phase 1
