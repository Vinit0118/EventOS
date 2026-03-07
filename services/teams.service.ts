// Path: services/teams.service.ts
import { CreateTeamPayload, CreateJoinRequestPayload } from '@/types'

export const teamsService = {
  // Search teams for an event, optionally filter by name/skills
  async search(eventId: string, query?: string) {
    const params = new URLSearchParams({ event_id: eventId })
    if (query) params.set('search', query)
    const res = await fetch(`/api/teams?${params}`)
    return res.json()
  },

  async getById(id: string) {
    const params = new URLSearchParams({ team_id: id })
    const res = await fetch(`/api/teams?${params}`)
    const all = await res.json()
    return { data: all.data?.[0] ?? null, success: all.success, error: all.error }
  },

  async create(payload: CreateTeamPayload) {
    const res = await fetch('/api/teams', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    return res.json()
  },

  // Participant sends a join request to a team
  async sendJoinRequest(payload: CreateJoinRequestPayload) {
    const res = await fetch('/api/teams/requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    return res.json()
  },

  // Team leader: get all requests for their team
  async getRequestsForTeam(teamId: string) {
    const res = await fetch(`/api/teams/requests?team_id=${teamId}`)
    return res.json()
  },

  // Participant: get all requests they've sent
  async getMyRequests(userId: string) {
    const res = await fetch(`/api/teams/requests?user_id=${userId}`)
    return res.json()
  },

  // Team leader: accept or reject a request
  async respondToRequest(teamId: string, requestId: string, response: 'ACCEPTED' | 'REJECTED') {
    const res = await fetch(`/api/teams/${teamId}/respond`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ request_id: requestId, response }),
    })
    return res.json()
  },

  // Get team for a specific registration / user+event combo
  async getMyTeam(eventId: string, userId: string) {
    const res = await fetch(`/api/teams?event_id=${eventId}`)
    const all = await res.json()
    const team = all.data?.find((t: any) => t.members?.some((m: any) => m.user_id === userId))
    return { data: team ?? null, success: true, error: null }
  },
}