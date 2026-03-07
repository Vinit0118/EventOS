// Path: app/api/teams/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { mockTeams, mockUsers } from '@/lib/mock-data'
import { Team, CreateTeamPayload } from '@/types'
import { generateId } from '@/lib/utils'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const eventId  = searchParams.get('event_id')
  const search   = searchParams.get('search')?.toLowerCase()
  const skills   = searchParams.get('skills')?.split(',').filter(Boolean)

  let teams = [...mockTeams]

  if (eventId) teams = teams.filter(t => t.event_id === eventId)

  if (search) {
    teams = teams.filter(t =>
      t.name.toLowerCase().includes(search) ||
      t.description?.toLowerCase().includes(search) ||
      t.skills.some(s => s.toLowerCase().includes(search))
    )
  }

  if (skills?.length) {
    teams = teams.filter(t => skills.some(s => t.skills.includes(s)))
  }

  // Add member_count & pending_requests computed fields
  return NextResponse.json({ data: teams, error: null, success: true })
}

export async function POST(req: NextRequest) {
  try {
    const body: CreateTeamPayload = await req.json()
    const { event_id, name, description, skills, leader_id } = body

    const leader = mockUsers.find(u => u.id === leader_id)
    if (!leader) return NextResponse.json({ data: null, error: 'User not found', success: false }, { status: 404 })

    const duplicate = mockTeams.find(t => t.event_id === event_id && t.name.toLowerCase() === name.toLowerCase())
    if (duplicate) return NextResponse.json({ data: null, error: 'Team name already taken for this event', success: false }, { status: 409 })

    const newTeam: Team = {
      id: generateId('team'),
      event_id,
      name,
      description,
      status: 'FORMING',
      leader_id,
      skills: skills ?? [],
      max_size: 4,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      leader,
      members: [{
        id: generateId('tm'),
        team_id: '',       // filled below
        user_id: leader_id,
        role: 'LEADER',
        joined_at: new Date().toISOString(),
        user: leader,
      }],
      member_count: 1,
      pending_requests: 0,
    }
    newTeam.members![0].team_id = newTeam.id

    mockTeams.push(newTeam)
    return NextResponse.json({ data: newTeam, error: null, success: true }, { status: 201 })
  } catch {
    return NextResponse.json({ data: null, error: 'Failed to create team', success: false }, { status: 500 })
  }
}