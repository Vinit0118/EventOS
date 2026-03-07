// Path: app/(dashboard)/participant/page.tsx
'use client'
import { useEffect, useState } from 'react'
import { Calendar, QrCode, Users, CheckCircle, Clock, MapPin, Plus, Loader2, Search } from 'lucide-react'
import Link from 'next/link'
import { authService } from '@/services/auth.service'
import { eventsService } from '@/services/events.service'
import { registrationsService } from '@/services/registrations.service'
import { Event, Registration } from '@/types'
import { formatDate } from '@/lib/utils'

export default function ParticipantDashboard() {
  const user = authService.getCurrentUser()
  const [events, setEvents]     = useState<Event[]>([])
  const [myRegs, setMyRegs]     = useState<Registration[]>([])
  const [loading, setLoading]   = useState(true)
  const [registering, setRegistering] = useState<string | null>(null)
  const [toast, setToast]       = useState('')
  const [search, setSearch]     = useState('')

  useEffect(() => {
    if (!user) return
    async function load() {
      const [evRes, regRes] = await Promise.all([
        eventsService.getAll(),
        registrationsService.getMyRegistrations(user!.id),
      ])
      // Show all published/ongoing events, exclude ones this user created
      setEvents((evRes.data ?? []).filter((e: Event) =>
        ['PUBLISHED', 'ONGOING'].includes(e.status) && e.created_by !== user!.id
      ))
      setMyRegs((regRes.data ?? []).filter((r: Registration) => r.status !== 'CANCELLED'))
      setLoading(false)
    }
    load()
  }, [])

  async function handleRegister(eventId: string) {
    if (!user) return
    setRegistering(eventId)
    const res = await registrationsService.register({ event_id: eventId, user_id: user.id })
    if (res.success && res.data) {
      setMyRegs(prev => [...prev, res.data])
      setToast('Registered! Check My Team to form or join a team.')
    } else {
      setToast(res.error ?? 'Registration failed')
    }
    setRegistering(null)
    setTimeout(() => setToast(''), 5000)
  }

  const registeredIds = new Set(myRegs.map(r => r.event_id))

  const filtered = events.filter(e =>
    !search ||
    e.title.toLowerCase().includes(search.toLowerCase()) ||
    e.location.toLowerCase().includes(search.toLowerCase()) ||
    e.tags.some(t => t.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <div className="p-8 max-w-6xl">
      <div className="mb-8 fade-in">
        <p className="label-xs mb-1">Participant</p>
        <h1 className="text-2xl font-bold tracking-tight" style={{ letterSpacing: '-0.02em' }}>
          Hey, {user?.name?.split(' ')[0]} 👋
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--ink-3)' }}>
          {myRegs.length > 0 ? `Registered for ${myRegs.length} event${myRegs.length > 1 ? 's' : ''}` : 'Find an event to join'}
        </p>
      </div>

      {toast && (
        <div className="mb-5 flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-medium fade-in"
          style={{ background: 'var(--green-light)', color: 'var(--green)', border: `1px solid ${toast.includes('fail') || toast.includes('Error') ? 'var(--red)' : 'rgba(22,163,74,0.2)'}`, display: 'flex' }}>
          <CheckCircle className="w-4 h-4 flex-shrink-0" />{toast}
        </div>
      )}

      {/* My registrations */}
      {myRegs.length > 0 && (
        <section className="mb-10">
          <p className="label-xs mb-3">My Registrations</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {myRegs.map((reg, i) => {
              const event = events.find(e => e.id === reg.event_id)
              return (
                <div key={reg.id} className="card bg-white p-4 slide-up" style={{ animationDelay: `${i * 0.06}s` }}>
                  <p className="font-semibold text-sm mb-1 truncate">{event?.title ?? reg.event_id}</p>
                  <div className="flex items-center justify-between mb-3">
                    <span className={`badge ${reg.checked_in ? 'badge-green' : 'badge-neutral'}`}>
                      {reg.checked_in ? 'Checked In' : reg.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5 p-3 rounded-xl"
                    style={{ background: 'var(--accent-light)', border: '1px solid var(--accent-mid)' }}>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: 'var(--accent)' }}>
                      <QrCode className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="label-xs mb-0.5">QR Token</p>
                      <p className="mono text-xs font-bold" style={{ color: 'var(--accent)', letterSpacing: '0.04em' }}>{reg.qr_token}</p>
                    </div>
                  </div>
                  {event?.type === 'TEAM' && (
                    <Link href="/participant/team"
                      className="mt-2.5 flex items-center gap-1 text-xs font-semibold"
                      style={{ color: 'var(--accent)' }}>
                      <Users className="w-3 h-3" />
                      {reg.team_id ? 'View my team' : 'Find or create a team'} →
                    </Link>
                  )}
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* Discover events */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <p className="label-xs">Discover Events</p>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: 'var(--ink-4)' }} />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search events…" className="input pl-8 py-1.5 text-sm w-48" />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-5 h-5 rounded-full border-2 animate-spin" style={{ borderColor: 'var(--ink-4)', borderTopColor: 'var(--accent)' }} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="card bg-white py-16 text-center">
            <Calendar className="w-8 h-8 mx-auto mb-3" style={{ color: 'var(--ink-5)' }} />
            <p className="text-sm font-medium">No events found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filtered.map((event, i) => {
              const isReg  = registeredIds.has(event.id)
              const fill   = Math.min(((event.registration_count ?? 0) / event.max_participants) * 100, 100)
              const almost = fill > 80

              return (
                <div key={event.id} className="card card-hover bg-white p-5 flex flex-col slide-up" style={{ animationDelay: `${i * 0.05}s` }}>
                  {/* Organizer */}
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-5 h-5 rounded-md flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0"
                      style={{ background: 'var(--ink-3)' }}>
                      {event.organizer?.name[0].toUpperCase() ?? '?'}
                    </div>
                    <span className="text-xs font-medium" style={{ color: 'var(--ink-3)' }}>{event.organizer?.name ?? 'Organizer'}</span>
                    <span className={`badge ml-auto ${event.status === 'ONGOING' ? 'badge-green' : 'badge-blue'}`}>{event.status}</span>
                  </div>

                  <h3 className="font-bold text-[15px] mb-1.5">{event.title}</h3>
                  <p className="text-sm leading-relaxed mb-4 flex-1 line-clamp-2" style={{ color: 'var(--ink-3)' }}>{event.description}</p>

                  <div className="space-y-1.5 mb-4">
                    {[
                      { icon: MapPin,   text: event.location },
                      { icon: Calendar, text: formatDate(event.start_date) },
                      { icon: Clock,    text: `Deadline ${formatDate(event.registration_deadline)}` },
                      { icon: Users,    text: event.type === 'TEAM' ? `Teams of ${event.min_team_size}–${event.max_team_size}` : 'Individual' },
                    ].map(({ icon: Icon, text }) => (
                      <div key={text} className="flex items-center gap-2 text-xs" style={{ color: 'var(--ink-3)' }}>
                        <Icon className="w-3 h-3 flex-shrink-0" />{text}
                      </div>
                    ))}
                  </div>

                  <div className="mb-3">
                    <div className="flex justify-between text-xs mb-1" style={{ color: 'var(--ink-3)' }}>
                      <span>{event.registration_count} / {event.max_participants}</span>
                      {almost && <span className="font-semibold" style={{ color: 'var(--red)' }}>Almost full!</span>}
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--ink-5)' }}>
                      <div className="h-full rounded-full" style={{ width: `${fill}%`, background: almost ? 'var(--red)' : 'var(--accent)' }} />
                    </div>
                  </div>

                  {event.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-4">
                      {event.tags.map(t => <span key={t} className="badge badge-indigo">{t}</span>)}
                    </div>
                  )}

                  {isReg ? (
                    <div className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold"
                      style={{ background: 'var(--green-light)', color: 'var(--green)' }}>
                      <CheckCircle className="w-4 h-4" />Registered
                    </div>
                  ) : (
                    <button onClick={() => handleRegister(event.id)} disabled={registering === event.id}
                      className="btn btn-primary py-2.5 text-sm w-full rounded-xl">
                      {registering === event.id
                        ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Registering…</>
                        : <><Plus className="w-3.5 h-3.5" />Register</>}
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}