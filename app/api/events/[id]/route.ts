// Path: app/api/events/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { mockEvents } from '@/lib/mock-data'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const event = mockEvents.find(e => e.id === params.id)
  if (!event) return NextResponse.json({ data: null, error: 'Event not found', success: false }, { status: 404 })
  return NextResponse.json({ data: event, error: null, success: true })
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const event = mockEvents.find(e => e.id === params.id)
  if (!event) return NextResponse.json({ data: null, error: 'Event not found', success: false }, { status: 404 })

  const updates = await req.json()
  const requesterId = updates.requested_by

  // Only event creator can modify
  if (requesterId && event.created_by !== requesterId) {
    return NextResponse.json({ data: null, error: 'Not authorized — you are not the organizer of this event', success: false }, { status: 403 })
  }

  Object.assign(event, { ...updates, updated_at: new Date().toISOString() })
  return NextResponse.json({ data: event, error: null, success: true })
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const idx = mockEvents.findIndex(e => e.id === params.id)
  if (idx === -1) return NextResponse.json({ data: null, error: 'Event not found', success: false }, { status: 404 })

  const { requested_by } = await req.json().catch(() => ({}))
  if (requested_by && mockEvents[idx].created_by !== requested_by) {
    return NextResponse.json({ data: null, error: 'Not authorized', success: false }, { status: 403 })
  }

  mockEvents.splice(idx, 1)
  return NextResponse.json({ data: null, error: null, success: true })
}