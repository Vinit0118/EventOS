// Path: app/(dashboard)/participant/discover/page.tsx
'use client'
// This is a redirect — participant discover is handled on the main dashboard page
// Keeping as a dedicated route for sidebar nav
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function ParticipantDiscoverPage() {
  const router = useRouter()
  useEffect(() => { router.replace('/participant') }, [router])
  return null
}