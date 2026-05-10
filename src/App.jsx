import React, { useState, useEffect } from 'react'
import DashboardPage from './pages/DashboardPage'
import AgentsPage from './pages/AgentsPage'
import ChatPage from './pages/ChatPage'
import ProjectsPage from './pages/ProjectsPage'
import {
  LayoutDashboard,
  Bot,
  MessageSquare,
  Folders,
  Activity,
  Zap,
  ChevronRight,
  Bell,
  Settings
} from 'lucide-react'

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Torre de Control', icon: LayoutDashboard },
  { id: 'agents',    label: 'Agentes',          icon: Bot },
  { id: 'chat',      label: 'Chat Orquestador', icon: MessageSquare },
  { id: 'projects',  label: 'Proyectos',         icon: Folders },
]

export default function App() {
  const [page, setPage] = useState('dashboard')
  const [time, setTime] = useState(new Date())
  const [sidebarOpen, setSidebarOpen] = useState(true)

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  const formatTime = (d) =>
    d.toLocaleTimeString('es-CR', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
  const formatDate = (d) =>
    d.toLocaleDateString('es-CR', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg-primary)' }}>
      {/* SIDEBAR */}
      <aside
        className="flex flex-col flex-shrink-0 transition-all duration-300"
        style={{
          width: sidebarOpen ? 240 : 64,
          background: 'var(--bg-secondary)',
          borderRight: '1px solid var(--border)',
        }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-5" style={{ borderBottom: '1px solid var(--border)' }}>
          <div
            className="flex items-center justify-center flex-shrink-0"
            style={{
              width: 36, height: 36,
              background: 'linear-gradient(135deg, #1d4ed8, #0891b2)',
              borderRadius: 10,
              boxShadow: '0 0 16px #3b82f630',
            }}
          >
            <Zap size={18} color="#fff" />
          </div>
          {sidebarOpen && (
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: 0.5 }}>
                NEXAI
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: 1, textTransform: 'uppercase' }}>
                Torre de Control
              </div>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex flex-col gap-1 p-2 flex-1">
          {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              className={`nav-item ${page === id ? 'active' : ''}`}
              style={{ justifyContent: sidebarOpen ? 'flex-start' : 'center' }}
              onClick={() => setPage(id)}
              title={!sidebarOpen ? label : undefined}
            >
              <Icon size={18} />
              {sidebarOpen && <span>{label}</span>}
              {sidebarOpen && page === id && (
                <ChevronRight size={14} style={{ marginLeft: 'auto', color: 'var(--accent-blue)' }} />
              )}
            </button>
          ))}
        </nav>

        {/* Bottom status */}
        {sidebarOpen && (
          <div className="p-3" style={{ borderTop: '1px solid var(--border)' }}>
            <div className="flex items-center gap-2 mb-2">
              <span className="status-dot online" />
              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Hermes NEXAI</span>
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'monospace' }}>
              {formatTime(time)}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              {formatDate(time)}
            </div>
          </div>
        )}

        {/* Collapse toggle */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          style={{
            padding: '12px',
            borderTop: '1px solid var(--border)',
            color: 'var(--text-muted)',
            textAlign: 'center',
            cursor: 'pointer',
            background: 'transparent',
            border: 'none',
            transition: 'color 0.2s',
          }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
        >
          <ChevronRight
            size={16}
            style={{ transform: sidebarOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s', display: 'inline' }}
          />
        </button>
      </aside>

      {/* MAIN CONTENT */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Top bar */}
        <header
          className="flex items-center justify-between px-6 py-3 flex-shrink-0"
          style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)', height: 56 }}
        >
          <div className="flex items-center gap-3">
            <Activity size={16} style={{ color: 'var(--accent-cyan)' }} />
            <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>
              {NAV_ITEMS.find(n => n.id === page)?.label}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="status-dot online" />
              <span style={{ fontSize: 12, color: 'var(--accent-green)', fontWeight: 500 }}>Sistema Operativo</span>
            </div>
            <button
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: 8,
                padding: '6px 8px',
                color: 'var(--text-muted)',
                cursor: 'pointer',
              }}
            >
              <Bell size={14} />
            </button>
            <button
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: 8,
                padding: '6px 8px',
                color: 'var(--text-muted)',
                cursor: 'pointer',
              }}
            >
              <Settings size={14} />
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto">
          {page === 'dashboard' && <DashboardPage />}
          {page === 'agents'    && <AgentsPage setPage={setPage} />}
          {page === 'chat'      && <ChatPage />}
          {page === 'projects'  && <ProjectsPage />}
        </main>
      </div>
    </div>
  )
}
