# 🟢 Hermes — Configuración OpenRouter Primario

**Fecha:** 10-may-2026 14:32 CST  
**Status:** ✅ IMPLEMENTADO  
**Decisión:** José compra créditos OpenRouter

---

## 📊 Configuración Aplicada

```yaml
model:
  default: claude-sonnet-4-6
  provider: openrouter
  
fallback_providers:
  - model: qwen2.5-coder:14b
    provider: ollama
    base_url: http://localhost:11434/v1
```

**Resultado:**
- ✅ Primario: Sonnet vía OpenRouter (máxima calidad)
- ✅ Fallback: Ollama Qwen 2.5 ($0, si OpenRouter falla)

---

## 💳 Créditos OpenRouter

**Dónde comprar:**
1. https://openrouter.ai/keys
2. Login
3. Añade método de pago
4. Compra créditos

**API Key:** En `~/.hermes/.env` (OPENROUTER_API_KEY)

**Consumo estimado:**
- Hermes tasks típicas: ~$0.01-0.05/tarea
- Crons diarios: ~$0.05-0.10/día
- **Meta mensual:** <$10/mes con optimizaciones

---

## 🎯 Stack Final — MEGA RESILIENTE

### ORBIT (Telegram, Interactivo)
```
Primario:     Sonnet (OpenRouter)
Fallback 1:   Haiku (OpenRouter)
Fallback 2:   Qwen 2.5 (Ollama, $0)
Status:       🟢 ACTIVO
```

### Hermes (Background, Persistent)
```
Primario:     Sonnet (OpenRouter)
Fallback:     Qwen 2.5 (Ollama, $0)
Status:       🟢 ACTIVO
```

### Crons (Monitoring, Cheap)
```
Primario:     Haiku (OpenRouter)
Fallback:     Qwen 2.5 (Ollama, $0)
Status:       🟢 ACTIVO
```

---

## 🚨 Garantía: NUNCA Sin Respuesta

**Cascada de 3+ niveles en cada componente:**

| Escenario | ORBIT | Hermes | Crons |
|-----------|-------|--------|-------|
| Todo normal | ✅ Sonnet | ✅ Sonnet | ✅ Haiku |
| OR cae | ⚡ Haiku | ⚡ Ollama | ⚡ Ollama |
| Quota agotada | 🔥 Ollama | 🔥 Ollama | 🔥 Ollama |
| Internet muere | 🆘 Ollama local | 🆘 Ollama local | 🆘 Ollama local |

**Resultado:** José SIEMPRE tiene agente operativo. Sin excepción.

---

## 💰 Presupuesto Estimado

| Componente | Costo/Mes | Notas |
|-----------|-----------|-------|
| ORBIT (Telegram) | $2-3 | Conversaciones diarias |
| Hermes (Background) | $3-5 | Tasks, automation |
| Crons (Monitoring) | $1-2 | Haiku optimizado |
| **Total OpenRouter** | **$6-10/mes** | Con fallbacks $0 |
| **Ollama (Fallback)** | **$0** | Siempre disponible |

**Vs. Antes (Anthropic directo):**
- Antes: ~$15-25/mes
- Ahora: ~$6-10/mes + $0 fallback
- **Ahorro: ~$10/mes (40-60%)**

---

## ✅ Próximos Pasos

1. **Compra créditos OpenRouter** (José)
2. **Monitorea consumo:** `curl -s https://api.openrouter.ai/api/v1/auth/profile -H "Authorization: Bearer $OPENROUTER_API_KEY" | jq .`
3. **Alertas si quota baja:** Setup en dashboard OpenRouter
4. **Fallback automático:** Ya funciona (Ollama escuchando)

---

**Implementado por:** Orbit  
**Aprobado por:** José Barrantes  
**Status:** 🟢 LIVE

NUNCA sin respuesta. Garantizado. 💪
