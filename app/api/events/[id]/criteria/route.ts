import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/server'

// GET /api/events/[id]/criteria — List criteria for an event
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServiceClient()

  const { data, error } = await supabase
    .from('event_criteria')
    .select('*')
    .eq('event_id', params.id)
    .order('display_order', { ascending: true })

  if (error) {
    return NextResponse.json({ data: null, error: error.message, success: false }, { status: 500 })
  }

  return NextResponse.json({ data, error: null, success: true })
}

// POST /api/events/[id]/criteria — Set criteria for an event (organizer only)
// Body: { criteria: string[] }  — replaces existing criteria with the new list
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServerClient()
  const serviceClient = createServiceClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ data: null, error: 'Unauthorized', success: false }, { status: 401 })
  }

  // Verify organizer
  const { data: event } = await supabase
    .from('events')
    .select('created_by')
    .eq('id', params.id)
    .single()

  if (!event || event.created_by !== user.id) {
    return NextResponse.json({ data: null, error: 'Only the event organizer can set criteria', success: false }, { status: 403 })
  }

  const { criteria } = await req.json() as { criteria: string[] }
  if (!criteria || !Array.isArray(criteria) || criteria.length === 0) {
    return NextResponse.json({ data: null, error: 'criteria must be a non-empty array of strings', success: false }, { status: 400 })
  }

  // Delete existing criteria for this event
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (serviceClient as any)
    .from('event_criteria')
    .delete()
    .eq('event_id', params.id)

  // Insert new criteria
  const rows = criteria.map((name: string, i: number) => ({
    event_id: params.id,
    name,
    max_points: 10,
    display_order: i,
  }))

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (serviceClient as any)
    .from('event_criteria')
    .insert(rows)
    .select()

  if (error) {
    console.error('POST /api/events/[id]/criteria error:', error)
    return NextResponse.json({ data: null, error: error.message, success: false }, { status: 500 })
  }

  return NextResponse.json({ data, error: null, success: true }, { status: 201 })
}
