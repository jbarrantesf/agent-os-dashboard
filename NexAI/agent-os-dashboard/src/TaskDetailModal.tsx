import React, { useState, useEffect } from 'react';

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

interface Comment {
  id: string;
  text: string;
  author: string;
  created_at: string;
}

interface TaskDetailModalProps {
  task: Task;
  onClose: () => void;
  apiUrl: string;
}

/**
 * Task Detail Modal — Shows full task details with comments and history
 */
export const TaskDetailModal: React.FC<TaskDetailModalProps> = ({
  task,
  onClose,
  apiUrl
}) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);

  // Fetch task details (comments, etc)
  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const response = await fetch(`${apiUrl}/tasks/${task.id}`);
        const data = await response.json();
        
        if (data.success) {
          setComments(data.comments);
        }
      } catch (err) {
        console.error('Failed to fetch task details:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [task.id, apiUrl]);

  // Add comment
  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    try {
      const response = await fetch(`${apiUrl}/tasks/${task.id}/comment?text=${encodeURIComponent(newComment)}`, {
        method: 'POST'
      });

      if (response.ok) {
        const data = await response.json();
        setComments([...comments, {
          id: data.comment_id,
          text: newComment,
          author: 'hermes',
          created_at: new Date().toISOString()
        }]);
        setNewComment('');
      }
    } catch (err) {
      console.error('Failed to add comment:', err);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('es-CR', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPriorityColor = (priority: Task['priority']): string => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-blue-100 text-blue-800';
      case 'low': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: Task['status']): string => {
    switch (status) {
      case 'triage': return 'bg-gray-100 text-gray-800';
      case 'todo': return 'bg-blue-100 text-blue-800';
      case 'in-progress': return 'bg-yellow-100 text-yellow-800';
      case 'blocked': return 'bg-red-100 text-red-800';
      case 'done': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gray-50 border-b border-gray-200 p-6 flex items-center justify-between">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900">{task.title}</h2>
            <p className="text-sm text-gray-500 mt-1">ID: {task.id}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Badges */}
          <div className="flex items-center gap-3 flex-wrap">
            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getPriorityColor(task.priority)}`}>
              {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)} Priority
            </span>
            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(task.status)}`}>
              {task.status.replace('-', ' ').charAt(0).toUpperCase() + task.status.replace('-', ' ').slice(1)}
            </span>
            {task.project && (
              <span className="px-3 py-1 rounded-full text-sm font-semibold bg-purple-100 text-purple-800">
                {task.project}
              </span>
            )}
            {task.assigned_to && (
              <span className="px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-800">
                👤 {task.assigned_to}
              </span>
            )}
          </div>

          {/* Description */}
          {task.description && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
              <p className="text-gray-700 leading-relaxed">{task.description}</p>
            </div>
          )}

          {/* Meta Information */}
          <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
            <div>
              <p className="text-sm text-gray-600">Created</p>
              <p className="font-semibold text-gray-900">{formatDate(task.created_at)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Last Updated</p>
              <p className="font-semibold text-gray-900">{formatDate(task.updated_at)}</p>
            </div>
            {task.estimated_hours && (
              <div>
                <p className="text-sm text-gray-600">Estimated</p>
                <p className="font-semibold text-gray-900">{task.estimated_hours} hours</p>
              </div>
            )}
            {task.assigned_to && (
              <div>
                <p className="text-sm text-gray-600">Assigned To</p>
                <p className="font-semibold text-gray-900">{task.assigned_to}</p>
              </div>
            )}
          </div>

          {/* Comments Section */}
          <div className="border-t pt-6">
            <h3 className="font-semibold text-gray-900 mb-4">Comments ({comments.length})</h3>

            {/* Comments List */}
            <div className="space-y-4 mb-6">
              {comments.length === 0 ? (
                <p className="text-gray-500 text-sm">No comments yet</p>
              ) : (
                comments.map(comment => (
                  <div key={comment.id} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <p className="font-semibold text-gray-900">{comment.author}</p>
                      <p className="text-xs text-gray-500">{formatDate(comment.created_at)}</p>
                    </div>
                    <p className="text-gray-700">{comment.text}</p>
                  </div>
                ))
              )}
            </div>

            {/* Add Comment */}
            {loading ? (
              <div className="text-center text-gray-500 text-sm">Loading...</div>
            ) : (
              <div className="flex gap-3">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  rows={3}
                />
                <button
                  onClick={handleAddComment}
                  disabled={!newComment.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Comment
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskDetailModal;
