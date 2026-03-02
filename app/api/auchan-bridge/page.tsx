'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

interface CartProduct {
  ean: string
  quantity: number
}

type Status = 'waiting' | 'logging-in' | 'filling' | 'done' | 'error'

// All zakaz API calls go through our Next.js proxy to avoid CORS
async function zakazProxy(path: string, method = 'GET', body?: unknown, zakazCookie?: string) {
  const res = await fetch('/api/zakaz/proxy', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      path,
      method,
      body,
      headers: zakazCookie ? { Cookie: zakazCookie } : {},
    }),
  })
  return res.json()
}

function BridgePage() {
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<Status>('waiting')
  const [message, setMessage] = useState('Очікування...')
  const [progress, setProgress] = useState(0)
  const [zakazCookie, setZakazCookie] = useState<string>('')

  useEffect(() => {
    // Get stored zakaz cookie from localStorage (set when user logs into auchan.zakaz.ua)
    const stored = localStorage.getItem('zakaz_session')
    if (stored) setZakazCookie(stored)

    function handleMessage(event: MessageEvent) {
      if (event.data?.type !== 'FILL_CART') return
      const products: CartProduct[] = event.data.products
      if (!products?.length) {
        setStatus('error')
        setMessage('Немає товарів для додавання')
        sendResult({ success: false, error: 'No products' })
        return
      }
      fillCart(products)
    }

    window.addEventListener('message', handleMessage)

    const encoded = searchParams.get('products')
    if (encoded) {
      try {
        const products = JSON.parse(decodeURIComponent(encoded))
        fillCart(products)
      } catch {
        setStatus('error')
        setMessage('Помилка читання товарів')
      }
    }

    return () => window.removeEventListener('message', handleMessage)
  }, [searchParams]) // eslint-disable-line react-hooks/exhaustive-deps

  async function fillCart(products: CartProduct[]) {
    try {
      setStatus('logging-in')
      setMessage('Перевірка сесії Auchan...')

      // Check session via proxy
      const sessionRes = await zakazProxy('/user/login', 'GET', undefined, zakazCookie)

      if (!sessionRes.ok) {
        setStatus('error')
        setMessage('Ви не авторизовані в Auchan. Увійдіть на auchan.zakaz.ua та спробуйте знову.')
        sendResult({ success: false, error: 'Not logged in to Auchan' })
        return
      }

      setStatus('filling')
      setMessage(`Додаємо ${products.length} товарів...`)
      setProgress(20)

      // Get delivery presets via proxy
      const presetsRes = await zakazProxy('/user/delivery_presets/', 'GET', undefined, zakazCookie)
      const presetsData = presetsRes.data
      const preset = Array.isArray(presetsData) ? presetsData[0] : presetsData?.results?.[0]
      const coords = preset?.address?.plan?.coords || { lat: 0, lng: 0 }

      setProgress(40)

      // Get store ID via proxy
      const storesRes = await zakazProxy(
        `/stores/?lat=${coords.lat}&lng=${coords.lng}&delivery_type=plan&retail_chain=auchan`,
        'GET', undefined, zakazCookie
      )
      const storeId = storesRes.data?.results?.[0]?.id || process.env.NEXT_PUBLIC_AUCHAN_STORE_ID || '48246401'

      setProgress(60)

      // Add items to cart via proxy
      const cartRes = await zakazProxy('/cart/items/', 'POST', {
        items: products.map(p => ({
          ean: p.ean,
          amount: p.quantity,
          operation: 'add',
        })),
      }, zakazCookie)

      setProgress(100)

      if (!cartRes.ok && cartRes.status >= 400) {
        setStatus('error')
        setMessage('Помилка додавання товарів. Перевірте авторизацію в Auchan.')
        sendResult({ success: false, error: 'Cart error' })
        return
      }

      setStatus('done')
      setMessage(`✅ ${products.length} товарів додано до кошика!`)
      sendResult({ success: true, added: products.length })

      setTimeout(() => {
        window.open('https://auchan.zakaz.ua/uk/', '_blank')
        window.close()
      }, 2000)

    } catch (e) {
      setStatus('error')
      setMessage(`Помилка: ${e instanceof Error ? e.message : 'Unknown error'}`)
      sendResult({ success: false, error: String(e) })
    }
  }

  function sendResult(result: { success: boolean; added?: number; error?: string }) {
    if (window.opener) {
      window.opener.postMessage({ type: 'CART_RESULT', ...result }, '*')
    }
  }

  const icons: Record<Status, string> = {
    waiting: '⏳', 'logging-in': '🔐', filling: '🛒', done: '🎉', error: '⚠️',
  }
  const colors: Record<Status, string> = {
    waiting: 'text-stone-500', 'logging-in': 'text-blue-600',
    filling: 'text-brand-600', done: 'text-green-600', error: 'text-red-600',
  }

  return (
    <div className="min-h-screen bg-amber-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-3xl shadow-lg p-8 w-full max-w-sm text-center space-y-6">
        <div className="font-display text-xl font-bold text-stone-800">BalanceBite × Auchan</div>

        <div className="text-5xl">
          {status === 'filling'
            ? <span className="inline-block animate-bounce">{icons[status]}</span>
            : icons[status]}
        </div>

        <p className={`font-medium ${colors[status]}`}>{message}</p>

        {status === 'filling' && (
          <div className="w-full bg-stone-100 rounded-full h-2">
            <div className="bg-brand-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }} />
          </div>
        )}

        {status === 'error' && message.includes('авторизовані') && (
          <div className="text-left bg-amber-50 rounded-2xl p-4 text-sm text-stone-600 space-y-2">
            <p className="font-semibold">Що робити:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Відкрийте <a href="https://auchan.zakaz.ua" target="_blank" rel="noreferrer"
                className="text-brand-600 underline">auchan.zakaz.ua</a></li>
              <li>Увійдіть у свій акаунт</li>
              <li>Поверніться і натисніть кнопку знову</li>
            </ol>
          </div>
        )}

        {status === 'done' && (
          <a href="https://auchan.zakaz.ua/uk/" target="_blank" rel="noreferrer"
            className="btn-primary w-full justify-center text-sm">
            🛒 Перейти до кошика Auchan →
          </a>
        )}
      </div>
    </div>
  )
}

export default function AuchanBridgePage() {
  return (
    <Suspense>
      <BridgePage />
    </Suspense>
  )
}
