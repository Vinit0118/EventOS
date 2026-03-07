// ─── SUPABASE BROWSER CLIENT ─────────────────────────────────────────────────
// This file is ready. Once you have your Supabase project:
// 1. Run: npm install @supabase/supabase-js @supabase/ssr
// 2. Add to .env.local:
//    NEXT_PUBLIC_SUPABASE_URL=your_url
//    NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
// 3. Uncomment the real implementation below

// ─── MOCK CLIENT (active until Supabase is connected) ────────────────────────
export const createBrowserClient = () => {
  return {
    auth: {
      signInWithPassword: async ({ email, password }: { email: string; password: string }) => {
        // Mock - replace with real Supabase call
        return { data: null, error: { message: 'Supabase not connected yet' } }
      },
      signUp: async ({ email, password, options }: any) => {
        return { data: null, error: { message: 'Supabase not connected yet' } }
      },
      signOut: async () => ({ error: null }),
      getUser: async () => ({ data: { user: null }, error: null }),
      getSession: async () => ({ data: { session: null }, error: null }),
    },
    from: (table: string) => ({
      select: () => ({ data: [], error: null }),
      insert: () => ({ data: null, error: null }),
      update: () => ({ data: null, error: null }),
      delete: () => ({ data: null, error: null }),
    }),
  }
}

// ─── REAL IMPLEMENTATION (uncomment when Supabase is ready) ──────────────────
/*
import { createBrowserClient as _createBrowserClient } from '@supabase/ssr'

export const createBrowserClient = () =>
  _createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
*/