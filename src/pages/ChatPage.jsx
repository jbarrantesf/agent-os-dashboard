import React, { useState, useRef, useEffect } from 'react'
import { Send, Zap, Bot, Paperclip, Mic, MoreVertical, Info } from 'lucide-react'

const INITIAL_MESSAGES = [
  {
    id: 1,
    role: 'agent',
    text: '¡Hola José! Soy **Hermes NEXAI**, tu socio operativo. Estoy conectado y listo.\n\nPuedes asignarme tareas, preguntarme por el estado de proyectos, pedirme que coordine con ORBIT, o simplemente trabajar conmigo desde aquí.\n\n¿En qué trabajamos hoy?',
    time: new Date().toLocaleTimeString('es-CR', { hour: '2-digit', minute: '2-digit' }),
    model: 'claude-sonnet-4-6',
  }
]

const QUICK_ACTIONS = [
  '¿Cuánto llevamos gastado este mes?',
  'Estado actual de proyectos activos',
  'Delega tarea a ORBIT',
  'Genera reporte de costos ahora',
]

const TypingIndicator = () => (
  <div className="flex items-start gap-3">
    <div style={{
      width: 32, height: 32, borderRadius: 10, flexShrink: 0,
      background: '#3b82f620',
      border: '1px solid #3b82f640',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <Zap size={14} style={{ color: '#3b82f6' }} />
    </div>
    <div className="chat-bubble-agent flex items-center gap-1" style={{ padding: '12px 16px' }}>
      <div className="typing-dot" />
      <div className="typing-dot" />
      <div className="typing-dot" />
    </div>
  </div>
)

const Message = ({ msg }) => {
  const isUser = msg.role === 'user'

  // Simple markdown-ish renderer
  const renderText = (text) => {
    return text.split('\n').map((line, i) => {
      const formatted = line
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/`(.*?)`/g, '<code style="background:#ffffff15;padding:2px 5px;border-radius:4px;font-family:monospace;font-size:12px">$1</code>')
      return (
        <span key={i}>
          <span dangerouslySetInnerHTML={{ __html: formatted }} />
          {i < text.split('\n').length - 1 && <br />}
        </span>
      )
    })
  }

  return (
    <div className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      {!isUser && (
        <div style={{
          width: 32, height: 32, borderRadius: 10, flexShrink: 0,
          background: '#3b82f620',
          border: '1px solid #3b82f640',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Zap size={14} style={{ color: '#3b82f6' }} />
        </div>
      )}
      <div style={{ maxWidth: '78%' }}>
        {!isUser && (
          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4, fontFamily: 'monospace' }}>
            HERMES · {msg.model} · {msg.time}
          </div>
        )}
        <div className={isUser ? 'chat-bubble-user' : 'chat-bubble-agent'}>
          {renderText(msg.text)}
        </div>
        {isUser && (
          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4, textAlign: 'right' }}>
            {msg.time}
          </div>
        )}
      </div>
    </div>
  )
}

export default function ChatPage() {
  const [messages, setMessages] = useState(INITIAL_MESSAGES)
  const [input, setInput] = useState('')
  const [typing, setTyping] = useState(false)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, typing])

  const sendMessage = (text) => {
    if (!text.trim()) return

    const userMsg = {
      id: Date.now(),
      role: 'user',
      text: text.trim(),
      time: new Date().toLocaleTimeString('es-CR', { hour: '2-digit', minute: '2-digit' }),
    }

    setMessages(prev => [...prev, userMsg])
    setInput('')
    setTyping(true)

    // Simulate agent response (replace with real API call to Hermes/backend)
    setTimeout(() => {
      setTyping(false)
      const responses = {
        'cuánto llevamos gastado': '💰 Este mes llevamos **$1.84 USD** de un budget de $100.\n\nDesglose:\n- claude-sonnet-4-6: $1.21\n- gpt-4o-mini (crons): $0.63\n\nEstás en buen ritmo — proyección mensual: ~$4.50.',
        'estado actual': '📊 **Proyectos activos:**\n\n- **Coybo**: En producción ✅\n- **MUNSO**: Fase 2, en progreso 🔄\n- **agent-os-dashboard**: Torre de Control v2 en build 🚀\n- **nexai-orchestrator-v2**: Supabase configurado ✅\n\n¿Quieres más detalle de alguno?',
        'delega': '🤖 Listo. ¿Qué tarea delegamos a ORBIT?\n\nDime qué necesitas y lo proceso: código, CLI, GitHub, Supabase, research...',
        'reporte': '⏳ Generando reporte de costos ahora...\n\nEsto normalmente toma 30-60 segundos. Te mando el resultado aquí y a Telegram.',
      }

      const lower = text.toLowerCase()
      let reply = null
      for (const [key, val] of Object.entries(responses)) {
        if (lower.includes(key)) { reply = val; break }
      }
      if (!reply) {
        reply = `Recibido: *"${text}"*\n\nEn producción esto iría a la API de Hermes para procesarlo en tiempo real. Por ahora el chat está en modo demo — pronto lo conectamos al backend. 🚧`
      }

      setMessages(prev => [...prev, {
        id: Date.now(),
        role: 'agent',
        text: reply,
        time: new Date().toLocaleTimeString('es-CR', { hour: '2-digit', minute: '2-digit' }),
        model: 'claude-sonnet-4-6',
      }])
    }, 1500 + Math.random() * 1000)
  }

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  return (
    <div className="flex flex-col h-full" style={{ maxHeight: 'calc(100vh - 56px)' }}>
      {/* Chat header */}
      <div
        className="flex items-center justify-between px-6 py-3 flex-shrink-0"
        style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border)' }}
      >
        <div className="flex items-center gap-3">
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: '#3b82f620',
            border: '1px solid #3b82f640',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Zap size={16} style={{ color: '#3b82f6' }} />
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>Hermes NEXAI</div>
            <div className="flex items-center gap-1">
              <span className="status-dot online" style={{ width: 6, height: 6 }} />
              <span style={{ fontSize: 11, color: 'var(--accent-green)' }}>Online · claude-sonnet-4-6</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="badge badge-blue" style={{ fontSize: 10 }}>Orquestador</span>
          <button style={{
            background: 'transparent', border: 'none',
            color: 'var(--text-muted)', cursor: 'pointer', padding: 4,
          }}>
            <MoreVertical size={16} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map(msg => <Message key={msg.id} msg={msg} />)}
        {typing && <TypingIndicator />}
        <div ref={bottomRef} />
      </div>

      {/* Quick actions */}
      <div
        className="flex gap-2 px-4 py-2 overflow-x-auto flex-shrink-0"
        style={{ borderTop: '1px solid var(--border)', background: 'var(--bg-secondary)' }}
      >
        {QUICK_ACTIONS.map(action => (
          <button
            key={action}
            onClick={() => sendMessage(action)}
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: 20,
              padding: '5px 12px',
              fontSize: 12,
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              flexShrink: 0,
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#3b82f640'; e.currentTarget.style.color = 'var(--text-primary)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-secondary)' }}
          >
            {action}
          </button>
        ))}
      </div>

      {/* Input */}
      <div
        className="flex items-end gap-3 px-4 py-3 flex-shrink-0"
        style={{ background: 'var(--bg-secondary)', borderTop: '1px solid var(--border)' }}
      >
        <button style={{ color: 'var(--text-muted)', cursor: 'pointer', background: 'none', border: 'none', padding: '0 4px', flexShrink: 0 }}>
          <Paperclip size={18} />
        </button>
        <div style={{ flex: 1, position: 'relative' }}>
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Escríbele a Hermes... (Enter para enviar)"
            rows={1}
            style={{
              width: '100%',
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: 12,
              padding: '10px 14px',
              color: 'var(--text-primary)',
              fontSize: 14,
              resize: 'none',
              outline: 'none',
              fontFamily: 'inherit',
              lineHeight: 1.5,
              maxHeight: 120,
              overflow: 'auto',
            }}
            onFocus={e => { e.currentTarget.style.borderColor = '#3b82f660' }}
            onBlur={e => { e.currentTarget.style.borderColor = 'var(--border)' }}
          />
        </div>
        <button
          onClick={() => sendMessage(input)}
          disabled={!input.trim()}
          style={{
            width: 40, height: 40, borderRadius: 12, flexShrink: 0,
            background: input.trim() ? 'var(--accent-blue)' : 'var(--bg-card)',
            border: `1px solid ${input.trim() ? 'var(--accent-blue)' : 'var(--border)'}`,
            color: input.trim() ? '#fff' : 'var(--text-muted)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: input.trim() ? 'pointer' : 'not-allowed',
            transition: 'all 0.2s',
          }}
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  )
}
