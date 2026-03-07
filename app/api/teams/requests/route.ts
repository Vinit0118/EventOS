// Path: app/api/teams/requests/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { mockJoinRequests, mockTeams, mockUsers } from '@/lib/mock-data'
import { TeamJoinRequest, CreateJoinRequestPayload } from '@/types'
import { generateId } from '@/lib/utils'

// GET /api/teams/requests?team_id=X         → requests for a team (leader view)
// GET /api/teams/requests?user_id=X         → requests by a user (participant view)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const teamId = searchParams.get('team_id')
  const userId = searchParams.get('user_id')

  let requests = [...mockJoinRequests]

  if (teamId) requests = requests.filter(r => r.team_id === teamId)
  if (userId) requests = requests.filter(r => r.user_id === userId)

  // Sort: pending first
  requests.sort((a, b) => {
    if (a.status === 'PENDING' && b.status !== 'PENDING') return -1
    if (a.status !== 'PENDING' && b.status === 'PENDING') return 1
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })

  return NextResponse.json({ data: requests, error: null, success: true })
}

// POST /api/teams/requests → participant sends a join request
export async function POST(req: NextRequest) {
  try {
    const body: CreateJoinRequestPayload = await req.json()
    const { team_id, user_id, message } = body

    const team = mockTeams.find(t => t.id === team_id)
    if (!team) return NextResponse.json({ data: null, error: 'Team not found', success: false }, { status: 404 })

    // Can't request if already a member
    const alreadyMember = team.members?.some(m => m.user_id === user_id)
    if (alreadyMember) return NextResponse.json({ data: null, error: 'Already a member of this team', success: false }, { status: 409 })

    // Can't request if team is full
    if ((team.member_count ?? 0) >= team.max_size) {
      return NextResponse.json({ data: null, error: 'Team is full', success: false }, { status: 400 })
    }

    // Can't send duplicate pending request
    const existingPending = mockJoinRequests.find(r => r.team_id === team_id && r.user_id === user_id && r.status === 'PENDING')
    if (existingPending) return NextResponse.json({ data: null, error: 'You already have a pending request for this team', success: false }, { status: 409 })

    const user = mockUsers.find(u => u.id === user_id)

    const newRequest: TeamJoinRequest = {
      id: generateId('req'),
      team_id,
      user_id,
      status: 'PENDING',
      message,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      user,
      team,
    }

    mockJoinRequests.push(newRequest)

    // Increment pending_requests count on team
    if (team.pending_requests !== undefined) team.pending_requests++
    else team.pending_requests = 1

    return NextResponse.json({ data: newRequest, error: null, success: true }, { status: 201 })
  } catch {
    return NextResponse.json({ data: null, error: 'Failed to send request', success: false }, { status: 500 })
  }
}