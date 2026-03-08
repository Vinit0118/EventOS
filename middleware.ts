// Path: middleware.ts  (project root, next to app/)
// ─── SUPABASE AUTH MIDDLEWARE ─────────────────────────────────────────────────
// Refreshes the Supabase Auth session on every request so cookies stay fresh.
// Without this, the session expires and server components get a null user.
//
// Also protects dashboard routes: redirects unauthenticated users to /login.

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(req: NextRequest) {
    const { pathname } = req.nextUrl

    // Skip middleware entirely for API routes — they handle their own auth
    if (pathname.startsWith('/api')) {
        return NextResponse.next()
    }

    let res = NextResponse.next({ request: req })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return req.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) => req.cookies.set(name, value))
                    res = NextResponse.next({ request: req })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        res.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    // Refresh session — must be called before any route protection checks
    const { data: { user } } = await supabase.auth.getUser()

    // ── Route protection ───────────────────────────────────────────────────────
    const isProtected =
        pathname.startsWith('/organizer') ||
        pathname.startsWith('/participant')

    const isAuthPage =
        pathname.startsWith('/login') ||
        pathname.startsWith('/register')

    // Unauthenticated user trying to access a protected page → redirect to login
    if (isProtected && !user) {
        return NextResponse.redirect(new URL('/login', req.url))
    }

    // Already logged-in user visiting login/register → redirect to dashboard
    if (isAuthPage && user) {
        // We don't have role here without a DB call, so redirect to a neutral
        // route that will further redirect based on role
        return NextResponse.redirect(new URL('/', req.url))
    }

    return res
}

export const config = {
    matcher: [
        // Only run on pages that need auth checks — skip static files, API routes, and auth callbacks
        '/((?!_next/static|_next/image|favicon.ico|api).*)',
    ],
}