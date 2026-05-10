# 🚀 START HERE — Real MCP Integration Test

**Choose:** Option A — Run real listeners test  
**Ready to:** Execute now  
**Estimated time:** 5 minutes

---

## 3️⃣ OPEN 3 TERMINALS

### Terminal 1️⃣ — ORBIT Listener
```bash
cd /Users/nextaisolutionscr/.openclaw/workspace
node orbit-listener.ts
```

### Terminal 2️⃣ — Hermes Listener  
```bash
cd /Users/nextaisolutionscr/.openclaw/workspace
node hermes-listener.ts
```

### Terminal 3️⃣ — Send Tests
```bash
cd /Users/nextaisolutionscr/.openclaw/workspace
bash run-real-test.sh commands
```

**Execute all 3 at the same time** (don't wait for one to finish)

---

## ✅ WHAT TO EXPECT

### Terminal 1 (ORBIT) will show:
- Listener starting message
- 4 task received notifications
- 4 execution logs
- 4 result sent notifications

### Terminal 2 (Hermes) will show:
- Listener starting message
- 4 result received notifications
- 4 "Task completed" messages
- 4 fake Telegram alerts

### Terminal 3 will show:
- "Test commands sent!"
- Done

---

## 🎯 TESTS THAT WILL RUN

| # | Command | Expected | Type |
|---|---------|----------|------|
| 1 | `echo 'Hello from real test'` | Output | Happy path |
| 2 | `pwd` | Directory path | Info |
| 3 | `ls -la *.ts \| head -5` | File list | Complex |
| 4 | `false` | Error + exit 1 | Error path |

---

## 🏁 SUCCESS = All 4 Tests Complete Without Errors

**Terminal 1 shows 4 executions**  
**Terminal 2 shows 4 results**  
**Terminal 3 says "Test commands sent!"**

If yes → ✅ **MCP INTEGRATION CONFIRMED**

---

## 📝 Next Step After Success

Reply: **"All 4 tests passed"**

Then choose:
- **B** — Add Supabase (persistence)
- **C** — Build Dashboard (UI)
- **D** — Go Production

---

**Go!** 🚀
