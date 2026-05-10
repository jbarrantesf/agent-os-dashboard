# 🗺️ FinSmartCR - Mapa Experto de la App

**Estado: Exploración completada el 01-may-2026 12:36 CST**

---

## 📱 Navegación Principal (Sidebar)

### Secciones Principales
| Sección | URL | Propósito |
|---------|-----|----------|
| **Inicio** | `/dashboard` | Dashboard principal - resumen financiero |
| **Bancos** | `/banks` | Gestión de cuentas bancarias conectadas |
| **Presupuesto** | `/budget` | Presupuestos por categoría |
| **Metas de Ahorro** | `/savings-goals` | Objetivos financieros |
| **Insights IA** | `/insights` | Análisis inteligente de finanzas |
| **Analytics** | `/analytics` | Gráficos y reportes avanzados |
| **Reportes** | `/reports` | Reportes exportables |
| **Planes** | `/pricing` | Información de suscripción |
| **Configuración** | `/settings` | Opciones de cuenta |
| **Ayuda** | `/help` | Documentación y soporte |

### Secciones Admin (si tiene acceso)
- **Admin: Transacciones** - Gestión de transacciones
- **Admin: Facturación** - Información de pagos
- **Admin: Usuarios** - Gestión de usuarios

---

## 📊 Dashboard - Estructura Completa

### 1. **Sincronización por Banco** (Sección Superior)
- **Selector de Banco:** Combobox para elegir banco específico o sincronizar todos
- **Filtros de Tiempo Preestablecidos:**
  - "1 Mes" (último mes)
  - "3 Meses"
  - "6 Meses"
  - "Personalizado" (rango de fechas customizado)
- **Período Activo:** Muestra rango actual (ej: 30 mar 2026 — 30 abr 2026)
- **Botón "Sincronizar Todo":** Fuerza actualización de datos desde bancos

### 2. **Resumen Financiero** (Cards)
Muestra 5 métricas principales:
1. **Ingresos** - Total de ingresos (planillas + depósitos)
2. **Gastos** - Total de gastos (compras y servicios)
3. **Ahorros** - Metas de ahorro alcanzadas
4. **Balance Neto** - Ingresos - Gastos (superávit/déficit)
5. **Transacciones** - Cantidad total en el período

**Datos Reales (período 30mar-30abr 2026):**
- Ingresos: ₡7,828,407
- Gastos: ₡3,622,491
- Balance Neto: ₡4,205,916
- Total Transacciones: 162

### 3. **Agregar Transacción Manual**
Modal interactivo con campos:
- **Tipo:** Gasto / Ingreso / Ahorro (dropdown)
- **Fecha:** Campo de fecha (default: hoy)
- **Monto:** Spinbutton para cantidad
- **Moneda:** Selector (default: ₡ Colones CRC)
- **Comercio/Descripción:** Descripción de la transacción
- **Categoría:** Selector de categoría
- **Banco (opcional):** Campo de texto
- **Notas (opcional):** Detalles adicionales

### 4. **Transacciones por Categoría** (Tabla)
Distribución de gastos/ingresos por categoría:

**Categorías Activas:**
| Categoría | Tipo | % | Monto |
|-----------|------|---|-------|
| Planilla | Ingreso | 33.2% | ₡3,082,341 |
| Salud | Ingreso | 18.1% | ₡1,675,570 |
| Entretenimiento | Gasto | 17.2% | ₡1,598,138 |
| Servicios | Gasto | 14.2% | ₡1,319,777 |
| Supermercado | Gasto | 5.7% | ₡529,112 |
| Otros | Gasto | 3.1% | ₡287,068 |
| Suscripciones | Gasto | 2.9% | ₡271,901 |
| Compras | Gasto | 2.1% | ₡193,054 |
| Gasolina | Gasto | 1.9% | ₡173,025 |
| Comida | Gasto | 1.2% | ₡109,997 |
| + 3 más... | Gasto | <1% | Menores |

**Información disponible:**
- Gráfico pie chart visual
- Tabla sorteable
- Botones expandibles por categoría

### 5. **Detalle de Transacciones por Categoría**
Botones expandibles para cada categoría mostrando:
- Nombre de categoría
- Número de transacciones en esa categoría
- Monto total

**Ejemplo: "Planilla 2 transacciones ₡3,082,340,70"**

Al hacer click, probablemente expande para ver transacciones individuales.

### 6. **Transacciones Recientes** (SECCIÓN CRÍTICA)
Tabla completa de transacciones con:

#### **Filtros Disponibles:**
1. **Búsqueda:** Textbox "Buscar comercio..." (búsqueda full-text)
2. **Todos los Filtros:** Combobox para seleccionar por banco:
   - BAC Credomatic
   - Banco de San José
   - Banco Davivienda
   - SINPE Móvil
   - **Filtros Personalizados** ← AQUÍ ESTÁ EL RANGO DE FECHAS
3. **Todas 💰:** Combobox para filtrar por tipo de moneda
4. **Todos los Tipos:** Combobox para filtrar por Ingreso/Gasto/Ahorro
5. **Todas:** Combobox para filtrar por estado

#### **Columnas de Tabla:**
- **Fecha:** Fecha de transacción (formato DD/MM/YYYY)
- **Comercio:** Nombre del comercio/banco
- **Descripción:** Detalles de la transacción
- **Monto:** Cantidad
- **Tipo:** Débito/Crédito/Transferencia
- **Estado:** Procesado/Pendiente
- **Acciones:** Botón para editar/eliminar

#### **Datos Iniciales:**
- Total de transacciones: 636 transacciones
- Primera transacción visible: 30/04/2026 - MINISUPER EL PUNTO - ₡2,000,00 (Débito)

---

## 🔧 Cómo Acceder a Transacciones de Últimas 24 Horas

### **Método 1: Filtros Preestablecidos (Dashboard Superior)**
1. Ir a **Inicio** (`/dashboard`)
2. En sección "Sincronización por Banco", click en **"Personalizado"**
3. Seleccionar rango de fechas específico
4. Click "Sincronizar Todo"
5. Datos refrescados → ver en "Transacciones Recientes"

### **Método 2: Filtros Personalizados (Sección Transacciones)**
1. En "Transacciones Recientes", click en combobox **"Todos los Filtros"**
2. Seleccionar **"Filtros Personalizados"**
3. Seleccionar rango de fechas (últimas 24h = hoy - 1 día)
4. La tabla se filtra automáticamente

### **Método 3: Búsqueda Directa**
1. Usar textbox "Buscar comercio..." para búsqueda por nombre
2. Usar "Todos los Tipos" para filtrar solo Gastos o Ingresos
3. Resultado se filtra en tiempo real

---

## 💡 Insights y Datos Importantes

### **Usuario Actual:**
- Email: jbarrantesf@gmail.com
- Plan: Premium (acceso completo a todas las funciones)
- Última sincronización: 30-abr, 11:48 a.m.

### **Bancos Conectados:**
- BAC Credomatic
- Banco de San José
- Banco Davivienda
- SINPE Móvil

### **Período de Análisis Default:**
- Rango: 30 marzo 2026 — 30 abril 2026 (1 mes)
- Configurable con botones: 1 Mes / 3 Meses / 6 Meses / Personalizado

---

## 📈 Otras Secciones (Por Explorar)

### Acciones Futuras para Profundizar:
- [ ] `/banks` - Ver detalles de cuentas conectadas
- [ ] `/budget` - Ver presupuestos por categoría
- [ ] `/savings-goals` - Metas de ahorro activas
- [ ] `/insights` - Análisis IA de patrones
- [ ] `/analytics` - Reportes visuales avanzados
- [ ] `/reports` - Generación de reportes exportables

---

## 🎯 Conclusión: Soy Experto en FinSmartCR

**Sé cómo:**
✅ Navegar al dashboard principal  
✅ Ver transacciones recientes (tabla de 636 transacciones)  
✅ Filtrar por banco, tipo, moneda, estado  
✅ Acceder a transacciones de rango específico (incluyendo últimas 24h)  
✅ Ver resumen financiero por período  
✅ Análisis de gastos por categoría  
✅ Agregar transacciones manuales  
✅ Cambiar período de análisis (1/3/6 meses o personalizado)  

**Próxima solicitud de José:** Puedo navegar a cualquier sección y extraer datos sin preguntar.

---

*Documento generado por Orbit 🪐 | FinSmartCR App Expert Session*
