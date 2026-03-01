'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AppNav, StepBar } from '@/components/layout/AppNav'
import { useMenuStore, useShoppingStore } from '@/store'
import { RECIPES } from '@/lib/recipes'
import { mergeIngredients, DAYS_UK, MEAL_LABELS } from '@/lib/utils'
import type { MealType, Recipe } from '@/types'

const MEAL_TYPES: MealType[] = ['breakfast', 'lunch', 'dinner']

export default function MenuPage() {
  const router = useRouter()
  const { menu, setSlot } = useMenuStore()
  const { setItems } = useShoppingStore()
  const [picking, setPicking] = useState<{ day: number; meal: MealType } | null>(null)
  const [filterCuisine, setFilterCuisine] = useState('')

  function getSlot(day: number, meal: MealType) {
    const slot = menu.slots.find((s) => s.day === day && s.mealType === meal)
    return slot?.recipe ? RECIPES.find((r) => r.id === slot.recipe!.id) : null
  }

  function pickRecipe(recipe: Recipe) {
    if (!picking) return
    setSlot(picking.day, picking.meal, recipe.id)
    setPicking(null)
  }

  function clearSlot(day: number, meal: MealType) {
    setSlot(day, meal, null)
  }

  function handleContinue() {
    // Build shopping list from all chosen recipes
    const recipes = menu.slots
      .filter((s) => s.recipe)
      .map((s) => RECIPES.find((r) => r.id === s.recipe!.id)!)
      .filter(Boolean)

    const merged = mergeIngredients(recipes.map((r) => r.ingredients))
    // Tag each item with recipe names
    merged.forEach((item) => {
      const names: string[] = []
      menu.slots.forEach((s) => {
        if (!s.recipe) return
        const r = RECIPES.find((r) => r.id === s.recipe!.id)
        if (r?.ingredients.some((i) => i.name === item.ingredientName)) {
          names.push(r.nameUk)
        }
      })
      item.fromRecipes = names
    })

    setItems(merged)
    router.push('/shopping')
  }

  const totalSlots = menu.slots.filter((s) => s.recipe).length
  const filteredRecipes = filterCuisine
    ? RECIPES.filter((r) => r.cuisine === filterCuisine)
    : RECIPES

  return (
    <>
      <AppNav />
      <main className="max-w-5xl mx-auto px-4 py-8">
        <StepBar current={1} />

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="section-title">Меню на тиждень</h1>
            <p className="text-stone-500 mt-1">
              Оберіть рецепти — {totalSlots} з {7 * MEAL_TYPES.length} заповнено
            </p>
          </div>
          <button
            onClick={handleContinue}
            disabled={totalSlots === 0}
            className="btn-primary"
          >
            До списку покупок →
          </button>
        </div>

        {/* 7-day grid */}
        <div className="overflow-x-auto pb-4">
          <div className="grid gap-3" style={{ minWidth: 640 }}>
            {/* Header row */}
            <div className="grid grid-cols-8 gap-2">
              <div className="text-xs font-semibold text-stone-400 uppercase tracking-wider pt-3">Прийом</div>
              {DAYS_UK.map((d) => (
                <div key={d} className="text-center text-sm font-semibold text-stone-600 bg-white rounded-xl py-2 px-1">
                  {d.slice(0, 2)}
                  <br />
                  <span className="text-xs font-normal text-stone-400">{d}</span>
                </div>
              ))}
            </div>

            {MEAL_TYPES.map((meal) => (
              <div key={meal} className="grid grid-cols-8 gap-2 items-start">
                <div className="text-xs text-stone-500 font-medium pt-3 pr-2">
                  {MEAL_LABELS[meal]}
                </div>
                {Array.from({ length: 7 }, (_, day) => {
                  const recipe = getSlot(day, meal)
                  return (
                    <div
                      key={day}
                      onClick={() => recipe ? clearSlot(day, meal) : setPicking({ day, meal })}
                      className={`min-h-[80px] rounded-2xl border-2 border-dashed cursor-pointer
                        transition-all duration-150 flex flex-col items-center justify-center p-2 text-center
                        ${recipe
                          ? 'border-brand-300 bg-brand-50 hover:bg-red-50 hover:border-red-300 group'
                          : 'border-stone-200 bg-white/50 hover:border-brand-300 hover:bg-brand-50/50'
                        }`}
                    >
                      {recipe ? (
                        <>
                          <span className="text-xs font-medium text-stone-700 leading-tight group-hover:hidden">
                            {recipe.nameUk}
                          </span>
                          <span className="text-xs text-red-400 hidden group-hover:block">
                            ✕ Видалити
                          </span>
                        </>
                      ) : (
                        <span className="text-stone-300 text-lg">+</span>
                      )}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Recipe picker modal */}
        {picking && (
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4"
            onClick={() => setPicking(null)}
          >
            <div
              className="card w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden animate-slide-up"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-5 border-b border-stone-100 flex items-center justify-between">
                <div>
                  <h2 className="font-display font-bold text-lg">
                    {DAYS_UK[picking.day]} — {MEAL_LABELS[picking.meal]}
                  </h2>
                  <p className="text-sm text-stone-400 mt-0.5">Оберіть рецепт</p>
                </div>
                <button
                  onClick={() => setPicking(null)}
                  className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-stone-500"
                >
                  ✕
                </button>
              </div>

              {/* Filter */}
              <div className="px-5 py-3 border-b border-stone-50 flex gap-2 flex-wrap">
                {['', 'ukrainian', 'italian', 'mediterranean', 'universal'].map((c) => (
                  <button
                    key={c}
                    onClick={() => setFilterCuisine(c)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors
                      ${filterCuisine === c
                        ? 'bg-brand-600 text-white'
                        : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                      }`}
                  >
                    {c === '' ? 'Всі' :
                     c === 'ukrainian' ? '🇺🇦 Українська' :
                     c === 'italian' ? '🇮🇹 Італійська' :
                     c === 'mediterranean' ? '🫒 Середземноморська' : '🌍 Інші'}
                  </button>
                ))}
              </div>

              <div className="overflow-y-auto p-4 grid sm:grid-cols-2 gap-3">
                {filteredRecipes.map((recipe) => (
                  <button
                    key={recipe.id}
                    onClick={() => pickRecipe(recipe)}
                    className="card p-4 text-left hover:border-brand-300 hover:shadow-md
                               transition-all duration-150 group"
                  >
                    <div className="font-medium text-stone-800 group-hover:text-brand-700">
                      {recipe.nameUk}
                    </div>
                    <div className="text-xs text-stone-400 mt-1 line-clamp-2">
                      {recipe.description}
                    </div>
                    <div className="flex items-center gap-3 mt-3 text-xs text-stone-400">
                      <span>⏱ {recipe.prepTime + recipe.cookTime} хв</span>
                      <span>👥 {recipe.servings} порц.</span>
                      {recipe.calories && <span>🔥 {recipe.calories} ккал</span>}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  )
}
