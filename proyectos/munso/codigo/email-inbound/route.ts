/**
 * apps/web/src/app/api/webhooks/email-inbound/route.ts
 *
 * Webhook receptor de correos inbound via Postmark.
 * Paso 1 del proceso CxC Canal Moderno — extracción de avisos de pago.
 *
 * Flujo:
 *   1. Postmark POST → verificar token
 *   2. Identificar cliente Canal Moderno (por remitente o contenido)
 *   3. Claude Haiku extrae: cliente, monto, facturas, NC
 *   4. Crear agent_proposal con status 'pending' (agente: 'inbox')
 *   5. Supabase Realtime notifica el dashboard automáticamente
 *
 * Variables de entorno requeridas:
 *   POSTMARK_SERVER_TOKEN   → token del servidor Postmark (para verificar autenticidad)
 *   ANTHROPIC_API_KEY       → ya existe
 *   NEXT_PUBLIC_SUPABASE_URL → ya existe
 *   SUPABASE_SERVICE_ROLE_KEY → ya existe
 */

import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'

// ─── Tipos Postmark Inbound ────────────────────────────────────────────────────

type PostmarkAddress = {
  Email: string
  Name: string
  MailboxHash: string
}

type PostmarkAttachment = {
  Name: string
  Content: string        // base64
  ContentType: string
  ContentLength: number
}

type PostmarkInboundPayload = {
  From: string
  FromFull: PostmarkAddress
  To: string
  ToFull: PostmarkAddress[]
  Cc: string
  CcFull: PostmarkAddress[]
  Subject: string
  TextBody: string
  HtmlBody: string
  StrippedTextReply: string
  Date: string           // ej: "Thu, 24 Apr 2026 10:30:00 -0600"
  MessageID: string
  Attachments: PostmarkAttachment[]
  RawEmail: string       // raw MIME (activado en Postmark settings)
}

// ─── Mapeo de remitentes conocidos → código Softland ─────────────────────────
// Completar con los emails reales de cada cliente a medida que se confirmen con Georgina.
// La clave puede ser dominio (@walmart.com) o email exacto (pagos@automercado.cr).

const REMITENTES_CANAL_MODERNO: Record<string, { codigo: string; nombre: string }> = {
  // Walmart / CSU
  'wm-proveedores@walmart.com':           { codigo: '0442', nombre: 'Walmart (CSU)' },
  '@walmart.com':                          { codigo: '0442', nombre: 'Walmart (CSU)' },
  // AutoMercado
  '@automercado.cr':                       { codigo: '0404', nombre: 'AutoMercado S.A.' },
  'cxp@automercado.cr':                    { codigo: '0404', nombre: 'AutoMercado S.A.' },
  // Megasuper
  '@megasuper.com':                        { codigo: '0459', nombre: 'Megasuper S.A.' },
  // GESSA
  '@gessa.com':                            { codigo: '0486', nombre: 'GESSA (Grupo Empresarial)' },
  // CompréBien / N S.A.
  '@comprebien.com':                       { codigo: '0502', nombre: 'Compré Bien' },
  // El Colono
  '@elcolono.com':                         { codigo: '0336', nombre: 'Almacenes El Colono S.A.' },
  // Construplaza
  '@construplaza.com':                     { codigo: '1380', nombre: 'Construplaza S.A.' },
  // CEFA
  '@grupodokka.com':                       { codigo: '1500', nombre: 'CEFA Central Farmacéutica' },
  // Ferretería EPA
  '@epa.com.cr':                           { codigo: '0378', nombre: 'Ferretería EPA S.A.' },
  // AMPM
  '@ampm.cr':                              { codigo: '0503', nombre: 'AMPM (Inversiones AMPM)' },
  // Comapan (reenvío desde pedidos@munso.net — manejado internamente)
}

// ─── Identificar cliente por remitente ────────────────────────────────────────

function identificarCliente(fromEmail: string): { codigo: string; nombre: string } | null {
  const email = fromEmail.toLowerCase()

  // Buscar match exacto primero
  if (REMITENTES_CANAL_MODERNO[email]) {
    return REMITENTES_CANAL_MODERNO[email]
  }

  // Buscar match por dominio
  for (const [patron, cliente] of Object.entries(REMITENTES_CANAL_MODERNO)) {
    if (patron.startsWith('@') && email.endsWith(patron)) {
      return cliente
    }
  }

  return null // Remitente desconocido → Claude lo intenta identificar por contenido
}

// ─── Extracción con Claude Haiku ──────────────────────────────────────────────

type PagoExtraido = {
  cliente_codigo: string | null
  cliente_nombre: string | null
  monto_total: number | null
  moneda: 'CRC' | 'USD' | null
  fecha_pago: string | null          // ISO date YYYY-MM-DD
  referencia_banco: string | null    // número de transferencia o cheque
  facturas: Array<{
    numero: string
    monto: number | null
    orden_compra: string | null
    notas: string | null
  }>
  notas_credito: Array<{
    numero: string
    monto: number | null
    tipo: 'devolucion' | 'dinamica_comercial' | 'pronto_pago' | 'otro'
  }>
  requiere_revision: boolean
  motivo_revision: string | null
  confianza: 'alta' | 'media' | 'baja'
}

async function extraerConHaiku(
  anthropic: Anthropic,
  payload: PostmarkInboundPayload,
  clientePreidentificado: { codigo: string; nombre: string } | null,
): Promise<PagoExtraido> {
  const contextoCliente = clientePreidentificado
    ? `El cliente ha sido identificado como: ${clientePreidentificado.nombre} (código Softland: ${clientePreidentificado.codigo}).`
    : 'El cliente NO pudo identificarse por remitente. Intenta identificarlo por el contenido del correo.'

  const cuerpoEmail = payload.TextBody || payload.HtmlBody || '(sin cuerpo)'

  const prompt = `Eres un extractor de datos financieros para el sistema AIOS de Munso Importaciones S.A. (Costa Rica).

Tu tarea: extraer la información estructurada de un aviso de pago de un cliente Canal Moderno.

${contextoCliente}

EMAIL:
- De: ${payload.FromFull.Name} <${payload.FromFull.Email}>
- Fecha: ${payload.Date}
- Asunto: ${payload.Subject}
- Adjuntos: ${payload.Attachments.map(a => a.Name).join(', ') || 'ninguno'}

CUERPO:
${cuerpoEmail.substring(0, 4000)}

Extrae SOLO lo que está explícitamente en el correo. Si un campo no está presente, usa null.
Responde ÚNICAMENTE con un JSON válido con esta estructura exacta:

{
  "cliente_codigo": "código Softland o null",
  "cliente_nombre": "nombre completo o null",
  "monto_total": 123456.78,
  "moneda": "CRC" o "USD",
  "fecha_pago": "YYYY-MM-DD",
  "referencia_banco": "número de transferencia/cheque o null",
  "facturas": [
    { "numero": "FC-0001", "monto": 50000.00, "orden_compra": "OC-123 o null", "notas": null }
  ],
  "notas_credito": [
    { "numero": "NC-0001", "monto": 5000.00, "tipo": "devolucion" }
  ],
  "requiere_revision": true/false,
  "motivo_revision": "Explicar si requiere revisión manual, null si no",
  "confianza": "alta/media/baja"
}

Para "tipo" de nota de crédito usa: devolucion | dinamica_comercial | pronto_pago | otro`

  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''

  // Limpiar posible markdown code block
  const jsonClean = text.replace(/```(?:json)?/g, '').replace(/```/g, '').trim()

  try {
    return JSON.parse(jsonClean) as PagoExtraido
  } catch {
    // Si Haiku falla al parsear, devolvemos estructura mínima para revisión manual
    return {
      cliente_codigo: clientePreidentificado?.codigo ?? null,
      cliente_nombre: clientePreidentificado?.nombre ?? null,
      monto_total: null,
      moneda: null,
      fecha_pago: null,
      referencia_banco: null,
      facturas: [],
      notas_credito: [],
      requiere_revision: true,
      motivo_revision: 'Error al parsear respuesta de IA — revisión manual requerida',
      confianza: 'baja',
    }
  }
}

// ─── POST handler ─────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    // ── 1. Verificar token Postmark ─────────────────────────────────────────
    const postmarkToken = request.headers.get('X-Postmark-Server-Token')
    const expectedToken = process.env.POSTMARK_SERVER_TOKEN

    if (!expectedToken || postmarkToken !== expectedToken) {
      console.warn('[EmailInbound] Token inválido o faltante')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // ── 2. Parsear payload Postmark ─────────────────────────────────────────
    const payload = await request.json() as PostmarkInboundPayload

    console.log(`[EmailInbound] Correo recibido — De: ${payload.FromFull.Email} | Asunto: ${payload.Subject}`)

    // ── 3. Verificar variables de entorno ───────────────────────────────────
    const anthropicApiKey        = process.env.ANTHROPIC_API_KEY
    const supabaseUrl            = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!anthropicApiKey || !supabaseUrl || !supabaseServiceRoleKey) {
      console.error('[EmailInbound] Variables de entorno faltantes')
      return NextResponse.json({ error: 'Configuración incompleta' }, { status: 500 })
    }

    // ── 4. Identificar cliente por remitente ────────────────────────────────
    const clienteIdentificado = identificarCliente(payload.FromFull.Email)

    // ── 5. Extraer datos con Claude Haiku ───────────────────────────────────
    const anthropic = new Anthropic({ apiKey: anthropicApiKey })
    const pago = await extraerConHaiku(anthropic, payload, clienteIdentificado)

    console.log(`[EmailInbound] Extracción completada — Cliente: ${pago.cliente_nombre} | Monto: ${pago.monto_total} | Confianza: ${pago.confianza}`)

    // ── 6. Crear agent_proposal en Supabase ─────────────────────────────────
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { persistSession: false },
    })

    // Tenant Munso (UUID fijo del seed)
    const TENANT_ID = '00000000-0000-0000-0000-000000000001'

    const tituloPropuesta = pago.cliente_nombre
      ? `Aviso de pago — ${pago.cliente_nombre}${pago.monto_total ? ` — ${pago.moneda} ${pago.monto_total.toLocaleString('es-CR')}` : ''}`
      : `Correo de pago sin identificar — ${payload.FromFull.Email}`

    const resumenEjecutivo = pago.requiere_revision
      ? `⚠️ Revisión manual requerida: ${pago.motivo_revision ?? 'datos incompletos'}. Correo de ${payload.FromFull.Email} con asunto "${payload.Subject}".`
      : `Aviso de pago de ${pago.cliente_nombre} por ${pago.moneda} ${pago.monto_total?.toLocaleString('es-CR') ?? '?'}. ${pago.facturas.length} facturas detectadas. Confianza: ${pago.confianza}.`

    const { data: rawProposal, error: errProposal } = await supabase
      .from('agent_proposals')
      .insert({
        tenant_id: TENANT_ID,
        agente: 'inbox',
        status: 'pending',
        titulo: tituloPropuesta,
        descripcion: `Correo recibido el ${payload.Date} de ${payload.FromFull.Name} <${payload.FromFull.Email}>.\nAsunto: ${payload.Subject}`,
        resumen_ejecutivo: resumenEjecutivo,
        prioridad: pago.requiere_revision ? 'alta' : 'media',
        payload: {
          pago_extraido: pago,
          email_original: {
            from: payload.FromFull,
            subject: payload.Subject,
            date: payload.Date,
            message_id: payload.MessageID,
            adjuntos: payload.Attachments.map(a => ({ nombre: a.Name, tipo: a.ContentType, bytes: a.ContentLength })),
          },
        },
        metadata: {
          fuente: 'postmark_inbound',
          message_id: payload.MessageID,
          remitente: payload.FromFull.Email,
          cliente_preidentificado: clienteIdentificado?.codigo ?? null,
          confianza_extraccion: pago.confianza,
        },
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 días
      })
      .select('id')
      .single()

    if (errProposal) {
      console.error('[EmailInbound] Error al crear propuesta:', errProposal.message)
      return NextResponse.json({ error: errProposal.message }, { status: 500 })
    }

    const proposal = rawProposal as unknown as { id: string }

    // ── 7. Registrar en audit_log ───────────────────────────────────────────
    await supabase.from('audit_log').insert({
      tenant_id: TENANT_ID,
      tipo_evento: 'email_inbound_procesado',
      agente: 'inbox',
      proposal_id: proposal.id,
      descripcion: `Correo de pago recibido y procesado. Remitente: ${payload.FromFull.Email}. Cliente: ${pago.cliente_nombre ?? 'no identificado'}. Propuesta creada: ${proposal.id}`,
      resultado: 'success',
    })

    console.log(`[EmailInbound] Propuesta creada: ${proposal.id}`)

    // ── 8. Responder a Postmark (siempre 200, o reintenta indefinidamente) ──
    return NextResponse.json({
      status: 'procesado',
      proposal_id: proposal.id,
      cliente: pago.cliente_nombre,
      confianza: pago.confianza,
      requiere_revision: pago.requiere_revision,
    })
  } catch (err) {
    const mensaje = err instanceof Error ? err.message : 'Error desconocido'
    console.error('[EmailInbound] Error no controlado:', mensaje)
    // Retornar 200 de todas formas — si retornamos 5xx Postmark reintenta (puede crear duplicados)
    return NextResponse.json({ status: 'error_interno', mensaje }, { status: 200 })
  }
}
