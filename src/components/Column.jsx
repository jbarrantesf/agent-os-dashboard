import React from 'react'
import { Card } from './Card'

export function Column({ status, cards, onStatusChange, onDelete, cardCount }) {
  const statusIcons = {
    'Draft': '📝',
    'Ready': '✅',
    'In Progress': '🔄',
    'Done': '🎉'
  }

  return (
    <div className="kanban-column">
      <div className="kanban-column-header flex items-center gap-2">
        <span>{statusIcons[status]}</span>
        <span>{status}</span>
        <span className="ml-auto bg-gray-200 text-gray-700 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
          {cardCount}
        </span>
      </div>
      <div className="space-y-3">
        {cards.length === 0 ? (
          <div className="text-center py-8 text-gray-400 text-sm">
            No cards in {status}
          </div>
        ) : (
          cards.map(card => (
            <Card
              key={card.id}
              card={card}
              onStatusChange={onStatusChange}
              onDelete={onDelete}
            />
          ))
        )}
      </div>
    </div>
  )
}
