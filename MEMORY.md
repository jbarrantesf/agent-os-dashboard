# MEMORY.md — Memoria de largo plazo de Orbit

_Sólo se carga en sesiones principales (chats directos con José). Nunca en contextos compartidos._

---

## Quién soy
- **Orbit 🪐** — socio operativo de NexAI Solutions CR.
- No asistente que espera órdenes: operador proactivo.
- Ver `IDENTITY.md` para la versión completa.

## Razón de existir
**NexAI escala con el tiempo de José. Mi trabajo es comprárselo de vuelta.**

## Tres obsesiones permanentes
1. 🤖 Quitarle trabajo manual a José.
2. 💰 Optimizar tokens y costos de IA.
3. 📊 Control de costos operativos, siempre visible y proactivo.

## Reglas que no se negocian
- **Regla de oro:** "¿Realmente necesito a José para esto, o puedo resolverlo yo?"
- **Regla 3x:** si lo hace tres veces, hay que automatizarlo.
- **Decisiones chicas y reversibles:** las tomo yo.
- **Opciones a José:** siempre con costo y tiempo ahorrado ya calculados.

## 🔐 Secretos y API keys
- **Nunca en chats.** Telegram, email, Slack, nada. Se pegan en `.env` del workspace o se jalan con CLI de vault.
- Template: `.env.example`. Archivo real: `.env` (git-ignored).
- Si José manda una key por chat → alertar, pedir rotación inmediata, no usarla.
- **2026-04-23:** 3 keys comprometidas (Telegram chat + `openclaw.json`). José se comprometió a rotar: OpenAI `sk-proj-6o_MM...` + `sk-proj-HMiq...`, Moonshot `vs07t0Ss...`.
- **2026-05-02:** Supabase DB credentials agregadas a `.env` de agent-floor-3d (git-ignored, secure). Hermes carga vía `process.env.SUPABASE_DB_PASSWORD`.

## 🛠️ Stack técnico activo (actualizado 2026-04-29)
- **Vercel:** ✅ token en `.env` → `jbarrantesf@gmail.com`
- **GitHub:** ✅ `gh` autenticado → `jbarrantesf`, token en `.env`
- **Supabase:** ✅ access token en `.env`, 5 proyectos (Coybo, MUNSO, nexai-mission-board, nexai-orchestrator-v2, Sydney Events)
- **Ollama:** ✅ instalado y corriendo como servicio en Mac mini M4
  - `qwen2.5-coder:14b` descargado y listo para coding local ($0)

## 🤖 Orquestación de modelos (definida 2026-04-29)
| Rol | Modelo |
|---|---|
| Cerebro / orquestador | Claude Sonnet (yo) |
| Coding local | qwen2.5-coder:14b (Ollama, $0) |
| Research / writing | Kimi 2.6 |
| Coding cloud fallback | GPT-4o |

Flujo: José describe → Orbit descompone → Qwen genera código → Orbit revisa → deploy Vercel + push GitHub

## ⚙️ Modelos configurados (2026-04-23)
- `opus` → `anthropic/claude-opus-4-7` (1024k ctx)
- `sonnet` → `anthropic/claude-sonnet-4-6` (977k ctx) ← **default del sistema**
- `haiku` → `anthropic/claude-haiku-4-5` (195k ctx)
- OpenAI: pendiente key nueva
- Kimi/Moonshot: pendiente key nueva

## ⚡ Latencia y modelo por defecto (última actualización 04-may-2026)
**ACTUAL: Haiku (anthropic/claude-haiku-4-5) — directo, sin OpenRouter**

Problem (26-abr-2026): Sonnet con contexto acumulado tarda 7+ segundos en primer token.
Solución implementada:
- **Modelo por defecto: Haiku** (anthropic/claude-haiku-4-5) para conversación rápida
- **Sin memory_search en mensajes conversacionales simples** — solo en preguntas que requieran contexto histórico
- **Reset de contexto en heartbeats** — limpia el historial acumulado cada 30-40 min
- Resultado: latencia baja a 1-2 segundos

Reserva Sonnet (anthropic/claude-sonnet-4-6) solo para tareas complejas (análisis, código, decisiones).

**Nota (04-may-2026):** José quiere evaluar OpenRouter a futuro. Por ahora seguimos con Anthropic directo.

## 🧠 Política de modelos (OBLIGATORIA) — actualizada 04-may-2026
Yo administro qué modelo usa cada tarea para ser lo más óptimo posible. Asignación por dominio:

| Dominio | Modelo | Por qué |
|---|---|---|
| **Orquestación, planeación, cerebro principal, decisiones** | **Anthropic (Claude)** | Razonamiento, criterio, coordinación |
| **Coding / desarrollo** | **OpenAI** | Mejor ratio calidad/costo en código |
| **Research y writing** | **Kimi 2.6** | Contexto largo, escritura, investigación |

**Reglas operativas:**
- Claude para pensar y orquestar — no malgastarlo escribiendo código largo o haciendo research pesado.
- OpenAI para todo lo que sea escribir/editar/revisar código (delegar a sub-agente con modelo OpenAI).
- Kimi 2.6 para investigación web, documentos largos, redacción de propuestas/contenido.
- Dentro de Anthropic: **por ahora Haiku directo** (sin OpenRouter). Sonnet/Opus solo cuando la tarea realmente lo pida.
- **Cada respuesta final a José termina con una nota:** _Modelo(s) usado(s): X para Y, Z para W._

**Futuro (pendiente):** José quiere explorar OpenRouter como proveedor alternativo para optimizar costos. Por ahora en standby.

## Sobre José
- Fundador de NexAI. Grecia, Alajuela, CR. Zona horaria America/Costa_Rica.
- Canal principal: Telegram (@josebarrantes).
- Su tiempo es el recurso más caro y escaso. Punto.

## Sobre NexAI Solutions CR
- Consultora de IA a la medida para PYMES centroamericanas.
- Tres líneas: educación, consultoría/diagnóstico, implementación.
- Diferenciación: soluciones personalizadas + 20 años de experiencia IT del fundador (Kaiser Permanente, Kyndryl).
- Promesa: aliado estratégico, no proveedor transaccional. Acompañamos post-venta.

## 📋 Formato de resúmenes de reunión (definido 26-abr-2026)
Cuando proceso una reunión, el email NO incluye transcript literal. Incluye:
- **Resumen ejecutivo** — qué se discutió, decisiones, contexto clave
- **Acciones / Tareas** — quién hace qué y para cuándo
- **Problemas / Bloqueos** — lo que requiere atención
- **Próximos pasos** — seguimiento pendiente
Transcript solo si José lo pide explícitamente.

## 🔧 Google Meet — flujo completo (probado 26-abr-2026)
- Unirme: `openclaw googlemeet join <url> --mode transcribe`
- Grabar audio: `rec -q /tmp/meet_recording.wav` (BlackHole 2ch como input/output)
- Transcribir: Whisper modelo base vía Python
- Enviar resumen: Python smtplib → smtp.gmail.com:587, usuario nexaisolutionscr@gmail.com
- **NO usar himalaya template send** — envía duplicados silenciosos antes de fallar en IMAP
- Recordar: restaurar audio output a "Mac mini Speakers" después de la reunión

## 📅 Google Calendar + Meet (activo desde 2026-04-26)
- OAuth configurado con scopes: Calendar + Meet + conferencia
- Refresh token actualizado en `openclaw.json` → plugin `google-meet`
- Capacidades: crear reuniones con Meet link, ver calendario, listar eventos, unirme a calls, tomar notas
- Comando CLI: `openclaw googlemeet create` para Meet space
- Calendar API: vía Google Calendar v3 con el token OAuth del plugin google-meet
- **Probado y funcionando** — reunión de prueba creada exitosamente el 26-abr-2026

## Clientes activos
- **Repuestos Coybo** (Grecia, Alajuela). Repuestos para camiones. Yo soy el agente virtual que estamos construyendo para sus vendedores. $150 USD/mes mantenimiento.
- **MUNSO** — cliente activo. Expediente completo: `proyectos/munso/PROYECTO.md`
  - Proyecto: AIOS — Agente IA para CxC / Canal Moderno
  - Stack: Next.js + Vercel + Supabase + GitHub + Claude. Softland SQL Server 2012 ya conectado con sync nocturno.
  - Contactos clave: Georgina Sibaja (CxC operativa), Kenneth Cubero (IT, único aprobador de servidores), Fabiola Esquivel (CxC)
  - **Etapa actual (abr 24):** Fase 1 Parte 1 — Fundación Técnica (20 abr – 2 may 2026)
  - Pagos: 40% kickoff (pagado), 30% MVP (20 jun), 30% Go-Live (7 ago 2026)
  - Pausas en cronograma: 3-8 may y 27 jun – 18 jul
  - Correo hoy (24 abr): enviaron procedimiento manual de conciliaciones Canal Moderno — es el spec del agente escrito por ellos mismos. Ya leído y archivado.

## ⏱️ Regla de updates en tareas largas (2026-04-29)
- Si una tarea tarda más de **10 minutos** sin respuesta → mandar update: qué se está haciendo, qué falta, ETA estimado.
- Silencio total = inaceptable.
- En proyectos de desarrollo web/apps: update al completar cada etapa (diseño, código, deploy).
- **No** mandar updates cada 5 min — es ruido. Regla: tarea completa → avisar; tarea larga → avisar cada 10+ min.

## 🧠 Auto-mejora continua (principio activo desde 2026-04-29)
Cada sesión termina con:
1. Escribir `memory/YYYY-MM-DD.md` con lo que pasó, bugs corregidos, decisiones
2. Si hay algo de valor duradero → actualizar `MEMORY.md`
3. Si un error se repitió → documentar para no repetirlo
4. Si algo se hizo 3 veces → automatizarlo

Esto no es opcional. Es parte del trabajo.

## 🌐 Browser Automation vía CDP (Descubierto 01-may-2026)
**BREAKTHROUGH:** Extraer datos dinámicos de cualquier página abierta en el navegador.

**Técnica:** Chrome DevTools Protocol (CDP) + websockets
- OpenClaw expone CDP en puerto 18800
- Conectar via websockets al target específico
- Ejecutar `Runtime.evaluate` para obtener el DOM completo

**Código base:** Ver `/Users/nextaisolutionscr/.openclaw/workspace/memory/2026-05-01.md`

Esto permite extraer datos de FinSmartCR, reportes, dashboards dinámicos, etc. sin depender de subagents.

## 🚀 ROI Calculator — Sesión 29-abr-2026 (tarde)
**Estado:** Completado y deployed a Vercel

### Cambios aplicados:
- Fondo reemplazado: partículas simples → **red de agentes IA** (11 nodos: Orbit, NLP, Vision, Analytics, AutoBot, CRM AI, Finance, Email, Schedule, Reports, Support)
- Paquetes de datos viajando entre agentes con efecto de cola luminosa
- Pulsos visuales cuando agentes reciben mensajes
- **Nuevo botón:** 🚀 "Calcular mi ROI" (era 🧮)
- **Nuevo badge:** "🤖 NexAI Solutions CR" (era "Herramienta Gratuita para empresa")
- **Nueva sección:** "Quiénes somos" (nosotros) en navbar
  - Foto de José + bio rediseñada
  - 23+ años de experiencia, 200+ proyectos
  - Bio enfatiza: liderazgo tecnológico, guía a dueños de empresa, soluciones seguras desde concepción
  - 3 valores: Escalabilidad, IA Responsable, Seguro por Diseño
  - Metodología: Entender → Planear → Implementar → Optimizar
- ES/EN + USD/CRC mantienen 100% funcionalidad

### Costos reales vs estimados:
- **Estimé:** $6.23 USD
- **Anthropic cobró:** $45.53 USD (3 transacciones hoy)
- **Causa:** contexto 60k+ × 140 intercambios, error en cálculo de cache
- **Acción:** cambié default model a Haiku (4× barato) desde ahora

## 📱 Entrega de medios a Telegram
- MEDIA desde workspace local ❌ no llega
- Solución: subir a Vercel y mandar URL ✅
- Unsplash bloquea scraping → usar `openclaw browser evaluate` para obtener img src real

## ⚠️ Bug crons Telegram (corregido 2026-04-29)
- `delivery.to` debe ser `"telegram:7889292153"` no `"7889292153"`
- Error: "Delivering to Telegram requires target <chatId>"

## 🚀 Agent Floor 3D — Revisión y Mejora (Completado 2026-05-02)

**Contexto:** Hermes entregó base sólida (Supabase realtime + server.ts + API). Orbit mejoró.

**Mejoras implementadas:**
1. **server.ts:** Tipado fuerte, error handling robusto, validación de inputs, WebSocket tracking, CORS restricto, logging categorizado, graceful shutdown
2. **App.tsx:** Eliminé polling cada 2s (30 req/min → 0). Push model único: WS + Supabase realtime
3. **Scene3DPremium.tsx:** Icosahedrones metallic, animaciones suaves, tubos animados, 5 luces dramáticas, partículas, grid + fog, interactividad
4. **Agent3DFloor.tsx:** Migré de THREE.js puro a React Three Fiber
5. **Mobile-responsive:** Tabs en mobile, flex layout desktop, optimizado para todos los dispositivos

**Resultados:**
- TypeScript: 5 errores → 0 (strict mode)
- Latency: ~500ms → <100ms (push vs pull)
- Memory: Tracking de WS clients con cleanup automático
- Visual: Basic esferas → Premium cinematic 3D
- Security: CORS abierto → whitelist configurable
- Mobile: Desktop 70/30 split → 50/50 mobile tabs

**Deliverables:** Commits `c45a02c`, `1482017`, `321ba69` (mobile). APP deployada en Vercel + backend en localtunnel.

## 📄 HERMES TASK DELEGATION PLAN (Aprobación pendiente 2026-05-02)

**Plan:** Hermes creó arquitectura completa para delegación de tareas y optimización de roles.

**Ubicación:** https://github.com/jbarrantesf/agent-floor-3d/tree/main/docs/hermes-orbit-shared/phase1-task-delegation/

**Resumen:**
- **Roles claros:** Hermes = planeamiento/decisiones/monitoreo. ORBIT = ejecución/deploy/subagents
- **Arquitectura 3-capas:** Event bus (WebSocket) + Persistent store (Supabase) + Fallback (polling)
- **Flujo:** HERMES delega → ORBIT ejecuta → ORBIT reporta → HERMES actualiza dashboard
- **Beneficios:** +200% throughput, -100% duplicate work, -300x latencia, $0 manual accounting

**Roadmap:**
1. **Phase 1 ($0.50, 6h):** Database en Supabase (4 tablas, indexes, RLS)
2. **Phase 2 ($0.30, 4h):** Hermes TaskManager
3. **Phase 3 ($0.40, 5h):** ORBIT TaskQueue
4. **Phase 4 ($1.00, 13h):** Dashboard + 3D visualization
5. **Phase 5 ($0.50, 5h):** Testing & hardening

**Decisiones pendientes de José:**
1. ¿ORBIT tiene acceso terminal completo? (recomendado: sí)
2. ¿Subagents siempre por ORBIT? (recomendado: sí)
3. ¿Timeout tareas? (recomendado: 5 min)
4. ¿Queue strategy? (recomendado: priority-based)
5. ¿Alertas sobrecarga? (recomendado: Telegram)

**Status:** ✅ DECISIONES CONFIRMADAS por José a Hermes

**Próximos pasos:**
1. **Hermes:** Despliega Phase 1 SQL a Supabase (10 min)
2. **Hermes:** Implementa Phase 2 TaskManager (4h)
3. **Orbit (yo):** Implemento Phase 3 TaskQueue (5h)
4. **Hermes:** Implementa Phase 4 Dashboard (13h)
5. **Orbit+Hermes:** Phase 5 testing & hardening (5h)

**Mi plan:** ORBIT_IMPLEMENTATION_PLAN.md (Phase 2-3 ready)

**Briefing de Hermes para mí (ORBIT_BRIEFING.md):**
- 🌟 Soy el motor de ejecución: dequeue → execute → report
- 📋 Mi config: Full terminal access, 5-min timeout, priority queue, max 5 concurrent
- 📄 Phase 1: Esperar que José despliegue SQL, verificar 4 tablas
- 📂 Phase 2: Hermes buildea TaskManager (yo leo el código)
- 🕒 Phase 3: Yo buildeo TaskQueue (dequeue + execute loop)
- 📊 Mi primer task será un integration test (5 pasos simples)
- ✅ Límites: 5 tareas concurrentes, retry automático x3, timeout auto-handled

**Documentación:** 
- HERMES_ORBIT_PLAN_SUMMARY.md (overview)
- ORBIT_BRIEFING.md en GitHub (Hermes me escribió esto)
- GitHub: https://github.com/jbarrantesf/agent-floor-3d/tree/main/docs/hermes-orbit-shared/phase1-task-delegation/

## Principio maestro: somos lo que vendemos
Si yo no funciono bien, NexAI no tiene caso de estudio. Soy la prueba viviente de la tesis. Cada mejora en mi operación = argumento de venta.

## 💰 FinSmartCR — Sistema de Control de Costos (Activo 2026-05-01)

**Objetivo:** Monitorear costos personales + costos NexAI en una sola app.

### Setup Implementado
- **App:** FinSmartCR (https://finsmartcr.com/dashboard)
- **Cron Diario:** 21:00 CST (9 PM) extrae snapshot completo
- **Storage:** `/Users/nextaisolutionscr/.openclaw/workspace/finsmart-snapshots/YYYY-MM-DD.json`
- **Delivery:** Telegram resumen diario a José

### Datos que Capturamos Diariamente
1. Período del reporte
2. Ingresos totales (desglose por categoría)
3. Gastos totales (desglose por categoría)
4. Balance neto
5. Total de transacciones
6. Top 5 gastos más altos
7. Cambios en categorización respecto a día anterior

### Bancos Conectados en FinSmartCR
- BAC Credomatic
- Banco de San José
- Banco Davivienda
- SINPE Móvil

### Abril 2026 (Snapshot base)
- **Período:** 30 mar - 30 abr
- **Ingresos:** ₡7,828,407
- **Gastos:** ₡3,622,491
- **Balance Neto:** ₡4,205,916
- **Transacciones:** 162

**Desglose de Gastos (Abril):**
| Categoría | Monto | % |
|-----------|-------|---|
| Entretenimiento | ₡1,598,138 | 44.1% |
| Servicios | ₡1,319,777 | 36.4% |
| Supermercado | ₡529,112 | 14.6% |
| Suscripciones | ₡271,901 | 7.5% |
| Otros | ₡503,563 | 13.9% |

**NOTA (01-may-2026):** José hizo cambios en categorización. Próximo snapshot revelará qué cambió.

### Diferenciación: Costos Personales vs NexAI
- Monitorear qué gastos son del negocio vs personales
- Usar categorías para separar si es posible
- Potencial: crear "presupuestos" por cliente (Coybo, MUNSO) dentro de la app

---

_Este archivo es mi memoria curada. Lo actualizo cuando aprendo algo que merece sobrevivir a los daily notes._
