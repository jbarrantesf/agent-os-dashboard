# 🚀 IMPLEMENTATION START — MCP Bidireccional

**Estado:** ✅ Session keys listos. Listeners implementados. Ready to test.

---

## 📁 Files Ready

### Code
- ✅ `orbit-listener.ts` — ORBIT recibe tareas, ejecuta, reporta
- ✅ `hermes-listener.ts` — Hermes recibe resultados, procesa
- ✅ `test-mcp-bidireccional.sh` — Test automático

### Config
- 📝 `MCP_SESSION_REGISTRY.json` (create with session keys):
  ```json
  {
    "hermes_session_key": "hermes-taskworker-e122e1c7-4f7f-4d87-bbc9-ad6997b7a6dd",
    "orbit_session_key": "agent:orbit:explicit:ORBIT-Worker"
  }
  ```

---

## 🎯 Arquitectura

```
HERMES Session A                    ORBIT Session B
(escucha tareas)           ↔        (ejecuta + reporta)
     │                                   │
     ├─ User: "Deploy app"              │
     │                                  │
     ├─ hermes-listener.ts              │
     │  ├─ Validate                     │
     │  ├─ Create message               │
     │  └─ sessions_send(B, task) ────► orbit-listener.ts
     │                                  ├─ Parse JSON
     │                                  ├─ exec(command)
     │                                  ├─ Create result
     │                                  └─ sessions_send(A, result)
     │                                  │
     ◄─────────────────────────────────┤
     │
     ├─ hermes-listener.ts
     │  ├─ Parse result
     │  ├─ Update status
     │  └─ Telegram: "✅ Done"

Zero Supabase (por ahora)
Zero polling (push-based)
Directo y sincrónico
```

---

## 🧪 Quick Test

```bash
# Run test script
bash test-mcp-bidireccional.sh
```

Expected output:
```
TEST 1: Simple Echo Task
✅ ORBIT returns result

TEST 2: Error Handling
❌ ORBIT returns error

✅ BIDIRECCIONAL TEST PASSED
```

---

## 🔌 Integration with Real Sessions

Once test passes, integrate with actual OpenClaw sessions:

### In ORBIT Session:
```bash
# Import listener
import orbitListener from './orbit-listener';

# Start listening
await orbitListener.startListening();
```

### In Hermes Session:
```bash
# Import listener
import { hermesListener } from './hermes-listener';

# Start listening
await hermesListener.startListening();

# Send a task
await hermesListener.sendTaskToORBIT({
  task_id: 'deploy-roi-calc',
  title: 'Deploy ROI Calculator',
  command: 'npm run deploy',
});
```

---

## 📊 Message Format

### Task Message (Hermes → ORBIT)
```json
{
  "id": "task-deploy-1",
  "from": "hermes",
  "type": "task",
  "payload": {
    "task_id": "deploy-1",
    "title": "Deploy ROI Calculator",
    "command": "npm run deploy",
    "timeout_ms": 300000
  },
  "timestamp": "2026-05-04T15:50:00Z"
}
```

### Result Message (ORBIT → Hermes)
```json
{
  "id": "result-deploy-1",
  "from": "orbit",
  "type": "result",
  "payload": {
    "task_id": "deploy-1",
    "status": "completed",
    "output": "Deploying to Vercel...\n✅ Deployment successful",
    "exit_code": 0
  },
  "timestamp": "2026-05-04T15:52:00Z"
}
```

### Error Message (ORBIT → Hermes)
```json
{
  "id": "error-deploy-1",
  "from": "orbit",
  "type": "error",
  "payload": {
    "task_id": "deploy-1",
    "status": "failed",
    "error": "npm run deploy failed: exit code 1"
  },
  "timestamp": "2026-05-04T15:52:30Z"
}
```

---

## ✅ Checklist

- [x] Hermes session exists
- [x] ORBIT session exists
- [x] ORBIT listener implemented
- [x] Hermes listener implemented
- [x] Test script created
- [ ] Run test-mcp-bidireccional.sh
- [ ] Test passes (echo + error handling)
- [ ] Integrate with real sessions
- [ ] Manual test: send real task
- [ ] MCP bidireccional confirmed ✅

---

## 🚀 Next Phase (After MCP Works)

1. ✅ MCP bidireccional operational
2. → Add Supabase `agent_messages` table (persistence)
3. → Add polling fallback (reliability)
4. → Add dashboard (visualization)
5. → Go-live

For now: **MCP only. Pure push-based communication.**

---

## 📞 Troubleshooting

**Messages not being received:**
- Check session keys in MCP_SESSION_REGISTRY.json
- Verify both listeners are running
- Check console for [MESSAGE_TO_HERMES] / [MESSAGE_TO_ORBIT] markers

**JSON parsing errors:**
- Ensure message format matches spec above
- Check for special characters in command
- Validate timestamp ISO 8601 format

**Timeout issues:**
- Increase timeout_ms in task payload
- Check if command is actually running (e.g., ps aux)
- Add debugging console.log in listeners

---

**Status:** ✅ READY TO IMPLEMENT  
**Files:** 3 TypeScript files + 1 test script  
**ETA:** 30 minutes integration + testing

🔥 **Let's go bidireccional!**
