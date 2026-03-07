// Path: app/page.tsx
'use client'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import {
  ArrowRight, Zap, Users, QrCode, BarChart3, Shield,
  GitBranch, Check, Calendar, MapPin, Clock, ChevronDown,
  ChevronLeft, ChevronRight as ChevronRightIcon
} from 'lucide-react'
import { Event } from '@/types'
import { formatDate } from '@/lib/utils'

const features = [
  { icon: Users,     title: 'Team Engine',      desc: 'Search teams, send join requests, leader accepts or rejects. One team per event.' },
  { icon: QrCode,    title: 'QR Check-In',       desc: 'Token-based check-in per event. Each organizer manages their own attendees.' },
  { icon: BarChart3, title: 'Live Analytics',     desc: 'Health scores, velocity, and team formation rate — all scoped per event.' },
  { icon: Shield,    title: 'Scoped Permissions', desc: 'Organizers own only their events. No cross-event admin access.' },
  { icon: GitBranch, title: 'Global Platform',    desc: 'Any user can host events or join them. Different organizer per event, always.' },
  { icon: Users,     title: 'Team Requests',      desc: 'Leaders see incoming requests with messages, and accept or reject per slot.' },
]

const demos = [
  { role: 'Organizer',   email: 'organizer@eventos.dev',  pass: 'org123',  color: 'bg-violet-500',
    perks: ['Create & publish events', 'Manage check-in for your events', 'View analytics scoped to your events'] },
  { role: 'Participant', email: 'participant@eventos.dev', pass: 'part123', color: 'bg-blue-500',
    perks: ['Register for any public event', 'Create or search teams', 'Send join requests with a message'] },
]

const STATUS_BADGE: Record<string, string> = {
  PUBLISHED: 'badge-blue', ONGOING: 'badge-green',
}

// ─── Mini event card for carousel ────────────────────────────────────────────
function EventCard({ event }: { event: Event }) {
  const fill = Math.min(((event.registration_count ?? 0) / event.max_participants) * 100, 100)
  const almostFull = fill > 80
  return (
    <div className="card bg-white p-5 flex flex-col flex-shrink-0"
      style={{ width: 300, minHeight: 340 }}>
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

      <h3 className="font-bold text-[15px] mb-1.5 line-clamp-1">{event.title}</h3>
      <p className="text-sm leading-relaxed mb-4 flex-1 line-clamp-2" style={{ color: 'var(--ink-3)' }}>
        {event.description}
      </p>

      {/* Meta */}
      <div className="space-y-1 mb-3">
        <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--ink-3)' }}>
          <MapPin className="w-3 h-3 flex-shrink-0" />{event.location}
        </div>
        <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--ink-3)' }}>
          <Calendar className="w-3 h-3 flex-shrink-0" />{formatDate(event.start_date)}
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
        <div className="flex flex-wrap gap-1 mb-3">
          {event.tags.slice(0, 3).map(t => <span key={t} className="badge badge-indigo">{t}</span>)}
        </div>
      )}

      {/* Fill bar */}
      <div className="mb-4">
        <div className="flex justify-between text-xs mb-1" style={{ color: 'var(--ink-3)' }}>
          <span>{event.registration_count ?? 0} / {event.max_participants}</span>
          {almostFull && <span className="font-semibold" style={{ color: 'var(--red)' }}>Almost full!</span>}
        </div>
        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--ink-5)' }}>
          <div className="h-full rounded-full"
            style={{ width: `${fill}%`, background: almostFull ? 'var(--red)' : 'var(--accent)' }} />
        </div>
      </div>

      <Link href="/register"
        className="btn btn-primary py-2 text-sm w-full rounded-xl text-center">
        Register — it's free <ArrowRight className="w-3.5 h-3.5" />
      </Link>
    </div>
  )
}

// ─── Skeleton card ────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="card bg-white p-5 flex-shrink-0 animate-pulse" style={{ width: 300, minHeight: 340 }}>
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
  )
}

export default function LandingPage() {
  const [events, setEvents]       = useState<Event[]>([])
  const [evLoading, setEvLoading] = useState(true)
  const eventsRef  = useRef<HTMLElement>(null)
  const scrollRef  = useRef<HTMLDivElement>(null)
  const [canScrollLeft,  setCanScrollLeft]  = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  useEffect(() => {
    Promise.all([
      fetch('/api/events?status=PUBLISHED').then(r => r.json()),
      fetch('/api/events?status=ONGOING').then(r => r.json()),
    ])
      .then(([pub, ong]) => {
        setEvents([...(pub.data ?? []), ...(ong.data ?? [])])
        setEvLoading(false)
      })
      .catch(() => setEvLoading(false))
  }, [])

  // Track scroll arrows availability
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    function check() {
      setCanScrollLeft(el!.scrollLeft > 8)
      setCanScrollRight(el!.scrollLeft + el!.clientWidth < el!.scrollWidth - 8)
    }
    check()
    el.addEventListener('scroll', check)
    window.addEventListener('resize', check)
    return () => { el.removeEventListener('scroll', check); window.removeEventListener('resize', check) }
  }, [events, evLoading])

  function scroll(dir: 'left' | 'right') {
    scrollRef.current?.scrollBy({ left: dir === 'left' ? -320 : 320, behavior: 'smooth' })
  }

  function scrollToEvents() {
    eventsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b" style={{ borderColor: 'var(--border)' }}>
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'var(--accent)' }}>
              <Zap className="w-4 h-4 text-white" strokeWidth={2.5} />
            </div>
            <span className="font-semibold text-[15px] tracking-tight">EventOS</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={scrollToEvents} className="btn btn-ghost px-4 py-2 text-sm">Browse Events</button>
            <Link href="/login"    className="btn btn-ghost px-4 py-2 text-sm">Sign in</Link>
            <Link href="/register" className="btn btn-primary px-4 py-2 text-sm">
              Get started <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-24 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 mb-8 text-xs font-semibold fade-in"
            style={{ background: 'var(--accent-light)', color: 'var(--accent)', border: '1px solid var(--accent-mid)' }}>
            <span className="dot" style={{ background: 'var(--accent)' }} />
            Global event platform — anyone can host or join
          </div>
          <h1 className="slide-up text-[clamp(2.75rem,7vw,5rem)] font-bold tracking-tight leading-[1.05] mb-6"
            style={{ letterSpacing: '-0.03em' }}>
            The operating system<br />
            <span style={{ color: 'var(--accent)' }}>for your events</span>
          </h1>
          <p className="slide-up stagger-1 text-lg leading-relaxed max-w-xl mx-auto mb-10" style={{ color: 'var(--ink-3)' }}>
            Register for events, form teams with a request flow, and check in with QR codes.
            Each event has its own organizer — no shared admin.
          </p>
          <div className="slide-up stagger-2 flex items-center justify-center gap-3 flex-wrap">
            <button onClick={scrollToEvents} className="btn btn-primary px-6 py-3 text-[15px]">
              Browse events <ChevronDown className="w-4 h-4" />
            </button>
            <Link href="/login" className="btn btn-secondary px-6 py-3 text-[15px]">Sign in</Link>
          </div>
        </div>
      </section>

      {/* Stats strip */}
      <section className="border-y py-10" style={{ borderColor: 'var(--border)', background: 'var(--ink-6)' }}>
        <div className="max-w-4xl mx-auto px-6 grid grid-cols-3 gap-8 text-center">
          {[
            { num: '1:1', label: 'Organizer per event' },
            { num: '2',   label: 'Roles: Organizer & Participant' },
            { num: '∞',   label: 'Events per organizer' },
          ].map(({ num, label }) => (
            <div key={label}>
              <div className="mono text-3xl font-semibold mb-1" style={{ letterSpacing: '-0.03em' }}>{num}</div>
              <div className="text-sm" style={{ color: 'var(--ink-3)' }}>{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── EVENTS CAROUSEL ─────────────────────────────────────────────────── */}
      <section ref={eventsRef} className="py-20">
        {/* Header — full width with padding */}
        <div className="max-w-6xl mx-auto px-6 flex items-end justify-between mb-8">
          <div>
            <p className="label-xs mb-2">Open Now</p>
            <h2 className="text-3xl font-bold tracking-tight" style={{ letterSpacing: '-0.02em' }}>
              Events you can join
            </h2>
            <p className="text-sm mt-2" style={{ color: 'var(--ink-3)' }}>
              No account needed to browse. Sign up to register.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Scroll arrows */}
            {!evLoading && events.length > 0 && (
              <div className="flex gap-1.5">
                <button onClick={() => scroll('left')} disabled={!canScrollLeft}
                  className="w-8 h-8 rounded-lg border flex items-center justify-center transition-all"
                  style={{
                    borderColor: canScrollLeft ? 'var(--border-strong)' : 'var(--border)',
                    color:       canScrollLeft ? 'var(--ink-2)' : 'var(--ink-5)',
                    background:  canScrollLeft ? 'white' : 'var(--ink-6)',
                    cursor:      canScrollLeft ? 'pointer' : 'default',
                  }}>
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button onClick={() => scroll('right')} disabled={!canScrollRight}
                  className="w-8 h-8 rounded-lg border flex items-center justify-center transition-all"
                  style={{
                    borderColor: canScrollRight ? 'var(--border-strong)' : 'var(--border)',
                    color:       canScrollRight ? 'var(--ink-2)' : 'var(--ink-5)',
                    background:  canScrollRight ? 'white' : 'var(--ink-6)',
                    cursor:      canScrollRight ? 'pointer' : 'default',
                  }}>
                  <ChevronRightIcon className="w-4 h-4" />
                </button>
              </div>
            )}
            <Link href="/events"
              className="btn btn-secondary px-4 py-2 text-sm">
              View all events <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Carousel — edge-to-edge with left padding matching layout */}
        <div className="relative">
          {evLoading ? (
            <div className="flex gap-4 px-6 overflow-hidden">
              {[1, 2, 3, 4].map(i => <SkeletonCard key={i} />)}
            </div>
          ) : events.length === 0 ? (
            <div className="mx-6 card py-16 text-center">
              <Calendar className="w-10 h-10 mx-auto mb-3" style={{ color: 'var(--ink-5)' }} />
              <p className="font-semibold mb-1">No open events right now</p>
              <p className="text-sm mb-4" style={{ color: 'var(--ink-3)' }}>Check back soon, or create one yourself.</p>
              <Link href="/register" className="btn btn-primary px-4 py-2 text-sm mx-auto" style={{ display: 'inline-flex' }}>
                Host an event
              </Link>
            </div>
          ) : (
            <>
              {/* Left fade edge */}
              {canScrollLeft && (
                <div className="absolute left-0 top-0 bottom-0 w-16 z-10 pointer-events-none"
                  style={{ background: 'linear-gradient(to right, white, transparent)' }} />
              )}
              {/* Right fade edge */}
              {canScrollRight && (
                <div className="absolute right-0 top-0 bottom-0 w-16 z-10 pointer-events-none"
                  style={{ background: 'linear-gradient(to left, white, transparent)' }} />
              )}
              <div
                ref={scrollRef}
                className="flex gap-4 overflow-x-auto pb-3"
                style={{
                  paddingLeft: 24,
                  paddingRight: 24,
                  scrollbarWidth: 'none',
                  msOverflowStyle: 'none',
                  WebkitOverflowScrolling: 'touch',
                }}>
                {events.map(event => <EventCard key={event.id} event={event} />)}

                {/* "See all" end card */}
                <Link href="/events"
                  className="card flex-shrink-0 flex flex-col items-center justify-center gap-3 card-hover"
                  style={{ width: 200, minHeight: 340, borderStyle: 'dashed' }}>
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
                    style={{ background: 'var(--accent-light)' }}>
                    <ArrowRight className="w-6 h-6" style={{ color: 'var(--accent)' }} />
                  </div>
                  <div className="text-center px-4">
                    <p className="font-semibold text-sm mb-1">See all events</p>
                    <p className="text-xs" style={{ color: 'var(--ink-3)' }}>
                      Browse, filter & search every open event
                    </p>
                  </div>
                </Link>
              </div>
            </>
          )}
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6" style={{ background: 'var(--ink-6)' }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="label-xs mb-3">Platform Features</p>
            <h2 className="text-3xl font-bold tracking-tight" style={{ letterSpacing: '-0.02em' }}>
              Built around real event workflows
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map(({ icon: Icon, title, desc }, i) => (
              <div key={title} className={`card card-hover bg-white p-5 slide-up stagger-${Math.min(i + 1, 6)}`}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-4" style={{ background: 'var(--accent-light)' }}>
                  <Icon className="w-4 h-4" style={{ color: 'var(--accent)' }} />
                </div>
                <h3 className="font-semibold text-[15px] mb-1.5">{title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--ink-3)' }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Demo credentials */}
      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <p className="label-xs mb-3">Demo Access</p>
            <h2 className="text-3xl font-bold tracking-tight" style={{ letterSpacing: '-0.02em' }}>Try either role now</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {demos.map(({ role, email, pass, color, perks }) => (
              <Link key={role} href="/login" className="card card-hover p-5 group block">
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-8 h-8 rounded-lg ${color} flex items-center justify-center flex-shrink-0`}>
                    <span className="text-white text-sm font-bold">{role[0]}</span>
                  </div>
                  <div className="flex-1 flex items-center justify-between">
                    <span className="font-semibold text-[15px]">{role}</span>
                    <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: 'var(--accent)' }} />
                  </div>
                </div>
                <div className="space-y-1.5 mb-4">
                  {perks.map(p => (
                    <div key={p} className="flex items-center gap-2 text-sm" style={{ color: 'var(--ink-2)' }}>
                      <Check className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'var(--green)' }} />{p}
                    </div>
                  ))}
                </div>
                <div className="mono text-xs rounded-lg px-3 py-2.5 space-y-0.5"
                  style={{ background: 'var(--ink-6)', border: '1px solid var(--border)' }}>
                  <div className="flex gap-3">
                    <span style={{ color: 'var(--ink-4)' }}>email</span>
                    <span style={{ color: 'var(--ink-2)' }}>{email}</span>
                  </div>
                  <div className="flex gap-3">
                    <span style={{ color: 'var(--ink-4)' }}>pass </span>
                    <span style={{ color: 'var(--ink-2)' }}>{pass}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t py-8 px-6" style={{ borderColor: 'var(--border)' }}>
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