'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

const STORE_ID = '48246409'
const API_BASE = 'https://stores-api.zakaz.ua'

interface CartProduct {
  ean: string
  quantity: number
}

type Status = 'waiting' | 'logging-in' | 'filling' | 'done' | 'error'

function BridgePage() {
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<Status>('waiting')
  const [message, setMessage] = useState('Очікування...')
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    // Listen for cart data from parent window
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

    // Also check if products were passed via URL (fallback)
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
      // Step 1: Check if we have an active session
      setStatus('logging-in')
      setMessage('Перевірка сесії Auchan...')

      const sessionCheck = await fetch(`${API_BASE}/user/login`, {
        credentials: 'include',
        headers: {
          'x-chain': 'auchan',
          'x-version': '65',
          'Accept': 'application/json',
        },
      })

      if (!sessionCheck.ok) {
        setStatus('error')
        setMessage('Ви не авторизовані в Auchan. Увійдіть на auchan.zakaz.ua та спробуйте знову.')
        sendResult({ success: false, error: 'Not logged in to Auchan' })
        return
      }

      // Step 2: Fill the cart
      setStatus('filling')
      setMessage(`Додаємо ${products.length} товарів...`)

// Get user's saved delivery address
      const presetsRes = await fetch(`${API_BASE}/user/delivery_presets/`, {
        credentials: 'include',
        headers: { 'x-chain': 'auchan', 'x-version': '65', 'Accept': 'application/json' },
      })
      const presetsData = await presetsRes.json()
      console.log('Presets response status:', presetsRes.status)
      console.log('Presets data:', JSON.stringify(presetsData).substring(0, 500))
      console.log('Presets keys:', Object.keys(presetsData))
      const preset = Array.isArray(presetsData) ? presetsData[0] : presetsData?.results?.[0]
      const addressId = preset?.address?.plan?.id || ''
      const coords = preset?.address?.plan?.coords || { lat: 0, lng: 0 }
      console.log('Address ID:', addressId)
      console.log('Coords:', JSON.stringify(coords))
      console.log('Full preset:', JSON.stringify(preset))

// Find correct Auchan store for user's location
      const storesRes = await fetch(
        `${API_BASE}/stores/?lat=${coords.lat}&lng=${coords.lng}&delivery_type=plan&retail_chain=auchan`,
        { credentials: 'include', headers: { 'x-chain': 'auchan', 'x-version': '65', 'Accept': 'application/json' } }
      )
      const storesData = await storesRes.json()
      const storeId = storesData?.results?.[0]?.id || STORE_ID

      console.log('Sending products:', JSON.stringify(products))
      const res = await fetch(`${API_BASE}/cart/items/`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'x-chain': 'auchan',
          'x-version': '65',
          'Origin': 'https://auchan.zakaz.ua',
          'Referer': 'https://auchan.zakaz.ua/',
        },
        body: JSON.stringify({
          items: products.map(p => ({
            ean: p.ean,
            amount: p.quantity,
            operation: 'add',
          })),
        }),
      })

const responseText = await res.text()
console.log('Cart response:', res.status, responseText)

const added = products.length
setProgress(100)
setMessage(`Перевірка...`)

      setStatus('done')
      setMessage(`✅ ${added} товарів додано до кошика!`)
      sendResult({ success: true, added })

      // Redirect to Auchan cart after 2 seconds
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
    waiting: '⏳',
    'logging-in': '🔐',
    filling: '🛒',
    done: '🎉',
    error: '⚠️',
  }

  const colors: Record<Status, string> = {
    waiting: 'text-stone-500',
    'logging-in': 'text-blue-600',
    filling: 'text-brand-600',
    done: 'text-green-600',
    error: 'text-red-600',
  }

  return (
    <div className="min-h-screen bg-amber-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-3xl shadow-lg p-8 w-full max-w-sm text-center space-y-6">
        {/* Logo */}
        <div className="font-display text-xl font-bold text-stone-800">BalanceBite × Auchan</div>

        {/* Status icon */}
        <div className="text-5xl">
          {status === 'filling' ? (
            <span className="inline-block animate-bounce">{icons[status]}</span>
          ) : (
            icons[status]
          )}
        </div>

        {/* Message */}
        <p className={`font-medium ${colors[status]}`}>{message}</p>

        {/* Progress bar */}
        {status === 'filling' && (
          <div className="w-full bg-stone-100 rounded-full h-2">
            <div
              className="bg-brand-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}

        {/* Instructions when not logged in */}
        {status === 'error' && message.includes('авторизовані') && (
          <div className="text-left bg-amber-50 rounded-2xl p-4 text-sm text-stone-600 space-y-2">
            <p className="font-semibold">Що робити:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Відкрийте <a href="https://auchan.zakaz.ua" target="_blank" rel="noreferrer" className="text-brand-600 underline">auchan.zakaz.ua</a></li>
              <li>Увійдіть у свій акаунт</li>
              <li>Поверніться і натисніть кнопку знову</li>
            </ol>
          </div>
        )}

  {status === 'done' && (
    <a
      href="https://auchan.zakaz.ua/uk/"
      target="_blank"
      rel="noreferrer"
      className="btn-primary w-full justify-center text-sm"
    >
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
