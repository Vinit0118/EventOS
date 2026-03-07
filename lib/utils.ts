// Path: lib/utils.ts
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateId(prefix = 'id'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`
}

export function generateQRToken(eventId: string, userId: string): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  const suffix = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
  const eSuffix = eventId.replace(/[^a-zA-Z0-9]/g, '').slice(-4).toUpperCase()
  const uSuffix = userId.replace(/[^a-zA-Z0-9]/g, '').slice(-4).toUpperCase()
  return `QR-${eSuffix}-${uSuffix}-${suffix}`
}

export function formatDate(date: string, opts?: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', ...opts }).format(new Date(date))
}

export function formatDateTime(date: string): string {
  return new Intl.DateTimeFormat('en-IN', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(date))
}

export function timeAgo(date: string): string {
  const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (s < 60)   return `${s}s ago`
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400)return `${Math.floor(s / 3600)}h ago`
  return `${Math.floor(s / 86400)}d ago`
}

export function timeUntil(date: string): string {
  const s = Math.floor((new Date(date).getTime() - Date.now()) / 1000)
  if (s < 0)    return 'Ended'
  if (s < 3600) return `${Math.floor(s / 60)}m left`
  if (s < 86400)return `${Math.floor(s / 3600)}h left`
  return `${Math.floor(s / 86400)}d left`
}

export function calculateHealthScore(
  registrations: number, maxParticipants: number,
  checkinRate: number, teamFormationRate: number
): number {
  const fillRate = Math.min((registrations / maxParticipants) * 100, 100)
  return Math.round(fillRate * 0.4 + checkinRate * 0.35 + teamFormationRate * 0.25)
}