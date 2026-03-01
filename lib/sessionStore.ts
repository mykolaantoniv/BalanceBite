import type { ZakazSession } from '@/types'

// Server-side in-memory store (survives for the lifetime of the Node process)
// On Vercel: tokens live per-serverless-instance, so users may need to
// re-authenticate occasionally. This is intentional (no persistent storage).

const sessions = new Map<string, ZakazSession>()

const TTL_MS = 12 * 60 * 60 * 1000 // 12 hours

export function setZakazSession(userId: string, token: string): void {
  sessions.set(userId, {
    userId,
    token,
    expiresAt: Date.now() + TTL_MS,
  })
}

export function getZakazSession(userId: string): ZakazSession | null {
  const session = sessions.get(userId)
  if (!session) return null
  if (Date.now() > session.expiresAt) {
    sessions.delete(userId)
    return null
  }
  return session
}

export function deleteZakazSession(userId: string): void {
  sessions.delete(userId)
}

export function hasZakazSession(userId: string): boolean {
  return getZakazSession(userId) !== null
}
