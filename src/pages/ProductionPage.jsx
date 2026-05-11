import { useState, useEffect } from 'react'
import { ExternalLink, RefreshCw, CheckCircle, XCircle, Clock, Globe, Code2, Layers } from 'lucide-react'

const VERCEL_TOKEN_KEY = 'vercel_token'
const TEAM_ID = 'team_cQ7Ac1AVhNLFoKLfMczmJqG0'

// Proyectos hardcoded como fallback (datos reales de Vercel)
const FALLBACK_PROJECTS = [
  { name: 'agent-os-dashboard',           framework: 'vite',    status: 'READY', url: 'https://agent-os-dashboard-nine.vercel.app',                   category: 'NexAI Internal' },
  { name: 'agent-floor-3d',               framework: 'vite',    status: 'READY', url: 'https://agent-floor-3d.vercel.app',                            category: 'NexAI Internal' },
  { name: 'nexai-orchestrator-v2',        framework: 'nextjs',  status: 'READY', url: 'https://nexai-orchestrator-v2.vercel.app',                     category: 'NexAI Core' },
  { name: 'nexai-mission-board-v2',       framework: 'nextjs',  status: 'READY', url: 'https://nexai-mission-board-v2.vercel.app',                    category: 'NexAI Core' },
  { name: 'nexai-mission-board',          framework: 'nextjs',  status: 'READY', url: 'https://nexai-mission-board.vercel.app',                       category: 'NexAI Core' },
  { name: 'aios-munso-web',               framework: 'nextjs',  status: 'READY', url: 'https://aios-munso-web.vercel.app',                            category: 'Clientes' },
  { name: 'roi-calculator',               framework: 'static',  status: 'READY', url: 'https://roi-calculator-khaki.vercel.app',                      category: 'NexAI Tools' },
  { name: 'nexai-clienthub',              framework: 'nextjs',  status: 'READY', url: 'https://nexai-clienthub-mne4a9w7.vercel.app',                  category: 'NexAI Tools' },
  { name: 'nexai-projectflow',            framework: 'nextjs',  status: 'READY', url: 'https://nexai-projectflow-mne325gs.vercel.app',                category: 'NexAI Tools' },
  { name: 'nexai-habit-tracker',          framework: 'nextjs',  status: 'READY', url: 'https://nexai-nexai-habit-tracker-mnmobaxh.vercel.app',        category: 'Demos / QA' },
  { name: 'nexai-breakout-qa',            framework: 'nextjs',  status: 'READY', url: 'https://nexai-nexai-breakout-functional-qa.vercel.app',        category: 'Demos / QA' },
  { name: 'nexai-tetris-benchmark',       framework: 'nextjs',  status: 'READY', url: 'https://nexai-nexai-tetris-trial-benchmark.vercel.app',        category: 'Demos / QA' },
  { name: 'nexai-github-smoke',           framework: 'nextjs',  status: 'READY', url: 'https://nexai-nexai-github-smoke-mnmouy1v.vercel.app',         category: 'Demos / QA' },
  { name: 'nexai-pipeline-smoke',         framework: 'nextjs',  status: 'READY', url: 'https://nexai-nexai-pipeline-smoke-mnmolsvs.vercel.app',       category: 'Demos / QA' },
  { name: 'racing-game',                  framework: 'static',  status: 'READY', url: 'https://racing-game-pink.vercel.app',                          category: 'Demos / QA' },
  { name: 'piano',                        framework: 'static',  status: 'READY', url: 'https://piano-khaki-ten.vercel.app',                           category: 'Demos / QA' },
  { name: 'nexai-mission-board-v2-fwxu',  framework: 'nextjs',  status: 'READY', url: 'https://nexai-mission-board-v2-fwxu.vercel.app',               category: 'NexAI Core' },
  { name: 'agent-os-api',                 framework: 'static',  status: 'NO_DEPLOY', url: 'https://agent-os-api.vercel.app',                         category: 'NexAI Internal' },
]

const CATEGORIES = ['Todos', 'NexAI Core', 'NexAI Internal', 'NexAI Tools', 'Clientes', 'Demos / QA']

const FRAMEWORK_COLORS = {
  nextjs:  'bg-white/10 text-white',
  vite:    'bg-purple-500/20 text-purple-300',
  static:  'bg-blue-500/20 text-blue-300',
}

const FRAMEWORK_ICON = {
  nextjs: '▲',
  vite:   '⚡',
  static: '📄',
}

const CATEGORY_COLORS = {
  'NexAI Core':     'border-l-cyan-400',
  'NexAI Internal': 'border-l-violet-400',
  'NexAI Tools':    'border-l-emerald-400',
  'Clientes':       'border-l-amber-400',
  'Demos / QA':     'border-l-rose-400',
}

const CATEGORY_BADGE = {
  'NexAI Core':     'bg-cyan-500/15 text-cyan-300',
  'NexAI Internal': 'bg-violet-500/15 text-violet-300',
  'NexAI Tools':    'bg-emerald-500/15 text-emerald-300',
  'Clientes':       'bg-amber-500/15 text-amber-300',
  'Demos / QA':     'bg-rose-500/15 text-rose-300',
}

function StatusBadge({ status }) {
  if (status === 'READY') return (
    <span className="flex items-center gap-1 text-xs text-emerald-400">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
      LIVE
    </span>
  )
  if (status === 'ERROR') return (
    <span className="flex items-center gap-1 text-xs text-red-400">
      <XCircle size={12} /> ERROR
    </span>
  )
  return (
    <span className="flex items-center gap-1 text-xs text-zinc-500">
      <Clock size={12} /> {status || 'PENDING'}
    </span>
  )
}

function ProjectCard({ project }) {
  const borderColor = CATEGORY_COLORS[project.category] || 'border-l-zinc-600'
  const badgeColor  = CATEGORY_BADGE[project.category]  || 'bg-zinc-700 text-zinc-300'
  const fwColor     = FRAMEWORK_COLORS[project.framework] || FRAMEWORK_COLORS.static
  const fwIcon      = FRAMEWORK_ICON[project.framework]  || '📦'

  return (
    <div className={`bg-zinc-800/60 border border-zinc-700/50 border-l-2 ${borderColor} rounded-lg p-4 hover:bg-zinc-800 transition-all group`}>
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-zinc-100 truncate group-hover:text-white transition-colors">
            {project.name}
          </h3>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <span className={`text-xs px-1.5 py-0.5 rounded font-mono ${fwColor}`}>
              {fwIcon} {project.framework}
            </span>
            <span className={`text-xs px-1.5 py-0.5 rounded ${badgeColor}`}>
              {project.category}
            </span>
          </div>
        </div>
        <StatusBadge status={project.status} />
      </div>

      <a
        href={project.url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-cyan-400 transition-colors truncate group/link"
        title={project.url}
      >
        <Globe size={11} className="shrink-0" />
        <span className="truncate">{project.url.replace('https://', '')}</span>
        <ExternalLink size={10} className="shrink-0 opacity-0 group-hover/link:opacity-100 transition-opacity" />
      </a>
    </div>
  )
}

export default function ProductionPage() {
  const [projects]    = useState(FALLBACK_PROJECTS)
  const [filter, setFilter]   = useState('Todos')
  const [search, setSearch]   = useState('')
  const [lastUpdated] = useState(new Date().toLocaleTimeString('es-CR'))

  const filtered = projects.filter(p => {
    const matchCat    = filter === 'Todos' || p.category === filter
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) ||
                        p.url.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch
  })

  const readyCount = projects.filter(p => p.status === 'READY').length
  const byCategory = CATEGORIES.slice(1).map(cat => ({
    cat,
    count: projects.filter(p => p.category === cat).length,
  }))

  return (
    <div className="p-6 space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Layers size={20} className="text-cyan-400" />
            Soluciones en Producción
          </h1>
          <p className="text-sm text-zinc-400 mt-0.5">
            Inventario Vercel · {projects.length} proyectos · {readyCount} activos
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-zinc-500">
          <RefreshCw size={12} />
          Actualizado {lastUpdated}
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {byCategory.map(({ cat, count }) => (
          <button
            key={cat}
            onClick={() => setFilter(filter === cat ? 'Todos' : cat)}
            className={`text-left p-3 rounded-lg border transition-all ${
              filter === cat
                ? 'bg-zinc-700 border-zinc-500'
                : 'bg-zinc-800/50 border-zinc-700/50 hover:bg-zinc-800'
            }`}
          >
            <div className="text-lg font-bold text-white">{count}</div>
            <div className={`text-xs mt-0.5 ${CATEGORY_BADGE[cat]?.split(' ')[1] || 'text-zinc-400'}`}>{cat}</div>
          </button>
        ))}
      </div>

      {/* Search + filter */}
      <div className="flex gap-3 flex-wrap">
        <input
          type="text"
          placeholder="Buscar proyecto o URL..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 min-w-[200px] bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-cyan-500 transition-colors"
        />
        <div className="flex gap-2 flex-wrap">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                filter === cat
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'bg-zinc-800 text-zinc-400 border border-zinc-700 hover:border-zinc-500'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="text-center text-zinc-500 py-12">
          <Globe size={32} className="mx-auto mb-3 opacity-30" />
          <p>No se encontraron proyectos</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {filtered.map(p => (
            <ProjectCard key={p.name} project={p} />
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center gap-4 pt-2 border-t border-zinc-800 text-xs text-zinc-600">
        <span>▲ Next.js</span>
        <span>⚡ Vite</span>
        <span>📄 Static</span>
        <span className="ml-auto">
          <a href="https://vercel.com/jose-barrantes-projects-f8f6418a" target="_blank" rel="noopener noreferrer"
            className="hover:text-zinc-400 transition-colors flex items-center gap-1">
            Ver en Vercel <ExternalLink size={10} />
          </a>
        </span>
      </div>
    </div>
  )
}
