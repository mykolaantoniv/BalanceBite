'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AppNav } from '@/components/layout/AppNav'
import { useCartStore, useMenuStore } from '@/store'
import { formatPrice } from '@/lib/utils'
import { RECIPES } from '@/lib/recipes'
import { MEAL_LABELS, DAYS_UK } from '@/lib/utils'

export default function SuccessPage() {
  const router = useRouter()
  const { cartItems, lastResult, clearCart } = useCartStore()
  const { menu } = useMenuStore()
  const [show, setShow] = useState(false)

  useEffect(() => {
    // Animate in
    setTimeout(() => setShow(true), 50)
  }, [])

  const total = cartItems.reduce((sum, i) => sum + i.product.price * i.quantity, 0)
  const itemCount = cartItems.reduce((sum, i) => sum + i.quantity, 0)

  // Get recipes used this week
  const usedRecipeIds = [...new Set(menu.slots.map(s => (s.recipe as {id:string})?.id).filter(Boolean))]
  const usedRecipes = usedRecipeIds.map(id => RECIPES.find(r => r.id === id)).filter(Boolean)

  // Group menu by day
  const byDay = menu.slots.reduce<Record<number, typeof menu.slots>>((acc, slot) => {
    if (!acc[slot.day]) acc[slot.day] = []
    acc[slot.day].push(slot)
    return acc
  }, {})

  return (
    <>
      <AppNav />
      <main className="max-w-2xl mx-auto px-4 py-8">

        {/* Hero success banner */}
        <div className={`card p-8 text-center mb-8 transition-all duration-500 ${show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="text-6xl mb-4">🎉</div>
          <h1 className="font-display text-2xl font-bold text-stone-800 mb-2">
            Кошик заповнено!
          </h1>
          <p className="text-stone-500 mb-1">
            {lastResult?.message || `${itemCount} товарів додано до кошика Auchan`}
          </p>
          <p className="text-sm text-stone-400">
            Орієнтовна сума: <span className="font-semibold text-stone-600">{formatPrice(total)}</span>
          </p>

          <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href="https://auchan.zakaz.ua/uk/"
              target="_blank"
              rel="noreferrer"
              className="btn-primary justify-center py-3 px-6 text-base"
            >
              🛒 Перейти до кошика Auchan →
            </a>
            <button
              onClick={() => router.push('/menu')}
              className="btn-secondary justify-center py-3 px-6 text-base"
            >
              📅 Змінити меню
            </button>
          </div>
        </div>

        {/* This week's menu */}
        {Object.keys(byDay).length > 0 && (
          <div className={`mb-8 transition-all duration-500 delay-100 ${show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <h2 className="section-title mb-4">Меню цього тижня</h2>
            <div className="space-y-2">
              {Object.entries(byDay).sort(([a],[b]) => Number(a)-Number(b)).map(([day, slots]) => (
                <div key={day} className="card p-4">
                  <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-2">
                    {DAYS_UK[Number(day)]}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {slots.map(slot => {
                      const recipe = RECIPES.find(r => r.id === (slot.recipe as {id:string})?.id)
                      return recipe ? (
                        <span key={slot.mealType} className="text-sm bg-amber-100 text-amber-800 rounded-xl px-3 py-1">
                          {MEAL_LABELS[slot.mealType]?.split(' ')[0]} {recipe.nameUk}
                        </span>
                      ) : null
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Cart summary */}
        {cartItems.length > 0 && (
          <div className={`mb-8 transition-all duration-500 delay-200 ${show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <h2 className="section-title mb-4">Що замовлено</h2>
            <div className="card divide-y divide-stone-100">
              {cartItems.map(item => (
                <div key={item.product.ean} className="flex items-center gap-3 p-3">
                  {item.product.img && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.product.img} alt={item.product.title}
                      className="w-10 h-10 object-contain rounded-lg bg-stone-50 flex-shrink-0"
                      referrerPolicy="no-referrer" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-stone-700 truncate">{item.product.title}</p>
                    <p className="text-xs text-stone-400">{item.quantity} уп × {formatPrice(item.product.price)}</p>
                  </div>
                  <p className="text-sm font-semibold text-stone-700 flex-shrink-0">
                    {formatPrice(item.product.price * item.quantity)}
                  </p>
                </div>
              ))}
              <div className="flex justify-between p-4 bg-stone-50 rounded-b-2xl">
                <span className="font-semibold text-stone-600">Разом</span>
                <span className="font-bold text-stone-800">{formatPrice(total)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Bottom CTA */}
        <div className={`text-center transition-all duration-500 delay-300 ${show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <a
            href="https://auchan.zakaz.ua/uk/"
            target="_blank"
            rel="noreferrer"
            className="btn-primary justify-center py-4 px-8 text-lg w-full"
          >
            🛒 Оформити доставку в Auchan →
          </a>
          <p className="text-xs text-stone-400 mt-3">
            Оберіть зручний час доставки на сайті Auchan
          </p>
        </div>

      </main>
    </>
  )
}
