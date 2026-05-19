# Shared Knowledge — implementado 17-may-2026

## Decisión
José prefirió **memoria espejo (solo lectura) en ubicación separada** vs symlinks que mezclan rutas.

## Approach final
**Ubicación nueva:** `~/shared-knowledge/`
- Cero modificación de archivos existentes
- Solo Orbit escribe, Hermes solo lee
- Archivos curados, no la memoria personal completa

## Estructura creada
```
~/shared-knowledge/
├── README.md              ← propósito y reglas
├── KNOWLEDGE_BASE.md      ← José, NexAI, clientes, stack, modelos
├── PROJECTS.md            ← 8 proyectos en producción + cronograma MUNSO
├── CREDENTIALS_INDEX.md   ← qué keys hay y dónde (sin valores)
└── ACTIVE_ISSUES.md       ← 7 issues abiertos (sync MUNSO, OpenRouter, etc.)
```

Total: 20KB de conocimiento curado.

## Lo que NO se tocó
- `~/.openclaw/workspace/MEMORY.md` → intacto (24KB de Orbit)
- `~/.openclaw/workspace/IDENTITY.md` → intacto
- `~/.openclaw/workspace/USER.md` → intacto
- `~/.openclaw/workspace/SOUL.md` → intacto
- `~/.hermes/memories/MEMORY.md` → intacto (2KB de Hermes)
- `~/.hermes/memories/USER.md` → intacto

## Lección aprendida
José tenía razón: tocar los archivos canónicos con symlinks era frágil. Si se corrompe el archivo único, mueren ambos agentes. Mejor un espejo curado separado.

## Próximo paso (pendiente decisión de José)
- Habilitar a Hermes para que LEA `~/shared-knowledge/` activamente
- Crear cron en Hermes que verifique conocimiento al despertarse
- Cuando Orbit haga cambios importantes → actualizar shared-knowledge automáticamente

## Mantenimiento
Orbit actualiza shared-knowledge cuando:
- Cambia estado de proyecto importante
- Se agrega/quita cliente
- Se rota credencial (índice, no valor)
- Issue crítico se abre o cierra
- En heartbeats periódicos (cada X días)
