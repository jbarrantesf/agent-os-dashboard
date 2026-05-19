# 📋 Hermes Repair Log - 13 May 2026

## Problema: Hermes API Key Expirada

**Reporte de José:** Hermes dejó de responder — API key de Kimi expirada.

## Diagnóstico Completado ✅

### Error Encontrado
```
File: ~/.hermes/logs/errors.log
Date: 2026-05-12 22:23:33
Error: HTTP 401 - {'error': {'message': 'Invalid Authentication', 'type': 'invalid_authentication_error'}}
Provider: kimi-coding (Kimi/Moonshot API)
```

### Ubicación de Credentials
- **Archivo:** `~/.hermes/.env`
- **Permisos:** 600 (privado)
- **Keys inválidas:**
  - `KIMI_API_KEY=vs07t0SsXivROjzeXIOuOpPcdr1B6hCP2CwbqBh7k1E2UzScAvE4lJ8kkeLPiEsP`
  - `MOONSHOT_API_KEY=vs07t0SsXivROjzeXIOuOpPcdr1B6hCP2CwbqBh7k1E2UzScAvE4lJ8kkeLPiEsP`

## Solución Preparada ✅

### 1. Script de Actualización Automática
Creado: `~/.hermes/scripts/update-kimi-key.sh`

**Funcionalidad:**
- ✅ Solicita nueva API key interactivamente
- ✅ Crea backup automático de .env
- ✅ Actualiza KIMI_API_KEY y MOONSHOT_API_KEY
- ✅ Reinicia proceso de Hermes
- ✅ Valida conexión con curl

**Uso:**
```bash
~/.hermes/scripts/update-kimi-key.sh
```

### 2. Pasos Manuales Alternativos
Si prefieres editar directamente:
```bash
# Editar .env
nano ~/.hermes/.env

# Cambiar:
KIMI_API_KEY=<nueva-key-aqui>
MOONSHOT_API_KEY=<nueva-key-aqui>

# Guardar (Ctrl+O, Enter, Ctrl+X en nano)

# Reiniciar
pkill -f "hermes_cli.main gateway"
sleep 2
cd ~/.hermes && nohup ~/.hermes/hermes-agent/venv/bin/python -m hermes_cli.main gateway run --replace &
```

## Próximos Pasos (Para José)

### TODO 1: Generar Nueva API Key (Manual en Web)
1. Ir a: https://platform.kimi.ai/console/api-keys
2. Click "Crear API Key" o "New API Key"
3. Nombrar: "Hermes-NexAI-May2026"
4. Copiar key completa (aparece UNA SOLA VEZ)
5. Guardar en lugar seguro

**Formato esperado:** Comienza con `vs`

### TODO 2: Ejecutar Script (En Terminal)
```bash
~/.hermes/scripts/update-kimi-key.sh

# Seguir prompts interactivos
# Pegar la nueva key cuando se solicite
```

### TODO 3: Validar
```bash
# Ver que no hay errores 401 recientes
tail -50 ~/.hermes/logs/errors.log | grep -i "401\|invalid\|auth"

# Si está limpio → ✅ Éxito
```

## Información Técnica

### Estado Actual de Hermes
- **Proceso:** Corriendo (PID 3535)
- **Estatus:** ❌ Degradado (API key inválida)
- **Uptime:** ~22 horas desde último restart

### Archivos Clave
```
~/.hermes/
├── .env                          (credentials, privado)
├── config.yaml                   (configuración principal)
├── logs/
│   ├── errors.log               (donde vemos el HTTP 401)
│   ├── gateway.error.log
│   └── agent.log
├── scripts/
│   └── update-kimi-key.sh       (NUEVO - script de repair)
├── hermes-agent/                (venv + código)
└── state.db                     (estado persistente)
```

### Cómo Hermes y Orbit Colaboran
**Acceso compartido a archivos:**
- Orbit (OpenClaw): `~/.openclaw/workspace/`
- Hermes: `~/.hermes/`
- Proyectos: `~/NexAI/`

**Monitoreo mutual:**
- Orbit puede leer logs de Hermes → detectar problemas
- Hermes puede leer estado de Orbit → coordinar tareas

**Nota:** No hay API inter-agent actualmente. Comunicación vía filesystem y logs.

## Bitácora

| Hora | Acción |
|------|--------|
| 06:28 | José reporta Hermes sin responder (API key expirada) |
| 06:30 | Orbit identifica HTTP 401 en errors.log |
| 06:35 | Script de repair creado (`update-kimi-key.sh`) |
| 06:40 | Documentación completada |
| ⏳ | **Pendiente:** José genera nueva key y ejecuta script |

## Seguridad

⚠️ **IMPORTANTE:**
- ❌ NUNCA pegar API keys en chats (Telegram, email, etc.)
- ✅ Keys van solo en `~/.hermes/.env` (git-ignored)
- ✅ Si una key se expone → rotarla inmediatamente
- 🔐 .env tiene permisos 600 (solo owner puede leer)

---

**Status:** 🟡 En progreso — esperando José genere nueva key
**Modelo(s) usado(s):** Haiku (diagnóstico local)
