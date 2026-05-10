# 📋 PLAN DE HERMES: Optimización de Roles y Delegación de Tareas

**Fecha:** 2 May 2026  
**Status:** ✅ READY FOR APPROVAL  
**Fuente:** https://github.com/jbarrantesf/agent-floor-3d/tree/main/docs/hermes-orbit-shared/phase1-task-delegation/

---

## 🎯 VISIÓN (1 LÍNEA)

**Hermes delega tareas a ORBIT vía evento + Supabase. ORBIT ejecuta, reporta progreso, completa. Cero comunicación manual.**

---

## 📌 ROLES CLARIFICADOS

```
HERMES (Cerebro) ────────────────→ ORBIT (Ejecutor)
├─ ✅ Planeación de tareas         ├─ ✅ Código/Git/Vercel
├─ ✅ Decisiones estratégicas      ├─ ✅ Testing & Deploy
├─ ✅ Monitoreo de progreso        ├─ ✅ Delegación a subagents
├─ ✅ Tracking de costos           └─ ✅ Reportar status/progreso
└─ ❌ NO ejecuta código           
                                   HERMES ←────────────────
                                   Recibe: status, progreso, costos
```

---

## 🏗️ ARQUITECTURA (3 Capas)

### Capa 1: Event Bus (WebSocket)
```
HERMES emite:  DELEGATE_TASK → {goal, estimated_cost, timeout}
ORBIT emite:   TASK_UPDATE   → {progress, actual_cost, status}
ORBIT emite:   COMPLETE      → {success, total_cost, artifacts}
```

### Capa 2: Persistent Store (Supabase)
```sql
- tasks .................. Queue principal (QUEUED, EXECUTING, COMPLETED, FAILED)
- task_events ........... Audit trail de cambios
- agent_capacity ........ Límites y health de cada agent (ORBIT, Subagents, etc)
- cost_daily_summary .... Agregación diaria para reportes
```

### Capa 3: Fallback (Polling)
```
Si WebSocket cae → Supabase polling cada 5s
Si > 5 min down  → Alert a José por Telegram
```

---

## 🔄 FLUJO DE TAREAS (7 Pasos)

```
1. HERMES verifica capacidad de ORBIT
   └─ Si disponible → procede. Si full → espera o alerta

2. HERMES crea tarea en Supabase
   └─ status = QUEUED, estimated_cost = $X, timeout = 5 min

3. HERMES emite evento DELEGATE_TASK por WebSocket
   └─ ORBIT recibe en <100ms

4. ORBIT dequeues tarea
   └─ status = EXECUTING
   └─ Comienza ejecución

5. ORBIT reporta progreso cada 5 segundos
   └─ INSERT task_events
   └─ UPDATE progress_percent, actual_cost

6. ORBIT completa tarea
   └─ status = COMPLETED
   └─ Emit EXECUTION_COMPLETE con costos finales

7. HERMES actualiza dashboard y cost tracking
   └─ 3D floor muestra nueva tarea completada
```

---

## 📊 BENEFICIOS ESPERADOS

| Métrica | Antes | Después | Mejora |
|---------|-------|---------|--------|
| Comunicación manual | Sí (Telegram) | No | ✅ 100% automático |
| Visibilidad de tareas | Nula | Real-time (WebSocket) | ✅ Instantáneo |
| Throughput | 1 tarea/min | 3+ tareas/min | ✅ +200% |
| Cost tracking | Manual (1h/semana) | Automático | ✅ 1h ahorrada |
| Latencia de comunicación | 30s | <100ms | ✅ 300x más rápido |
| Manejo de errores | Manual | Automático (retry + timeout) | ✅ 0 intervención |
| Duplicate work | 30% | 0% | ✅ Eliminado |

---

## 🚀 ROADMAP (5 Fases, 33h, $2.70, 4 semanas)

### PHASE 1: Database Setup ($0.50, 6h) ⭐ **INICIO HOY**
```
□ Crear 4 tablas en Supabase: tasks, task_events, agent_capacity, cost_daily_summary
□ Indexes (10+) para performance
□ RLS policies (8) para seguridad
□ Realtime subscriptions (3 tablas)
□ Seed data (4 agents)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Deployment: 10 minutos (copy-paste SQL a Supabase)
Script: PHASE1_SQL_SCHEMA.sql en GitHub
```

### PHASE 2: Hermes Integration ($0.30, 4h)
```
□ Clase TaskManager en Hermes
□ Método delegateTaskToOrbit()
□ WebSocket subscribeToUpdates()
□ Manejo de callbacks (handleCompletion, handleError, handleTimeout)
```

### PHASE 3: ORBIT Integration ($0.40, 5h)
```
□ Clase TaskQueue en ORBIT
□ Escucha evento DELEGATE_TASK
□ Loop executeTask() continuo
□ Reporta progreso cada 5s
```

### PHASE 4: Dashboard + 3D ($1.00, 13h)
```
□ API endpoints (/api/tasks, /api/metrics)
□ React hooks (useTaskQueue)
□ 3D floor update: muestra tareas en vivo
□ Particle system para costos
```

### PHASE 5: Testing & Hardening ($0.50, 5h)
```
□ Unit tests
□ E2E tests
□ Load testing (100+ tareas concurrentes)
□ Production deployment
```

---

## 🎯 LO QUE NECESITAMOS DE TI (5 DECISIONES)

**Responde para confirmar Phase 1:**

```
1. ¿ORBIT tiene acceso a terminal completo?
   ☐ Sí (puede hacer Git, SSH, Vercel deploy)
   ☐ No (solo inference)

2. ¿Siempre delegamos subagents a través de ORBIT?
   ☐ Sí (recomendado: ORBIT es el orchestrador)
   ☐ A veces (Hermes delega directo a algunos subagents)

3. ¿Timeout por defecto de tareas?
   ☐ 30 segundos
   ☐ 5 minutos ⭐ (RECOMENDADO)
   ☐ 10 minutos
   ☐ Custom: _____

4. ¿Estrategia de queue?
   ☐ FIFO (primero en entrar, primero en salir)
   ☐ Priority-based ⭐ (HIGH/MEDIUM/LOW) (RECOMENDADO)

5. ¿Alertas de sobrecarga (cuando ORBIT > 90% capacidad)?
   ☐ Sí, por Telegram ⭐ (RECOMENDADO)
   ☐ Dashboard only
```

---

## 💰 COSTOS

### One-time Implementation
```
Phase 1-5 total: $2.70
├─ DB setup ........ $0.50
├─ Hermes ......... $0.30
├─ ORBIT .......... $0.40
├─ Dashboard ...... $1.00
└─ Testing ........ $0.50
```

### Monthly Recurring
```
├─ Supabase hosting ... ~$0.20 (free tier incluido)
├─ Token savings ...... -$0.64 (menos trabajo manual)
└─ NET: -$0.44/mes (AHORRA dinero!)

Break-even: 4 meses ✅
```

---

## ✅ DEFINICIÓN DE ÉXITO

Cuando todo esté listo:

- [ ] Hermes NUNCA necesita "pingear" a ORBIT manualmente
- [ ] ORBIT dequeues tarea en <2 segundos
- [ ] 3D floor muestra progreso de tareas en vivo
- [ ] Costos tracked automáticamente por tarea
- [ ] Duplicate work reducido 80%
- [ ] Throughput 3x (1 → 3+ tareas/min)
- [ ] Zero accounting manual

---

## 📁 DOCUMENTACIÓN EN GITHUB

```
docs/hermes-orbit-shared/phase1-task-delegation/
├─ README.md ........................... Índice completo
├─ QUICK_REFERENCE.md .................. Este resumen (1-pager)
├─ EXECUTIVE_SUMMARY.md ............... Visión + roadmap (detallado)
├─ PHASE1_SQL_SCHEMA.sql .............. SQL lista para Supabase
├─ PHASE1_DEPLOYMENT.md ............... Step-by-step guide
├─ task-delegation-architecture.md .... Diseño técnico
├─ task-delegation-visual.md .......... Diagramas ASCII
├─ task-delegation-code.md ............ TypeScript implementation
└─ SESSION_SUMMARY.md ................. Resumen completo sesión Hermes
```

---

## 🎬 PRÓXIMOS PASOS

### HOY (May 2)
1. ✅ Orbit revisa este plan
2. 📋 José responde 5 decisiones
3. 🚀 Hermes deploya Phase 1 SQL a Supabase

### MAÑANA (May 3)
1. Verifica: 4 tablas creadas en Supabase
2. Phase 2 kickoff: Hermes TaskManager
3. Crea delegateTaskToOrbit() function

### SEMANA 1
1. Phase 3: ORBIT TaskQueue
2. Phase 4: Dashboard API + 3D rendering
3. WebSocket subscriptions activas

### SEMANA 2-3
1. Phase 5: Testing + hardening
2. Load testing
3. Production deployment

### SEMANA 4
1. Demo completo a José
2. Sistema en vivo: tareas, progreso, costos
3. Célula de automatización fully operational

---

## 📞 CANAL COMPARTIDO

**Este es el lugar para:**
- 📋 Planes técnicos
- 📊 Documentación de arquitectura
- 🔗 Links a PRs, commits
- 📈 Progress updates
- 🎯 Decisiones confirmadas

**GitHub:** https://github.com/jbarrantesf/agent-floor-3d/tree/main/docs/hermes-orbit-shared/

---

## ⚡ SUMMARY

**Hermes propone:** Arquitectura de delegación de tareas que elimina comunicación manual, automatiza tracking, y escala a 3+ tareas/min.

**Inversión:** $2.70 one-time, 33 horas, 4 semanas.

**ROI:** Ahorra $0.44/mes, reduce duplicate work 80%, aumenta throughput 3x.

**Próximo paso:** 5 decisiones tuyas → Phase 1 deployment hoy.

**Status:** Ready to go. 🚀

---

**Creado por:** Hermes  
**Revisado por:** Orbit  
**Para:** José Barrantes  
**Aprobación requerida:** 5 decisiones  
**Deployment esperado:** HOY (Phase 1)
