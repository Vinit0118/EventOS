import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, createServiceClient } from '@/lib/supabase/server'

// GET /api/events/[id]/scores — Get current user's submitted scores for this event
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServerClient()
  const serviceClient = createServiceClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ data: [], error: null, success: true })
  }

  const { data, error } = await serviceClient
    .from('scores')
    .select('*')
    .eq('event_id', params.id)
    .eq('judge_id', user.id)

  if (error) {
    console.error('GET /api/events/[id]/scores error:', error)
    return NextResponse.json({ data: null, error: error.message, success: false }, { status: 500 })
  }

  return NextResponse.json({ data: data ?? [], error: null, success: true })
}

// POST /api/events/[id]/scores — Submit or update scores
// Body: { team_id?, participant_id?, scores: [{ criteria_id, points }] }
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServerClient()
  const serviceClient = createServiceClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ data: null, error: 'Unauthorized', success: false }, { status: 401 })
  }

  // Verify user is a judge for this event
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: judgeAssignment } = await (serviceClient as any)
    .from('event_judges')
    .select('id')
    .eq('event_id', params.id)
    .eq('user_id', user.id)
    .single()

  if (!judgeAssignment) {
    return NextResponse.json({ data: null, error: 'You are not a judge for this event', success: false }, { status: 403 })
  }

  const { team_id, participant_id, scores } = await req.json() as {
    team_id?: string
    participant_id?: string
    scores: { criteria_id: string; points: number }[]
  }

  // Must have exactly one of team_id or participant_id
  if ((!team_id && !participant_id) || (team_id && participant_id)) {
    return NextResponse.json({ data: null, error: 'Provide either team_id or participant_id (not both)', success: false }, { status: 400 })
  }

  if (!scores || !Array.isArray(scores) || scores.length === 0) {
    return NextResponse.json({ data: null, error: 'scores array is required', success: false }, { status: 400 })
  }

  // Validate points against criteria max_points
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: criteriaRows } = await (serviceClient as any)
    .from('event_criteria')
    .select('id, max_points')
    .eq('event_id', params.id)

  const criteriaMap = new Map<string, number>(
    (criteriaRows ?? []).map((c: { id: string; max_points: number }) => [c.id, c.max_points])
  )

  for (const s of scores) {
    const maxPoints = criteriaMap.get(s.criteria_id)
    if (maxPoints === undefined) {
      return NextResponse.json({ data: null, error: `Invalid criteria_id: ${s.criteria_id}`, success: false }, { status: 400 })
    }
    if (s.points < 0 || s.points > maxPoints) {
      return NextResponse.json({ data: null, error: `Points must be 0-${maxPoints} for criteria ${s.criteria_id}`, success: false }, { status: 400 })
    }
  }

  // Upsert scores (insert or update on conflict)
  const rows = scores.map(s => ({
    event_id: params.id,
    judge_id: user.id,
    ...(team_id ? { team_id } : { participant_id }),
    criteria_id: s.criteria_id,
    points: s.points,
  }))

  const onConflict = team_id
    ? 'judge_id,team_id,criteria_id'
    : 'judge_id,participant_id,criteria_id'

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: upserted, error } = await (serviceClient as any)
    .from('scores')
    .upsert(rows, { onConflict })
    .select()

  if (error) {
    console.error('POST /api/events/[id]/scores error:', error)
    return NextResponse.json({ data: null, error: error.message, success: false }, { status: 500 })
  }

  return NextResponse.json({ data: upserted, error: null, success: true }, { status: 201 })
}
