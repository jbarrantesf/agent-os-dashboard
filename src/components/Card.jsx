import React from 'react'
import clsx from 'clsx'

const CARD_TYPE_COLORS = {
  code: { badge: 'bg-blue-100 text-blue-800', border: 'border-l-4 border-blue-500', bg: 'bg-blue-50' },
  research: { badge: 'bg-green-100 text-green-800', border: 'border-l-4 border-green-500', bg: 'bg-green-50' },
  design: { badge: 'bg-amber-100 text-amber-800', border: 'border-l-4 border-amber-500', bg: 'bg-amber-50' },
  other: { badge: 'bg-purple-100 text-purple-800', border: 'border-l-4 border-purple-500', bg: 'bg-purple-50' },
}

export function Card({ card, onStatusChange, onDelete }) {
  const colors = CARD_TYPE_COLORS[card.card_type] || CARD_TYPE_COLORS.other
  const statuses = ['Draft', 'Ready', 'In Progress', 'Done']

  return (
    <div className={clsx(
      'p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing bg-white',
      colors.border
    )}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="font-semibold text-gray-900 flex-1 text-sm">{card.title}</h3>
        <button
          onClick={() => onDelete(card.id)}
          className="text-gray-400 hover:text-red-500 transition-colors"
          title="Delete card"
        >
          ✕
        </button>
      </div>

      {card.description && (
        <p className="text-xs text-gray-600 mb-2">{card.description}</p>
      )}

      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <span className={clsx('text-xs font-medium px-2 py-1 rounded', colors.badge)}>
          {card.card_type}
        </span>
        {card.assignee && (
          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
            {card.assignee}
          </span>
        )}
      </div>

      {card.due_date && (
        <p className="text-xs text-gray-500 mb-2">
          Due: {new Date(card.due_date).toLocaleDateString()}
        </p>
      )}

      <select
        value={card.status}
        onChange={(e) => onStatusChange(card.id, e.target.value)}
        className="w-full text-xs p-1.5 border border-gray-300 rounded bg-white hover:bg-gray-50 transition-colors"
      >
        {statuses.map(status => (
          <option key={status} value={status}>{status}</option>
        ))}
      </select>
    </div>
  )
}
