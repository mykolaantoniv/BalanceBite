import type { ZakazProduct, ZakazSearchResult, CartItem } from '@/types'

const STORE_ID = process.env.AUCHAN_STORE_ID || '48246401'
const API_BASE = process.env.ZAKAZ_API_BASE || 'https://stores-api.zakaz.ua'

// ─── Product Search (no auth required) ───────────────────────────────────────

export async function searchProducts(
  query: string,
  page = 1,
  perPage = 10
): Promise<ZakazSearchResult> {
  const url = new URL(`${API_BASE}/stores/${STORE_ID}/products/search/`)
  url.searchParams.set('q', query)
  url.searchParams.set('page', String(page))
  url.searchParams.set('per_page', String(perPage))
  url.searchParams.set('lang', 'uk')

  const res = await fetch(url.toString(), {
    headers: {
      'Accept': 'application/json',
      'Accept-Language': 'uk',
      'User-Agent': 'Mozilla/5.0 (compatible; MealPlanner/1.0)',
    },
    next: { revalidate: 300 },
  })

  if (!res.ok) {
    throw new Error(`Zakaz search failed: ${res.status}`)
  }

  const data = await res.json()
  return {
    results: (data.results || []).map(normalizeProduct),
    count: data.count || 0,
  }
}

// ─── Add items to cart (auth required) ───────────────────────────────────────

export async function addToCart(
  items: CartItem[],
  sessionToken: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Build cookie header with correct cookie name
    const cookieHeader = sessionToken.startsWith('cookie:')
      ? sessionToken.slice(7)
      : `__Host-zakaz-sid=${sessionToken}`

    const payload = {
      items: items.map(item => ({
        ean: item.product.ean,
        amount: item.quantity,
        operation: 'add',
      })),
    }


    const res = await fetch(`${API_BASE}/cart/items/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'x-chain': 'auchan',
        'x-version': '65',
        'Origin': 'https://auchan.zakaz.ua',
        'Referer': 'https://auchan.zakaz.ua/',
        'Cookie': cookieHeader,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      body: JSON.stringify(payload),
    })

    const text = await res.text()

    if (!res.ok) {
      let errMsg = `HTTP ${res.status}`
      try {
        const err = JSON.parse(text)
        errMsg = err?.errors?.[0]?.description || err?.detail || errMsg
      } catch { /* not json */ }
      return { success: false, error: errMsg }
    }

    return { success: true }
  } catch (e: unknown) {
    return { success: false, error: e instanceof Error ? e.message : 'Unknown error' }
  }
}

export async function loginToZakaz(
  phone: string,
  password: string
): Promise<{ token: string } | { error: string }> {
  const BASE = 'https://stores-api.zakaz.ua'
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'x-chain': 'auchan',
    'x-version': '65',
    'Origin': 'https://auchan.zakaz.ua',
    'Referer': 'https://auchan.zakaz.ua/',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  }

  // Normalize: strip +, spaces → 380XXXXXXXXX
  const normalizedPhone = phone.replace(/\D/g, '').replace(/^0/, '380')

  const endpoints = [
    { url: `${BASE}/user/login`, body: { phone: normalizedPhone, password } },
    { url: `${BASE}/user/login`, body: { login: normalizedPhone, password } },
  ]

  const errors: string[] = []

  for (const endpoint of endpoints) {
    try {
      const res = await fetch(endpoint.url, {
        method: 'POST',
        headers,
        body: JSON.stringify(endpoint.body),
      })

      const text = await res.text()
      let data: Record<string, unknown> = {}
      try { data = JSON.parse(text) } catch { /* not json */ }


      if (!res.ok) {
        errors.push(`HTTP ${res.status}`)
        continue
      }

      // Token field
      const token = (data?.token || data?.access_token || data?.sessionid || data?.key) as string | undefined
      if (token) return { token }

      // Cookie-based session
      const setCookie = res.headers.get('set-cookie')

      if (setCookie) {
        const sidMatch = setCookie.match(/(?:__Host-)?zakaz[_-]?sid=([^;,\s]+)/i)
        if (sidMatch?.[1]) {
          return { token: sidMatch[1] }
        }
        return { token: `cookie:${setCookie}` }
      }

      // user_id returned but no cookie — session must come from cookies
      if (data?.user_id) {
        errors.push(`Login OK (user_id=${data.user_id}) but no session cookie in response`)
        continue
      }

      errors.push(`ok but no token/cookie: ${text.slice(0, 100)}`)
    } catch (e) {
      errors.push(String(e))
    }
  }

  return { error: `Помилка входу: ${errors.join(' | ')}` }
}

// ─── Normalize product from API response ─────────────────────────────────────

function normalizeProduct(raw: Record<string, unknown>): ZakazProduct {
  const img = raw.img as Record<string, string> | null
  const producer = raw.producer as Record<string, unknown> | null

  return {
    ean:      String(raw.ean || ''),
    title:    String(raw.title || ''),
    img:      img?.s350x350 || img?.s200x200 || img?.s150x150 || '',
    price:    Number(raw.price || 0),
    weight:   String(raw.weight || ''),
    producer: producer?.trademark ? String(producer.trademark) : undefined,
    in_stock: raw.in_stock !== false,
    discount: raw.discount ? Number((raw.discount as Record<string, unknown>)?.value || 0) : undefined,
  }
}