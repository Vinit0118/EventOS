import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/server'

// GET /api/events/[id]/judges — List judges for an event
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServiceClient()

  const { data, error } = await supabase
    .from('event_judges')
    .select('*, user:profiles!event_judges_user_id_fkey(*)')
    .eq('event_id', params.id)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('GET /api/events/[id]/judges error:', error)
    return NextResponse.json({ data: null, error: error.message, success: false }, { status: 500 })
  }

  return NextResponse.json({ data: data ?? [], error: null, success: true })
}

// POST /api/events/[id]/judges — Assign a judge (organizer only)
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServerClient()
  const serviceClient = createServiceClient()

  // Verify authenticated user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ data: null, error: 'Unauthorized', success: false }, { status: 401 })
  }

  // Verify user is the organizer of this event
  const { data: event } = await supabase
    .from('events')
    .select('created_by')
    .eq('id', params.id)
    .single()

  if (!event || event.created_by !== user.id) {
    return NextResponse.json({ data: null, error: 'Only the event organizer can assign judges', success: false }, { status: 403 })
  }

  const { user_id } = await req.json()
  if (!user_id) {
    return NextResponse.json({ data: null, error: 'user_id is required', success: false }, { status: 400 })
  }

  // Use service client to bypass RLS for the insert
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (serviceClient as any)
    .from('event_judges')
    .insert({
      event_id: params.id,
      user_id,
      assigned_by: user.id,
    })
    .select('*, user:profiles!event_judges_user_id_fkey(*)')
    .single()

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ data: null, error: 'User is already a judge for this event', success: false }, { status: 409 })
    }
    console.error('POST /api/events/[id]/judges error:', error)
    return NextResponse.json({ data: null, error: error.message, success: false }, { status: 500 })
  }

  return NextResponse.json({ data, error: null, success: true }, { status: 201 })
}
