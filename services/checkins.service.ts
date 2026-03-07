// Path: services/checkins.service.ts
export const checkinsService = {
  async checkIn(qrToken: string, eventId: string, checkedInBy: string) {
    const res = await fetch('/api/checkins', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ qr_token: qrToken, event_id: eventId, checked_in_by: checkedInBy }),
    })
    return res.json()
  },

  async getByEvent(eventId: string) {
    const res = await fetch(`/api/checkins?event_id=${eventId}`)
    return res.json()
  },
}