import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

// GET /api/events/[id]/leaderboard — Get ranked leaderboard for an event
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServiceClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('leaderboard')
    .select('*')
    .eq('event_id', params.id)
    .order('total_points', { ascending: false })

  console.log('[Leaderboard API] event:', params.id, 'data:', data, 'error:', error)

  if (error) {
    console.error('[Leaderboard API] error:', error)
    // View might not exist yet or no scores — return empty
    return NextResponse.json({ data: [], error: null, success: true })
  }

  return NextResponse.json({ data: data ?? [], error: null, success: true })
}
