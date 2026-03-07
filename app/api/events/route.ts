// Path: app/api/events/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { mockEvents, mockUsers } from '@/lib/mock-data'
import { Event, CreateEventPayload } from '@/types'
import { generateId } from '@/lib/utils'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const createdBy = searchParams.get('created_by')   // organizer's own events
  const status    = searchParams.get('status')
  const type      = searchParams.get('type')
  const search    = searchParams.get('search')?.toLowerCase()

  let events = [...mockEvents]

  if (createdBy) events = events.filter(e => e.created_by === createdBy)
  if (status)    events = events.filter(e => e.status === status)
  if (type)      events = events.filter(e => e.type === type)
  if (search)    events = events.filter(e =>
    e.title.toLowerCase().includes(search) ||
    e.description.toLowerCase().includes(search) ||
    e.location.toLowerCase().includes(search)
  )

  // Attach organizer info
  events = events.map(ev => ({
    ...ev,
    organizer: mockUsers.find(u => u.id === ev.created_by),
  }))

  return NextResponse.json({ data: events, error: null, success: true })
}

export async function POST(req: NextRequest) {
  try {
    const body: CreateEventPayload & { created_by: string } = await req.json()

    const creator = mockUsers.find(u => u.id === body.created_by)
    if (!creator) return NextResponse.json({ data: null, error: 'User not found', success: false }, { status: 404 })

    const newEvent: Event = {
      id: generateId('event'),
      ...body,
      status: 'DRAFT',
      tags: body.tags ?? [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      registration_count: 0,
      checkin_count: 0,
      organizer: creator,
    }

    mockEvents.push(newEvent)
    return NextResponse.json({ data: newEvent, error: null, success: true }, { status: 201 })
  } catch {
    return NextResponse.json({ data: null, error: 'Failed to create event', success: false }, { status: 500 })
  }
}