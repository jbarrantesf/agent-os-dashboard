import React, { useState, useEffect, useCallback } from 'react';
import TaskDetailModal from './TaskDetailModal';

interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'triage' | 'todo' | 'in-progress' | 'blocked' | 'done';
  assigned_to?: string;
  project?: string;
  estimated_hours?: number;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  created_at: string;
  updated_at: string;
}

interface Stats {
  total: number;
  by_status: Record<string, number>;
  by_assignee: Record<string, number>;
}

interface KanbanBoardProps {
  apiUrl?: string;
  board?: string;
}

const COLUMNS = [
  { id: 'triage', label: '📥 Triage', color: 'gray' },
  { id: 'todo', label: '📋 Todo', color: 'blue' },
  { id: 'in-progress', label: '⚙️ In Progress', color: 'yellow' },
  { id: 'blocked', label: '🚫 Blocked', color: 'red' },
  { id: 'done', label: '✅ Done', color: 'green' }
];

const ASSIGNEE_COLORS: Record<string, string> = {
  'hermes': 'bg-purple-100 text-purple-800 border-purple-300',
  'orbit': 'bg-blue-100 text-blue-800 border-blue-300',
  'worker-1': 'bg-indigo-100 text-indigo-800 border-indigo-300',
  'worker-2': 'bg-pink-100 text-pink-800 border-pink-300',
};

const PRIORITY_COLORS: Record<string, string> = {
  'urgent': 'bg-red-100 text-red-800',
  'high': 'bg-orange-100 text-orange-800',
  'medium': 'bg-blue-100 text-blue-800',
  'low': 'bg-gray-100 text-gray-800',
};

const COLUMN_COLORS: Record<string, string> = {
  'gray': 'bg-gray-50 border-gray-200',
  'blue': 'bg-blue-50 border-blue-200',
  'yellow': 'bg-yellow-50 border-yellow-200',
  'red': 'bg-red-50 border-red-200',
  'green': 'bg-green-50 border-green-200',
};

/**
 * Control Tower Kanban Board — Professional Trello-style drag-drop interface
 * Real-time WebSocket sync with Hermes Kanban system
 */
export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  apiUrl = 'http://localhost:8000/api/kanban',
  board = 'default'
}) => {
  const [tasks, setTasks] = useState<Record<string, Task[]>>({
    triage: [],
    todo: [],
    'in-progress': [],
    blocked: [],
    done: []
  });

  const [stats, setStats] = useState<Stats>({
    total: 0,
    by_status: {},
    by_assignee: {}
  });

  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [filter, setFilter] = useState<string>('all');
  const [draggedTask, setDraggedTask] = useState<{ taskId: string; fromColumn: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ws, setWs] = useState<WebSocket | null>(null);

  // Fetch initial tasks
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const response = await fetch(`${apiUrl}/tasks?board=${board}`);
        const data = await response.json();

        if (data.success) {
          // Group tasks by status
          const grouped: Record<string, Task[]> = {
            triage: [],
            todo: [],
            'in-progress': [],
            blocked: [],
            done: []
          };

          data.tasks.forEach((task: Task) => {
            if (grouped[task.status]) {
              grouped[task.status].push(task);
            }
          });

          setTasks(grouped);
          setStats(data.stats);
        }
      } catch (err) {
        console.error('Failed to fetch tasks:', err);
        setError('Failed to load tasks');
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, [apiUrl, board]);

  // WebSocket connection for real-time updates
  useEffect(() => {
    const wsUrl = `ws://localhost:8000/api/kanban/ws/kanban?board=${board}`;
    const socket = new WebSocket(wsUrl);

    socket.onopen = () => {
      console.log('✅ WebSocket connected');
    };

    socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);

        switch (message.type) {
          case 'snapshot':
            // Initial state
            const grouped: Record<string, Task[]> = {
              triage: [],
              todo: [],
              'in-progress': [],
              blocked: [],
              done: []
            };
            message.tasks.forEach((task: Task) => {
              if (grouped[task.status]) {
                grouped[task.status].push(task);
              }
            });
            setTasks(grouped);
            setStats(message.stats);
            break;

          case 'task_created':
            // New task
            setTasks(prev => ({
              ...prev,
              [message.task.status]: [...(prev[message.task.status] || []), message.task]
            }));
            break;

          case 'task_claimed':
            // Task assigned
            setTasks(prev => {
              const newTasks = { ...prev };
              Object.keys(newTasks).forEach(status => {
                newTasks[status] = newTasks[status].map(t =>
                  t.id === message.task_id ? { ...t, assigned_to: message.assignee } : t
                );
              });
              return newTasks;
            });
            break;

          case 'task_completed':
            // Task moved to done
            setTasks(prev => {
              const newTasks = { ...prev };
              Object.keys(newTasks).forEach(status => {
                newTasks[status] = newTasks[status].filter(t => t.id !== message.task_id);
              });
              newTasks.done = [...(newTasks.done || []), message.task];
              return newTasks;
            });
            break;

          case 'comment_added':
            // Comment added (refresh task)
            setSelectedTask(prev =>
              prev && prev.id === message.task_id
                ? { ...prev, updated_at: new Date().toISOString() }
                : prev
            );
            break;
        }
      } catch (err) {
        console.error('WebSocket message parse error:', err);
      }
    };

    socket.onerror = (err) => {
      console.error('❌ WebSocket error:', err);
      setError('Real-time updates unavailable');
    };

    socket.onclose = () => {
      console.log('WebSocket disconnected');
    };

    setWs(socket);

    return () => {
      socket.close();
    };
  }, [board]);

  // Claim task
  const handleClaim = useCallback(async (taskId: string) => {
    try {
      const response = await fetch(`${apiUrl}/tasks/${taskId}/claim?assignee=hermes`, {
        method: 'POST'
      });

      if (!response.ok) throw new Error('Failed to claim task');
      // WebSocket will handle the update
    } catch (err) {
      console.error('Failed to claim task:', err);
      alert('Failed to claim task');
    }
  }, [apiUrl]);

  // Complete task
  const handleComplete = useCallback(async (taskId: string) => {
    try {
      const response = await fetch(`${apiUrl}/tasks/${taskId}/complete`, {
        method: 'POST'
      });

      if (!response.ok) throw new Error('Failed to complete task');
      // WebSocket will handle the update
    } catch (err) {
      console.error('Failed to complete task:', err);
      alert('Failed to complete task');
    }
  }, [apiUrl]);

  // Drag handlers
  const handleDragStart = (task: Task, column: string) => {
    setDraggedTask({ taskId: task.id, fromColumn: column });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = useCallback(async (toColumn: string) => {
    if (!draggedTask) return;

    const task = Object.values(tasks)
      .flat()
      .find(t => t.id === draggedTask.taskId);

    if (!task) return;

    // Update UI optimistically
    setTasks(prev => {
      const newTasks = { ...prev };
      newTasks[draggedTask.fromColumn] = newTasks[draggedTask.fromColumn].filter(
        t => t.id !== draggedTask.taskId
      );
      newTasks[toColumn] = [...(newTasks[toColumn] || []), { ...task, status: toColumn as any }];
      return newTasks;
    });

    // Call API
    try {
      const response = await fetch(`${apiUrl}/tasks/${draggedTask.taskId}/status?status=${toColumn}`, {
        method: 'PATCH'
      });

      if (!response.ok) {
        throw new Error('Failed to update task status');
      }
    } catch (err) {
      console.error('Failed to move task:', err);
      alert('Failed to move task');
      // UI will revert on next WebSocket update
    }

    setDraggedTask(null);
  }, [draggedTask, tasks, apiUrl]);

  // Filter tasks
  const getFilteredTasks = (columnTasks: Task[]): Task[] => {
    if (filter === 'all') return columnTasks;
    return columnTasks.filter(t => t.assigned_to === filter);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-white mb-4"></div>
          <p className="text-white text-lg">Loading Kanban...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">🚀 Control Tower</h1>
          <p className="text-gray-400 text-sm mt-1">Kanban Board • Board: {board}</p>
        </div>

        <div className="flex items-center gap-6">
          {/* Stats */}
          <div className="flex gap-6">
            <div className="text-center">
              <p className="text-gray-400 text-sm">Total</p>
              <p className="text-white text-2xl font-bold">{stats.total}</p>
            </div>
            <div className="text-center">
              <p className="text-gray-400 text-sm">In Progress</p>
              <p className="text-yellow-400 text-2xl font-bold">{stats.by_status?.['in-progress'] || 0}</p>
            </div>
            <div className="text-center">
              <p className="text-gray-400 text-sm">Done</p>
              <p className="text-green-400 text-2xl font-bold">{stats.by_status?.['done'] || 0}</p>
            </div>
          </div>

          {/* Filter */}
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 hover:border-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Assignees</option>
            <option value="hermes">👾 Hermes</option>
            <option value="orbit">🌌 Orbit</option>
            <option value="unassigned">Unassigned</option>
          </select>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-500 text-white px-6 py-3">
          {error}
        </div>
      )}

      {/* Kanban Board */}
      <div className="flex-1 overflow-x-auto p-6 gap-6 flex">
        {COLUMNS.map(column => {
          const columnTasks = getFilteredTasks(tasks[column.id] || []);
          const columnColor = COLUMN_COLORS[column.color];

          return (
            <div
              key={column.id}
              className={`flex-shrink-0 w-96 rounded-lg border-2 ${columnColor} flex flex-col`}
            >
              {/* Column Header */}
              <div className="p-4 border-b border-gray-300 bg-white bg-opacity-5">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-white">{column.label}</h2>
                  <span className="px-3 py-1 rounded-full text-sm font-semibold bg-gray-700 text-gray-200">
                    {columnTasks.length}
                  </span>
                </div>
              </div>

              {/* Tasks Container */}
              <div
                onDragOver={handleDragOver}
                onDrop={() => handleDrop(column.id)}
                className="flex-1 p-4 overflow-y-auto space-y-3"
              >
                {columnTasks.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <p className="text-sm">No tasks</p>
                  </div>
                ) : (
                  columnTasks.map(task => (
                    <div
                      key={task.id}
                      draggable
                      onDragStart={() => handleDragStart(task, column.id)}
                      onClick={() => setSelectedTask(task)}
                      className="bg-white rounded-lg p-4 shadow-md hover:shadow-lg cursor-move transition-all hover:scale-105 border-l-4 border-blue-500"
                    >
                      {/* Priority Badge */}
                      <div className="flex items-start justify-between mb-2">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${PRIORITY_COLORS[task.priority]}`}>
                          {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                        </span>
                        {task.assigned_to && (
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${ASSIGNEE_COLORS[task.assigned_to] || 'bg-gray-100 text-gray-800'}`}>
                            {task.assigned_to === 'hermes' ? '👾' : task.assigned_to === 'orbit' ? '🌌' : '👤'} {task.assigned_to}
                          </span>
                        )}
                      </div>

                      {/* Title */}
                      <h3 className="font-bold text-gray-900 mb-2 text-sm line-clamp-2">
                        {task.title}
                      </h3>

                      {/* Meta */}
                      <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                        {task.project && (
                          <span className="px-2 py-1 rounded bg-purple-100 text-purple-800">
                            {task.project}
                          </span>
                        )}
                        {task.estimated_hours && (
                          <span>⏱️ {task.estimated_hours}h</span>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        {!task.assigned_to && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleClaim(task.id);
                            }}
                            className="flex-1 px-2 py-1 bg-blue-500 text-white text-xs font-semibold rounded hover:bg-blue-600 transition"
                          >
                            Claim
                          </button>
                        )}
                        {column.id !== 'done' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleComplete(task.id);
                            }}
                            className="flex-1 px-2 py-1 bg-green-500 text-white text-xs font-semibold rounded hover:bg-green-600 transition"
                          >
                            Done
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Task Detail Modal */}
      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          apiUrl={apiUrl}
        />
      )}
    </div>
  );
};

export default KanbanBoard;
