import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { loginToZakaz } from '@/lib/zakaz'
import { setZakazSession, deleteZakazSession, hasZakazSession } from '@/lib/sessionStore'

// POST /api/zakaz/connect  — log in to zakaz.ua and store token
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { email, password } = await req.json()
  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password required' }, { status: 400 })
  }

  const userId = (session.user as { id?: string }).id || session.user.email!
  const result = await loginToZakaz(email, password)

  if ('error' in result) {
    return NextResponse.json({ error: result.error }, { status: 401 })
  }

  setZakazSession(userId, result.token)
  return NextResponse.json({ success: true })
}

// GET /api/zakaz/connect — check if user has active zakaz session
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = (session.user as { id?: string }).id || session.user.email!
  const connected = hasZakazSession(userId)
  return NextResponse.json({ connected })
}

// DELETE /api/zakaz/connect — disconnect zakaz.ua account
export async function DELETE() {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = (session.user as { id?: string }).id || session.user.email!
  deleteZakazSession(userId)
  return NextResponse.json({ success: true })
}
