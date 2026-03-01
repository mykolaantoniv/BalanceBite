'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { AppNav, StepBar } from '@/components/layout/AppNav'
import { useCartStore, useShoppingStore } from '@/store'
import { formatPrice } from '@/lib/utils'

function QuantityEditor({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  const [editing, setEditing] = useState(false)
  const [input, setInput] = useState(String(value))
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { setInput(String(value)) }, [value])
  useEffect(() => { if (editing) inputRef.current?.select() }, [editing])

  function commit() {
    const n = parseInt(input)
    if (!isNaN(n) && n >= 1) onChange(n)
    else setInput(String(value))
    setEditing(false)
  }

  return (
    <div className="flex items-center gap-2 flex-shrink-0">
      <button onClick={() => onChange(value - 1)}
        className="w-7 h-7 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-stone-600 font-bold transition-colors">−</button>
      {editing ? (
        <input ref={inputRef} type="number" min="1" value={input}
          onChange={e => setInput(e.target.value)}
          onBlur={commit}
          onKeyDown={e => {
            if (e.key === 'Enter') commit()
            if (e.key === 'Escape') { setInput(String(value)); setEditing(false) }
          }}
          className="w-12 text-center font-semibold text-stone-800 border border-brand-300 rounded-lg py-0.5 focus:outline-none focus:ring-2 focus:ring-brand-400" />
      ) : (
        <span onClick={() => setEditing(true)} title="Натисніть для редагування"
          className="w-8 text-center font-semibold text-stone-800 cursor-pointer hover:bg-stone-100 rounded px-1 py-0.5 transition-colors">
          {value}
        </span>
      )}
      <button onClick={() => onChange(value + 1)}
        className="w-7 h-7 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-stone-600 font-bold transition-colors">+</button>
    </div>
  )
}

export default function CartPage() {
  const router = useRouter()
  const { cartItems, updateQuantity, setQuantityDirect, removeItem, buildCart, isSubmitting, setSubmitting, lastResult, setResult } = useCartStore()
  const { items: shoppingItems } = useShoppingStore()

  useEffect(() => {
    if (cartItems.length === 0 && shoppingItems.length > 0) {
      buildCart(shoppingItems)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const total = cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0)
  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0)

  async function handleFillCart() {
    setSubmitting(true)
    setResult(null)

    const products = cartItems.map(item => ({
      ean: item.product.ean,
      quantity: item.quantity,
    }))

    const popup = window.open(
      '/auchan-bridge',
      `auchan-bridge-${Date.now()}`,
      'width=420,height=500,left=200,top=150,resizable=yes,scrollbars=no'
    )

    if (!popup) {
      setResult({ success: false, message: 'Не вдалося відкрити вікно. Дозвольте спливаючі вікна для цього сайту.' })
      setSubmitting(false)
      return
    }

    setTimeout(() => {
      try { popup.postMessage({ type: 'FILL_CART', products }, '*') } catch { /* closed */ }
    }, 1500)

    function handleResult(event: MessageEvent) {
      if (event.data?.type !== 'CART_RESULT') return
      window.removeEventListener('message', handleResult)
      setSubmitting(false)

      if (event.data.success) {
        setResult({ success: true, message: `${event.data.added} товарів додано до кошика Auchan!` })
        // Redirect to success page
        setTimeout(() => router.push('/success'), 800)
      } else if (event.data.error?.includes('Not logged in')) {
        setResult({ success: false, message: 'Спочатку увійдіть на auchan.zakaz.ua, потім спробуйте знову.' })
      } else {
        setResult({ success: false, message: 'Помилка заповнення кошика. Спробуйте ще раз.' })
      }
    }

    window.addEventListener('message', handleResult)
    setTimeout(() => { window.removeEventListener('message', handleResult); setSubmitting(false) }, 90000)
  }

  return (
    <>
      <AppNav />
      <main className="max-w-3xl mx-auto px-4 py-8">
        <StepBar current={3} />

        <div className="mb-6">
          <h1 className="section-title">Кошик Auchan</h1>
          <p className="text-stone-500 mt-1">{totalItems} упаковок на суму {formatPrice(total)}</p>
        </div>

        {lastResult && !lastResult.success && (
          <div className="p-4 rounded-2xl mb-6 flex items-center gap-3 bg-red-50 border border-red-200 text-red-800">
            <span className="text-2xl">⚠️</span>
            <p className="font-semibold">{lastResult.message}</p>
          </div>
        )}

        {cartItems.length === 0 ? (
          <div className="card p-12 text-center text-stone-400">
            <div className="text-4xl mb-3">🛒</div>
            <p>Кошик порожній. Поверніться до списку покупок.</p>
          </div>
        ) : (
          <>
            <div className="space-y-3 mb-8">
              {cartItems.map((cartItem) => (
                <div key={cartItem.product.ean} className="card p-4 flex items-center gap-4">
                  {cartItem.product.img ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={cartItem.product.img} alt={cartItem.product.title}
                      className="w-16 h-16 object-contain rounded-xl bg-stone-50 flex-shrink-0"
                      referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-stone-100 flex items-center justify-center text-2xl flex-shrink-0">🛒</div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-stone-800 truncate">{cartItem.product.title}</p>
                    {cartItem.product.producer && (
                      <p className="text-xs text-stone-400 mt-0.5">{cartItem.product.producer}</p>
                    )}
                    <p className="text-sm text-stone-500 mt-0.5">{cartItem.product.weight}г / уп</p>
                  </div>

                  <QuantityEditor
                    value={cartItem.quantity}
                    onChange={(qty) => {
                      if (qty <= 0) removeItem(cartItem.product.ean)
                      else setQuantityDirect(cartItem.product.ean, qty)
                    }}
                  />

                  <div className="text-right flex-shrink-0 w-20">
                    <p className="font-semibold text-stone-800">{formatPrice(cartItem.product.price * cartItem.quantity)}</p>
                    <p className="text-xs text-stone-400">{formatPrice(cartItem.product.price)} / уп</p>
                  </div>

                  <button onClick={() => removeItem(cartItem.product.ean)}
                    className="text-stone-300 hover:text-red-400 transition-colors ml-1 flex-shrink-0" title="Видалити">✕</button>
                </div>
              ))}
            </div>

            <div className="card p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-stone-600">Упаковок: {totalItems} шт</span>
                <span className="font-semibold text-stone-800">{formatPrice(total)}</span>
              </div>
              <div className="mb-5 text-sm text-stone-400">Доставка розраховується на сайті Auchan</div>

              <button onClick={handleFillCart} disabled={isSubmitting || cartItems.length === 0}
                className="btn-primary w-full justify-center text-base py-4">
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Заповнюємо кошик...
                  </span>
                ) : <>🛒 Заповнити кошик Auchan →</>}
              </button>

              <p className="text-xs text-stone-400 text-center mt-3">
                Відкриється невелике вікно — потрібно бути авторизованим на auchan.zakaz.ua
              </p>
            </div>
          </>
        )}
      </main>
    </>
  )
}
