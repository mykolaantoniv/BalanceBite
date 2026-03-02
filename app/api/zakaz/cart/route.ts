import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { addToCart } from '@/lib/zakaz'
import { getZakazSession } from '@/lib/sessionStore'
import type { CartItem } from '@/types'

// POST /api/zakaz/cart
// Body: { items: CartItem[] }
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = (session.user as { id?: string }).id || session.user.email!
  const zakazSession = getZakazSession(userId)

  if (!zakazSession) {
    return NextResponse.json(
      { error: 'Auchan not connected. Please connect your account first.' },
      { status: 403 }
    )
  }

  const body = await req.json()
  const items: CartItem[] = body.items

  if (!items || !Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: 'No items provided' }, { status: 400 })
  }

  const result = await addToCart(items, zakazSession.token)
  console.log('[cart route] addToCart result:', JSON.stringify(result))

  if (!result.success) {
    // If token expired, clear it so user knows to reconnect
    if (result.error?.includes('401') || result.error?.includes('403')) {
      const { deleteZakazSession } = await import('@/lib/sessionStore')
      deleteZakazSession(userId)
      return NextResponse.json(
        { error: 'Auchan session expired. Please reconnect your account.' },
        { status: 403 }
      )
    }
    return NextResponse.json({ error: result.error }, { status: 500 })
  }

  return NextResponse.json({
    success: true,
    itemCount: items.length,
    redirectUrl: 'https://auchan.zakaz.ua/uk/cart/',
  })
}