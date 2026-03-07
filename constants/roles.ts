// Path: constants/roles.ts
import { UserRole, Event, User } from '@/types'

// ─── ROLE LABELS ─────────────────────────────────────────────────────────────
export const ROLE_LABELS: Record<UserRole, string> = {
  ORGANIZER:   'Organizer',
  PARTICIPANT: 'Participant',
}

export const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  ORGANIZER:   'Host events, manage registrations, check-in, and analytics',
  PARTICIPANT: 'Register for events, form teams, join hackathons',
}

// ─── EVENT-SCOPED PERMISSION CHECK ───────────────────────────────────────────
// An organizer is only admin of events THEY created.
// A participant can also create events (they become event admin for those).
export function isEventAdmin(user: User, event: Event): boolean {
  return event.created_by === user.id
}

// ─── DASHBOARD ROUTES ────────────────────────────────────────────────────────
export const DASHBOARD_ROUTES: Record<UserRole, string> = {
  ORGANIZER:   '/organizer',
  PARTICIPANT: '/participant',
}

// ─── PROTECTED ROUTE PREFIXES ────────────────────────────────────────────────
export const PROTECTED_PREFIXES = ['/organizer', '/participant']
export const AUTH_ROUTES        = ['/login', '/register']

// ─── ROLE UI ─────────────────────────────────────────────────────────────────
export const ROLE_BADGE: Record<UserRole, string> = {
  ORGANIZER:   'badge-indigo',
  PARTICIPANT: 'badge-blue',
}

export const ROLE_DOT: Record<UserRole, string> = {
  ORGANIZER:   'bg-violet-500',
  PARTICIPANT: 'bg-blue-500',
}