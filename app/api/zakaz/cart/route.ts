import { NextRequest, NextResponse } from 'next/server'
import { addToCart } from '@/lib/zakaz'
import type { CartItem } from '@/types'

// POST /api/zakaz/cart
// Body: { items: CartItem[], token: string }
export async function POST(req: NextRequest) {
  const body = await req.json()
  const items: CartItem[] = body.items
  const token: string = body.token

  if (!token) {
    return NextResponse.json({ error: 'Auchan not connected. Please connect your account first.' }, { status: 403 })
  }

  if (!items || !Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: 'No items provided' }, { status: 400 })
  }

  const result = await addToCart(items, token)
  console.log('[cart route] addToCart result:', JSON.stringify(result))

  if (!result.success) {
    if (result.error?.includes('401') || result.error?.includes('403')) {
      return NextResponse.json({ error: 'Auchan session expired. Please reconnect your account.' }, { status: 403 })
    }
    return NextResponse.json({ error: result.error }, { status: 500 })
  }

  return NextResponse.json({
    success: true,
    itemCount: items.length,
    redirectUrl: 'https://auchan.zakaz.ua/uk/cart/',
  })
}