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
    // Build cookie header — token may be raw token or full cookie string
    const cookieHeader = sessionToken.startsWith('cookie:')
      ? sessionToken.slice(7)
      : `zakaz_sid=${sessionToken}; __Host-zakaz-sid=${sessionToken}`

    const payload = {
      items: items.map(item => ({
        ean: item.product.ean,
        amount: item.quantity,
        operation: 'add',
      })),
    }

    console.log('[addToCart] sending', items.length, 'items to /cart/items/')
    console.log('[addToCart] cookie:', cookieHeader.slice(0, 80))

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
    console.log('[addToCart] response', res.status, text.slice(0, 300))

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

// ─── Login to Zakaz.ua (captures session token) ───────────────────────────────

export async function loginToZakaz(
  phone: string,
  password: string
): Promise<{ token: string } | { error: string }> {
  const res = await fetch(`https://stores-api.zakaz.ua/user/esputnik/auth`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'x-chain': 'auchan',
      'x-version': '65',
      'Origin': 'https://auchan.zakaz.ua',
    },
    body: JSON.stringify({ login: phone, password }),
  })

  if (!res.ok) {
    return { error: 'Невірний номер телефону або пароль' }
  }

  const data = await res.json()
  const token = data?.token
  if (!token) {
    return { error: 'No token in response' }
  }

  return { token }
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