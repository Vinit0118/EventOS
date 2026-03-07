import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { calculateHealthScore } from '@/lib/utils'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServerClient()

  // 1. Fetch the pre-computed event_stats view
  const { data: stats, error } = await supabase
    .from('event_stats')
    .select('*')
    .eq('event_id', params.id)
    .single()

  if (error || !stats) {
    console.error("Analytics fetch error:", error)
    return NextResponse.json({ data: null, error: 'Event not found or stats unavilable', success: false }, { status: 404 })
  }

  // 2. Fetch velocity data (last 7 days of registrations)
  const lastWeek = new Date()
  lastWeek.setDate(lastWeek.getDate() - 7)

  const { data: regs } = await supabase
    .from('registrations')
    .select('created_at')
    .eq('event_id', params.id)
    .neq('status', 'CANCELLED')
    .gte('created_at', lastWeek.toISOString())

  const velocity = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i))
    const day = d.toISOString().slice(0, 10)
    const count = regs?.filter(r => r.created_at.slice(0, 10) === day).length || 0
    return { date: day, count }
  })

  // 3. Assemble final analytics object
  const analytics = {
    ...stats,
    registration_velocity: velocity,
    health_score: calculateHealthScore(
      stats.total_registrations,
      stats.max_participants,
      stats.checkin_rate,
      stats.team_formation_rate
    ),
  }

  return NextResponse.json({ data: analytics, error: null, success: true })
}