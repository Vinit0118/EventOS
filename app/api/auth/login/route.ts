// Path: app/api/auth/login/route.ts
// Login is now handled client-side directly via authService.login()
// which calls supabase.auth.signInWithPassword().
//
// This route is kept as a thin server-side fallback for any non-browser
// clients (e.g. mobile apps, Postman testing).
// RLS + Supabase session cookies handle all authorization automatically.

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { LoginPayload } from '@/types'

export async function POST(req: NextRequest) {
  try {
    const { email, password }: LoginPayload = await req.json()

    if (!email || !password) {
      return NextResponse.json(
        { data: null, error: 'Email and password are required', success: false },
        { status: 400 }
      )
    }

    const supabase = createServerClient()

    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error || !data.user) {
      return NextResponse.json(
        { data: null, error: 'Invalid email or password', success: false },
        { status: 401 }
      )
    }

    // Fetch profile for role + name
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, email, name, role, avatar_url, created_at')
      .eq('id', data.user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json(
        { data: null, error: 'Profile not found', success: false },
        { status: 404 }
      )
    }

    return NextResponse.json({
      data: {
        user: profile,
        access_token: data.session.access_token,
        expires_at: new Date(data.session.expires_at! * 1000).toISOString(),
      },
      error: null,
      success: true,
    })
  } catch {
    return NextResponse.json(
      { data: null, error: 'Login failed', success: false },
      { status: 500 }
    )
  }
}