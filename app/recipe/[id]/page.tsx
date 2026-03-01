'use client'

import { useParams, useRouter } from 'next/navigation'
import { AppNav } from '@/components/layout/AppNav'
import { Clock, Flame, Leaf, ChevronLeft, Plus } from 'lucide-react'
import { useCartStore, useShoppingStore } from '@/store'
import { generateId } from '@/lib/utils'
import type { ShoppingItem } from '@/types'

// Same recipe data as landing page
const RECIPES = [
  { id: '1', nameUk: 'Середземноморська миска з куркою', prepTime: '25 хв', calories: 420, balanceScore: 92, ingredients: ['Куряче філе', 'Рис', 'Помідори', 'Шпинат'], tagsUk: ['Багато білку', 'Збалансовано'], emoji: '🥗', protein: 38, carbs: 42, fat: 12, servings: 2,
    instructions: ['Відварити рис до готовності', 'Обсмажити куряче філе з приправами', 'Нарізати помідори та шпинат', 'Зібрати миску: рис, курка, овочі', 'Полити оливковою олією та подавати'] },
  { id: '2', nameUk: 'Швидке овочеве смаження', prepTime: '15 хв', calories: 310, balanceScore: 88, ingredients: ['Броколі', 'Перець болгарський', 'Морква', 'Часник'], tagsUk: ['Вегетаріанське', 'Швидко'], emoji: '🥦', protein: 12, carbs: 38, fat: 10, servings: 2,
    instructions: ['Нарізати всі овочі великими шматками', 'Розігріти сковороду з олією', 'Обсмажити часник 1 хв', 'Додати овочі, смажити 8–10 хв', 'Посолити, поперчити, подавати'] },
  { id: '3', nameUk: 'Яєчня з протеїном', prepTime: '10 хв', calories: 350, balanceScore: 85, ingredients: ['Яйця', 'Шпинат', 'Помідори', 'Сир'], tagsUk: ['Багато білку', 'Швидко'], emoji: '🍳', protein: 28, carbs: 8, fat: 22, servings: 1,
    instructions: ['Нарізати помідори та шпинат', 'Розігріти масло на сковороді', 'Обсмажити овочі 2 хв', 'Збити яйця, вилити на сковороду', 'Посипати сиром, готувати до застигання'] },
  { id: '4', nameUk: 'Ситний суп із сочевиці', prepTime: '30 хв', calories: 280, balanceScore: 95, ingredients: ['Квасоля', 'Морква', 'Цибуля', 'Часник'], tagsUk: ['Клітковина', 'Заготовка'], emoji: '🍲', protein: 18, carbs: 40, fat: 4, servings: 4,
    instructions: ['Обсмажити цибулю та часник', 'Додати нарізану моркву', 'Залити водою або бульйоном', 'Додати квасолю, варити 20 хв', 'Посолити, додати спеції та подавати'] },
  { id: '5', nameUk: 'Лосось із солодкою картоплею', prepTime: '20 хв', calories: 480, balanceScore: 97, ingredients: ['Лосось', 'Картопля', 'Броколі'], tagsUk: ['Омега-3', 'Збалансовано'], emoji: '🐟', protein: 35, carbs: 45, fat: 16, servings: 2,
    instructions: ['Нарізати картоплю кубиками, запекти 15 хв при 200°C', 'Розрізати броколі на суцвіття', 'Обсмажити лосось по 4 хв з кожного боку', 'Відварити броколі 5 хв', 'Подавати разом із картоплею'] },
  { id: '6', nameUk: 'Паста Прімавера в одному горщику', prepTime: '20 хв', calories: 390, balanceScore: 80, ingredients: ['Паста', 'Перець болгарський', 'Помідори', 'Часник'], tagsUk: ['Улюблена', 'Легко'], emoji: '🍝', protein: 14, carbs: 58, fat: 10, servings: 3,
    instructions: ['Закип\'ятити воду, посолити', 'Відварити пасту al dente', 'Обсмажити часник та перець', 'Додати помідори, тушкувати 5 хв', 'Змішати пасту з соусом та подавати'] },
  { id: '7', nameUk: 'Нічна вівсянка', prepTime: '5 хв', calories: 290, balanceScore: 82, ingredients: ['Вівсяні пластівці', 'Молоко', 'Ягоди заморожені'], tagsUk: ['Наперед', 'Швидко'], emoji: '🥣', protein: 10, carbs: 45, fat: 8, servings: 1,
    instructions: ['Змішати вівсянку з молоком у банці', 'Додати ягоди та мед за смаком', 'Закрити та поставити в холодильник', 'Залишити на ніч (мінімум 6 годин)', 'Вранці перемішати та подавати'] },
  { id: '8', nameUk: 'Парфе з грецьким йогуртом', prepTime: '5 хв', calories: 250, balanceScore: 84, ingredients: ['Грецький йогурт', 'Ягоди заморожені', 'Гранола'], tagsUk: ['Швидко', 'Збалансовано'], emoji: '🍨', protein: 18, carbs: 30, fat: 6, servings: 1,
    instructions: ['Покласти шар йогурту у склянку', 'Додати шар граноли', 'Додати ягоди', 'Повторити шари', 'Подавати одразу або охолодити'] },
  { id: '9', nameUk: 'Курка з авокадо у ролі', prepTime: '10 хв', calories: 440, balanceScore: 90, ingredients: ['Куряче філе', 'Авокадо', 'Помідори', 'Сир'], tagsUk: ['Багато білку', 'Швидко'], emoji: '🌯', protein: 32, carbs: 35, fat: 18, servings: 1,
    instructions: ['Нарізати відварену курку смужками', 'Розрізати авокадо, видалити кісточку', 'Нарізати помідори та сир', 'Розкласти начинку на лаваш', 'Загорнути у ролл та подавати'] },
]

function getBalanceColor(score: number) {
  if (score >= 90) return '#3d9e5f'
  if (score >= 80) return '#c49a0a'
  return '#d96b2a'
}
function getBalanceBg(score: number) {
  if (score >= 90) return 'hsla(152,50%,45%,0.12)'
  if (score >= 80) return 'hsla(45,80%,50%,0.12)'
  return 'hsla(15,80%,55%,0.12)'
}

export default function RecipePage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { setItems } = useShoppingStore()

  const recipe = RECIPES.find(r => r.id === id)

  if (!recipe) {
    return (
      <>
        <AppNav />
        <main className="max-w-2xl mx-auto px-4 py-16 text-center">
          <p className="text-6xl mb-4">🍽️</p>
          <h1 className="font-display text-2xl mb-2">Рецепт не знайдено</h1>
          <button onClick={() => router.back()} className="btn-secondary mt-4">← Назад</button>
        </main>
      </>
    )
  }

  function addToShoppingList() {
    const items: ShoppingItem[] = recipe!.ingredients.map(ing => ({
      id: generateId(),
      ingredientName: ing,
      quantity: 1,
      unit: 'шт',
      category: 'produce',
      fromRecipes: [recipe!.nameUk],
      checked: false,
    }))
    setItems(items)
    router.push('/shopping')
  }

  const macroTotal = recipe.protein + recipe.carbs + recipe.fat

  return (
    <>
      <AppNav />
      <main className="max-w-2xl mx-auto px-4 py-8">

        {/* Back */}
        <button onClick={() => router.back()}
          className="flex items-center gap-1 text-sm font-body mb-6 transition-colors"
          style={{ color: 'var(--muted-foreground)' }}>
          <ChevronLeft size={16} /> Назад
        </button>

        {/* Hero card */}
        <div className="rounded-2xl border p-8 mb-6" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>
          <div className="flex items-start justify-between mb-4">
            <span className="text-7xl">{recipe.emoji}</span>
            <span className="flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold font-body"
              style={{ backgroundColor: getBalanceBg(recipe.balanceScore), color: getBalanceColor(recipe.balanceScore) }}>
              <Leaf size={14} /> {recipe.balanceScore}% баланс
            </span>
          </div>
          <h1 className="font-display text-3xl mb-3" style={{ color: 'var(--foreground)' }}>{recipe.nameUk}</h1>

          <div className="flex flex-wrap gap-4 text-sm font-body mb-4" style={{ color: 'var(--muted-foreground)' }}>
            <span className="flex items-center gap-1"><Clock size={15} /> {recipe.prepTime}</span>
            <span className="flex items-center gap-1"><Flame size={15} /> {recipe.calories} кал</span>
            <span className="flex items-center gap-1">👥 {recipe.servings} порції</span>
          </div>

          <div className="flex flex-wrap gap-2 mb-6">
            {recipe.tagsUk.map(tag => (
              <span key={tag} className="px-3 py-1 rounded-full text-xs font-body font-medium"
                style={{ backgroundColor: 'var(--secondary)', color: 'var(--secondary-foreground)' }}>{tag}</span>
            ))}
          </div>

          <button onClick={addToShoppingList} className="btn-primary w-full justify-center py-3 text-base">
            <Plus size={18} /> Додати до списку покупок
          </button>
        </div>

        {/* Macros */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: 'Білки', value: recipe.protein, unit: 'г', color: '#3d9e5f' },
            { label: 'Вуглеводи', value: recipe.carbs, unit: 'г', color: '#c49a0a' },
            { label: 'Жири', value: recipe.fat, unit: 'г', color: '#d96b2a' },
          ].map(macro => (
            <div key={macro.label} className="rounded-2xl border p-4 text-center"
              style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>
              <p className="text-2xl font-bold font-body mb-1" style={{ color: macro.color }}>{macro.value}{macro.unit}</p>
              <p className="text-xs font-body" style={{ color: 'var(--muted-foreground)' }}>{macro.label}</p>
              <div className="mt-2 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--muted)' }}>
                <div className="h-full rounded-full transition-all"
                  style={{ width: `${Math.round(macro.value / macroTotal * 100)}%`, backgroundColor: macro.color }} />
              </div>
            </div>
          ))}
        </div>

        {/* Ingredients */}
        <div className="rounded-2xl border p-6 mb-6" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>
          <h2 className="font-display text-xl mb-4" style={{ color: 'var(--foreground)' }}>Інгредієнти</h2>
          <div className="space-y-2">
            {recipe.ingredients.map(ing => (
              <div key={ing} className="flex items-center gap-3 py-2 border-b last:border-0"
                style={{ borderColor: 'var(--border)' }}>
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: 'var(--primary)' }} />
                <span className="font-body text-sm" style={{ color: 'var(--foreground)' }}>{ing}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Instructions */}
        <div className="rounded-2xl border p-6" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>
          <h2 className="font-display text-xl mb-4" style={{ color: 'var(--foreground)' }}>Приготування</h2>
          <div className="space-y-4">
            {recipe.instructions.map((step, i) => (
              <div key={i} className="flex gap-4">
                <span className="w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold font-body flex-shrink-0"
                  style={{ backgroundColor: 'var(--primary)', color: 'var(--primary-foreground)' }}>{i + 1}</span>
                <p className="font-body text-sm leading-relaxed pt-1" style={{ color: 'var(--foreground)' }}>{step}</p>
              </div>
            ))}
          </div>
        </div>

        <button onClick={addToShoppingList} className="btn-primary w-full justify-center py-3 text-base mt-6">
          🛒 Замовити інгредієнти в Auchan
        </button>

      </main>
    </>
  )
}
