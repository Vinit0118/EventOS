// Path: services/auth.service.ts
// ─── AUTH SERVICE ─────────────────────────────────────────────────────────────
// All session management now delegates to Supabase Auth.
// Supabase handles token storage, refresh, and expiry automatically via cookies.
// The localStorage SESSION_KEY pattern has been removed entirely.

import { createBrowserClient } from '@/lib/supabase/client'
import { LoginPayload, RegisterPayload, User, UserRole } from '@/types'
import { DASHBOARD_ROUTES } from '@/constants/roles'

// Cache for getCurrentUser to avoid redundant Supabase calls
let _cachedUser: User | null = null
let _cacheTimestamp = 0
const CACHE_TTL = 10_000 // 10 seconds

export const authService = {

  // ─── LOGIN ──────────────────────────────────────────────────────────────────
  async login(payload: LoginPayload) {
    const supabase = createBrowserClient()

    const { data, error } = await supabase.auth.signInWithPassword({
      email: payload.email,
      password: payload.password,
    })

    if (error || !data.user) {
      return { data: null, error: error?.message ?? 'Login failed', success: false }
    }

    // Fetch profile row (role, name, avatar_url)
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, email, name, role, avatar_url, created_at')
      .eq('id', data.user.id)
      .single()

    if (profileError || !profile) {
      return { data: null, error: 'Profile not found', success: false }
    }

    // Update cache
    _cachedUser = profile as User
    _cacheTimestamp = Date.now()

    return {
      data: {
        user: profile as User,
        access_token: data.session.access_token,
        expires_at: data.session.expires_at
          ? new Date(data.session.expires_at * 1000).toISOString()
          : '',
      },
      error: null,
      success: true,
    }
  },

  // ─── REGISTER ───────────────────────────────────────────────────────────────
  async register(payload: RegisterPayload) {
    const supabase = createBrowserClient()

    const { data, error } = await supabase.auth.signUp({
      email: payload.email,
      password: payload.password,
      options: {
        // Passed to raw_user_meta_data — fn_handle_new_user trigger reads these
        // to auto-create the profiles row on first sign-up.
        data: {
          name: payload.name,
          role: payload.role ?? 'PARTICIPANT',
        },
      },
    })

    if (error || !data.user) {
      return { data: null, error: error?.message ?? 'Registration failed', success: false }
    }

    // Profile is auto-created by the DB trigger (fn_handle_new_user).
    // Fetch it so we can return a full session object immediately.
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, email, name, role, avatar_url, created_at')
      .eq('id', data.user.id)
      .single()

    // Update cache
    _cachedUser = profile as User
    _cacheTimestamp = Date.now()

    return {
      data: {
        user: profile as User,
        access_token: data.session?.access_token ?? '',
        expires_at: data.session?.expires_at
          ? new Date(data.session.expires_at * 1000).toISOString()
          : '',
      },
      error: null,
      success: true,
    }
  },

  // ─── GET CURRENT USER ────────────────────────────────────────────────────────
  // Use this anywhere in client components to get the logged-in user + profile.
  // Cached for 10 seconds to prevent redundant API calls across layout + pages.
  async getCurrentUser(): Promise<User | null> {
    // Return cached result if fresh
    if (_cachedUser && (Date.now() - _cacheTimestamp) < CACHE_TTL) {
      return _cachedUser
    }

    const supabase = createBrowserClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      _cachedUser = null
      _cacheTimestamp = Date.now()
      return null
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('id, email, name, role, avatar_url, created_at')
      .eq('id', user.id)
      .single()

    _cachedUser = profile as User ?? null
    _cacheTimestamp = Date.now()
    return _cachedUser
  },

  // ─── LOGOUT ─────────────────────────────────────────────────────────────────
  async logout() {
    _cachedUser = null
    _cacheTimestamp = 0
    const supabase = createBrowserClient()
    await supabase.auth.signOut()
    window.location.href = '/login'
  },

  // ─── DASHBOARD ROUTE ────────────────────────────────────────────────────────
  getDashboardRoute(role: UserRole): string {
    return DASHBOARD_ROUTES[role] ?? '/participant'
  },
}