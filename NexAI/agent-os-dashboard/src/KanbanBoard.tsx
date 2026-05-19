import React, { useState, useEffect, useCallback } from 'react'
import TaskDetailModal from './TaskDetailModal'
import { supabase, type Task } from './supabaseClient'

interface Stats {
  total: number
  by_status: Record<string, number>
  by_assignee: Record<string, number>
}

interface KanbanBoardProps {
  board?: string
}

const COLUMNS = [
  { id: 'triage', label: '📥 Triage', color: 'gray' },
  { id: 'todo', label: '📋 Todo', color: 'blue' },
  { id: 'in-progress', label: '⚙️ In Progress', color: 'yellow' },
  { id: 'blocked', label: '🚫 Blocked', color: 'red' },
  { id: 'done', label: '✅ Done', color: 'green' }
]

const ASSIGNEE_COLORS: Record<string, string> = {
  'hermes': 'bg-purple-100 text-purple-800 border-purple-300',
  'orbit': 'bg-blue-100 text-blue-800 border-blue-300',
  'worker-1': 'bg-indigo-100 text-indigo-800 border-indigo-300',
  'worker-2': 'bg-pink-100 text-pink-800 border-pink-300',
}

const PRIORITY_COLORS: Record<string, string> = {
  'urgent': 'bg-red-100 text-red-800',
  'high': 'bg-orange-100 text-orange-800',
  'medium': 'bg-blue-100 text-blue-800',
  'low': 'bg-gray-100 text-gray-800',
}

const COLUMN_COLORS: Record<string, string> = {
  'gray': 'bg-gradient-to-b from-gray-700 to-gray-800',
  'blue': 'bg-gradient-to-b from-blue-700 to-blue-800',
  'yellow': 'bg-gradient-to-b from-yellow-700 to-yellow-800',
  'red': 'bg-gradient-to-b from-red-700 to-red-800',
  'green': 'bg-gradient-to-b from-green-700 to-green-800',
}

const KanbanBoard: React.FC<KanbanBoardProps> = ({ board = 'default' }) => {
  const [tasks, setTasks] = useState<Record<string, Task[]>>({})
  const [stats, setStats] = useState<Stats>({ total: 0, by_status: {}, by_assignee: {} })
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Cargar tareas desde Supabase
  const loadTasks = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from('tasks')
        .select('*')
        .eq('board', board)
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError

      // Agrupar por status
      const grouped: Record<string, Task[]> = {}
      COLUMNS.forEach(col => {
        grouped[col.id] = []
      })

      data?.forEach((task: Task) => {
        if (grouped[task.status]) {
          grouped[task.status].push(task)
        }
      })

      setTasks(grouped)

      // Calcular stats
      const newStats: Stats = {
        total: data?.length || 0,
        by_status: {},
        by_assignee: {}
      }

      data?.forEach((task: Task) => {
        newStats.by_status[task.status] = (newStats.by_status[task.status] || 0) + 1
        if (task.assigned_to) {
          newStats.by_assignee[task.assigned_to] = (newStats.by_assignee[task.assigned_to] || 0) + 1
        }
      })

      setStats(newStats)
    } catch (err: any) {
      setError(err.message || 'Error cargando tareas')
      console.error('Error loading tasks:', err)
    } finally {
      setIsLoading(false)
    }
  }, [board])

  // Cargar tareas al montar
  useEffect(() => {
    loadTasks()

    // Suscribirse a cambios en tiempo real
    const subscription = supabase
      .channel(`tasks:${board}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks',
          filter: `board=eq.${board}`
        },
        () => {
          loadTasks() // Recargar cuando hay cambios
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [board, loadTasks])

  // Crear nueva tarea
  const handleCreateTask = async () => {
    if (!newTaskTitle.trim()) return

    try {
      const { error } = await supabase.from('tasks').insert({
        title: newTaskTitle,
        status: 'triage',
        board,
        priority: 'medium'
      })

      if (error) throw error

      setNewTaskTitle('')
      await loadTasks()
    } catch (err: any) {
      setError(err.message || 'Error creando tarea')
    }
  }

  // Actualizar estado de tarea (drag & drop)
  const handleUpdateTaskStatus = async (taskId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', taskId)

      if (error) throw error

      await loadTasks()
    } catch (err: any) {
      setError(err.message || 'Error actualizando tarea')
    }
  }

  // Eliminar tarea
  const handleDeleteTask = async (taskId: string) => {
    try {
      const { error } = await supabase.from('tasks').delete().eq('id', taskId)

      if (error) throw error

      await loadTasks()
    } catch (err: any) {
      setError(err.message || 'Error eliminando tarea')
    }
  }

  // Manejar drag and drop
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, taskId: string) => {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('taskId', taskId)
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>, newStatus: string) => {
    e.preventDefault()
    const taskId = e.dataTransfer.getData('taskId')
    await handleUpdateTaskStatus(taskId, newStatus)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="text-white text-xl">⏳ Cargando Kanban...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 p-4">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-4xl font-bold text-white mb-2">🎯 Control Tower Kanban</h1>
        <p className="text-gray-400">Board: <span className="font-mono bg-gray-800 px-2 py-1 rounded">{board}</span></p>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="mb-4 p-4 bg-red-900 text-red-100 rounded-lg border border-red-700">
          ❌ {error}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
          <div className="text-gray-400 text-sm">Total de Tareas</div>
          <div className="text-3xl font-bold text-white">{stats.total}</div>
        </div>
        {Object.entries(stats.by_status).map(([status, count]) => (
          <div key={status} className="bg-gray-800 p-4 rounded-lg border border-gray-700">
            <div className="text-gray-400 text-sm capitalize">{status}</div>
            <div className="text-3xl font-bold text-white">{count}</div>
          </div>
        ))}
      </div>

      {/* Create New Task */}
      <div className="mb-6 flex gap-2">
        <input
          type="text"
          value={newTaskTitle}
          onChange={(e) => setNewTaskTitle(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleCreateTask()}
          placeholder="Nueva tarea... (Enter para crear)"
          className="flex-1 bg-gray-800 text-white px-4 py-2 rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none"
        />
        <button
          onClick={handleCreateTask}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold transition"
        >
          ➕ Crear
        </button>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-5 gap-4">
        {COLUMNS.map((column) => (
          <div
            key={column.id}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, column.id)}
            className={`${COLUMN_COLORS[column.color]} rounded-lg p-4 min-h-96`}
          >
            <h2 className="text-white font-bold text-lg mb-4 sticky top-0 bg-gray-800 p-2 rounded">
              {column.label}
              <span className="text-sm text-gray-300 ml-2">({tasks[column.id]?.length || 0})</span>
            </h2>

            <div className="space-y-3">
              {tasks[column.id]?.map((task) => (
                <div
                  key={task.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, task.id)}
                  onClick={() => {
                    setSelectedTask(task)
                    setShowModal(true)
                  }}
                  className="bg-gray-800 p-3 rounded-lg border border-gray-600 hover:border-blue-500 cursor-grab active:cursor-grabbing transition group"
                >
                  <div className="text-white font-semibold text-sm mb-2 group-hover:text-blue-300">
                    {task.title}
                  </div>

                  {task.description && (
                    <p className="text-gray-400 text-xs mb-2 line-clamp-2">{task.description}</p>
                  )}

                  {/* Badges */}
                  <div className="flex flex-wrap gap-1">
                    <span className={`text-xs px-2 py-1 rounded-full ${PRIORITY_COLORS[task.priority]}`}>
                      {task.priority}
                    </span>
                    {task.assigned_to && (
                      <span className={`text-xs px-2 py-1 rounded-full border ${ASSIGNEE_COLORS[task.assigned_to] || 'bg-gray-700 text-gray-300'}`}>
                        👤 {task.assigned_to}
                      </span>
                    )}
                    {task.estimated_hours && (
                      <span className="text-xs px-2 py-1 rounded-full bg-gray-700 text-gray-300">
                        ⏱️ {task.estimated_hours}h
                      </span>
                    )}
                  </div>

                  {/* Delete button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteTask(task.id)
                    }}
                    className="mt-2 w-full text-xs bg-red-900 hover:bg-red-800 text-red-100 py-1 rounded opacity-0 group-hover:opacity-100 transition"
                  >
                    🗑️ Eliminar
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Task Detail Modal */}
      {showModal && selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          onClose={() => setShowModal(false)}
          onUpdate={async () => {
            await loadTasks()
            setShowModal(false)
          }}
        />
      )}
    </div>
  )
}

export default KanbanBoard
