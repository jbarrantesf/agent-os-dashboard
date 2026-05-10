import React, { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { Column } from './components/Column'
import { NewCardForm } from './components/NewCardForm'
import { cardService } from './services/cardService'

const STATUSES = ['Draft', 'Ready', 'In Progress', 'Done']
const CARD_TYPES = ['code', 'research', 'design', 'other']

export default function App() {
  const queryClient = useQueryClient()
  const [selectedType, setSelectedType] = useState(null)
  const [error, setError] = useState(null)

  // Fetch cards with real-time polling
  const { data: cards = [], isLoading, refetch } = useQuery(
    ['cards', selectedType],
    () => cardService.getAll(selectedType ? { cardType: selectedType } : {}),
    {
      refetchInterval: 10000, // Poll every 10 seconds
      refetchOnWindowFocus: false,
    }
  )

  // Create card mutation
  const createMutation = useMutation(
    (newCard) => cardService.create(newCard),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('cards')
        setError(null)
      },
      onError: (error) => {
        setError(`Failed to create card: ${error.message}`)
      }
    }
  )

  // Update card mutation
  const updateMutation = useMutation(
    ({ id, updates }) => cardService.update(id, updates),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('cards')
        setError(null)
      },
      onError: (error) => {
        setError(`Failed to update card: ${error.message}`)
      }
    }
  )

  // Delete card mutation
  const deleteMutation = useMutation(
    (id) => cardService.delete(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('cards')
        setError(null)
      },
      onError: (error) => {
        setError(`Failed to delete card: ${error.message}`)
      }
    }
  )

  const handleCreateCard = (formData) => {
    createMutation.mutate(formData)
  }

  const handleStatusChange = (cardId, newStatus) => {
    updateMutation.mutate({
      id: cardId,
      updates: { status: newStatus }
    })
  }

  const handleDeleteCard = (cardId) => {
    if (window.confirm('Are you sure you want to delete this card?')) {
      deleteMutation.mutate(cardId)
    }
  }

  // Group cards by status
  const cardsByStatus = STATUSES.reduce((acc, status) => {
    acc[status] = cards.filter(card => card.status === status)
    return acc
  }, {})

  // Auto-dismiss errors
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000)
      return () => clearTimeout(timer)
    }
  }, [error])

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            🏗️ Dashboard Tower
          </h1>
          <p className="text-gray-600 text-sm mt-1">Kanban Board for Task Management</p>
        </div>
      </header>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mx-4 mt-4 rounded">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* New Card Form */}
        <NewCardForm
          onSubmit={handleCreateCard}
          isLoading={createMutation.isLoading}
        />

        {/* Filter Section */}
        <div className="mb-6 flex flex-wrap gap-2 items-center">
          <span className="text-sm font-medium text-gray-600">Filter by type:</span>
          <button
            onClick={() => setSelectedType(null)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              selectedType === null
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            All
          </button>
          {CARD_TYPES.map(type => (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                selectedType === type
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-gray-500">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-2"></div>
              Loading cards...
            </div>
          </div>
        )}

        {/* Kanban Board */}
        {!isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {STATUSES.map(status => (
              <Column
                key={status}
                status={status}
                cards={cardsByStatus[status]}
                onStatusChange={handleStatusChange}
                onDelete={handleDeleteCard}
                cardCount={cardsByStatus[status].length}
              />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && cards.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No cards yet. Create one to get started!</p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-gray-600">
          <p>Dashboard Tower v1.0 • Real-time polling every 10 seconds</p>
        </div>
      </footer>
    </div>
  )
}
