import React, { useState, useEffect } from 'react'
import DashboardPage from './pages/DashboardPage'
import AgentsPage from './pages/AgentsPage'
import ChatPage from './pages/ChatPage'
import ProjectsPage from './pages/ProjectsPage'
import CostsDashboard from './pages/CostsDashboard'
import SnakeGamePage from './pages/SnakeGamePage'
import ProductionPage from './pages/ProductionPage'
import {
  LayoutDashboard,
  Bot,
  MessageSquare,
  Folders,
  TrendingDown,
  Activity,
  Zap,
  ChevronRight,
  Bell,
  Settings,
  Menu,
  X,
  Layers,
  User,
  Shield,
  FileText
} from 'lucide-react'
import './App.css'

// Sidebar structure similar to Danny
const SIDEBAR_SECTIONS = {
  teams: [
    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
    { id: 'agents', label: 'Agentes', icon: Bot },
  ],
  clients: [
    { id: 'projects', label: 'Proyectos', icon: Folders },
  ],
  operations: [
    { id: 'chat', label: 'Chat', icon: MessageSquare },
    { id: 'costs', label: 'Costos & ROI', icon: TrendingDown },
    { id: 'snake', label: 'Snake Game', icon: Zap },
  ],
  system: [
    { id: 'production', label: 'Prod / Vercel', icon: Layers },
    { id: 'docs', label: 'Docs', icon: FileText },
  ]
}

const NEXAI_TEAMS = [
  { name: 'T1 AI Front Desk', description: 'Atención al cliente', status: 'standby', agents: 4 },
  { name: 'T2 AI Sales', description: 'Aumentar LTV', status: 'standby', agents: 3 },
  { name: 'T3 Marketing Engine', description: 'Content generation', status: 'standby', agents: 3 },
  { name: 'T4 CRM + Data', description: 'Data intelligence', status: 'standby', agents: 3 },
  { name: 'T5 Automations', description: 'Sistema OpenClaw', status: 'standby', agents: 4 },
  { name: 'T6 Executive Dashboard', description: 'Central metrics', status: 'standby', agents: 4 },
  { name: 'T7 Design Team', description: 'Diseño dirigido', status: 'standby', agents: 3 },
  { name: 'T8 Social Media', description: 'Social management', status: 'standby', agents: 5 },
  { name: 'T9 Ads Management', description: 'Todas las plataformas', status: 'standby', agents: 8 },
]

const NEXAI_CLIENTS = [
  { name: 'Coybo', status: 'active' },
  { name: 'Client 2', status: 'active' },
  { name: 'Client 3', status: 'pending' },
  { name: 'Client 4', status: 'inactive' },
  { name: 'Client 5', status: 'active' },
  { name: 'Client 6', status: 'active' },
  { name: 'Client 7', status: 'active' },
]

export default function App() {
  const [page, setPage] = useState('dashboard')
  const [time, setTime] = useState(new Date())
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [expandedSection, setExpandedSection] = useState('teams')

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  const formatTime = (d) =>
    d.toLocaleTimeString('es-CR', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
  const formatDate = (d) =>
    d.toLocaleDateString('es-CR', { weekday: 'long', day: 'numeric', month: 'long' })

  const metrics = {
    agents: NEXAI_TEAMS.length,
    deployed: 0,
    clients: NEXAI_CLIENTS.length,
    mrr: 5500,
    alerts: 2,
  }

  const getAllNavItems = () => Object.values(SIDEBAR_SECTIONS).flat()

  return (
    <div className="danny-layout flex h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* DANNY-STYLE SIDEBAR */}
      <aside className="danny-sidebar flex flex-col w-64 bg-gradient-to-b from-slate-900 to-slate-950 border-r border-slate-800 overflow-y-auto">
        {/* User Header */}
        <div className="sticky top-0 p-6 bg-slate-900/50 backdrop-blur border-b border-slate-800">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center text-white font-bold text-sm">
              J
            </div>
            <div>
              <div className="font-semibold text-white">José</div>
              <div className="text-xs text-slate-400">Master Operator</div>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="w-2 h-2 rounded-full bg-red-500"></span>
            Offline
          </div>
        </div>

        {/* Navigation with sections */}
        <nav className="flex-1 px-3 py-6 space-y-6">
          {/* AGENT TEAMS */}
          <div>
            <button
              onClick={() => setExpandedSection(expandedSection === 'teams' ? null : 'teams')}
              className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-slate-400 hover:text-slate-300 uppercase tracking-wider"
            >
              <span>AGENT TEAMS</span>
              <span className="bg-slate-700 text-slate-300 px-2 py-0.5 rounded text-xs">{NEXAI_TEAMS.length}</span>
            </button>
            {expandedSection === 'teams' && (
              <div className="mt-2 space-y-1">
                {SIDEBAR_SECTIONS.teams.map(item => (
                  <button
                    key={item.id}
                    onClick={() => setPage(item.id)}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded transition-colors ${
                      page === item.id
                        ? 'bg-purple-600/30 text-purple-300'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <item.icon size={16} />
                    <span className="text-sm">{item.label}</span>
                  </button>
                ))}
                {NEXAI_TEAMS.map((team, idx) => (
                  <button
                    key={`team-${idx}`}
                    className="w-full text-left px-3 py-1 text-xs text-slate-500 hover:text-slate-300 truncate"
                  >
                    {team.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* CLIENTS */}
          <div>
            <button
              onClick={() => setExpandedSection(expandedSection === 'clients' ? null : 'clients')}
              className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-slate-400 hover:text-slate-300 uppercase tracking-wider"
            >
              <span>CLIENTS</span>
              <span className="bg-slate-700 text-slate-300 px-2 py-0.5 rounded text-xs">{NEXAI_CLIENTS.length}</span>
            </button>
            {expandedSection === 'clients' && (
              <div className="mt-2 space-y-1">
                {SIDEBAR_SECTIONS.clients.map(item => (
                  <button
                    key={item.id}
                    onClick={() => setPage(item.id)}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded transition-colors ${
                      page === item.id
                        ? 'bg-purple-600/30 text-purple-300'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <item.icon size={16} />
                    <span className="text-sm">{item.label}</span>
                  </button>
                ))}
                {NEXAI_CLIENTS.map((client, idx) => (
                  <button
                    key={`client-${idx}`}
                    className="w-full text-left px-3 py-1 text-xs text-slate-500 hover:text-slate-300 flex items-center gap-2 truncate"
                  >
                    <span className={`w-2 h-2 rounded-full ${
                      client.status === 'active' ? 'bg-green-500' : 'bg-slate-600'
                    }`}></span>
                    {client.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* OPERATIONS */}
          <div>
            <button
              onClick={() => setExpandedSection(expandedSection === 'ops' ? null : 'ops')}
              className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-slate-400 hover:text-slate-300 uppercase tracking-wider"
            >
              <span>OPERATIONS</span>
            </button>
            {expandedSection === 'ops' && (
              <div className="mt-2 space-y-1">
                {SIDEBAR_SECTIONS.operations.map(item => (
                  <button
                    key={item.id}
                    onClick={() => setPage(item.id)}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded transition-colors text-sm ${
                      page === item.id
                        ? 'bg-purple-600/30 text-purple-300'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <item.icon size={16} />
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* SYSTEM */}
          <div>
            <button
              onClick={() => setExpandedSection(expandedSection === 'system' ? null : 'system')}
              className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-slate-400 hover:text-slate-300 uppercase tracking-wider"
            >
              <span>SYSTEM</span>
            </button>
            {expandedSection === 'system' && (
              <div className="mt-2 space-y-1">
                {SIDEBAR_SECTIONS.system.map(item => (
                  <button
                    key={item.id}
                    onClick={() => setPage(item.id)}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded transition-colors text-sm ${
                      page === item.id
                        ? 'bg-purple-600/30 text-purple-300'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <item.icon size={16} />
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 space-y-3">
          <div className="text-xs text-slate-500">
            <div className="font-semibold text-slate-400">NexAI Solutions CR</div>
            <div className="text-slate-600">{formatDate(time)}</div>
          </div>
          <button className="w-full px-3 py-2 text-sm text-slate-400 hover:text-red-400 transition">
            Sign out
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top metrics bar */}
        <div className="bg-slate-900/50 backdrop-blur border-b border-slate-800 px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-8 text-sm">
              <div className="text-slate-400">
                AGENTS <span className="font-semibold text-white">{metrics.agents}</span>
              </div>
              <div className="text-slate-400">
                DEPLOYED <span className="font-semibold text-white">{metrics.deployed}</span>
              </div>
              <div className="text-slate-400">
                CLIENTS <span className="font-semibold text-white">{metrics.clients}</span>
              </div>
              <div className="text-slate-400">
                MRR <span className="font-semibold text-green-400">${metrics.mrr.toLocaleString()}</span>
              </div>
              <div className="text-slate-400">
                ALERTS <span className="font-semibold text-orange-400">{metrics.alerts}</span>
              </div>
            </div>
            <div className="text-xs text-slate-500">
              Updated {formatTime(time)}
            </div>
          </div>
        </div>

        {/* Content area */}
        <main className="flex-1 overflow-auto">
          {page === 'dashboard' && <DashboardPage />}
          {page === 'agents' && <AgentsPage setPage={setPage} />}
          {page === 'chat' && <ChatPage />}
          {page === 'projects' && <ProjectsPage />}
          {page === 'costs' && <CostsDashboard />}
          {page === 'snake' && <SnakeGamePage />}
          {page === 'production' && <ProductionPage />}
        </main>
      </div>
    </div>
  )
}
