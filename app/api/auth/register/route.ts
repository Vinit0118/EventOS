// Path: app/api/auth/register/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { mockUsers, mockCredentials } from '@/lib/mock-data'
import { RegisterPayload, AuthSession, User } from '@/types'
import { generateId } from '@/lib/utils'

export async function POST(req: NextRequest) {
  try {
    const { email, password, name, role = 'PARTICIPANT' }: RegisterPayload = await req.json()

    if (mockCredentials[email]) {
      return NextResponse.json({ data: null, error: 'Email already registered', success: false }, { status: 409 })
    }

    const user: User = {
      id: generateId('user'),
      email,
      name,
      role,
      created_at: new Date().toISOString(),
    }

    mockUsers.push(user)
    mockCredentials[email] = password

    const session: AuthSession = {
      user,
      access_token: `mock-token-${user.id}-${Date.now()}`,
      expires_at: new Date(Date.now() + 7 * 86400000).toISOString(),
    }

    return NextResponse.json({ data: session, error: null, success: true }, { status: 201 })
  } catch {
    return NextResponse.json({ data: null, error: 'Registration failed', success: false }, { status: 500 })
  }
}