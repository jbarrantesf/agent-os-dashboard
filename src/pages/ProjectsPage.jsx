import React, { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { Plus, Folders, Filter } from 'lucide-react'
import { cardService } from '../services/cardService'

const STATUSES = ['Draft', 'Ready', 'In Progress', 'Done']
const CARD_TYPES = ['code', 'research', 'design', 'other']

const TYPE_COLORS = {
  code: '#3b82f6',
  research: '#10b981',
  design: '#f59e0b',
  other: '#8b5cf6',
}

const STATUS_COLORS = {
  Draft: '#475569',
  Ready: '#3b82f6',
  'In Progress': '#f59e0b',
  Done: '#10b981',
}

const KanbanCard = ({ card, onStatusChange, onDelete }) => (
  <div
    className="glass-card p-3 mb-2"
    style={{ borderLeft: `3px solid ${TYPE_COLORS[card.card_type] || '#475569'}` }}
  >
    <div className="flex items-start justify-between gap-2 mb-2">
      <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', lineHeight: 1.3 }}>
        {card.title}
      </div>
      <button
        onClick={() => onDelete(card.id)}
        style={{ color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, lineHeight: 1, flexShrink: 0 }}
        title="Eliminar"
      >×</button>
    </div>
    {card.description && (
      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8, lineHeight: 1.4 }}>
        {card.description}
      </div>
    )}
    <div className="flex items-center justify-between">
      <span className="badge" style={{ background: `${TYPE_COLORS[card.card_type]}20`, color: TYPE_COLORS[card.card_type], fontSize: 10 }}>
        {card.card_type}
      </span>
      <select
        value={card.status}
        onChange={e => onStatusChange(card.id, e.target.value)}
        style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border)',
          borderRadius: 6,
          color: STATUS_COLORS[card.status] || 'var(--text-secondary)',
          fontSize: 11,
          padding: '2px 6px',
          cursor: 'pointer',
          fontWeight: 500,
        }}
      >
        {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
      </select>
    </div>
    {card.assignee && (
      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>
        👤 {card.assignee}
      </div>
    )}
  </div>
)

const Column = ({ status, cards, onStatusChange, onDelete }) => (
  <div style={{ minWidth: 220, flex: '1 1 220px' }}>
    <div
      className="flex items-center gap-2 mb-3 px-1"
      style={{ borderBottom: `2px solid ${STATUS_COLORS[status]}40`, paddingBottom: 8 }}
    >
      <span style={{ fontSize: 13, fontWeight: 600, color: STATUS_COLORS[status] }}>{status}</span>
      <span
        style={{
          background: `${STATUS_COLORS[status]}20`,
          color: STATUS_COLORS[status],
          borderRadius: 12,
          padding: '1px 8px',
          fontSize: 11,
          fontWeight: 600,
        }}
      >
        {cards.length}
      </span>
    </div>
    <div style={{ minHeight: 80 }}>
      {cards.map(card => (
        <KanbanCard key={card.id} card={card} onStatusChange={onStatusChange} onDelete={onDelete} />
      ))}
      {cards.length === 0 && (
        <div style={{
          border: '1px dashed var(--border)',
          borderRadius: 8,
          padding: '16px',
          textAlign: 'center',
          color: 'var(--text-muted)',
          fontSize: 12,
        }}>
          Sin tarjetas
        </div>
      )}
    </div>
  </div>
)

export default function ProjectsPage() {
  const queryClient = useQueryClient()
  const [selectedType, setSelectedType] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title: '', card_type: 'code', status: 'Draft', assignee: '', description: '' })
  const [error, setError] = useState(null)

  const { data: cards = [], isLoading } = useQuery(
    ['cards', selectedType],
    () => cardService.getAll(selectedType ? { cardType: selectedType } : {}),
    { refetchInterval: 15000, refetchOnWindowFocus: false }
  )

  const createMutation = useMutation(
    (newCard) => cardService.create(newCard),
    {
      onSuccess: () => { queryClient.invalidateQueries('cards'); setShowForm(false); setForm({ title: '', card_type: 'code', status: 'Draft', assignee: '', description: '' }) },
      onError: (e) => setError(`Error: ${e.message}`)
    }
  )

  const updateMutation = useMutation(
    ({ id, updates }) => cardService.update(id, updates),
    { onSuccess: () => queryClient.invalidateQueries('cards') }
  )

  const deleteMutation = useMutation(
    (id) => cardService.delete(id),
    { onSuccess: () => queryClient.invalidateQueries('cards') }
  )

  const cardsByStatus = STATUSES.reduce((acc, s) => {
    acc[s] = cards.filter(c => c.status === s)
    return acc
  }, {})

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)' }}>
            📁 Proyectos
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>
            Kanban de tareas y proyectos NexAI
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2"
          style={{
            background: 'var(--accent-blue)',
            border: 'none',
            borderRadius: 8,
            padding: '8px 14px',
            color: '#fff',
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          <Plus size={15} />
          Nueva Tarea
        </button>
      </div>

      {/* New card form */}
      {showForm && (
        <div className="glass-card p-5">
          <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 14 }}>
            Crear Nueva Tarea
          </h3>
          {error && (
            <div style={{ background: '#ef444420', border: '1px solid #ef444440', borderRadius: 8, padding: 10, marginBottom: 12, fontSize: 12, color: '#ef4444' }}>
              {error}
            </div>
          )}
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className="col-span-2">
              <input
                placeholder="Título de la tarea *"
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                style={{
                  width: '100%', background: 'var(--bg-secondary)',
                  border: '1px solid var(--border)', borderRadius: 8,
                  padding: '9px 12px', color: 'var(--text-primary)', fontSize: 13,
                  outline: 'none',
                }}
                onFocus={e => e.currentTarget.style.borderColor = '#3b82f660'}
                onBlur={e => e.currentTarget.style.borderColor = 'var(--border)'}
              />
            </div>
            <select
              value={form.card_type}
              onChange={e => setForm(f => ({ ...f, card_type: e.target.value }))}
              style={{
                background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                borderRadius: 8, padding: '9px 12px', color: 'var(--text-primary)', fontSize: 13,
              }}
            >
              {CARD_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <input
              placeholder="Asignar a... (ej: Hermes, ORBIT)"
              value={form.assignee}
              onChange={e => setForm(f => ({ ...f, assignee: e.target.value }))}
              style={{
                background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                borderRadius: 8, padding: '9px 12px', color: 'var(--text-primary)', fontSize: 13, outline: 'none',
              }}
            />
            <div className="col-span-2">
              <textarea
                placeholder="Descripción (opcional)"
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                rows={2}
                style={{
                  width: '100%', background: 'var(--bg-secondary)',
                  border: '1px solid var(--border)', borderRadius: 8,
                  padding: '9px 12px', color: 'var(--text-primary)', fontSize: 13,
                  resize: 'none', outline: 'none', fontFamily: 'inherit',
                }}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => createMutation.mutate(form)}
              disabled={!form.title.trim()}
              style={{
                background: form.title.trim() ? 'var(--accent-blue)' : 'var(--bg-card)',
                border: 'none', borderRadius: 8,
                padding: '9px 18px', color: form.title.trim() ? '#fff' : 'var(--text-muted)',
                fontSize: 13, fontWeight: 600, cursor: form.title.trim() ? 'pointer' : 'not-allowed',
              }}
            >
              {createMutation.isLoading ? 'Creando...' : 'Crear Tarea'}
            </button>
            <button
              onClick={() => setShowForm(false)}
              style={{ background: 'transparent', border: '1px solid var(--border)', borderRadius: 8, padding: '9px 14px', color: 'var(--text-secondary)', fontSize: 13, cursor: 'pointer' }}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Type filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter size={13} style={{ color: 'var(--text-muted)' }} />
        {[null, ...CARD_TYPES].map(type => (
          <button
            key={type ?? 'all'}
            onClick={() => setSelectedType(type)}
            style={{
              background: selectedType === type ? 'var(--accent-blue)' : 'var(--bg-card)',
              border: `1px solid ${selectedType === type ? 'var(--accent-blue)' : 'var(--border)'}`,
              borderRadius: 20, padding: '4px 14px',
              color: selectedType === type ? '#fff' : 'var(--text-secondary)',
              fontSize: 12, fontWeight: 500, cursor: 'pointer',
            }}
          >
            {type === null ? 'Todos' : type}
          </button>
        ))}
      </div>

      {/* Kanban board */}
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
          Cargando tareas...
        </div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {STATUSES.map(status => (
            <Column
              key={status}
              status={status}
              cards={cardsByStatus[status]}
              onStatusChange={(id, newStatus) => updateMutation.mutate({ id, updates: { status: newStatus } })}
              onDelete={(id) => { if (window.confirm('¿Eliminar tarea?')) deleteMutation.mutate(id) }}
            />
          ))}
        </div>
      )}
    </div>
  )
}
