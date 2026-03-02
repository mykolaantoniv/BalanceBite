import { NextRequest, NextResponse } from 'next/server'

const API_BASE = process.env.ZAKAZ_API_BASE || 'https://stores-api.zakaz.ua'

// This proxy forwards requests to zakaz.ua from the SERVER side,
// avoiding CORS issues that occur when the browser calls zakaz.ua directly.

export async function POST(req: NextRequest) {
  const { path, method = 'GET', body, headers: extraHeaders } = await req.json()

  const url = `${API_BASE}${path}`

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'x-chain': 'auchan',
    'x-version': '65',
    'Origin': 'https://auchan.zakaz.ua',
    'Referer': 'https://auchan.zakaz.ua/',
    ...extraHeaders,
  }

  // Forward the user's zakaz session cookie if present
  const cookieHeader = req.headers.get('x-zakaz-cookie')
  if (cookieHeader) {
    headers['Cookie'] = cookieHeader
  }

  try {
    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    })

    const text = await response.text()
    let data
    try { data = JSON.parse(text) } catch { data = text }

    // Forward set-cookie headers so the browser can store zakaz session
    const setCookie = response.headers.get('set-cookie')
    const nextRes = NextResponse.json(
      { data, status: response.status, ok: response.ok },
      { status: 200 }
    )
    if (setCookie) {
      nextRes.headers.set('x-set-cookie', setCookie)
    }
    return nextRes
  } catch (e) {
    return NextResponse.json(
      { error: String(e), status: 500, ok: false },
      { status: 200 }
    )
  }
}
