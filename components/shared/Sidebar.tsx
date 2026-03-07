// Path: components/shared/Sidebar.tsx
'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Calendar, QrCode, Users, BarChart3, LogOut, Zap, Globe } from 'lucide-react'
import { authService } from '@/services/auth.service'
import { User } from '@/types'

interface NavItem { href: string; label: string; icon: React.ElementType }

const NAV: Record<string, NavItem[]> = {
  ORGANIZER: [
    { href: '/organizer',         label: 'My Events',  icon: Calendar },
    { href: '/organizer/discover', label: 'Discover',   icon: Globe },
    { href: '/organizer/checkin', label: 'Check-In',   icon: QrCode },
    { href: '/organizer/analytics', label: 'Analytics', icon: BarChart3 },
  ],
  PARTICIPANT: [
    { href: '/participant',      label: 'Dashboard',  icon: LayoutDashboard },
    { href: '/participant/discover', label: 'Discover Events', icon: Globe },
    { href: '/participant/team', label: 'My Team',    icon: Users },
  ],
}

const ROLE_COLORS: Record<string, { badge: string; dot: string }> = {
  ORGANIZER:   { badge: 'badge-indigo', dot: 'bg-violet-500' },
  PARTICIPANT: { badge: 'badge-blue',   dot: 'bg-blue-500' },
}

export default function Sidebar({ user }: { user: User }) {
  const pathname = usePathname()
  const items = NAV[user.role] ?? []
  const rc = ROLE_COLORS[user.role]

  return (
    <aside className="w-56 flex-shrink-0 h-screen sticky top-0 flex flex-col bg-white border-r"
      style={{ borderColor: 'var(--border)' }}>

      {/* Logo */}
      <div className="px-5 py-4 border-b flex items-center gap-2" style={{ borderColor: 'var(--border)' }}>
        <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: 'var(--accent)' }}>
          <Zap className="w-4 h-4 text-white" strokeWidth={2.5} />
        </div>
        <span className="font-semibold text-[15px] tracking-tight">EventOS</span>
      </div>

      {/* User chip */}
      <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--border)', background: 'var(--ink-6)' }}>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0
            text-white text-sm font-bold" style={{ background: 'var(--accent)' }}>
            {user.name[0].toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate leading-tight">{user.name}</p>
            <span className={`badge ${rc.badge} mt-0.5`}>{user.role}</span>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
        {items.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link key={href} href={href}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all"
              style={{
                background: active ? 'var(--accent-light)' : 'transparent',
                color:      active ? 'var(--accent)' : 'var(--ink-3)',
                borderLeft: active ? '2px solid var(--accent)' : '2px solid transparent',
              }}
              onMouseEnter={e => { if (!active) { e.currentTarget.style.background = 'var(--ink-6)'; e.currentTarget.style.color = 'var(--ink)' } }}
              onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--ink-3)' } }}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />{label}
            </Link>
          )
        })}
      </nav>

      {/* Sign out */}
      <div className="px-3 py-3 border-t" style={{ borderColor: 'var(--border)' }}>
        <button onClick={() => authService.logout()}
          className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm w-full transition-all"
          style={{ color: 'var(--ink-3)' }}
          onMouseEnter={e => { e.currentTarget.style.color = 'var(--red)'; e.currentTarget.style.background = 'var(--red-light)' }}
          onMouseLeave={e => { e.currentTarget.style.color = 'var(--ink-3)'; e.currentTarget.style.background = 'transparent' }}>
          <LogOut className="w-4 h-4" /> Sign out
        </button>
      </div>
    </aside>
  )
}