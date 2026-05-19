import React, { useState } from 'react';
import KanbanBoard from './KanbanBoard';
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

function App() {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  return (
    <div className="w-full h-screen bg-gray-50">
      <KanbanBoard
        board="default"
        apiUrl="http://localhost:8000/api/kanban"
        onTaskClick={setSelectedTask}
      />

      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          apiUrl="http://localhost:8000/api/kanban"
        />
      )}
    </div>
  );
}

export default App;
