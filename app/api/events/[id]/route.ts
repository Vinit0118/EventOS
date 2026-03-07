import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServerClient()

  const { data, error } = await supabase
    .from('events')
    .select(`*, organizer:profiles!events_created_by_fkey(*)`)
    .eq('id', params.id)
    .single()

  if (error || !data) {
    return NextResponse.json({ data: null, error: 'Event not found', success: false }, { status: 404 })
  }

  return NextResponse.json({ data, error: null, success: true })
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServerClient()

  const updates = await req.json()
  // RLS will automatically reject if the user isn't the creator
  delete updates.requested_by

  const { data, error } = await supabase
    .from('events')
    .update(updates)
    .eq('id', params.id)
    .select(`*, organizer:profiles!events_created_by_fkey(*)`)
    .single()

  if (error) {
    console.error(`PATCH /api/events/${params.id} error:`, error)
    return NextResponse.json({ data: null, error: error.message, success: false }, { status: 500 })
  }

  return NextResponse.json({ data, error: null, success: true })
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServerClient()

  // RLS `events_delete_own_draft` ensures only the organizer can delete it
  // and ONLY if status is DRAFT or CANCELLED.
  const { error } = await supabase
    .from('events')
    .delete()
    .eq('id', params.id)

  if (error) {
    console.error(`DELETE /api/events/${params.id} error:`, error)
    return NextResponse.json({ data: null, error: error.message, success: false }, { status: 500 })
  }

  return NextResponse.json({ data: null, error: null, success: true })
}