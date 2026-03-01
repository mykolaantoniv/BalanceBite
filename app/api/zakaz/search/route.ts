import { NextRequest, NextResponse } from 'next/server'
import { searchProducts } from '@/lib/zakaz'

// GET /api/zakaz/search?q=молоко&page=1
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q')
  const page = Number(searchParams.get('page') || 1)

  if (!q || q.trim().length < 2) {
    return NextResponse.json({ error: 'Query too short' }, { status: 400 })
  }

  try {
    const results = await searchProducts(q.trim(), page, 8)
    return NextResponse.json(results)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Search failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
