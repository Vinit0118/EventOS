// Path: services/events.service.ts
import { CreateEventPayload, Event } from '@/types'

export const eventsService = {
  async getAll(filters?: { status?: string; created_by?: string; search?: string }) {
    const params = new URLSearchParams()
    if (filters?.status)     params.set('status', filters.status)
    if (filters?.created_by) params.set('created_by', filters.created_by)
    if (filters?.search)     params.set('search', filters.search)
    const res = await fetch(`/api/events?${params}`)
    return res.json()
  },

  async getById(id: string) {
    const res = await fetch(`/api/events/${id}`)
    return res.json()
  },

  async create(payload: CreateEventPayload & { created_by: string }) {
    const res = await fetch('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    return res.json()
  },

  async updateStatus(id: string, status: Event['status'], requestedBy: string) {
    const res = await fetch(`/api/events/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, requested_by: requestedBy }),
    })
    return res.json()
  },

  async delete(id: string, requestedBy: string) {
    const res = await fetch(`/api/events/${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requested_by: requestedBy }),
    })
    return res.json()
  },

  async getAnalytics(id: string) {
    const res = await fetch(`/api/events/${id}/analytics`)
    return res.json()
  },
}