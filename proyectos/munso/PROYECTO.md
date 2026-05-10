# MUNSO Importaciones S.A. — Proyecto AIOS CxC

## Resumen ejecutivo
Transformación del proceso de Cuentas por Cobrar (CxC) con IA. Foco inicial: Canal Moderno (clientes clase A — Walmart, AutoMercado, AMPM, Megasuper, GESSA, etc.). El agente IA reemplaza tareas manuales de conciliación, monitoreo de SLA, estimaciones y bitácoras.

---

## Contactos clave

| Nombre | Rol | Email |
|---|---|---|
| Georgina Sibaja | CxC / operativa principal | georgina.sibaja@munso.net |
| Kenneth Cubero Castro | Gerente TI & Logística | kenneth.cubero@munso.net |
| Fabiola Esquivel | CxC | fabiola.esquivel@munso.net |
| Erik Muñoz | (recibe avisos Walmart) | — |
| Roynier | (recibe avisos Megasuper) | — |
| Paulo Vargas | Mercadeo (aprueba NC) | paulo.vargas@munso.net |
| Heiner Núñez | Gerente Comercial | heiner.nunez@munso.net |

---

## Estructura de pagos

| Milestone | Descripción | Fecha | % |
|---|---|---|---|
| Kickoff | Ejecutado ✅ Pagado ✅ | 15 abr 2026 | 40% |
| MVP validado | Demo funcional aprobada | 20 jun 2026 | 30% |
| Go-Live | Sistema en producción | 7 ago 2026 | 30% |

---

## Cronograma

| Fase | Actividad | Fechas | Estado |
|---|---|---|---|
| Fase 0 | Alineación estratégica, kickoff, KPIs | 15–17 abr 2026 | ✅ Completo |
| Fase 1 (Parte 1) | Fundación técnica, arquitectura, accesos | 20 abr – 2 may 2026 | 🔄 EN CURSO |
| Pausa | — | 3–8 may 2026 | — |
| Fase 1 (Parte 2) | Reglas de negocio, validación funcional | 11–16 may 2026 | Pendiente |
| Fase 2 (Parte 1) | Construcción del agente, integración | 18 may – 5 jun 2026 | Pendiente |
| Fase 2 (Parte 2) | Ajustes, demo, cierre MVP | 8–20 jun 2026 | Pendiente |
| Pausa | — | 27 jun – 18 jul 2026 | — |
| Fase 3 | Validación con casos reales, KPIs | 20–31 jul 2026 | Pendiente |
| Fase 4 | Go-Live, capacitación, despliegue | 3–7 ago 2026 | Pendiente |
| Fase 5 | Estabilización, soporte, cierre | 10 ago – 4 sep 2026 | Pendiente |

---

## Stack técnico

- **Frontend/Backend:** Next.js + Vercel
- **Base de datos:** Supabase (PostgreSQL)
- **ERP:** Softland SQL Server 2012 (Windows Server 2012, mismo servidor)
- **Código:** GitHub
- **Agente:** Claude Code / Claude Managed Agents
- **Sync:** Sync Service nocturno (corre 10:30pm, post-backup de Softland que corre 6pm-9pm)
- **Conexión Softland:** localhost, usuario solo lectura `aios_sync_reader`, ngrok para acceso externo (puerto puede cambiar — confirmar con Kenneth)

### Entorno Munso (IT)
- Windows Server 2012 + SQL Server 2012
- Sin proxy corporativo
- 100MB banda, estable
- Kenneth Cubero: único aprobador de cambios en servidores
- Backup: 6pm, dura ~3h → sync nocturno después de 9:30pm

---

## Arquitectura del sistema (AIOS)

### Dos mundos
- **Softland SQL Server** = fuente de verdad. NUNCA se escribe desde la app. Solo lectura.
- **Supabase PostgreSQL** = capa operativa: caché de Softland + estado del workflow + audit log

### Tablas principales en Supabase
- `softland_clientes` — espejo de clientes (caché)
- `softland_documentos_cc` — documentos CxC (facturas, NC, ND)
- `softland_facturas` — facturas con campos Canal Moderno (U_AD_WM_*, U_AD_AM_*)
- `softland_sync_log` — log de sincronizaciones
- `agent_proposals` — corazón del human-in-the-loop. Pendiente hasta que humano aprueba/rechaza
- `agent_proposal_items` — items granulares de una propuesta
- `audit_log` — inmutable. Todo lo que pasa queda registrado
- `notifications` — alertas en tiempo real (Supabase Realtime)
- `conciliacion_cm_sesiones` — cada ejecución del Agente Conciliador
- `conciliacion_cm_items` — cada factura individual en proceso de conciliación
- `sla_pasos` — 14 pasos del proceso CxC con SLAs en horas
- `sla_tracking` — estado actual de cada paso (actualiza cada 30 min)

### Tablas clave en Softland (SQL Server)
- `FACTURA` — cabecera de facturas. Campos críticos Canal Moderno: `U_AD_WM_*` (Walmart), `U_AD_AM_*` (AutoMercado)
- `FACTURA_LINEA` — líneas de factura
- `DOCUMENTOS_CC` — estado de todos los documentos CxC
- `alCXC_PEN_COB` — vista de aging (documentos con saldo pendiente)
- `alCXC_DOC_APL` — documentos aplicados (pagos cruzados contra facturas)
- `CLIENTE` — maestro de clientes

---

## Agentes definidos

| Agente | Función |
|---|---|
| **Conciliador** | Concilia pagos Canal Moderno (Paso 10). Lee reporte del cliente, cruza contra Softland, propone aplicación de facturas |
| **Monitor SLA** | Vigila los 14 pasos del proceso CxC. Emite alertas cuando se acerca/supera el SLA |
| **Estimaciones** | Proyecta recuperación de cartera por cliente/mes |
| **Reportero** | Genera reportes consolidados |
| **Bitácoras** | Historial de interacciones con clientes |
| **Inbox** | Unificador de mensajes entrantes |

---

## Proceso manual actual (Canal Moderno) — lo que automatizamos

1. Recibir aviso de pago por correo o portal del cliente
2. Registrar recibo en ERP (Softland)
3. Cruzar facturas y NC manualmente en Excel por cliente
4. Actualizar consolidado de conciliación por cliente
5. Gestionar notas de crédito (devoluciones, dinámicas comerciales, pronto pago) con Mercadeo/Ventas/Facturación
6. Marcar pestaña en verde cuando saldo = 0

### Clientes Canal Moderno
Walmart (CSU), AutoMercado, AMPM, Megasuper, GESSA, Compre Bien, El Colono, El Colono La Jungla, Construplaza, Delimart, El Rey, Ferretería EPA, CEFA, Comapan, Corp. El Lagar, Depósito Las Gravilias y otros.

### Caso especial Walmart
Desde nov 2025, por error de ₡11,976,908.74 en NC de Fill Rate, los pagos NO se aplican a las facturas del detalle sino a las facturas más antiguas hasta donde alcance el saldo. Vigente hasta nuevo aviso de Gerencia General.

---

## KPIs de éxito

- Reducción de carga operativa en actividades manuales de conciliación
- Mejora en tiempos de conciliación y seguimiento
- Disminución de errores/retrabajos
- Nivel de adopción del equipo
- Cumplimiento de hitos de validación en operación real

---

## Riesgos activos

| Riesgo | Mitigación |
|---|---|
| Schema Softland no documentado | Exploración directa con Kenneth (ya en progreso) |
| Demora accesos/credenciales | Script SQL listo; NexAI asiste remoto |
| Pausas de agenda (may 3-8, jun 27-jul 18) | Cronograma ajustado para proteger hitos |
| SQL Server 2012 sin soporte Microsoft | Riesgo medio plazo — documentado |
| Walmart caso especial ₡11.9M | Procedimiento especial documentado en reglas del agente |

---

_Última actualización: 2026-04-24 | Orbit / NexAI Solutions CR_
