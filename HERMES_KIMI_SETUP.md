# Hermes + Kimi 2.5 API — Guía de Configuración

**Objetivo:** Configurar Hermes para usar Kimi 2.5 como modelo de research/writing (reemplaza a OpenAI)

---

## 📋 PASO 1: Crear API Key en Kimi Platform

**URL:** https://platform.kimi.ai/console/api-keys

1. Abre el link en navegador
2. Inicia sesión (si no tienes cuenta, crea una)
3. Click en **"Crear API Key"** o **"New API Key"**
4. Nómbrata: `Hermes-NexAI` (o similar)
5. **COPIA la key completa** — se mostrará UNA SOLA VEZ
6. Guarda en lugar seguro temporalmente

**Formato de key:** `sk-...` (empieza con `sk-`)

---

## 🔐 PASO 2: Guardar API Key en `.env`

Abre el archivo `~/.env` y añade:

```bash
KIMI_API_KEY=sk-[tu-key-aqui]
```

**Ejemplo:**
```bash
KIMI_API_KEY=sk-abc123def456ghi789
```

⚠️ **IMPORTANTE:**
- No compartas esta key en chats, email, o repos públicos
- Si la expones: ve a https://platform.kimi.ai/console/api-keys y revócala inmediatamente

---

## 🎛️ PASO 3: Configurar OpenClaw para Kimi

Actualiza `~/.openclaw/openclaw.json`:

```json
{
  "agents": {
    "defaults": {
      "models": {
        "moonshot/kimi-k2.5-preview": {
          "alias": "kimi"
        }
      },
      "model": {
        "primary": "moonshot/kimi-k2.5-preview"
      }
    }
  },
  "auth": {
    "profiles": {
      "moonshot:default": {
        "provider": "moonshot",
        "mode": "api_key",
        "base_url": "https://api.moonshot.ai/v1"
      }
    }
  },
  "plugins": {
    "entries": {
      "moonshot": {
        "enabled": true
      }
    }
  }
}
```

---

## 🧪 PASO 4: Probar la Conexión

```bash
curl -X POST https://api.moonshot.ai/v1/chat/completions \
  -H "Authorization: Bearer $KIMI_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "kimi-k2.5-preview",
    "messages": [
      {"role": "user", "content": "¿Cuál es tu nombre?"}
    ]
  }'
```

Si funciona, recibirás una respuesta JSON con la respuesta de Kimi.

---

## 📚 Documentación Oficial (Español)

- **API Overview:** https://platform.kimi.ai/docs/api/overview
- **Quickstart:** https://platform.kimi.ai/docs/api/quickstart
- **Modelos disponibles:** https://platform.kimi.ai/docs/models
- **Console (crear keys):** https://platform.kimi.ai/console/api-keys

---

## ✅ Verificación Final

Ejecuta:

```bash
openclaw config get auth.profiles
```

Deberías ver:
```json
{
  "moonshot:default": {
    "provider": "moonshot",
    "mode": "api_key"
  }
}
```

---

## 🚀 Usar Kimi en Hermes

Una vez configurado, usa Kimi como:

```python
from openai import OpenAI

client = OpenAI(
    api_key="sk-...",  # Tu KIMI_API_KEY
    base_url="https://api.moonshot.ai/v1"
)

response = client.chat.completions.create(
    model="kimi-k2.5-preview",
    messages=[
        {"role": "user", "content": "Tu prompt aquí"}
    ]
)
```

---

## 💰 Pricing Kimi 2.5

- **Input:** $0.003 por 1K tokens
- **Output:** $0.009 por 1K tokens

(Mucho más barato que GPT-4o)

---

## ❓ Troubleshooting

| Error | Solución |
|---|---|
| `401 Unauthorized` | Verifica que KIMI_API_KEY esté correcto en `.env` |
| `Model not found` | Usa `kimi-k2.5-preview` (nombre exacto) |
| `Base URL error` | Debe ser `https://api.moonshot.ai/v1` (con `/v1` al final) |
| `Connection timeout` | Verifica tu conexión a internet y firewall |

---

**¿Necesitas ayuda? Avísame y debugueamos juntos.** 🪐
