// ─── SUPABASE SERVER CLIENT ───────────────────────────────────────────────────
// Used in API Routes and Server Components

// ─── MOCK CLIENT (active until Supabase is connected) ────────────────────────
export const createServerClient = () => {
  return {
    auth: {
      getUser: async () => ({ data: { user: null }, error: null }),
      getSession: async () => ({ data: { session: null }, error: null }),
      admin: {
        createUser: async (payload: any) => ({ data: null, error: null }),
        deleteUser: async (id: string) => ({ data: null, error: null }),
      },
    },
    from: (table: string) => ({
      select: (cols = '*') => ({
        eq: (col: string, val: any) => ({
          single: async () => ({ data: null, error: null }),
          data: [],
          error: null,
        }),
        data: [],
        error: null,
      }),
      insert: (payload: any) => ({
        select: () => ({
          single: async () => ({ data: null, error: null }),
        }),
      }),
      update: (payload: any) => ({
        eq: (col: string, val: any) => ({
          select: () => ({
            single: async () => ({ data: null, error: null }),
          }),
        }),
      }),
      delete: () => ({
        eq: (col: string, val: any) => ({ data: null, error: null }),
      }),
    }),
  }
}

// ─── REAL IMPLEMENTATION (uncomment when Supabase is ready) ──────────────────
/*
import { createServerClient as _createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export const createServerClient = () => {
  const cookieStore = cookies()
  return _createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )
}
*/