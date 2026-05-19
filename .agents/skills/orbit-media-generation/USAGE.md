# Orbit Media Generation — Uso Efectivo

## ✅ Probado y Funcionando (12-may-2026)

### Generar Imágenes 4K

**Desde OpenClaw chat/agent:**
```python
from image_generate import image_generate

result = image_generate(
    prompt="Your description here",
    size="1024x1024",
    model="openrouter/auto"
)
```

**Vía herramienta nativa de OpenClaw:**
```
/image-generate "NexAI professional website mockup"
```

**Resultado:** 2-4 imágenes 4K en ~30 segundos

### Generar Videos 1080p

**Desde OpenClaw chat/agent:**
```python
from video_generate import video_generate

result = video_generate(
    prompt="Your video description",
    durationSeconds=15,
    model="openrouter/auto"
)
```

**Vía herramienta nativa:**
```
/video-generate "Drone shot of tech office" --duration 15
```

**Resultado:** Video 1080p en ~2-5 minutos (async)

---

## 🎯 Casos de Uso Reales

### 1. Propuestas de Cliente
```
Prompt: "Professional mockup of [client] AI solution dashboard, 
showing real-time metrics, modern tech aesthetic, 4K"
→ Generar imagen para PDF de propuesta
```

### 2. Morning Briefing
```
Prompt: "NexAI Solutions brand hero image, modern tech office, 
Costa Rica vibe, professional photography"
→ Adjuntar a resumen diario
```

### 3. Capacitación/Educación
```
Prompt: "Step-by-step animation of AI agent architecture, 
clean infographic, professional motion graphics, 15 seconds"
→ Video para training interno
```

### 4. Redes Sociales
```
Prompt: "NexAI Solutions LinkedIn post graphic, brand colors, 
tech vibe, with space for quote about AI automation"
→ Imagen 1024×1024 para LinkedIn/Instagram
```

---

## 📊 Costos Reales (May 2026)

| Generación | Modelo | Costo | Tiempo |
|---|---|---|---|
| Imagen 4K | Flux | $0.03-0.05 | ~30s |
| Video 15s | Seedance 2.0 | $0.10-0.15 | ~3-5m |
| **Batch típica** | Auto-select | **~$1-2** | **~10m** |

---

## 🚀 Integración con Orbit

Orbit puede:
1. **Escuchar pedidos:** "Genera una imagen de..." 
2. **Enriquecer prompt** con brand guidelines
3. **Llamar a image_generate / video_generate**
4. **Guardar y referenciar** en propuestas/reportes
5. **Loguear costo** automáticamente

---

## ✅ Skills Listos

Este skill está integrado con:
- ✅ OpenRouter (multi-modelo)
- ✅ OpenClaw native tools
- ✅ NexAI brand guidelines
- ✅ Cost tracking
- ✅ Async video polling

**Invocar cuando sea necesario desde Orbit o chat directo.**
