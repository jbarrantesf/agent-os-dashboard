import React, { useState, useEffect } from 'react'
import { cardService } from '../services/cardService'

export default function CostsDashboard() {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [totalCost, setTotalCost] = useState(0)

  useEffect(() => {
    loadProjectCosts()
  }, [])

  const loadProjectCosts = async () => {
    try {
      // Cargar datos de costos desde docs o estado local
      const costData = {
        "Snake Game 🐍": {
          total: 113.29,
          api: 0.79,
          infra: 0.00,
          dev_time: 112.50,
          time_minutes: 45,
          loc: 902,
          model: "Opus 4.7",
          status: "Done",
          date: "2026-05-15"
        }
      }
      
      const projectsList = Object.entries(costData).map(([name, cost]) => ({
        name,
        ...cost
      }))
      
      setProjects(projectsList)
      setTotalCost(projectsList.reduce((sum, p) => sum + p.total, 0))
      setLoading(false)
    } catch (error) {
      console.error('Error loading costs:', error)
      setLoading(false)
    }
  }

  if (loading) return <div className="text-center p-8">Cargando costos...</div>

  return (
    <div className="p-8 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 min-h-screen">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-red-400 bg-clip-text text-transparent mb-2">
            💰 Costos de Proyectos - NexAI
          </h1>
          <p className="text-gray-400">Control y transparencia de costos en Torre de Control</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          
          <div className="bg-slate-700 border border-purple-500/30 rounded-lg p-6 hover:border-purple-500/60 transition">
            <div className="text-gray-400 text-sm font-medium">Total de Costos</div>
            <div className="text-3xl font-bold text-purple-400 mt-2">${totalCost.toFixed(2)}</div>
            <div className="text-gray-500 text-xs mt-2">Todos los proyectos</div>
          </div>

          <div className="bg-slate-700 border border-green-500/30 rounded-lg p-6 hover:border-green-500/60 transition">
            <div className="text-gray-400 text-sm font-medium">Proyectos Completados</div>
            <div className="text-3xl font-bold text-green-400 mt-2">{projects.length}</div>
            <div className="text-gray-500 text-xs mt-2">Status: Done</div>
          </div>

          <div className="bg-slate-700 border border-blue-500/30 rounded-lg p-6 hover:border-blue-500/60 transition">
            <div className="text-gray-400 text-sm font-medium">Costo Promedio</div>
            <div className="text-3xl font-bold text-blue-400 mt-2">${(totalCost / projects.length).toFixed(2)}</div>
            <div className="text-gray-500 text-xs mt-2">Por proyecto</div>
          </div>

          <div className="bg-slate-700 border border-orange-500/30 rounded-lg p-6 hover:border-orange-500/60 transition">
            <div className="text-gray-400 text-sm font-medium">Tiempo Total</div>
            <div className="text-3xl font-bold text-orange-400 mt-2">{projects.reduce((sum, p) => sum + p.time_minutes, 0)} min</div>
            <div className="text-gray-500 text-xs mt-2">Desarrollo</div>
          </div>

        </div>

        {/* Projects Table */}
        <div className="bg-slate-700 border border-slate-600 rounded-lg overflow-hidden">
          
          <div className="px-6 py-4 border-b border-slate-600 bg-slate-800">
            <h2 className="text-lg font-semibold text-white">Desglose por Proyecto</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-800 border-b border-slate-600">
                <tr>
                  <th className="px-6 py-3 text-left text-gray-400 font-medium">Proyecto</th>
                  <th className="px-6 py-3 text-right text-gray-400 font-medium">API Calls</th>
                  <th className="px-6 py-3 text-right text-gray-400 font-medium">Infra</th>
                  <th className="px-6 py-3 text-right text-gray-400 font-medium">Dev Time</th>
                  <th className="px-6 py-3 text-right text-gray-400 font-medium">Total</th>
                  <th className="px-6 py-3 text-right text-gray-400 font-medium">LOC</th>
                  <th className="px-6 py-3 text-right text-gray-400 font-medium">Tiempo</th>
                  <th className="px-6 py-3 text-right text-gray-400 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {projects.map((project, idx) => (
                  <tr key={idx} className="border-b border-slate-600 hover:bg-slate-800/50 transition">
                    <td className="px-6 py-4 text-white font-medium">{project.name}</td>
                    <td className="px-6 py-4 text-right text-blue-400">${project.api.toFixed(2)}</td>
                    <td className="px-6 py-4 text-right text-green-400">${project.infra.toFixed(2)}</td>
                    <td className="px-6 py-4 text-right text-purple-400">${project.dev_time.toFixed(2)}</td>
                    <td className="px-6 py-4 text-right font-bold text-yellow-400">${project.total.toFixed(2)}</td>
                    <td className="px-6 py-4 text-right text-gray-400">{project.loc}</td>
                    <td className="px-6 py-4 text-right text-gray-400">{project.time_minutes} min</td>
                    <td className="px-6 py-4 text-right">
                      <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-medium">
                        {project.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>

        {/* Cost Breakdown Chart */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Breakdown */}
          <div className="bg-slate-700 border border-slate-600 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Desglose de Costos (Snake Game)</h3>
            
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-400">API Calls (Modelos IA)</span>
                  <span className="text-blue-400 font-medium">$0.79</span>
                </div>
                <div className="w-full bg-slate-600 rounded-full h-2">
                  <div className="bg-blue-500 h-2 rounded-full" style={{width: '0.7%'}}></div>
                </div>
                <div className="text-xs text-gray-500 mt-1">Opus 4.7 + Haiku 4.5</div>
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-400">Infraestructura</span>
                  <span className="text-green-400 font-medium">$0.00</span>
                </div>
                <div className="w-full bg-slate-600 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{width: '0%'}}></div>
                </div>
                <div className="text-xs text-gray-500 mt-1">Vercel + Supabase (free tier)</div>
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-400">Developer Time (José)</span>
                  <span className="text-purple-400 font-medium">$112.50</span>
                </div>
                <div className="w-full bg-slate-600 rounded-full h-2">
                  <div className="bg-purple-500 h-2 rounded-full" style={{width: '99.3%'}}></div>
                </div>
                <div className="text-xs text-gray-500 mt-1">45 minutos @ $150/hr</div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-600">
              <div className="flex justify-between items-center">
                <span className="text-white font-semibold">Total del Proyecto</span>
                <span className="text-2xl font-bold text-yellow-400">$113.29</span>
              </div>
            </div>
          </div>

          {/* Metrics */}
          <div className="bg-slate-700 border border-slate-600 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Métricas de Eficiencia</h3>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-slate-800 rounded">
                <span className="text-gray-400">Costo por LOC</span>
                <span className="text-cyan-400 font-mono font-medium">$0.13</span>
              </div>
              
              <div className="flex justify-between items-center p-3 bg-slate-800 rounded">
                <span className="text-gray-400">Costo por minuto</span>
                <span className="text-cyan-400 font-mono font-medium">$2.52</span>
              </div>
              
              <div className="flex justify-between items-center p-3 bg-slate-800 rounded">
                <span className="text-gray-400">Costo por feature</span>
                <span className="text-cyan-400 font-mono font-medium">$28.32</span>
              </div>
              
              <div className="flex justify-between items-center p-3 bg-slate-800 rounded">
                <span className="text-gray-400">Tokens procesados</span>
                <span className="text-cyan-400 font-mono font-medium">626,110</span>
              </div>
              
              <div className="flex justify-between items-center p-3 bg-slate-800 rounded">
                <span className="text-gray-400">Costo por 1K tokens</span>
                <span className="text-cyan-400 font-mono font-medium">$0.00125</span>
              </div>

              <div className="flex justify-between items-center p-3 bg-slate-800 rounded">
                <span className="text-gray-400">Eficiencia (cost/hr work)</span>
                <span className="text-cyan-400 font-mono font-medium">$151.05</span>
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-gray-500 text-sm">
          <p>📊 Dashboard de Costos - Torre de Control (NexAI Solutions CR)</p>
          <p className="text-xs mt-2">Actualizado: 2026-05-15 | Modelo Primary: Opus 4.7 | Status: LIVE</p>
        </div>

      </div>
    </div>
  )
}
