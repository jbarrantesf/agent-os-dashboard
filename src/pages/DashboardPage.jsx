import React, { useState, useEffect } from 'react'
import {
  Database, GitBranch as GithubIcon, MessageSquare, DollarSign, TrendingUp,
  Clock, CheckCircle, AlertCircle, Activity, Zap, Server,
  BarChart2, Users, ArrowUpRight, ArrowDownRight, RefreshCw
} from 'lucide-react'

// Simulated real-time data (replace with actual API calls)
const useMetrics = () => {
  const [metrics, setMetrics] = useState({
    costToday: 0.12,
    costMonth: 1.84,
    costBudget: 13.0,
    tasksCompleted: 47,
    tasksRunning: 2,
    tokensSaved: 142000,
    timeSaved: 8.5,
    hermesStatus: 'online',
    orbitStatus: 'online',
    supabaseStatus: 'online',
    githubStatus: 'online',
    telegramStatus: 'online',
    cronJobsActive: 6,
    lastSync: new Date(),
  })

  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(m => ({
        ...m,
        lastSync: new Date(),
        costToday: +(m.costToday + Math.random() * 0.001).toFixed(4),
      }))
    }, 30000)
    return () => clearInterval(interval)
  }, [])

  return metrics
}

const MetricCard = ({ title, value, sub, icon: Icon, accent, trend, trendUp }) => (
  <div className={`glass-card metric-card-${accent} p-4`}>
    <div className="flex items-start justify-between mb-3">
      <div
        style={{
          width: 36, height: 36, borderRadius: 8,
          background: `var(--accent-${accent})20`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        <Icon size={18} style={{ color: `var(--accent-${accent})` }} />
      </div>
      {trend && (
        <div className="flex items-center gap-1" style={{ color: trendUp ? 'var(--accent-green)' : 'var(--accent-red)', fontSize: 12 }}>
          {trendUp ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
          {trend}
        </div>
      )}
    </div>
    <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'monospace' }}>
      {value}
    </div>
    <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>{title}</div>
    {sub && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{sub}</div>}
  </div>
)

const ConnectionCard = ({ name, status, detail, icon: Icon, color }) => (
  <div className="glass-card p-3 flex items-center gap-3">
    <div
      style={{
        width: 34, height: 34, borderRadius: 8, flexShrink: 0,
        background: `${color}15`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        border: `1px solid ${color}30`,
      }}
    >
      <Icon size={16} style={{ color }} />
    </div>
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2">
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{name}</span>
        <span className={`status-dot ${status}`} />
      </div>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>{detail}</div>
    </div>
    <div>
      {status === 'online'
        ? <span className="badge badge-green">●&nbsp;Live</span>
        : <span className="badge badge-muted">Offline</span>
      }
    </div>
  </div>
)

const ActivityItem = ({ icon: Icon, text, time, color }) => (
  <div className="flex items-start gap-3 py-2" style={{ borderBottom: '1px solid var(--border)' }}>
    <div
      style={{
        width: 28, height: 28, borderRadius: 6, flexShrink: 0, marginTop: 2,
        background: `${color}15`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      <Icon size={13} style={{ color }} />
    </div>
    <div className="flex-1">
      <div style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.4 }}>{text}</div>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{time}</div>
    </div>
  </div>
)

const CronJobRow = ({ name, schedule, lastRun, status }) => (
  <div className="flex items-center gap-3 py-2" style={{ borderBottom: '1px solid var(--border)' }}>
    <span className={`status-dot ${status === 'ok' ? 'online' : 'error'}`} />
    <div className="flex-1 min-w-0">
      <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-primary)' }}>{name}</div>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'monospace' }}>{schedule}</div>
    </div>
    <div style={{ fontSize: 11, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{lastRun}</div>
    <span className={`badge ${status === 'ok' ? 'badge-green' : 'badge-red'}`}>{status}</span>
  </div>
)

export default function DashboardPage() {
  const m = useMetrics()
  const [refreshing, setRefreshing] = useState(false)

  const refresh = () => {
    setRefreshing(true)
    setTimeout(() => setRefreshing(false), 1200)
  }

  const budgetPct = Math.round((m.costMonth / m.costBudget) * 100)

  return (
    <div className="p-6 space-y-6">
      {/* Header row */}
      <div className="flex items-start sm:items-center justify-between gap-3">
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)' }}>
            🗼 Torre de Control
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>
            Centro nervioso operativo de NexAI Solutions CR
          </p>
        </div>
        <button
          onClick={refresh}
          className="flex items-center gap-2 flex-shrink-0"
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 8,
            padding: '8px 14px',
            color: 'var(--text-secondary)',
            fontSize: 13,
            cursor: 'pointer',
            fontWeight: 500,
          }}
        >
          <RefreshCw size={14} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
          Actualizar
        </button>
      </div>

      {/* Metric cards */}
      <div className="kpi-grid grid gap-4" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
        <MetricCard
          title="Costo Hoy"
          value={`$${m.costToday.toFixed(3)}`}
          sub={`$${m.costMonth.toFixed(2)} este mes`}
          icon={DollarSign}
          accent="blue"
          trend="-12%"
          trendUp={false}
        />
        <MetricCard
          title="Tareas Completadas"
          value={m.tasksCompleted}
          sub={`${m.tasksRunning} corriendo ahora`}
          icon={CheckCircle}
          accent="green"
          trend="+8"
          trendUp={true}
        />
        <MetricCard
          title="Tokens Ahorrados"
          value={`${(m.tokensSaved / 1000).toFixed(0)}K`}
          sub="vs. modelo sin optimizar"
          icon={Zap}
          accent="cyan"
          trend="+18%"
          trendUp={true}
        />
        <MetricCard
          title="Tiempo Ahorrado"
          value={`${m.timeSaved}h`}
          sub="estimado esta semana"
          icon={Clock}
          accent="purple"
          trend="+2.1h"
          trendUp={true}
        />
      </div>

      {/* Budget bar */}
      <div className="glass-card p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
              💰 Budget OpenRouter
            </span>
            <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 8 }}>
              ${m.costMonth.toFixed(2)} / ${m.costBudget.toFixed(0)} USD
            </span>
          </div>
          <span
            className={`badge ${budgetPct > 80 ? 'badge-red' : budgetPct > 50 ? 'badge-amber' : 'badge-green'}`}
          >
            {budgetPct}% usado
          </span>
        </div>
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{
              width: `${budgetPct}%`,
              background: budgetPct > 80
                ? 'var(--accent-red)'
                : budgetPct > 50
                ? 'var(--accent-amber)'
                : 'linear-gradient(90deg, var(--accent-blue), var(--accent-cyan))',
            }}
          />
        </div>
        <div className="flex justify-between mt-2 budget-labels">
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>$0</span>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            Restante: ${(m.costBudget - m.costMonth).toFixed(2)}
          </span>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>${m.costBudget}</span>
        </div>
      </div>

      {/* Two columns: Connections + Cron Jobs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Connections */}
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-4">
            <Activity size={15} style={{ color: 'var(--accent-cyan)' }} />
            <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
              Conexiones en Tiempo Real
            </h3>
          </div>
          <div className="space-y-2">
            <ConnectionCard
              name="Supabase"
              status={m.supabaseStatus}
              detail="5 proyectos activos · nexai-orchestrator-v2"
              icon={Database}
              color="#10b981"
            />
            <ConnectionCard
              name="GitHub"
              status={m.githubStatus}
              detail="jbarrantesf · agent-os-dashboard, coybo..."
              icon={GithubIcon}
              color="#8b5cf6"
            />
            <ConnectionCard
              name="Telegram"
              status={m.telegramStatus}
              detail="@josebarrantes · canal principal activo"
              icon={MessageSquare}
              color="#3b82f6"
            />
            <ConnectionCard
              name="OpenRouter"
              status="online"
              detail="claude-sonnet-4-6 · Haiku fallback activo"
              icon={Server}
              color="#06b6d4"
            />
          </div>
        </div>

        {/* Cron Jobs */}
        <div className="glass-card p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Clock size={15} style={{ color: 'var(--accent-amber)' }} />
              <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
                Cron Jobs Activos
              </h3>
            </div>
            <span className="badge badge-green">{m.cronJobsActive} activos</span>
          </div>
          <div>
            <CronJobRow
              name="Reporte Diario Costos"
              schedule="0 8 * * * · gpt-4o-mini"
              lastRun="hoy 08:01"
              status="ok"
            />
            <CronJobRow
              name="Daily Sync Hermes↔ORBIT"
              schedule="10 8 * * * · gpt-4o-mini"
              lastRun="hoy 08:22"
              status="ok"
            />
            <CronJobRow
              name="ORBIT Cost Monitor"
              schedule="10 8 * * 5 · viernes"
              lastRun="2026-05-08"
              status="ok"
            />
            <CronJobRow
              name="ORBIT Status Check"
              schedule="10 8 * * 2 · martes"
              lastRun="2026-05-06"
              status="ok"
            />
            <CronJobRow
              name="Dashboard Tower Monitor"
              schedule="10 8 * * 3 · miércoles"
              lastRun="hoy 09:00"
              status="ok"
            />
            <CronJobRow
              name="Infra Health Check"
              schedule="10 8 * * 4 · jueves"
              lastRun="hoy 08:55"
              status="ok"
            />
          </div>
        </div>
      </div>

      {/* Activity feed + ROI */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Activity */}
        <div className="glass-card p-4 lg:col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <BarChart2 size={15} style={{ color: 'var(--accent-blue)' }} />
            <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
              Actividad Reciente
            </h3>
          </div>
          <ActivityItem
            icon={CheckCircle}
            text="Reporte diario de costos generado y enviado a Telegram"
            time="hace 2 horas"
            color="#10b981"
          />
          <ActivityItem
            icon={Activity}
            text="ORBIT Infrastructure Health Check completado — todo OK"
            time="hace 3 horas"
            color="#06b6d4"
          />
          <ActivityItem
            icon={Zap}
            text="Dashboard Tower Monitor ejecutado — sin alertas"
            time="hace 3 horas"
            color="#3b82f6"
          />
          <ActivityItem
            icon={AlertCircle}
            text="Budget alert: $13/$100 usado este mes (13%)"
            time="hoy 08:01"
            color="#f59e0b"
          />
          <ActivityItem
            icon={CheckCircle}
            text="Daily Sync Hermes↔ORBIT: ambos agentes activos"
            time="hoy 08:22"
            color="#10b981"
          />
        </div>

        {/* ROI Card */}
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={15} style={{ color: 'var(--accent-green)' }} />
            <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
              ROI Estimado
            </h3>
          </div>
          <div className="space-y-4">
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>TIEMPO AHORRADO / SEMANA</div>
              <div style={{ fontSize: 26, fontWeight: 700, color: 'var(--accent-green)', fontFamily: 'monospace' }}>
                8.5h
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>@ $50/h = $425 valor</div>
            </div>
            <div style={{ height: 1, background: 'var(--border)' }} />
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>COSTO IA / SEMANA</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--accent-blue)', fontFamily: 'monospace' }}>
                ~$0.46
              </div>
            </div>
            <div style={{ height: 1, background: 'var(--border)' }} />
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>ROI NETO</div>
              <div style={{ fontSize: 26, fontWeight: 700, fontFamily: 'monospace' }}>
                <span style={{ color: 'var(--accent-green)' }}>924x</span>
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>retorno sobre inversión IA</div>
            </div>
            <div className="glass-card p-3" style={{ background: '#10b98110', borderColor: '#10b98130' }}>
              <div style={{ fontSize: 11, color: '#10b981', fontWeight: 600 }}>
                💡 Por cada $1 en IA, NexAI recupera $924 en valor-tiempo de José
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
