# 📋 Hermes Sonnet Migration - 13 May 2026 (8:06 AM)

## Problema Identificado

José verificó que Hermes **NO estaba realmente usando OpenRouter + sonic/sonic-eq** a pesar de que la config decía que sí.

**Audio:** "Tienes que verificar porque todavía Hermes no está activo con OpenRouter, necesitamos OpenRouter con Sonnet, por favor."

## Diagnóstico

**Issue:** Hermes no recargó la configuración anterior (sonic/sonic-eq). El config.yaml tenía los cambios, pero el proceso no los aplicó.

**Solución:** Forzar reinicio completo con nueva config + cambiar a Sonnet.

## Cambios Implementados ✅

### Config Anterior (No funcionaba)
```yaml
model:
  default: sonic/sonic-eq
  provider: openrouter
```

### Config Nueva (Activa ahora)
```yaml
model:
  default: anthropic/claude-sonnet-4-6
  provider: openrouter
  base_url: https://openrouter.ai/api/v1
```

### Acciones
1. ✅ Terminados todos los procesos Hermes (-9 force kill)
2. ✅ Limpiado ~/.hermes/gateway.pid
3. ✅ Actualizado config.yaml → Sonnet como principal
4. ✅ Actualizado fallback_providers → Sonnet + Haiku + Qwen
5. ✅ Reiniciado Hermes desde cero (PID 30154)
6. ✅ Validado que config está aplicada

## Estado Final

```
✅ Modelo principal: anthropic/claude-sonnet-4-6
✅ Provider: OpenRouter (https://openrouter.ai/api/v1)
✅ Fallback chain: Sonnet → Haiku → Qwen (local)
✅ Proceso: PID 30154 (corriendo)
✅ Status: 🟢 OPERATIVO
```

## Diferencia Sonnet vs Sonic

| Aspecto | Sonic EQ | Claude Sonnet |
|---------|----------|---------------|
| Costo | Más barato | Moderado (recomendado) |
| Calidad | Buena | Excelente |
| Razonamiento | Bueno | Superior |
| Contexto | 128k | 200k |
| **Recomendación** | Para tareas simples | **Para Hermes (mejor balance)** |

José eligió Sonnet para mejor calidad/confiabilidad.

## Próximos Pasos

- Monitorear que Hermes use Sonnet sin errores
- Si hay issues, fallback automático a Haiku
- Reportar estado a José

---

**Status:** ✅ Completado
**Timestamp:** 2026-05-13 08:06 CST
**Config file:** ~/.hermes/config.yaml
**Process:** PID 30154
