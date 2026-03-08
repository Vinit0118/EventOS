import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

// GET /api/auth/users?search=... — Search users by name or email (for judge assignment)
export async function GET(req: NextRequest) {
  const search = req.nextUrl.searchParams.get('search')?.trim()
  if (!search || search.length < 2) {
    return NextResponse.json({ data: [], error: null, success: true })
  }

  const supabase = createServiceClient()

  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, name, role, avatar_url')
    .or(`name.ilike.%${search}%,email.ilike.%${search}%`)
    .limit(10)

  if (error) {
    return NextResponse.json({ data: null, error: error.message, success: false }, { status: 500 })
  }

  return NextResponse.json({ data, error: null, success: true })
}
