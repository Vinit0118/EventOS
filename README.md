# EventOS 🚀

A complete, production-grade Event Operating System built for hackathons.

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Copy env template
cp .env.local.example .env.local

# 3. Run dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@eventos.dev | admin123 |
| Participant | participant@eventos.dev | part123 |
| Volunteer | volunteer@eventos.dev | vol123 |
| Judge | judge@eventos.dev | judge123 |

## Architecture

```
Page/Component  →  Service (services/*.ts)  →  API Route (app/api/)  →  Mock Data / Supabase
```

**UI never touches data directly. All logic lives in services.**

## Connecting Supabase (when ready)

1. Create project at supabase.com
2. Run `supabase-schema.sql` in SQL Editor
3. Fill `.env.local` with your keys
4. In `lib/supabase/client.ts` and `lib/supabase/server.ts`: uncomment real implementations, comment out mocks
5. In each `app/api/*/route.ts`: uncomment Supabase sections, comment mock sections

## Project Structure

```
app/
  (auth)/          # Login, Register
  (dashboard)/
    admin/         # Admin dashboard, events, check-in
    participant/   # Events, team management
    volunteer/     # Check-in scanner
    judge/         # Analytics view
  api/             # All API routes
services/          # Business logic (call these from components)
types/             # TypeScript interfaces
lib/
  mock-data.ts     # In-memory DB (active until Supabase)
  supabase/        # Client + Server stubs (swap to real)
constants/         # RBAC roles and permissions
```

## Features Built

- ✅ Auth (login/register with role selection)
- ✅ RBAC (Admin, Participant, Volunteer, Judge)
- ✅ Multi-event management
- ✅ Event creation with full form
- ✅ Event status state machine
- ✅ Participant registration with QR token generation
- ✅ Team creation, join by invite code
- ✅ QR check-in system
- ✅ Admin dashboard with health scores
- ✅ Volunteer check-in scanner
- ✅ Judge analytics view
- ✅ Live mock data that persists in-session
- ✅ Supabase schema ready to deploy