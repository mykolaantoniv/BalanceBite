import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url')
  if (!url || !url.startsWith('https://img')) {
    return new NextResponse('Invalid URL', { status: 400 })
  }

  try {
    const res = await fetch(url, {
      headers: {
        'Referer': 'https://auchan.zakaz.ua/',
        'User-Agent': 'Mozilla/5.0 (compatible)',
      },
    })

    if (!res.ok) return new NextResponse('Image not found', { status: 404 })

    const blob = await res.arrayBuffer()
    return new NextResponse(blob, {
      headers: {
        'Content-Type': res.headers.get('content-type') || 'image/jpeg',
        'Cache-Control': 'public, max-age=86400',
      },
    })
  } catch {
    return new NextResponse('Failed to fetch image', { status: 500 })
  }
}
