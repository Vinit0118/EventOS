import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/server'

// DELETE /api/events/[id]/judges/[userId] — Remove a judge (organizer only)
export async function DELETE(_req: NextRequest, { params }: { params: { id: string; userId: string } }) {
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
    return NextResponse.json({ data: null, error: 'Only the event organizer can remove judges', success: false }, { status: 403 })
  }

  const { error } = await serviceClient
    .from('event_judges')
    .delete()
    .eq('event_id', params.id)
    .eq('user_id', params.userId)

  if (error) {
    console.error('DELETE /api/events/[id]/judges/[userId] error:', error)
    return NextResponse.json({ data: null, error: error.message, success: false }, { status: 500 })
  }

  return NextResponse.json({ data: null, error: null, success: true })
}
