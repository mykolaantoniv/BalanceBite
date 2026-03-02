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
    const payload = {
      products: items.map(item => ({
        ean: item.product.ean,
        quantity: item.quantity,
      })),
    }

    const res = await fetch(`${API_BASE}/stores/${STORE_ID}/cart/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Accept-Language': 'uk',
        'x-chain': 'auchan',
        'x-version': '65',
        'Origin': 'https://auchan.zakaz.ua',
        'Referer': 'https://auchan.zakaz.ua/',
        'Cookie': sessionToken.startsWith('cookie:')
          ? sessionToken.slice(7)
          : `__Host-zakaz-sid=${sessionToken}`,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      body: JSON.stringify(payload),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      return { success: false, error: err?.detail || `HTTP ${res.status}` }
    }

    return { success: true }
  } catch (e: unknown) {
    return { success: false, error: e instanceof Error ? e.message : 'Unknown error' }
  }
}

// ─── Login to Zakaz.ua (captures session token) ───────────────────────────────

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

  const endpoints = [
    { url: `${BASE}/user/login`,           body: { phone, password } },
    { url: `${BASE}/user/login`,           body: { login: phone, password } },
    { url: `${BASE}/user/esputnik/auth`,   body: { login: phone, password } },
    { url: `${BASE}/user/esputnik/auth`,   body: { phone, password } },
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
      console.log(`[zakaz login] ${endpoint.url} → ${res.status}: ${text.slice(0, 300)}`)

      if (!res.ok) {
        errors.push(`${endpoint.url} ${res.status}`)
        continue
      }

      let data: Record<string, unknown> = {}
      try { data = JSON.parse(text) } catch { /* not json */ }

      const token = (data?.token || data?.access_token || data?.sessionid || data?.key) as string | undefined
      if (token) return { token }

      // Cookie-based session
      const setCookie = res.headers.get('set-cookie')
      if (setCookie) {
        console.log('[zakaz login] cookie-based session:', setCookie.slice(0, 100))
        return { token: `cookie:${setCookie}` }
      }

      errors.push(`${endpoint.url} ok but no token: ${text.slice(0, 100)}`)
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