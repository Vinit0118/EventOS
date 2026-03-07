// Path: app/(auth)/register/page.tsx
'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Loader2, ArrowRight, Check, Zap, Users } from 'lucide-react'
import { authService } from '@/services/auth.service'
import { UserRole } from '@/types'

const ROLES: { value: UserRole; label: string; desc: string; perks: string[]; color: string }[] = [
  {
    value: 'ORGANIZER',
    label: 'Organizer',
    desc: 'Host your own events',
    perks: ['Create & publish events', 'Manage registrations', 'QR check-in & analytics'],
    color: 'bg-violet-500',
  },
  {
    value: 'PARTICIPANT',
    label: 'Participant',
    desc: 'Join events as an attendee',
    perks: ['Register for any event', 'Form and join teams', 'Get your QR token'],
    color: 'bg-blue-500',
  },
]

export default function RegisterPage() {
  const router = useRouter()
  const [form, setForm]         = useState({ name: '', email: '', password: '', role: '' as UserRole | '' })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    if (!form.role) { setError('Please select a role'); return }
    setError(''); setLoading(true)
    const res = await authService.register({ ...form, role: form.role as UserRole })
    if (!res.success || !res.data) { setError(res.error ?? 'Registration failed'); setLoading(false); return }
    authService.saveSession(res.data)
    router.push(authService.getDashboardRoute(res.data.user.role))
  }

  return (
    <div className="w-full max-w-[440px] slide-up">
      <div className="bg-white rounded-2xl border p-8" style={{ borderColor: 'var(--border)', boxShadow: 'var(--shadow-md)' }}>
        <div className="mb-7">
          <h1 className="text-[22px] font-bold tracking-tight mb-1" style={{ letterSpacing: '-0.02em' }}>Create account</h1>
          <p className="text-sm" style={{ color: 'var(--ink-3)' }}>Join EventOS — host or participate</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          {/* Role selector — first, it's the biggest decision */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--ink-2)' }}>I want to…</label>
            <div className="grid grid-cols-2 gap-2">
              {ROLES.map(r => {
                const selected = form.role === r.value
                return (
                  <button key={r.value} type="button" onClick={() => setForm({ ...form, role: r.value })}
                    className="p-4 rounded-xl text-left transition-all border"
                    style={{
                      borderColor: selected ? 'var(--accent)' : 'var(--border)',
                      background:  selected ? 'var(--accent-light)' : 'white',
                    }}>
                    <div className={`w-7 h-7 rounded-lg ${r.color} flex items-center justify-center mb-2.5`}>
                      {r.value === 'ORGANIZER' ? <Zap className="w-4 h-4 text-white" /> : <Users className="w-4 h-4 text-white" />}
                    </div>
                    <p className="font-semibold text-sm mb-0.5">{r.label}</p>
                    <p className="text-xs" style={{ color: 'var(--ink-3)' }}>{r.desc}</p>
                    {selected && (
                      <div className="mt-2.5 space-y-1">
                        {r.perks.map(p => (
                          <div key={p} className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--accent)' }}>
                            <Check className="w-3 h-3 flex-shrink-0" />{p}
                          </div>
                        ))}
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--ink-2)' }}>Full name</label>
            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
              placeholder="Jamie Developer" required className="input" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--ink-2)' }}>Email</label>
            <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
              placeholder="you@example.com" required className="input" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--ink-2)' }}>Password</label>
            <div className="relative">
              <input type={showPass ? 'text' : 'password'} value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                placeholder="Min. 6 characters" required minLength={6} className="input pr-10" />
              <button type="button" onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--ink-4)' }}>
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {error && <div className="badge badge-red px-3.5 py-2.5 text-xs rounded-lg w-full fade-in">{error}</div>}

          <button type="submit" disabled={loading || !form.role} className="btn btn-primary w-full py-2.5 text-sm">
            {loading
              ? <><Loader2 className="w-4 h-4 animate-spin" />Creating account…</>
              : <>Create account <ArrowRight className="w-3.5 h-3.5" /></>}
          </button>
        </form>
      </div>

      <p className="text-center text-sm mt-5" style={{ color: 'var(--ink-3)' }}>
        Already have an account?{' '}
        <Link href="/login" className="font-semibold" style={{ color: 'var(--accent)' }}>Sign in</Link>
      </p>
    </div>
  )
}