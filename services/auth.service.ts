// Path: services/auth.service.ts
import { LoginPayload, RegisterPayload, AuthSession, User, UserRole } from '@/types'
import { DASHBOARD_ROUTES } from '@/constants/roles'

const SESSION_KEY = 'eventos_session'

export const authService = {
  async login(payload: LoginPayload) {
    const res  = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    return res.json()
  },

  async register(payload: RegisterPayload) {
    const res = await fetch('/api/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    return res.json()
  },

  saveSession(session: AuthSession) {
    if (typeof window !== 'undefined') localStorage.setItem(SESSION_KEY, JSON.stringify(session))
  },

  getSession(): AuthSession | null {
    if (typeof window === 'undefined') return null
    try {
      const raw = localStorage.getItem(SESSION_KEY)
      return raw ? JSON.parse(raw) : null
    } catch { return null }
  },

  getCurrentUser(): User | null {
    return this.getSession()?.user ?? null
  },

  logout() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(SESSION_KEY)
      window.location.href = '/login'
    }
  },

  getDashboardRoute(role: UserRole): string {
    return DASHBOARD_ROUTES[role] ?? '/participant'
  },
}