// Path: app/(dashboard)/participant/team/page.tsx
'use client'
import { useEffect, useState, useCallback } from 'react'
import {
  Users, Plus, Search, CheckCircle, XCircle, Clock, Crown,
  Loader2, ChevronRight, MessageSquare, X, Sparkles
} from 'lucide-react'
import { authService } from '@/services/auth.service'
import { eventsService } from '@/services/events.service'
import { teamsService } from '@/services/teams.service'
import { registrationsService } from '@/services/registrations.service'
import { Event, Team, TeamJoinRequest, Registration } from '@/types'
import { timeAgo } from '@/lib/utils'

type Tab = 'my-team' | 'find-team' | 'create-team' | 'requests'

// ─── Status badge helper ──────────────────────────────────────────────────────
function RequestStatusBadge({ status }: { status: TeamJoinRequest['status'] }) {
  if (status === 'PENDING')  return <span className="badge badge-amber flex items-center gap-1"><Clock className="w-3 h-3" />Pending</span>
  if (status === 'ACCEPTED') return <span className="badge badge-green flex items-center gap-1"><CheckCircle className="w-3 h-3" />Accepted</span>
  return <span className="badge badge-red flex items-center gap-1"><XCircle className="w-3 h-3" />Rejected</span>
}

// ─── Team card ────────────────────────────────────────────────────────────────
function TeamCard({
  team, onRequest, alreadyRequested, isMember, isLeader
}: {
  team: Team
  onRequest: (team: Team) => void
  alreadyRequested: boolean
  isMember: boolean
  isLeader: boolean
}) {
  const full = (team.member_count ?? 0) >= team.max_size
  return (
    <div className="card bg-white p-5 card-hover">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0 pr-3">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-bold text-[15px]">{team.name}</h3>
            {isLeader && <span className="badge badge-indigo flex items-center gap-1"><Crown className="w-3 h-3" />Leader</span>}
            {isMember && !isLeader && <span className="badge badge-green">Member</span>}
          </div>
          <p className="text-xs" style={{ color: 'var(--ink-3)' }}>{team.leader?.name} · {team.member_count}/{team.max_size} members</p>
        </div>
        <span className={`badge flex-shrink-0 ${full ? 'badge-neutral' : 'badge-green'}`}>{full ? 'Full' : 'Open'}</span>
      </div>

      {team.description && (
        <p className="text-sm leading-relaxed mb-3 line-clamp-2" style={{ color: 'var(--ink-3)' }}>{team.description}</p>
      )}

      {/* Skills */}
      {team.skills.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {team.skills.map(s => <span key={s} className="badge badge-blue">{s}</span>)}
        </div>
      )}

      {/* Members */}
      <div className="flex items-center gap-1.5 mb-4">
        {team.members?.slice(0, 4).map(m => (
          <div key={m.id} className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
            style={{ background: m.role === 'LEADER' ? 'var(--accent)' : 'var(--ink-4)' }}>
            {m.user?.name[0].toUpperCase() ?? '?'}
          </div>
        ))}
        {(team.member_count ?? 0) < team.max_size && (
          Array.from({ length: team.max_size - (team.member_count ?? 0) }).map((_, i) => (
            <div key={i} className="w-7 h-7 rounded-lg border-2 border-dashed flex items-center justify-center"
              style={{ borderColor: 'var(--border-strong)' }}>
              <Plus className="w-3 h-3" style={{ color: 'var(--ink-4)' }} />
            </div>
          ))
        )}
      </div>

      {/* Action */}
      {!isMember && !isLeader && (
        <button
          onClick={() => onRequest(team)}
          disabled={full || alreadyRequested}
          className="btn w-full py-2 text-sm rounded-xl"
          style={alreadyRequested
            ? { background: 'var(--ink-6)', color: 'var(--ink-3)', border: '1px solid var(--border)', cursor: 'default' }
            : full
            ? { background: 'var(--ink-6)', color: 'var(--ink-4)', border: '1px solid var(--border)', cursor: 'not-allowed' }
            : undefined}
          {...(!full && !alreadyRequested ? { className: 'btn btn-primary w-full py-2 text-sm rounded-xl' } : {})}
        >
          {alreadyRequested ? <><Clock className="w-3.5 h-3.5" />Request Sent</> : full ? 'Team Full' : <><MessageSquare className="w-3.5 h-3.5" />Request to Join</>}
        </button>
      )}
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function ParticipantTeamPage() {
  const user = authService.getCurrentUser()

  const [tab, setTab] = useState<Tab>('my-team')
  const [registrations, setRegistrations] = useState<Registration[]>([])
  const [selectedEventId, setSelectedEventId] = useState('')
  const [myTeam, setMyTeam] = useState<Team | null>(null)
  const [teams, setTeams]   = useState<Team[]>([])
  const [myRequests, setMyRequests] = useState<TeamJoinRequest[]>([])
  const [incomingRequests, setIncomingRequests] = useState<TeamJoinRequest[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [responding, setResponding] = useState<string | null>(null)

  // Create team form
  const [createForm, setCreateForm] = useState({ name: '', description: '', skills: [] as string[], skillInput: '' })
  const [creating, setCreating]     = useState(false)
  const [createError, setCreateError] = useState('')

  // Request modal
  const [requestTarget, setRequestTarget] = useState<Team | null>(null)
  const [requestMsg, setRequestMsg]       = useState('')
  const [sendingReq, setSendingReq]       = useState(false)

  // Load initial data
  useEffect(() => {
    if (!user) return
    registrationsService.getMyRegistrations(user.id).then(res => {
      const regs: Registration[] = (res.data ?? []).filter((r: Registration) => r.status !== 'CANCELLED')
      setRegistrations(regs)
      // Default to first team event
      const first = regs[0]?.event_id ?? ''
      setSelectedEventId(first)
    })
  }, [])

  // Load teams, my team, requests when event changes
  const loadTeamData = useCallback(async () => {
    if (!selectedEventId || !user) return
    setLoading(true)
    const [teamsRes, myTeamRes, reqRes] = await Promise.all([
      teamsService.search(selectedEventId, search || undefined),
      teamsService.getMyTeam(selectedEventId, user.id),
      teamsService.getMyRequests(user.id),
    ])
    setTeams(teamsRes.data ?? [])
    setMyTeam(myTeamRes.data ?? null)
    setMyRequests(reqRes.data ?? [])

    // If I'm a team leader, also load incoming requests
    if (myTeamRes.data?.leader_id === user.id) {
      const inRes = await teamsService.getRequestsForTeam(myTeamRes.data.id)
      setIncomingRequests(inRes.data ?? [])
    }
    setLoading(false)
  }, [selectedEventId, user, search])

  useEffect(() => { loadTeamData() }, [loadTeamData])

  // Auto-switch tab based on state
  useEffect(() => {
    if (myTeam) setTab('my-team')
  }, [myTeam])

  async function handleSendRequest() {
    if (!requestTarget || !user) return
    setSendingReq(true)
    const res = await teamsService.sendJoinRequest({ team_id: requestTarget.id, user_id: user.id, message: requestMsg })
    setSendingReq(false)
    setRequestTarget(null)
    setRequestMsg('')
    if (res.success) loadTeamData()
  }

  async function handleRespond(requestId: string, teamId: string, response: 'ACCEPTED' | 'REJECTED') {
    setResponding(requestId)
    await teamsService.respondToRequest(teamId, requestId, response)
    setResponding(null)
    loadTeamData()
  }

  async function handleCreateTeam(e: React.FormEvent) {
    e.preventDefault()
    if (!user || !selectedEventId) return
    setCreating(true); setCreateError('')
    const res = await teamsService.create({
      event_id: selectedEventId,
      name: createForm.name,
      description: createForm.description,
      skills: createForm.skills,
      leader_id: user.id,
    })
    if (!res.success) { setCreateError(res.error ?? 'Failed'); setCreating(false); return }
    setCreating(false)
    setCreateForm({ name: '', description: '', skills: [], skillInput: '' })
    loadTeamData()
  }

  const requestedTeamIds = new Set(myRequests.filter(r => r.status === 'PENDING').map(r => r.team_id))
  const pendingIncoming  = incomingRequests.filter(r => r.status === 'PENDING')

  const tabs: { key: Tab; label: string; count?: number }[] = [
    { key: 'my-team',     label: myTeam ? 'My Team' : 'My Team' },
    { key: 'find-team',   label: 'Find a Team' },
    { key: 'create-team', label: 'Create Team' },
    { key: 'requests',    label: 'Requests', count: (myTeam?.leader_id === user?.id ? pendingIncoming.length : 0) + myRequests.filter(r => r.status === 'PENDING').length },
  ]

  if (!registrations.length) return (
    <div className="p-8 max-w-4xl">
      <p className="label-xs mb-1">Participant</p>
      <h1 className="text-2xl font-bold tracking-tight mb-6" style={{ letterSpacing: '-0.02em' }}>Team</h1>
      <div className="card bg-white py-20 text-center">
        <Users className="w-10 h-10 mx-auto mb-3" style={{ color: 'var(--ink-5)' }} />
        <p className="font-semibold mb-1">Not registered for any event yet</p>
        <p className="text-sm mb-4" style={{ color: 'var(--ink-3)' }}>Register for a team event first to access team features</p>
        <a href="/participant" className="btn btn-primary px-4 py-2 text-sm mx-auto inline-flex">Browse Events</a>
      </div>
    </div>
  )

  return (
    <div className="p-8 max-w-5xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-6 fade-in">
        <div>
          <p className="label-xs mb-1">Participant</p>
          <h1 className="text-2xl font-bold tracking-tight" style={{ letterSpacing: '-0.02em' }}>Team</h1>
        </div>
        {/* Event selector */}
        <div>
          <label className="label-xs block mb-1.5">Event</label>
          <select value={selectedEventId} onChange={e => setSelectedEventId(e.target.value)} className="input text-sm py-2">
            {registrations.map(r => (
              <option key={r.event_id} value={r.event_id}>{r.event_id}</option>
            ))}
          </select>
        </div>
      </div>

      {/* My team status banner */}
      {myTeam && (
        <div className="mb-5 p-4 rounded-xl flex items-center gap-3 slide-up"
          style={{ background: 'var(--accent-light)', border: '1px solid var(--accent-mid)' }}>
          <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: 'var(--accent)' }}>
            <Users className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-sm" style={{ color: 'var(--accent)' }}>
              {myTeam.leader_id === user?.id ? `You're leading ` : `You're in `}
              <span className="font-bold">{myTeam.name}</span>
            </p>
            <p className="text-xs" style={{ color: 'var(--accent)' }}>
              {myTeam.member_count}/{myTeam.max_size} members · {myTeam.status}
            </p>
          </div>
          {myTeam.leader_id === user?.id && pendingIncoming.length > 0 && (
            <button onClick={() => setTab('requests')}
              className="badge badge-indigo flex items-center gap-1.5 cursor-pointer">
              <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
              {pendingIncoming.length} pending request{pendingIncoming.length > 1 ? 's' : ''}
              <ChevronRight className="w-3 h-3" />
            </button>
          )}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b" style={{ borderColor: 'var(--border)' }}>
        {tabs.map(({ key, label, count }) => (
          <button key={key} onClick={() => setTab(key)}
            className="relative px-4 py-2.5 text-sm font-medium transition-colors"
            style={{
              color: tab === key ? 'var(--accent)' : 'var(--ink-3)',
              borderBottom: tab === key ? '2px solid var(--accent)' : '2px solid transparent',
              marginBottom: '-1px',
            }}>
            {label}
            {count != null && count > 0 && (
              <span className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full text-[10px] font-bold text-white"
                style={{ background: 'var(--accent)' }}>{count}</span>
            )}
          </button>
        ))}
      </div>

      {/* ── MY TEAM TAB ── */}
      {tab === 'my-team' && (
        <div className="slide-up">
          {!myTeam ? (
            <div className="card bg-white py-16 text-center">
              <Sparkles className="w-10 h-10 mx-auto mb-3" style={{ color: 'var(--ink-5)' }} />
              <p className="font-semibold mb-1">You're not on a team yet</p>
              <p className="text-sm mb-5" style={{ color: 'var(--ink-3)' }}>Create a team or find one to join</p>
              <div className="flex justify-center gap-2">
                <button onClick={() => setTab('create-team')} className="btn btn-primary px-4 py-2 text-sm">Create a Team</button>
                <button onClick={() => setTab('find-team')} className="btn btn-secondary px-4 py-2 text-sm">Find a Team</button>
              </div>
            </div>
          ) : (
            <div className="card bg-white p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold"
                  style={{ background: 'var(--accent)' }}>
                  {myTeam.name[0].toUpperCase()}
                </div>
                <div>
                  <h2 className="font-bold text-lg">{myTeam.name}</h2>
                  <div className="flex gap-1.5 mt-1">
                    <span className={`badge ${myTeam.status === 'APPROVED' ? 'badge-green' : myTeam.status === 'FORMING' ? 'badge-amber' : 'badge-neutral'}`}>
                      {myTeam.status}
                    </span>
                    <span className="badge badge-neutral">{myTeam.member_count}/{myTeam.max_size} members</span>
                  </div>
                </div>
              </div>

              {myTeam.description && (
                <p className="text-sm leading-relaxed mb-5" style={{ color: 'var(--ink-3)' }}>{myTeam.description}</p>
              )}

              {myTeam.skills.length > 0 && (
                <div className="mb-5">
                  <p className="label-xs mb-2">Team Skills</p>
                  <div className="flex flex-wrap gap-1.5">
                    {myTeam.skills.map(s => <span key={s} className="badge badge-blue">{s}</span>)}
                  </div>
                </div>
              )}

              <p className="label-xs mb-3">Members</p>
              <div className="space-y-2">
                {myTeam.members?.map(m => (
                  <div key={m.id} className="flex items-center gap-3 p-3 rounded-xl"
                    style={{ background: 'var(--ink-6)', border: '1px solid var(--border)' }}>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                      style={{ background: m.role === 'LEADER' ? 'var(--accent)' : 'var(--ink-4)' }}>
                      {m.user?.name[0].toUpperCase() ?? '?'}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold">{m.user?.name ?? m.user_id}</p>
                      <p className="text-xs" style={{ color: 'var(--ink-3)' }}>{m.user?.email}</p>
                    </div>
                    {m.role === 'LEADER' && (
                      <span className="badge badge-indigo flex items-center gap-1"><Crown className="w-3 h-3" />Leader</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── FIND TEAM TAB ── */}
      {tab === 'find-team' && (
        <div className="slide-up">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--ink-4)' }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by team name or skill…"
              className="input pl-9"
            />
          </div>

          {loading ? (
            <div className="flex justify-center py-16">
              <div className="w-5 h-5 rounded-full border-2 animate-spin" style={{ borderColor: 'var(--ink-4)', borderTopColor: 'var(--accent)' }} />
            </div>
          ) : teams.length === 0 ? (
            <div className="card bg-white py-16 text-center">
              <Users className="w-8 h-8 mx-auto mb-2" style={{ color: 'var(--ink-5)' }} />
              <p className="text-sm font-medium mb-1">No teams found</p>
              <p className="text-xs" style={{ color: 'var(--ink-3)' }}>Be the first — create a team!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {teams.map(team => (
                <TeamCard
                  key={team.id}
                  team={team}
                  onRequest={t => setRequestTarget(t)}
                  alreadyRequested={requestedTeamIds.has(team.id)}
                  isMember={team.members?.some(m => m.user_id === user?.id) ?? false}
                  isLeader={team.leader_id === user?.id}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── CREATE TEAM TAB ── */}
      {tab === 'create-team' && (
        <div className="slide-up max-w-lg">
          {myTeam ? (
            <div className="card bg-white py-12 text-center">
              <Users className="w-8 h-8 mx-auto mb-2" style={{ color: 'var(--ink-5)' }} />
              <p className="font-medium">You're already on a team for this event</p>
              <p className="text-sm mt-1" style={{ color: 'var(--ink-3)' }}>Leave your current team first to create a new one</p>
            </div>
          ) : (
            <div className="card bg-white p-6">
              <h2 className="font-bold text-[15px] mb-5">Create a New Team</h2>
              <form onSubmit={handleCreateTeam} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--ink-2)' }}>Team Name</label>
                  <input value={createForm.name} onChange={e => setCreateForm({ ...createForm, name: e.target.value })}
                    required placeholder="Neural Ninjas" className="input" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--ink-2)' }}>Description</label>
                  <textarea value={createForm.description} onChange={e => setCreateForm({ ...createForm, description: e.target.value })}
                    rows={3} placeholder="What are you building? What kind of teammates are you looking for?" className="input resize-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--ink-2)' }}>Skills you're looking for</label>
                  <div className="flex gap-2">
                    <input value={createForm.skillInput}
                      onChange={e => setCreateForm({ ...createForm, skillInput: e.target.value })}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          const s = createForm.skillInput.trim()
                          if (s && !createForm.skills.includes(s))
                            setCreateForm({ ...createForm, skills: [...createForm.skills, s], skillInput: '' })
                        }
                      }}
                      placeholder="React, Python, Design… (Enter)" className="input flex-1" />
                    <button type="button" className="btn btn-secondary px-3 text-sm rounded-lg"
                      onClick={() => {
                        const s = createForm.skillInput.trim()
                        if (s && !createForm.skills.includes(s))
                          setCreateForm({ ...createForm, skills: [...createForm.skills, s], skillInput: '' })
                      }}>Add</button>
                  </div>
                  {createForm.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {createForm.skills.map(s => (
                        <span key={s} className="badge badge-blue flex items-center gap-1.5">
                          {s}
                          <button type="button" onClick={() => setCreateForm({ ...createForm, skills: createForm.skills.filter(x => x !== s) })} className="opacity-60 hover:opacity-100">×</button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                {createError && <div className="badge badge-red px-3.5 py-2.5 text-xs rounded-lg w-full">{createError}</div>}
                <button type="submit" disabled={creating} className="btn btn-primary w-full py-2.5 text-sm">
                  {creating ? <><Loader2 className="w-4 h-4 animate-spin" />Creating…</> : <><Plus className="w-4 h-4" />Create Team</>}
                </button>
              </form>
            </div>
          )}
        </div>
      )}

      {/* ── REQUESTS TAB ── */}
      {tab === 'requests' && (
        <div className="slide-up space-y-6">
          {/* Incoming requests (if I'm a leader) */}
          {myTeam?.leader_id === user?.id && (
            <div>
              <p className="label-xs mb-3">Incoming Join Requests for {myTeam.name}</p>
              {incomingRequests.length === 0 ? (
                <div className="card bg-white py-10 text-center">
                  <p className="text-sm" style={{ color: 'var(--ink-3)' }}>No join requests yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {incomingRequests.map(req => (
                    <div key={req.id} className="card bg-white p-4 flex items-start gap-4">
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center text-white font-bold flex-shrink-0"
                        style={{ background: 'var(--ink-3)' }}>
                        {req.user?.name[0].toUpperCase() ?? '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="font-semibold text-sm">{req.user?.name}</p>
                          <RequestStatusBadge status={req.status} />
                        </div>
                        <p className="text-xs mb-2" style={{ color: 'var(--ink-3)' }}>{req.user?.email} · {timeAgo(req.created_at)}</p>
                        {req.message && (
                          <div className="text-xs p-2.5 rounded-lg leading-relaxed"
                            style={{ background: 'var(--ink-6)', border: '1px solid var(--border)', color: 'var(--ink-2)' }}>
                            "{req.message}"
                          </div>
                        )}
                      </div>
                      {req.status === 'PENDING' && (
                        <div className="flex gap-1.5 flex-shrink-0">
                          <button
                            onClick={() => handleRespond(req.id, myTeam.id, 'ACCEPTED')}
                            disabled={responding === req.id}
                            className="btn btn-primary px-3 py-1.5 text-xs rounded-lg">
                            {responding === req.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <><CheckCircle className="w-3.5 h-3.5" />Accept</>}
                          </button>
                          <button
                            onClick={() => handleRespond(req.id, myTeam.id, 'REJECTED')}
                            disabled={responding === req.id}
                            className="btn btn-danger px-3 py-1.5 text-xs rounded-lg">
                            <XCircle className="w-3.5 h-3.5" />Reject
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* My outgoing requests */}
          <div>
            <p className="label-xs mb-3">My Join Requests</p>
            {myRequests.length === 0 ? (
              <div className="card bg-white py-10 text-center">
                <p className="text-sm" style={{ color: 'var(--ink-3)' }}>You haven't requested to join any team yet</p>
                <button onClick={() => setTab('find-team')} className="text-sm mt-2 font-medium" style={{ color: 'var(--accent)' }}>
                  Find a team →
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {myRequests.map(req => (
                  <div key={req.id} className="card bg-white p-4 flex items-center gap-4">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold flex-shrink-0"
                      style={{ background: 'var(--accent)' }}>
                      {req.team?.name[0].toUpperCase() ?? '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm">{req.team?.name}</p>
                      <p className="text-xs" style={{ color: 'var(--ink-3)' }}>
                        Led by {req.team?.leader?.name} · {timeAgo(req.created_at)}
                      </p>
                      {req.message && <p className="text-xs mt-1 italic" style={{ color: 'var(--ink-3)' }}>"{req.message}"</p>}
                    </div>
                    <RequestStatusBadge status={req.status} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Request Modal ── */}
      {requestTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(15,15,16,0.4)', backdropFilter: 'blur(6px)' }}>
          <div className="bg-white rounded-2xl w-full max-w-md slide-up"
            style={{ boxShadow: 'var(--shadow-lg)', border: '1px solid var(--border)' }}>
            <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
              <h2 className="font-semibold">Request to join {requestTarget.name}</h2>
              <button onClick={() => setRequestTarget(null)} className="btn btn-ghost p-1.5 rounded-lg">
                <X className="w-4 h-4" style={{ color: 'var(--ink-3)' }} />
              </button>
            </div>
            <div className="p-6">
              {/* Team preview */}
              <div className="flex flex-wrap gap-1.5 mb-4">
                {requestTarget.skills.map(s => <span key={s} className="badge badge-blue">{s}</span>)}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--ink-2)' }}>
                  Message to team leader <span className="font-normal" style={{ color: 'var(--ink-4)' }}>(optional)</span>
                </label>
                <textarea
                  value={requestMsg}
                  onChange={e => setRequestMsg(e.target.value)}
                  rows={3}
                  placeholder="Introduce yourself — what skills do you bring? Why do you want to join this team?"
                  className="input resize-none"
                />
              </div>
              <div className="flex gap-2 mt-4">
                <button onClick={() => setRequestTarget(null)} className="btn btn-secondary flex-1 py-2.5 text-sm">Cancel</button>
                <button onClick={handleSendRequest} disabled={sendingReq} className="btn btn-primary flex-1 py-2.5 text-sm">
                  {sendingReq ? <><Loader2 className="w-4 h-4 animate-spin" />Sending…</> : <><MessageSquare className="w-4 h-4" />Send Request</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}