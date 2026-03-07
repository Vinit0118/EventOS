import { Notification, ApiResponse } from '@/types'

const BASE = '/api/notifications'

export const notificationsService = {
  /**
   * Get all notifications for the current user
   */
  async getMyNotifications(userId: string): Promise<ApiResponse<Notification[]>> {
    const res = await fetch(`${BASE}?user_id=${userId}`)
    return res.json()
  },

  /**
   * Mark a notification as read
   */
  async markRead(id: string): Promise<ApiResponse<null>> {
    const res = await fetch(`${BASE}/${id}/read`, { method: 'POST' })
    return res.json()
  },

  /**
   * Mark all notifications as read
   */
  async markAllRead(userId: string): Promise<ApiResponse<null>> {
    const res = await fetch(`${BASE}/read-all`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId }),
    })
    return res.json()
  },

  /**
   * Get unread count
   */
  async getUnreadCount(userId: string): Promise<number> {
    const res = await fetch(`${BASE}/unread-count?user_id=${userId}`)
    const data = await res.json()
    return data.count ?? 0
  },

  /**
   * Admin: Send announcement to all event participants
   */
  async sendAnnouncement(eventId: string, title: string, message: string): Promise<ApiResponse<null>> {
    const res = await fetch(`${BASE}/announce`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event_id: eventId, title, message }),
    })
    return res.json()
  },
}