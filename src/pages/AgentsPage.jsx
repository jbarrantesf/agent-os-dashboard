import React, { useState, useEffect } from 'react'
import {
  Bot, Zap, Clock, CheckCircle, AlertCircle, Terminal,
  Activity, RefreshCw, ExternalLink, ChevronRight,
  Cpu, MessageSquare, GitBranch, Calendar
} from 'lucide-react'

const CRON_JOBS = [
  { id: 'fc8d', name: 'Reporte Diario Costos', schedule: '0 8 * * *', model: 'gpt-4o-mini', lastRun: 'hoy 08:01', status: 'ok', toolsets: ['terminal', 'file', 'skills'] },
  { id: 'ce68', name: 'Daily Sync Hermes↔ORBIT', schedule: '10 8 * * *', model: 'gpt-4o-mini', lastRun: 'hoy 08:22', status: 'ok', toolsets: ['terminal', 'file', 'skills'] },
  { id: '8623', name: 'ORBIT Cost Monitor', schedule: '10 8 * * 5', model: 'default', lastRun: '2026-05-08', status: 'ok', toolsets: [] },
  { id: 'b288', name: 'ORBIT Status Check', schedule: '10 8 * * 2', model: 'gpt-4o-mini', lastRun: '2026-05-06', status: 'ok', toolsets: ['terminal', 'file'] },
  { id: '4f10', name: 'Dashboard Tower Monitor', schedule: '10 8 * * 3', model: 'gpt-4o-mini', lastRun: 'hoy 09:00', status: 'ok', toolsets: ['file', 'terminal'] },
  { id: '5a7e', name: 'Infra Health Check', schedule: '10 8 * * 4', model: 'gpt-4o-mini', lastRun: 'hoy 08:55', status: 'ok', toolsets: ['terminal'] },
]

const AgentCard = ({ name, role, model, status, lastActivity, tasks, cost, color, icon: Icon, onChat }) => (
  <div className="glass-card p-5">
    {/* Header */}
    <div className="flex items-start justify-between mb-4">
      <div className="flex items-center gap-3">
        <div style={{
          width: 48, height: 48, borderRadius: 14,
          background: `${color}20`,
          border: `2px solid ${color}40`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: `0 0 20px ${color}20`,
        }}>
          <Icon size={22} style={{ color }} />
        </div>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>{name}</div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{role}</div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className={`status-dot ${status}`} />
        <span className={`badge ${status === 'online' ? 'badge-green' : status === 'busy' ? 'badge-amber' : 'badge-muted'}`}>
          {status === 'online' ? 'Online' : status === 'busy' ? 'Ocupado' : 'Offline'}
        </span>
      </div>
    </div>

    {/* Model */}
    <div className="flex items-center gap-2 mb-3">
      <Cpu size={12} style={{ color: 'var(--text-muted)' }} />
      <span style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'monospace' }}>{model}</span>
    </div>

    {/* Stats row */}
    <div className="grid grid-cols-3 gap-3 mb-4">
      <div style={{ textAlign: 'center', padding: '8px', background: 'var(--bg-secondary)', borderRadius: 8 }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'monospace' }}>{tasks}</div>
        <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>tareas hoy</div>
      </div>
      <div style={{ textAlign: 'center', padding: '8px', background: 'var(--bg-secondary)', borderRadius: 8 }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--accent-green)', fontFamily: 'monospace' }}>${cost}</div>
        <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>costo hoy</div>
      </div>
      <div style={{ textAlign: 'center', padding: '8px', background: 'var(--bg-secondary)', borderRadius: 8 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
          {lastActivity}
        </div>
        <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>última act.</div>
      </div>
    </div>

    {/* Action button */}
    <button
      onClick={onChat}
      className="flex items-center justify-center gap-2 w-full"
      style={{
        background: `${color}15`,
        border: `1px solid ${color}40`,
        borderRadius: 8,
        padding: '9px',
        color,
        fontSize: 13,
        fontWeight: 600,
        cursor: 'pointer',
        transition: 'all 0.2s',
      }}
      onMouseEnter={e => { e.currentTarget.style.background = `${color}25` }}
      onMouseLeave={e => { e.currentTarget.style.background = `${color}15` }}
    >
      <MessageSquare size={14} />
      Abrir Chat
    </button>
  </div>
)

export default function AgentsPage({ setPage }) {
  const [expandedCron, setExpandedCron] = useState(null)

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)' }}>
          🤖 Agentes
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>
          Estado y configuración de todos los agentes de NexAI
        </p>
      </div>

      {/* Agent cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <AgentCard
          name="Hermes NEXAI"
          role="Orquestador Principal · Socio Operativo"
          model="anthropic/claude-sonnet-4-6"
          status="online"
          lastActivity="hace 2m"
          tasks={12}
          cost="0.089"
          color="#3b82f6"
          icon={Zap}
          onChat={() => setPage('chat')}
        />
        <AgentCard
          name="ORBIT"
          role="Agente Ejecutor · OpenClaw"
          model="claude-sonnet-4-6 / GPT-4o"
          status="online"
          lastActivity="hace 15m"
          tasks={8}
          cost="0.034"
          color="#10b981"
          icon={Bot}
          onChat={() => setPage('chat')}
        />
      </div>

      {/* Capabilities comparison */}
      <div className="glass-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Activity size={15} style={{ color: 'var(--accent-cyan)' }} />
          <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
            Capacidades por Agente
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Hermes */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#3b82f6', marginBottom: 8 }}>
              ⚡ HERMES — Orquestación
            </div>
            {[
              'Planificación estratégica de proyectos',
              'Delegación inteligente a ORBIT',
              'Control de costos y optimización',
              'Comunicación con José (Telegram)',
              'Memoria persistente cross-sesión',
              'Skills y automatizaciones cron',
              'Código, investigación, análisis',
            ].map(cap => (
              <div key={cap} className="flex items-center gap-2 py-1">
                <CheckCircle size={12} style={{ color: '#3b82f6', flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{cap}</span>
              </div>
            ))}
          </div>
          {/* ORBIT */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#10b981', marginBottom: 8 }}>
              🤖 ORBIT — Ejecución
            </div>
            {[
              'CLI y scripts avanzados',
              'GitHub: PRs, issues, commits',
              'Supabase: migraciones, queries',
              'Vercel deployments',
              'Tareas de larga duración',
              'Ejecución paralela de subtareas',
              'Reportes de estado a Hermes',
            ].map(cap => (
              <div key={cap} className="flex items-center gap-2 py-1">
                <CheckCircle size={12} style={{ color: '#10b981', flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{cap}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Cron Jobs */}
      <div className="glass-card p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Calendar size={15} style={{ color: 'var(--accent-amber)' }} />
            <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
              Automatizaciones Programadas
            </h3>
          </div>
          <span className="badge badge-green">{CRON_JOBS.length} activas</span>
        </div>

        <div className="space-y-2">
          {CRON_JOBS.map(job => (
            <div
              key={job.id}
              className="glass-card"
              style={{ cursor: 'pointer', padding: '12px 14px' }}
              onClick={() => setExpandedCron(expandedCron === job.id ? null : job.id)}
            >
              <div className="flex items-center gap-3">
                <span className={`status-dot ${job.status === 'ok' ? 'online' : 'error'}`} />
                <div className="flex-1">
                  <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>{job.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                    {job.schedule} · {job.model}
                  </div>
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                  {job.lastRun}
                </div>
                <ChevronRight
                  size={14}
                  style={{
                    color: 'var(--text-muted)',
                    transform: expandedCron === job.id ? 'rotate(90deg)' : 'none',
                    transition: 'transform 0.2s',
                    flexShrink: 0,
                  }}
                />
              </div>
              {expandedCron === job.id && (
                <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--border)' }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>TOOLSETS:</div>
                  <div className="flex flex-wrap gap-2">
                    {job.toolsets.length > 0
                      ? job.toolsets.map(t => (
                        <span key={t} className="badge badge-blue">{t}</span>
                      ))
                      : <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Default (todos)</span>
                    }
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>
                    ID: <span style={{ fontFamily: 'monospace', color: 'var(--text-secondary)' }}>{job.id}...</span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
