'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { AppNav, StepBar } from '@/components/layout/AppNav'
import { useCartStore, useShoppingStore, useZakazStore } from '@/store'
import { formatPrice } from '@/lib/utils'
import { AuchanConnectModal } from '@/components/ui/AuchanConnectModal'

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
  const { isConnected, token, setConnected, setToken } = useZakazStore()
  const [showConnectModal, setShowConnectModal] = useState(false)

  useEffect(() => {
    if (cartItems.length === 0 && shoppingItems.length > 0) {
      buildCart(shoppingItems)
    }
    // Check if already connected on mount
    fetch('/api/zakaz/connect')
      .then(r => r.json())
      .then(d => { if (d.connected) setConnected(true) })
      .catch(() => {})
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const total = cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0)
  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0)

  async function handleFillCart() {
    // If not connected, show login modal first
    if (!isConnected) {
      setShowConnectModal(true)
      return
    }
    await doFillCart()
  }

  async function doFillCart(overrideToken?: string) {
    const activeToken = overrideToken ?? token
    setSubmitting(true)
    setResult(null)

    try {
      const res = await fetch('/api/zakaz/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: cartItems, token: activeToken }),
      })

      const data = await res.json()

      if (!res.ok) {
        // Session expired — need to reconnect
        if (res.status === 403) {
          setToken(null)
          setResult({ success: false, message: 'Сесія Auchan закінчилась. Підключіть акаунт знову.' })
          setShowConnectModal(true)
        } else {
          setResult({ success: false, message: data.error || 'Помилка заповнення кошика' })
        }
        setSubmitting(false)
        return
      }

      setResult({ success: true, message: `${data.itemCount} товарів додано до кошика Auchan!` })
      setTimeout(() => {
        router.push('/success')
      }, 800)
    } catch {
      setResult({ success: false, message: 'Мережева помилка. Спробуйте ще раз.' })
    } finally {
      setSubmitting(false)
    }
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

        {/* Connection status */}
        <div className="mb-4 flex items-center gap-3">
          {isConnected ? (
            <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 px-4 py-2 rounded-xl">
              <span>✅</span> Auchan підключено
              <button onClick={() => {
                fetch('/api/zakaz/connect', { method: 'DELETE' }).then(() => setToken(null))
              }} className="ml-2 text-xs text-stone-400 hover:text-red-400 transition-colors">
                відключити
              </button>
            </div>
          ) : (
            <button onClick={() => setShowConnectModal(true)}
              className="flex items-center gap-2 text-sm text-stone-600 bg-amber-50 border border-amber-200 px-4 py-2 rounded-xl hover:bg-amber-100 transition-colors">
              <span>🔗</span> Підключити акаунт Auchan
            </button>
          )}
        </div>

        {lastResult && (
          <div className={`p-4 rounded-2xl mb-6 flex items-center gap-3 ${
            lastResult.success
              ? 'bg-green-50 border border-green-200 text-green-800'
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}>
            <span className="text-2xl">{lastResult.success ? '🎉' : '⚠️'}</span>
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
                {isConnected
                  ? 'Товари будуть додані до вашого кошика на auchan.zakaz.ua'
                  : 'Потрібно підключити акаунт Auchan'}
              </p>
            </div>
          </>
        )}
      </main>

      {showConnectModal && (
        <AuchanConnectModal
          onClose={() => setShowConnectModal(false)}
          onConnected={(t) => {
            setShowConnectModal(false)
            doFillCart(t)
          }}
        />
      )}
    </>
  )
}
