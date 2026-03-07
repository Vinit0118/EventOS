// Path: app/api/events/[id]/analytics/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { mockEvents, mockRegistrations, mockTeams, mockCheckIns } from '@/lib/mock-data'
import { calculateHealthScore } from '@/lib/utils'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const event = mockEvents.find(e => e.id === params.id)
  if (!event) return NextResponse.json({ data: null, error: 'Event not found', success: false }, { status: 404 })

  const regs     = mockRegistrations.filter(r => r.event_id === params.id && r.status !== 'CANCELLED')
  const checkins = mockCheckIns.filter(c => c.event_id === params.id)
  const teams    = mockTeams.filter(t => t.event_id === params.id)

  const checkinRate       = regs.length > 0 ? Math.round((checkins.length / regs.length) * 100) : 0
  const teamFormationRate = event.type === 'TEAM' && regs.length > 0
    ? Math.round((regs.filter(r => r.team_id).length / regs.length) * 100) : 0

  // Simple velocity: count regs per day for last 7 days
  const velocity = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i))
    const day = d.toISOString().slice(0, 10)
    return { date: day, count: regs.filter(r => r.created_at.slice(0, 10) === day).length }
  })

  const analytics = {
    event_id:              params.id,
    total_registrations:   regs.length,
    confirmed_registrations: regs.filter(r => r.status === 'CONFIRMED').length,
    checked_in_count:      checkins.length,
    total_teams:           teams.length,
    approved_teams:        teams.filter(t => t.status === 'APPROVED').length,
    checkin_rate:          checkinRate,
    team_formation_rate:   teamFormationRate,
    registration_velocity: velocity,
    health_score:          calculateHealthScore(regs.length, event.max_participants, checkinRate, teamFormationRate),
  }

  return NextResponse.json({ data: analytics, error: null, success: true })
}