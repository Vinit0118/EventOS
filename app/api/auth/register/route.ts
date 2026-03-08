// Path: app/api/auth/register/route.ts
// Registration calls supabase.auth.signUp() which:
//   1. Creates the auth.users row
//   2. Fires fn_handle_new_user trigger → auto-creates profiles row
// No manual profile insert needed.

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { RegisterPayload } from '@/types'

export async function POST(req: NextRequest) {
  try {
    const { email, password, name, role = 'PARTICIPANT' }: RegisterPayload = await req.json()

    if (!email || !password || !name) {
      return NextResponse.json(
        { data: null, error: 'Email, password and name are required', success: false },
        { status: 400 }
      )
    }

    const supabase = createServerClient()

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        // fn_handle_new_user trigger reads name + role from raw_user_meta_data
        data: { name, role },
      },
    })

    if (error) {
      // Supabase returns a generic message for duplicate emails to prevent
      // user enumeration — we surface it as-is.
      return NextResponse.json(
        { data: null, error: error.message, success: false },
        { status: 409 }
      )
    }

    if (!data.user) {
      return NextResponse.json(
        { data: null, error: 'Registration failed', success: false },
        { status: 500 }
      )
    }

    // Profile may take a moment to be created by the trigger.
    // Fetch it; if not yet available return the auth user data only.
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, email, name, role, avatar_url, created_at')
      .eq('id', data.user.id)
      .single()

    return NextResponse.json(
      {
        data: {
          user: profile ?? {
            id: data.user.id,
            email,
            name,
            role,
            created_at: data.user.created_at,
          },
          access_token: data.session?.access_token ?? '',
          expires_at: data.session?.expires_at
            ? new Date(data.session.expires_at * 1000).toISOString()
            : '',
        },
        error: null,
        success: true,
      },
      { status: 201 }
    )
  } catch {
    return NextResponse.json(
      { data: null, error: 'Registration failed', success: false },
      { status: 500 }
    )
  }
}