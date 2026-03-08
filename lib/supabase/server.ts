// Path: lib/supabase/server.ts
// ─── SUPABASE SERVER CLIENT ───────────────────────────────────────────────────
// Used in API Routes and Server Components.
// Reads/writes cookies so Supabase Auth session is maintained across requests.

import { createServerClient as _createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

export const createServerClient = () => {
  const cookieStore = cookies()

  return _createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Called from a Server Component — cookies are read-only.
            // Safe to ignore: middleware handles session refresh.
          }
        },
      },
    }
  )
}

// ─── SERVICE ROLE CLIENT ──────────────────────────────────────────────────────
// Bypasses RLS. Use ONLY in trusted server-side routes (e.g. sending
// notifications, admin operations). Never expose to the client.
// Cached as a singleton to avoid creating multiple connections.

let _serviceClient: ReturnType<typeof createClient> | null = null

export const createServiceClient = () => {
  if (!_serviceClient) {
    _serviceClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
  }
  return _serviceClient
}