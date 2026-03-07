// Path: app/api/checkins/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { mockCheckIns, mockRegistrations, mockEvents } from '@/lib/mock-data'
import { CheckIn } from '@/types'
import { generateId } from '@/lib/utils'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const eventId = searchParams.get('event_id')
  let checkins = [...mockCheckIns]
  if (eventId) checkins = checkins.filter(c => c.event_id === eventId)
  return NextResponse.json({ data: checkins, error: null, success: true })
}

export async function POST(req: NextRequest) {
  try {
    const { qr_token, event_id, checked_in_by } = await req.json()

    const reg = mockRegistrations.find(r => r.qr_token === qr_token && r.event_id === event_id)
    if (!reg) return NextResponse.json({ data: null, error: 'Invalid QR token for this event', success: false }, { status: 404 })
    if (reg.status === 'CANCELLED') return NextResponse.json({ data: null, error: 'Registration is cancelled', success: false }, { status: 400 })
    if (reg.checked_in) return NextResponse.json({ data: null, error: 'Already checked in', success: false }, { status: 409 })

    reg.checked_in    = true
    reg.checked_in_at = new Date().toISOString()

    const checkin: CheckIn = {
      id: generateId('ci'),
      registration_id: reg.id,
      event_id,
      checked_in_by,
      checked_in_at: new Date().toISOString(),
    }
    mockCheckIns.push(checkin)

    const event = mockEvents.find(e => e.id === event_id)
    if (event && event.checkin_count !== undefined) event.checkin_count++

    return NextResponse.json({ data: checkin, error: null, success: true }, { status: 201 })
  } catch {
    return NextResponse.json({ data: null, error: 'Check-in failed', success: false }, { status: 500 })
  }
}