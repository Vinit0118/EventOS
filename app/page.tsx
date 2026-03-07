// Path: app/page.tsx
'use client'
import Link from 'next/link'
import { ArrowRight, Zap, Users, QrCode, BarChart3, Shield, GitBranch, Check } from 'lucide-react'

const features = [
  { icon: Users,     title: 'Team Engine',         desc: 'Search teams, send join requests, leader accepts or rejects. One team per event per person.' },
  { icon: QrCode,    title: 'QR Check-In',          desc: 'Token-based check-in with duplicate prevention. Each event organizer manages their own.' },
  { icon: BarChart3, title: 'Live Analytics',        desc: 'Health scores, velocity, team formation rate — all scoped per event.' },
  { icon: Shield,    title: 'Scoped Permissions',    desc: 'Organizers own their events. Participants own their registrations. No cross-event access.' },
  { icon: GitBranch, title: 'Global Platform',       desc: 'Any user can host events or join them. Different organizer per event, always.' },
  { icon: Users,     title: 'Team Requests',         desc: 'Leaders see incoming requests with messages, accept or reject per slot.' },
]

const demos = [
  { role: 'Organizer',   email: 'organizer@eventos.dev',  pass: 'org123',  color: 'bg-violet-500', perks: ['Create & publish events', 'Manage check-in for your events', 'View analytics for your events only'] },
  { role: 'Participant', email: 'participant@eventos.dev', pass: 'part123', color: 'bg-blue-500',   perks: ['Register for any public event', 'Create or search teams', 'Send join requests with a message'] },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b" style={{ borderColor: 'var(--border)' }}>
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'var(--accent)' }}>
              <Zap className="w-4 h-4 text-white" strokeWidth={2.5} />
            </div>
            <span className="font-semibold text-[15px] tracking-tight">EventOS</span>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/login" className="btn btn-ghost px-4 py-2 text-sm">Sign in</Link>
            <Link href="/register" className="btn btn-primary px-4 py-2 text-sm">
              Get started <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </nav>

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
            Register for events, form teams with a request flow, and check in with QR codes. Each event has its own organizer — no shared admin.
          </p>
          <div className="slide-up stagger-2 flex items-center justify-center gap-3 flex-wrap">
            <Link href="/register" className="btn btn-primary px-6 py-3 text-[15px]">
              Start for free <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/login" className="btn btn-secondary px-6 py-3 text-[15px]">Sign in</Link>
          </div>
        </div>
      </section>

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

      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="label-xs mb-3">Platform Features</p>
            <h2 className="text-3xl font-bold tracking-tight" style={{ letterSpacing: '-0.02em' }}>Built around real event workflows</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map(({ icon: Icon, title, desc }, i) => (
              <div key={title} className={`card card-hover p-5 slide-up stagger-${Math.min(i + 1, 6)}`}>
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

      <section className="py-20 px-6" style={{ background: 'var(--ink-6)' }}>
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
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-[15px]">{role}</span>
                      <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: 'var(--accent)' }} />
                    </div>
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
                  <div className="flex gap-3"><span style={{ color: 'var(--ink-4)' }}>email</span><span style={{ color: 'var(--ink-2)' }}>{email}</span></div>
                  <div className="flex gap-3"><span style={{ color: 'var(--ink-4)' }}>pass </span><span style={{ color: 'var(--ink-2)' }}>{pass}</span></div>
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