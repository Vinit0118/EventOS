// Path: app/events/page.tsx
'use client'
import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import {
  ArrowRight, Zap, Calendar, MapPin, Clock, Users,
  Search, SlidersHorizontal, X, ArrowLeft
} from 'lucide-react'
import { Event } from '@/types'
import { formatDate, timeUntil } from '@/lib/utils'

const STATUS_BADGE: Record<string, string> = {
  PUBLISHED: 'badge-blue', ONGOING: 'badge-green',
}

type SortOption = 'newest' | 'soonest' | 'most-registered' | 'most-spots'
type TypeFilter  = 'ALL' | 'TEAM' | 'INDIVIDUAL'

const SORT_LABELS: Record<SortOption, string> = {
  newest:           'Newest first',
  soonest:          'Starting soonest',
  'most-registered':'Most popular',
  'most-spots':     'Most spots left',
}

function EventCard({ event }: { event: Event }) {
  const fill       = Math.min(((event.registration_count ?? 0) / event.max_participants) * 100, 100)
  const almostFull = fill > 80
  const spotsLeft  = event.max_participants - (event.registration_count ?? 0)

  return (
    <div className="card card-hover bg-white p-5 flex flex-col">
      {/* Organizer + status */}
      <div className="flex items-center gap-2 mb-3">
        <div className="w-5 h-5 rounded-md flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0"
          style={{ background: 'var(--ink-3)' }}>
          {event.organizer?.name?.[0]?.toUpperCase() ?? '?'}
        </div>
        <span className="text-xs font-medium truncate flex-1" style={{ color: 'var(--ink-3)' }}>
          {event.organizer?.name ?? 'Organizer'}
        </span>
        <span className={`badge flex-shrink-0 ${STATUS_BADGE[event.status] ?? 'badge-neutral'}`}>
          {event.status}
        </span>
      </div>

      <h3 className="font-bold text-[15px] mb-1.5">{event.title}</h3>
      <p className="text-sm leading-relaxed mb-4 flex-1 line-clamp-2" style={{ color: 'var(--ink-3)' }}>
        {event.description}
      </p>

      {/* Meta */}
      <div className="space-y-1.5 mb-4">
        <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--ink-3)' }}>
          <MapPin className="w-3 h-3 flex-shrink-0" />{event.location}
        </div>
        <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--ink-3)' }}>
          <Calendar className="w-3 h-3 flex-shrink-0" />{formatDate(event.start_date)}
          <span className="ml-auto mono text-[10px] font-semibold px-1.5 py-0.5 rounded"
            style={{ background: 'var(--ink-6)', color: 'var(--ink-3)' }}>
            {timeUntil(event.start_date)}
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--ink-3)' }}>
          <Clock className="w-3 h-3 flex-shrink-0" />Deadline {formatDate(event.registration_deadline)}
        </div>
        <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--ink-3)' }}>
          <Users className="w-3 h-3 flex-shrink-0" />
          {event.type === 'TEAM'
            ? `Teams of ${event.min_team_size ?? 2}–${event.max_team_size ?? 4}`
            : 'Individual'}
        </div>
      </div>

      {/* Tags */}
      {event.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-4">
          {event.tags.map(t => <span key={t} className="badge badge-indigo">{t}</span>)}
        </div>
      )}

      {/* Fill bar */}
      <div className="mb-4">
        <div className="flex justify-between text-xs mb-1" style={{ color: 'var(--ink-3)' }}>
          <span>{event.registration_count ?? 0} / {event.max_participants} registered</span>
          {almostFull
            ? <span className="font-semibold" style={{ color: 'var(--red)' }}>Almost full!</span>
            : <span>{spotsLeft} spots left</span>}
        </div>
        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--ink-5)' }}>
          <div className="h-full rounded-full transition-all"
            style={{ width: `${fill}%`, background: almostFull ? 'var(--red)' : 'var(--accent)' }} />
        </div>
      </div>

      {/* CTA — requires sign in/up */}
      <Link href="/register"
        className="btn btn-primary py-2.5 text-sm w-full rounded-xl text-center">
        Register — it's free <ArrowRight className="w-3.5 h-3.5" />
      </Link>
    </div>
  )
}

export default function EventsPage() {
  const [events, setEvents]     = useState<Event[]>([])
  const [loading, setLoading]   = useState(true)
  const [search,  setSearch]    = useState('')
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('ALL')
  const [sort, setSort]         = useState<SortOption>('soonest')
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    Promise.all([
      fetch('/api/events?status=PUBLISHED').then(r => r.json()),
      fetch('/api/events?status=ONGOING').then(r => r.json()),
    ])
      .then(([pub, ong]) => {
        setEvents([...(pub.data ?? []), ...(ong.data ?? [])])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    let list = [...events]

    // Search
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(e =>
        e.title.toLowerCase().includes(q) ||
        e.description.toLowerCase().includes(q) ||
        e.location.toLowerCase().includes(q) ||
        e.tags.some(t => t.toLowerCase().includes(q)) ||
        e.organizer?.name?.toLowerCase().includes(q)
      )
    }

    // Type filter
    if (typeFilter !== 'ALL') list = list.filter(e => e.type === typeFilter)

    // Sort
    if (sort === 'newest')           list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    else if (sort === 'soonest')     list.sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime())
    else if (sort === 'most-registered') list.sort((a, b) => (b.registration_count ?? 0) - (a.registration_count ?? 0))
    else if (sort === 'most-spots')  list.sort((a, b) => (b.max_participants - (b.registration_count ?? 0)) - (a.max_participants - (a.registration_count ?? 0)))

    return list
  }, [events, search, typeFilter, sort])

  const hasFilters = search || typeFilter !== 'ALL'

  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b" style={{ borderColor: 'var(--border)' }}>
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center transition-transform group-hover:scale-105"
                style={{ background: 'var(--accent)' }}>
                <Zap className="w-4 h-4 text-white" strokeWidth={2.5} />
              </div>
              <span className="font-semibold text-[15px] tracking-tight">EventOS</span>
            </Link>
            {/* Breadcrumb separator */}
            <span style={{ color: 'var(--ink-5)' }}>/</span>
            <span className="text-sm font-medium" style={{ color: 'var(--ink-3)' }}>Events</span>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/login"    className="btn btn-ghost px-4 py-2 text-sm">Sign in</Link>
            <Link href="/register" className="btn btn-primary px-4 py-2 text-sm">
              Get started <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-10">
        {/* Back + Header */}
        <div className="mb-8 fade-in">
          <Link href="/"
            className="inline-flex items-center gap-1.5 text-sm mb-4 transition-colors"
            style={{ color: 'var(--ink-3)' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--accent)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--ink-3)')}>
            <ArrowLeft className="w-3.5 h-3.5" /> Back to home
          </Link>
          <div className="flex items-end justify-between">
            <div>
              <p className="label-xs mb-2">All Events</p>
              <h1 className="text-3xl font-bold tracking-tight" style={{ letterSpacing: '-0.02em' }}>
                Browse Events
              </h1>
              <p className="text-sm mt-2" style={{ color: 'var(--ink-3)' }}>
                {loading ? 'Loading…' : `${filtered.length} open event${filtered.length !== 1 ? 's' : ''}`}
                {!loading && hasFilters && ` matching your filters`}
              </p>
            </div>
            {/* Sign up prompt */}
            <div className="card bg-white px-5 py-3 flex items-center gap-3 text-sm"
              style={{ border: '1px solid var(--accent-mid)', background: 'var(--accent-light)' }}>
              <span style={{ color: 'var(--accent)' }}>Sign up free to register for any event</span>
              <Link href="/register" className="btn btn-primary px-3 py-1.5 text-xs rounded-lg">
                Sign up <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>

        {/* Search + Filters bar */}
        <div className="mb-6 slide-up">
          <div className="flex gap-3 flex-wrap">
            {/* Search */}
            <div className="relative flex-1" style={{ minWidth: 200 }}>
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--ink-4)' }} />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search events, locations, tags, organizers…"
                className="input pl-9"
              />
              {search && (
                <button onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: 'var(--ink-4)' }}>
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Type filter pills */}
            <div className="flex gap-1.5 items-center">
              {(['ALL', 'TEAM', 'INDIVIDUAL'] as TypeFilter[]).map(t => (
                <button key={t} onClick={() => setTypeFilter(t)}
                  className="px-3 py-2 rounded-lg text-sm font-medium transition-all border"
                  style={{
                    background:   typeFilter === t ? 'var(--accent)' : 'white',
                    color:        typeFilter === t ? 'white' : 'var(--ink-3)',
                    borderColor:  typeFilter === t ? 'var(--accent)' : 'var(--border)',
                  }}>
                  {t === 'ALL' ? 'All types' : t === 'TEAM' ? 'Team' : 'Individual'}
                </button>
              ))}
            </div>

            {/* Sort */}
            <div className="relative">
              <SlidersHorizontal className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none"
                style={{ color: 'var(--ink-4)' }} />
              <select value={sort} onChange={e => setSort(e.target.value as SortOption)}
                className="input pl-8 pr-3 text-sm py-2" style={{ width: 'auto', minWidth: 160 }}>
                {(Object.entries(SORT_LABELS) as [SortOption, string][]).map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
            </div>

            {/* Clear filters */}
            {hasFilters && (
              <button onClick={() => { setSearch(''); setTypeFilter('ALL') }}
                className="btn btn-ghost px-3 py-2 text-sm rounded-lg"
                style={{ color: 'var(--ink-3)' }}>
                <X className="w-3.5 h-3.5" /> Clear
              </button>
            )}
          </div>
        </div>

        {/* Events grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="card bg-white p-5 animate-pulse" style={{ minHeight: 340 }}>
                <div className="h-3 rounded mb-4" style={{ background: 'var(--ink-5)', width: '50%' }} />
                <div className="h-4 rounded mb-2" style={{ background: 'var(--ink-5)', width: '80%' }} />
                <div className="h-3 rounded mb-1" style={{ background: 'var(--ink-5)', width: '95%' }} />
                <div className="h-3 rounded mb-6" style={{ background: 'var(--ink-5)', width: '70%' }} />
                <div className="space-y-2 mb-6">
                  <div className="h-3 rounded" style={{ background: 'var(--ink-5)', width: '60%' }} />
                  <div className="h-3 rounded" style={{ background: 'var(--ink-5)', width: '45%' }} />
                  <div className="h-3 rounded" style={{ background: 'var(--ink-5)', width: '55%' }} />
                </div>
                <div className="h-9 rounded-xl mt-auto" style={{ background: 'var(--ink-5)' }} />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="card bg-white py-24 text-center slide-up">
            <Calendar className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--ink-5)' }} />
            <p className="font-semibold text-lg mb-2">
              {hasFilters ? 'No events match your filters' : 'No open events right now'}
            </p>
            <p className="text-sm mb-6" style={{ color: 'var(--ink-3)' }}>
              {hasFilters ? 'Try adjusting your search or filters' : 'Check back soon, or host your own event.'}
            </p>
            {hasFilters ? (
              <button onClick={() => { setSearch(''); setTypeFilter('ALL') }}
                className="btn btn-secondary px-4 py-2 text-sm mx-auto" style={{ display: 'inline-flex' }}>
                Clear filters
              </button>
            ) : (
              <Link href="/register" className="btn btn-primary px-4 py-2 text-sm mx-auto" style={{ display: 'inline-flex' }}>
                Host an event <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((event, i) => (
              <div key={event.id} className={`slide-up stagger-${Math.min((i % 6) + 1, 6)}`}>
                <EventCard event={event} />
              </div>
            ))}
          </div>
        )}

        {/* Bottom CTA */}
        {!loading && filtered.length > 0 && (
          <div className="mt-16 py-12 text-center rounded-2xl slide-up"
            style={{ background: 'var(--accent-light)', border: '1px solid var(--accent-mid)' }}>
            <h2 className="text-xl font-bold mb-2" style={{ letterSpacing: '-0.02em' }}>
              Ready to join an event?
            </h2>
            <p className="text-sm mb-6" style={{ color: 'var(--ink-3)' }}>
              Create a free account in under a minute — no credit card needed.
            </p>
            <div className="flex items-center justify-center gap-3">
              <Link href="/register" className="btn btn-primary px-6 py-2.5 text-sm">
                Sign up free <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <Link href="/login" className="btn btn-secondary px-6 py-2.5 text-sm">
                Sign in
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t py-8 px-6 mt-12" style={{ borderColor: 'var(--border)' }}>
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: 'var(--accent)' }}>
              <Zap className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
            </div>
            <span className="font-semibold text-sm">EventOS</span>
          </div>
          <span className="text-sm" style={{ color: 'var(--ink-4)' }}>Built for hackathons. Designed to win.</span>
        </div>
      </footer>
    </div>
  )
}