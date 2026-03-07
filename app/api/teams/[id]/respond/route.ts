// Path: app/api/teams/[id]/respond/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { mockJoinRequests, mockTeams, mockUsers, mockRegistrations } from '@/lib/mock-data'
import { generateId } from '@/lib/utils'

// POST /api/teams/[id]/respond
// Body: { request_id, response: 'ACCEPTED' | 'REJECTED' }
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { request_id, response } = await req.json()

    const team = mockTeams.find(t => t.id === params.id)
    if (!team) return NextResponse.json({ data: null, error: 'Team not found', success: false }, { status: 404 })

    const request = mockJoinRequests.find(r => r.id === request_id && r.team_id === params.id)
    if (!request) return NextResponse.json({ data: null, error: 'Request not found', success: false }, { status: 404 })
    if (request.status !== 'PENDING') return NextResponse.json({ data: null, error: 'Request already resolved', success: false }, { status: 409 })

    // Auto-reject if team became full since request was sent
    if (response === 'ACCEPTED' && (team.member_count ?? 0) >= team.max_size) {
      request.status = 'REJECTED'
      request.updated_at = new Date().toISOString()
      return NextResponse.json({ data: null, error: 'Team is now full. Request auto-rejected.', success: false }, { status: 400 })
    }

    request.status = response
    request.updated_at = new Date().toISOString()

    // Decrement pending count
    if (team.pending_requests && team.pending_requests > 0) team.pending_requests--

    if (response === 'ACCEPTED') {
      const user = mockUsers.find(u => u.id === request.user_id)

      // Add to team members
      if (!team.members) team.members = []
      team.members.push({
        id: generateId('tm'),
        team_id: team.id,
        user_id: request.user_id,
        role: 'MEMBER',
        joined_at: new Date().toISOString(),
        user,
      })
      team.member_count = (team.member_count ?? 0) + 1
      team.updated_at = new Date().toISOString()

      // If team is now full, mark COMPLETE
      if (team.member_count >= team.max_size) team.status = 'COMPLETE'

      // Link team_id on their registration for this event
      const reg = mockRegistrations.find(r => r.user_id === request.user_id && r.event_id === team.event_id)
      if (reg) reg.team_id = team.id

      // Auto-reject all other pending requests from this user for same event
      // (they can only be on one team)
      mockJoinRequests
        .filter(r => r.user_id === request.user_id && r.id !== request_id && r.status === 'PENDING')
        .forEach(r => {
          r.status = 'REJECTED'
          r.updated_at = new Date().toISOString()
          const t = mockTeams.find(t => t.id === r.team_id)
          if (t && t.pending_requests && t.pending_requests > 0) t.pending_requests--
        })
    }

    return NextResponse.json({ data: { request, team }, error: null, success: true })
  } catch (e) {
    return NextResponse.json({ data: null, error: 'Failed to respond', success: false }, { status: 500 })
  }
}