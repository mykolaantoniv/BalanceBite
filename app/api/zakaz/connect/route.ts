import { NextRequest, NextResponse } from 'next/server'
import { loginToZakaz } from '@/lib/zakaz'

// POST /api/zakaz/connect — log in to zakaz.ua, return token to client
// Token is stored client-side to avoid server session issues on Azure
export async function POST(req: NextRequest) {
  const { phone, email, password } = await req.json()
  if ((!email && !phone) || !password) {
    return NextResponse.json({ error: 'Phone and password required' }, { status: 400 })
  }

  const result = await loginToZakaz(phone || email, password)

  if ('error' in result) {
    return NextResponse.json({ error: result.error }, { status: 401 })
  }

  return NextResponse.json({ success: true, token: result.token })
}

// GET /api/zakaz/connect — no-op, connection state managed client-side
export async function GET() {
  return NextResponse.json({ connected: false })
}

// DELETE /api/zakaz/connect — no-op, client clears its own token
export async function DELETE() {
  return NextResponse.json({ success: true })
}