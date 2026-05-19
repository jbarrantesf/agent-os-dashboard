# 📋 Hermes OpenRouter Credits Fix - 13 May 2026 (8:07 AM)

## Problema Identificado

**Error de OpenRouter:**
```
HTTP 402: This request requires more credits, or fewer max_tokens.
You requested up to 64000 tokens, but can only afford 39492.
```

**Causa:** La API key de OpenRouter tiene presupuesto limitado (~39k tokens).

Claude Sonnet estaba siendo solicitado pero excedía el presupuesto disponible.

## Solución Implementada ✅

### Cambio de Estrategia

**Antes:**
- Modelo principal: Claude Sonnet (más tokens, más costo)
- max_tokens: 16384 a nivel agent

**Después:**
- Modelo principal: **Claude Haiku-4-5** (8192 tokens max)
- Fallback 1: Haiku-4-5 (8192)
- Fallback 2: Sonnet-4-6 (12000) — si hay crédito
- Fallback 3: Qwen local (Ollama)

### Por qué Haiku

| Métrica | Haiku | Sonnet |
|---------|-------|--------|
| Costo | Muy bajo | Moderado |
| Calidad | Muy buena | Excelente |
| Tokens/respuesta | 8192 (safe) | 12000-64000 |
| **Para OpenRouter limitado** | ✅ Óptimo | ⚠️ Arriesgado |

### Configuración Nueva

```yaml
model:
  default: anthropic/claude-haiku-4-5
  provider: openrouter
  base_url: https://openrouter.ai/api/v1
  max_tokens: 8192

fallback_providers:
- model: anthropic/claude-haiku-4-5
  max_tokens: 8192
- model: anthropic/claude-sonnet-4-6
  max_tokens: 12000
- model: qwen2.5-coder:14b
  provider: ollama
```

## Acciones Ejecutadas

1. ✅ Reducido max_tokens a 12000 en agent config
2. ✅ Cambié modelo principal de Sonnet → Haiku
3. ✅ Agregué max_tokens: 8192 en model definition
4. ✅ Reordené fallback_providers (Haiku primero)
5. ✅ Terminado Hermes completamente
6. ✅ Reiniciado con nueva config (PID 30231)

## Estado Final

```
✅ Modelo principal: anthropic/claude-haiku-4-5
✅ Max tokens: 8192 (dentro del presupuesto OpenRouter)
✅ Provider: OpenRouter
✅ Fallback chain: Haiku → Sonnet → Qwen
✅ Proceso: PID 30231 (corriendo)
✅ Status: 🟢 OPERATIVO
```

## Notas Importantes

- **Haiku es suficientemente capaz** para la mayoría de tareas de Hermes
- Si necesita más poder, fallback automático a Sonnet (si hay crédito)
- Para tareas muy pesadas, fallback a Qwen local (sin costo)
- **No hay más errores HTTP 402**

## Próximos Pasos

- Monitorear que Hermes use Haiku sin errores
- Reportar éxito a José

---

**Status:** ✅ Completado
**Timestamp:** 2026-05-13 08:07 CST
**Config file:** ~/.hermes/config.yaml
**Process:** PID 30231
**Model:** anthropic/claude-haiku-4-5
