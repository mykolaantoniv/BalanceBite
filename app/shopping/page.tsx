'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { AppNav, StepBar } from '@/components/layout/AppNav'
import { useShoppingStore, useCartStore } from '@/store'
import { formatPrice, CATEGORY_ICONS } from '@/lib/utils'
import type { ZakazProduct } from '@/types'

type SearchState = 'idle' | 'loading' | 'done' | 'error'

export default function ShoppingPage() {
  const router = useRouter()
  const { items, updateItem, setMatchedProduct, toggleItem } = useShoppingStore()
  const { buildCart } = useCartStore()

  const [searching, setSearching] = useState<Record<string, SearchState>>({})
  const [searchResults, setSearchResults] = useState<Record<string, ZakazProduct[]>>({})
  const [expandedItem, setExpandedItem] = useState<string | null>(null)

  const searchProduct = useCallback(async (itemId: string, query: string) => {
    setSearching((s) => ({ ...s, [itemId]: 'loading' }))
    try {
      const res = await fetch(`/api/zakaz/search?q=${encodeURIComponent(query)}`)
      const data = await res.json()
      setSearchResults((s) => ({ ...s, [itemId]: data.results || [] }))
      setSearching((s) => ({ ...s, [itemId]: 'done' }))
      // Auto-select first result
      if (data.results?.[0]) {
        setMatchedProduct(itemId, data.results[0])
      }
    } catch {
      setSearching((s) => ({ ...s, [itemId]: 'error' }))
    }
  }, [setMatchedProduct])

  async function searchAll() {
    for (const item of items) {
      if (!item.matchedProduct) {
        await searchProduct(item.id, item.ingredientName)
        await new Promise((r) => setTimeout(r, 200)) // rate limit
      }
    }
  }

  function handleContinue() {
    buildCart(items)
    router.push('/cart')
  }

  // Group items by category
  const grouped = items.reduce<Record<string, typeof items>>((acc, item) => {
    const cat = item.category || 'other'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(item)
    return acc
  }, {})

  const matchedCount = items.filter((i) => i.matchedProduct).length
  const checkedCount = items.filter((i) => i.checked).length

  return (
    <>
      <AppNav />
      <main className="max-w-3xl mx-auto px-4 py-8">
        <StepBar current={2} />

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="section-title">Список покупок</h1>
            <p className="text-stone-500 mt-1">
              {matchedCount}/{items.length} товарів знайдено в Auchan
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={searchAll}
              className="btn-secondary text-sm"
            >
              🔍 Знайти всі
            </button>
            <button
              onClick={handleContinue}
              disabled={matchedCount === 0}
              className="btn-primary text-sm"
            >
              До кошика →
            </button>
          </div>
        </div>

        {items.length === 0 ? (
          <div className="card p-12 text-center text-stone-400">
            <div className="text-4xl mb-3">📝</div>
            <p>Список порожній. Поверніться до меню та оберіть рецепти.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(grouped).map(([category, catItems]) => (
              <div key={category}>
                <h2 className="text-sm font-semibold text-stone-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                  {CATEGORY_ICONS[category] || '🛒'} {category}
                </h2>
                <div className="space-y-2">
                  {catItems.map((item) => (
                    <div
                      key={item.id}
                      className={`card p-4 transition-all ${item.checked ? 'opacity-40' : ''}`}
                    >
                      <div className="flex items-start gap-3">
                        {/* Checkbox */}
                        <button
                          onClick={() => toggleItem(item.id)}
                          className={`mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center
                            flex-shrink-0 transition-colors
                            ${item.checked
                              ? 'bg-brand-500 border-brand-500 text-white'
                              : 'border-stone-300 hover:border-brand-400'
                            }`}
                        >
                          {item.checked && <span className="text-xs">✓</span>}
                        </button>

                        {/* Item info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-medium text-stone-800">
                              {item.ingredientName}
                            </span>
                            <span className="text-sm text-stone-400 flex-shrink-0">
                              {item.quantity} {item.unit}
                            </span>
                          </div>

                          {item.fromRecipes.length > 0 && (
                            <p className="text-xs text-stone-400 mt-0.5">
                              {item.fromRecipes.slice(0, 2).join(', ')}
                              {item.fromRecipes.length > 2 && ` +${item.fromRecipes.length - 2}`}
                            </p>
                          )}

                          {/* Matched product */}
                          {item.matchedProduct ? (
                            <div
                              className="mt-2 flex items-center gap-2 cursor-pointer group"
                              onClick={() => setExpandedItem(expandedItem === item.id ? null : item.id)}
                            >
                              {item.matchedProduct.img && (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={item.matchedProduct.img} referrerPolicy="no-referrer"
                                  alt={item.matchedProduct.title}
                                  className="w-10 h-10 object-contain rounded-lg bg-stone-50"
                                />
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="text-sm text-stone-600 truncate group-hover:text-brand-600">
                                  {item.matchedProduct.title}
                                </p>
                                <p className="text-sm font-semibold text-brand-600">
                                  {formatPrice(item.matchedProduct.price)}
                                </p>
                              </div>
                              <span className="text-xs text-stone-400 group-hover:text-brand-500">
                                {expandedItem === item.id ? '▲ сховати' : '▼ варіанти'}
                              </span>
                            </div>
                          ) : (
                            <button
                              onClick={() => searchProduct(item.id, item.ingredientName)}
                              disabled={searching[item.id] === 'loading'}
                              className="mt-2 text-xs text-brand-600 hover:text-brand-700 font-medium"
                            >
                              {searching[item.id] === 'loading' ? '⏳ Пошук...' : '🔍 Знайти в Auchan'}
                            </button>
                          )}

                          {/* Expanded product alternatives */}
                          {expandedItem === item.id && searchResults[item.id] && (
                            <div className="mt-3 space-y-2">
                              <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider">
                                Варіанти ({searchResults[item.id].length})
                              </p>
                              {searchResults[item.id].map((product) => (
                                <button
                                  key={product.ean}
                                  onClick={() => {
                                    setMatchedProduct(item.id, product)
                                    setExpandedItem(null)
                                  }}
                                  className={`w-full flex items-center gap-3 p-2 rounded-xl border transition-colors text-left
                                    ${item.selectedProductId === product.ean
                                      ? 'border-brand-300 bg-brand-50'
                                      : 'border-stone-100 hover:border-stone-200 hover:bg-stone-50'
                                    }`}
                                >
                                  {product.img && (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                      src={product.img} referrerPolicy="no-referrer"
                                      alt={product.title}
                                      className="w-10 h-10 object-contain rounded-lg bg-stone-50 flex-shrink-0"
                                    />
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm text-stone-700 truncate">{product.title}</p>
                                    {product.producer && (
                                      <p className="text-xs text-stone-400">{product.producer}</p>
                                    )}
                                    <p className="text-sm font-semibold text-brand-600">{formatPrice(product.price)}</p>
                                  </div>
                                  {item.selectedProductId === product.ean && (
                                    <span className="text-brand-500 text-lg">✓</span>
                                  )}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {items.length > 0 && (
          <div className="mt-8 flex justify-between items-center">
            <p className="text-sm text-stone-400">
              {checkedCount > 0 && `${checkedCount} позицій відмічено як наявні`}
            </p>
            <button onClick={handleContinue} disabled={matchedCount === 0} className="btn-primary">
              До кошика Auchan →
            </button>
          </div>
        )}
      </main>
    </>
  )
}
