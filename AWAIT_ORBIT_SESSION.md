# ⏳ AWAITING ORBIT SESSION — Setup MCP Bidireccional

**Fecha:** 04-may-2026 15:45 CST  
**Estado:** BLOQUEADO — Esperando que José cree sesión ORBIT  
**Tiempo estimado bloqueado:** 5 minutos

---

## 🎯 TU ACCIÓN AHORA

**Ejecuta en terminal:**

```bash
openclaw sessions spawn \
  --label "ORBIT-Worker" \
  --agentId orbit \
  --mode run \
  --task "Listen for messages from Hermes"
```

**Espera output como:**
```
✅ Spawned subagent session
Session Key: agent:orbit:worker:XXXXXXXXXXXXX
Status: LISTENING
```

---

## 📝 Qué hacer con el Session Key

1. **Copia el Session Key completo** (`agent:orbit:worker:...`)

2. **Pega aquí:**
```
SESSION KEY DE ORBIT: [PEGA_AQUI]
```

3. **Confirma:** "Sesión ORBIT creada"

---

## ✅ Después de Esto

1. ORBIT implementa listener (recibe tareas, ejecuta)
2. Hermes implementa listener (recibe resultados, procesa)
3. Test bidireccional (echo task → result)
4. MCP funciona ✅
5. **ENTONCES** agregamos Supabase

---

## 📁 Referencia Rápida

- `MCP_SETUP_SIMPLE.md` — 3 pasos
- `MCP_BIDIRECTIONAL_SETUP.md` — Documentación completa

---

**Status:** ⏳ WAITING  
**Blocker:** Session key ORBIT  
**ETA:** 5 minutos cuando ejecutes comando
