# 💰 Cost Optimization Config — Activo desde 2026-05-19

## Cambios implementados

### 1. ✅ Modelo default → Haiku
**Archivo:** `~/.openclaw/openclaw.json`
```json
"model": {
  "primary": "anthropic/claude-haiku-4-5",  // ← ERA Opus, AHORA Haiku
  "fallbacks": ["sonnet", "qwen2.5-coder:14b"]
}
```

**Impacto:** 
- Cache write: $0.045 → $0.0024/1K (18× más barato)
- Input: $0.015 → $0.00080/1K (19× más barato)
- Output: $0.060 → $0.004/1K (15× más barato)

---

### 2. 🧠 Memory search — Manual only

**Regla:** NO llamar `memory_search()` automáticamente. Solo cuando:
- Pregunta contiene "qué pasó", "recuerda", "antes"
- Jose pregunta sobre un proyecto o cliente específico
- Necesito contexto histórico para decisión

**NO buscar en memory para:**
- "Hola"
- "Ok"
- "Continuamos"
- Preguntas técnicas aisladas sin contexto histórico
- Mensajes cortos (<20 palabras)

**Implementación:** Check en cada response — si `len(message) < 50 and not (why|remember|before|happened)` → skip memory_search.

---

### 3. 🔄 Escalamiento controlado

**Triggers para Sonnet (3× más caro que Haiku, pero 15× más barato que Opus):**
- ✓ Análisis de logs complejos (MUNSO, Coybo)
- ✓ Decisión de arquitectura que requiera razonamiento
- ✓ Code review o debugging de flujo multi-paso
- ✗ Chat conversacional
- ✗ Resúmenes simples
- ✗ Comandos CLI

**Triggers para Opus (EMERGENCIA ONLY):**
- 🚨 Completamente bloqueado en algo que Sonnet no resuelve
- 🚨 Decisión crítica que afecte producción/clientes
- 🚨 Documentar por qué Opus fue necesario

**Cómo eskalate:**
```bash
# Desde chat José: "usemos sonnet para esto"
# Respuesta mía:
/session_status model=sonnet
# Resto de respuesta con Sonnet
# Después: vuelvo a Haiku automáticamente
```

---

### 4. 📝 Sesiones largas vs fragmentadas

**ANTES (malo):**
- Cerrar chat + abrir nuevo = cache write x2
- 10 chats = 10 cache writes = $81

**AHORA (bien):**
- 1 sesión larga por tema
- Cache write: 1× al inicio
- Reutilización gratuita después

**Regla operativa:**
- No reiniciar OpenClaw entre tareas relacionadas
- Usar `sessions_spawn` para subtasks (no crea cache nueva)
- Batch de trabajo: "hoy hacemos X, Y, Z en una sesión"

---

### 5. 🚫 Evitar cache writes innecesarias

**Cosas que causan cache write = CARO:**
- Cargar MEMORY.md completa en cada mensaje (20K tokens)
- Cargar startup context si no es relevante
- Enviar screenshots sin necesidad
- Recargar archivos grandes por cada respuesta

**Lo que hago AHORA:**
- Cache write = 1× por sesión larga
- Reutilizar contexto compilado
- No "refrescar" memoria entre mensajes

---

## 📊 Proyección de costos

| Escenario | Costo/día | vs Hoy |
|---|---|---|
| Hoy (Opus fragmentado) | $82 | 1× (baseline) |
| Mañana (Haiku sesión larga) | $0.50 | **164× más barato** |
| Semana normal (Haiku 100%) | $3-5 | **16-27× más barato** |
| Mes operativo (Haiku + Sonnet puntual) | $50-70 | **20× más barato** |

---

## 🔍 Monitoreo diario

**Cada mañana verificar:**
```bash
# Cuál fue el pico de ayer
# Si >$10 → investigar qué pasó
# Si >$20 → implementar mitigación
```

**En Claude Console:**
- Alert si "Daily token cost" > $10
- Screenshot semanal a memoria

---

## 🛑 Red lines (NO CRUZAR)

1. ❌ NO volver a Opus por defecto (a menos que Jose lo pida explícitamente)
2. ❌ NO cargar MEMORY.md sin necesidad (search controlado)
3. ❌ NO fragmentar sesiones por tema (usa subagents)
4. ❌ NO reiniciar gateway entre tareas relacionadas

---

## ✅ Checklist para mañana 2026-05-19

- [x] Modelo default → Haiku en `openclaw.json`
- [x] Documentar reglas de memory_search
- [x] Documentar triggers de escalamiento
- [x] Monitoreo diario documentado
- [ ] Primer día sin Opus → validar que todo funciona
- [ ] Medir costo real EOD
- [ ] Reportar a Jose

---

**Generado:** 2026-05-18 23:11 CST  
**Status:** ✅ Listo para mañana  
**Objetivo:** Bajar de $82 → $0.50/día
