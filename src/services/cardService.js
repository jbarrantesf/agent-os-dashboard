import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || '/api'

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

export const cardService = {
  getAll: async (filters = {}) => {
    const params = new URLSearchParams()
    if (filters.status) params.append('status', filters.status)
    if (filters.cardType) params.append('cardType', filters.cardType)
    if (filters.assignee) params.append('assignee', filters.assignee)

    const response = await apiClient.get(`/cards?${params.toString()}`)
    return response.data.data || []
  },

  getById: async (id) => {
    const response = await apiClient.get(`/cards/${id}`)
    return response.data.data
  },

  create: async (card) => {
    const response = await apiClient.post('/cards', card)
    return response.data.data
  },

  update: async (id, updates) => {
    const response = await apiClient.patch(`/cards/${id}`, updates)
    return response.data.data
  },

  delete: async (id) => {
    await apiClient.delete(`/cards/${id}`)
  },
}
