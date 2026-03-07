// Path: app/api/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { mockUsers, mockCredentials } from '@/lib/mock-data'
import { LoginPayload, AuthSession } from '@/types'

export async function POST(req: NextRequest) {
  try {
    const { email, password }: LoginPayload = await req.json()

    const stored = mockCredentials[email]
    if (!stored || stored !== password) {
      return NextResponse.json({ data: null, error: 'Invalid email or password', success: false }, { status: 401 })
    }

    const user = mockUsers.find(u => u.email === email)
    if (!user) return NextResponse.json({ data: null, error: 'User not found', success: false }, { status: 404 })

    const session: AuthSession = {
      user,
      access_token: `mock-token-${user.id}-${Date.now()}`,
      expires_at: new Date(Date.now() + 7 * 86400000).toISOString(),
    }

    return NextResponse.json({ data: session, error: null, success: true })
  } catch {
    return NextResponse.json({ data: null, error: 'Login failed', success: false }, { status: 500 })
  }
}