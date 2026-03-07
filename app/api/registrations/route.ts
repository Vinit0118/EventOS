// Path: app/api/registrations/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { mockRegistrations, mockEvents, mockUsers } from '@/lib/mock-data'
import { CreateRegistrationPayload, Registration } from '@/types'
import { generateId, generateQRToken } from '@/lib/utils'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const eventId = searchParams.get('event_id')
  const userId  = searchParams.get('user_id')

  let regs = [...mockRegistrations]
  if (eventId) regs = regs.filter(r => r.event_id === eventId)
  if (userId)  regs = regs.filter(r => r.user_id  === userId)

  // Attach user info
  regs = regs.map(r => ({ ...r, user: mockUsers.find(u => u.id === r.user_id) }))

  return NextResponse.json({ data: regs, error: null, success: true })
}

export async function POST(req: NextRequest) {
  try {
    const { event_id, user_id }: CreateRegistrationPayload = await req.json()

    const event = mockEvents.find(e => e.id === event_id)
    if (!event) return NextResponse.json({ data: null, error: 'Event not found', success: false }, { status: 404 })
    if (!['PUBLISHED', 'ONGOING'].includes(event.status)) {
      return NextResponse.json({ data: null, error: 'Event is not accepting registrations', success: false }, { status: 400 })
    }
    if (new Date(event.registration_deadline) < new Date()) {
      return NextResponse.json({ data: null, error: 'Registration deadline has passed', success: false }, { status: 400 })
    }
    if ((event.registration_count ?? 0) >= event.max_participants) {
      return NextResponse.json({ data: null, error: 'Event is full', success: false }, { status: 400 })
    }

    const existing = mockRegistrations.find(r => r.event_id === event_id && r.user_id === user_id && r.status !== 'CANCELLED')
    if (existing) return NextResponse.json({ data: null, error: 'Already registered', success: false }, { status: 409 })

    const newReg: Registration = {
      id: generateId('reg'),
      event_id,
      user_id,
      status: 'CONFIRMED',
      qr_token: generateQRToken(event_id, user_id),
      checked_in: false,
      created_at: new Date().toISOString(),
    }

    mockRegistrations.push(newReg)
    if (event.registration_count !== undefined) event.registration_count++

    return NextResponse.json({ data: newReg, error: null, success: true }, { status: 201 })
  } catch {
    return NextResponse.json({ data: null, error: 'Registration failed', success: false }, { status: 500 })
  }
}