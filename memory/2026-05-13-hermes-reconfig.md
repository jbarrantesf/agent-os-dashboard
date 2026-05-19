# 📋 Hermes Reconfig Log - 13 May 2026 (8:05 AM)

## Problema: Hermes Desconfigurado

**Reporte de José (audio):** "Ayúdame a arreglar otra vez a Hermes que se volvió a desconfigurar. Ponle Open Router como el modelo principal y EQ, el modelo de Sonic más barato que tenemos, por favor."

## Diagnostico ✅

### Error Encontrado
```
File: ~/.hermes/config.yaml
Problema: Modelo principal = qwen2.5-coder:14b (Ollama local)
Debería: sonic/sonic-eq (OpenRouter)
```

Hermes también mostraba errores de validación JSONRPC en los logs.

## Solución Implementada ✅

### Cambios Realizados

**Archivo:** `~/.hermes/config.yaml`

**Antes:**
```yaml
model:
  default: qwen2.5-coder:14b
  provider: ollama
  api_mode: chat_completions
  base_url: http://localhost:11434/v1
  api_key: ollama
```

**Después:**
```yaml
model:
  default: sonic/sonic-eq
  provider: openrouter
  api_mode: chat_completions
  base_url: https://openrouter.ai/api/v1
```

### Fallback Chain
```
1. sonic/sonic-eq (OpenRouter) — PRINCIPAL, más barato
2. anthropic/claude-haiku-4-5 (OpenRouter) — Si EQ falla
3. qwen2.5-coder:14b (Ollama local) — Fallback local
```

## Acciones Ejecutadas

1. ✅ Backup de config anterior
2. ✅ Actualizado `config.yaml` con sonic/sonic-eq como principal
3. ✅ Terminado proceso Hermes (PID 28826)
4. ✅ Reiniciado Hermes con nueva config (PID 30065)
5. ✅ Verificado que el proceso esté corriendo
6. ✅ Validado que la config se aplicó correctamente

## Estado Final

```
Model:       sonic/sonic-eq (OpenRouter) ✅
Provider:    https://openrouter.ai/api/v1 ✅
Status:      🟢 Hermes Operativo
Process:     PID 30065 (corriendo)
Config:      ~/.hermes/config.yaml (actualizado)
```

## Ventajas de sonic/sonic-eq

- **Costo:** Uno de los modelos más baratos en OpenRouter
- **Velocidad:** Rápido, ideal para tareas general
- **Confiabilidad:** Fallback a Claude Haiku si hay problemas
- **Ollama Local:** Sigue disponible como tercer fallback

## Próximos Pasos

- Monitorear logs de Hermes para validar que sonic/sonic-eq funciona sin errores
- Si hay problemas, fallback automático a Claude Haiku
- Reportar a José si hay issues con el nuevo modelo

---

**Status:** ✅ Completado
**Modelo(s) usado(s):** Haiku (configuración local)
**Timestamp:** 2026-05-13 08:05 CST
