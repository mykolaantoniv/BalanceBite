'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { useShoppingStore } from '@/store'
import { generateId } from '@/lib/utils'
import type { ShoppingItem } from '@/types'
import { EXTENDED_RECIPES } from '@/lib/recipes-extended'
import {
  Leaf, ChevronDown, Plus, X,
  UtensilsCrossed, CalendarDays,
  ShieldCheck, Clock, Heart,
  Calendar, Flame, ChevronLeft, ChevronRight, Trash2,
  ChefHat, Zap, Info
} from 'lucide-react'

// ─── Data ────────────────────────────────────────────────────────────────────

type MealType = 'breakfast' | 'lunch' | 'dinner'
type ProgramType = 'lose' | 'maintain' | 'gain'

interface Recipe {
  id: number
  nameUk: string
  prepTime: string
  calories: number
  balanceScore: number
  ingredients: string[]
  tagsUk: string[]
  emoji: string
  mealTypes: MealType[]
  protein: number
  carbs: number
  fat: number
  programs: ProgramType[]
}

const RECIPES: Recipe[] = [
  { id: 1, nameUk: 'Середземноморська миска з куркою', prepTime: '25 хв', calories: 420, balanceScore: 92, ingredients: ['Куряче філе', 'Рис', 'Помідори', 'Шпинат'], tagsUk: ['Багато білку', 'Збалансовано'], emoji: '🥗', mealTypes: ['lunch', 'dinner'], protein: 38, carbs: 42, fat: 12, programs: ['maintain', 'gain'] },
  { id: 2, nameUk: 'Швидке овочеве смаження', prepTime: '15 хв', calories: 310, balanceScore: 88, ingredients: ['Броколі', 'Перець', 'Морква', 'Часник'], tagsUk: ['Вегетаріанське', 'Швидко'], emoji: '🥦', mealTypes: ['lunch', 'dinner'], protein: 12, carbs: 38, fat: 10, programs: ['lose', 'maintain'] },
  { id: 3, nameUk: 'Яєчня з протеїном', prepTime: '10 хв', calories: 350, balanceScore: 85, ingredients: ['Яйця', 'Шпинат', 'Помідори', 'Сир'], tagsUk: ['Багато білку', 'Швидко'], emoji: '🍳', mealTypes: ['breakfast'], protein: 28, carbs: 8, fat: 22, programs: ['maintain', 'gain'] },
  { id: 4, nameUk: 'Ситний суп із сочевиці', prepTime: '30 хв', calories: 280, balanceScore: 95, ingredients: ['Квасоля', 'Морква', 'Цибуля', 'Часник'], tagsUk: ['Клітковина', 'Заготовка'], emoji: '🍲', mealTypes: ['lunch', 'dinner'], protein: 18, carbs: 40, fat: 4, programs: ['lose', 'maintain'] },
  { id: 5, nameUk: 'Лосось із солодкою картоплею', prepTime: '20 хв', calories: 480, balanceScore: 97, ingredients: ['Лосось', 'Картопля', 'Броколі'], tagsUk: ['Омега-3', 'Збалансовано'], emoji: '🐟', mealTypes: ['dinner'], protein: 35, carbs: 45, fat: 16, programs: ['maintain', 'gain'] },
  { id: 6, nameUk: 'Паста Прімавера в одному горщику', prepTime: '20 хв', calories: 390, balanceScore: 80, ingredients: ['Паста', 'Перець', 'Помідори', 'Часник'], tagsUk: ['Улюблена', 'Легко'], emoji: '🍝', mealTypes: ['lunch', 'dinner'], protein: 14, carbs: 58, fat: 10, programs: ['maintain', 'gain'] },
  { id: 7, nameUk: 'Нічна вівсянка', prepTime: '5 хв', calories: 290, balanceScore: 82, ingredients: ['Вівсянка', 'Молоко', 'Ягоди'], tagsUk: ['Наперед', 'Швидко'], emoji: '🥣', mealTypes: ['breakfast'], protein: 10, carbs: 45, fat: 8, programs: ['lose', 'maintain'] },
  { id: 8, nameUk: 'Парфе з грецьким йогуртом', prepTime: '5 хв', calories: 250, balanceScore: 84, ingredients: ['Йогурт', 'Ягоди', 'Гранола'], tagsUk: ['Швидко', 'Збалансовано'], emoji: '🍨', mealTypes: ['breakfast'], protein: 18, carbs: 30, fat: 6, programs: ['lose'] },
  { id: 9, nameUk: 'Курка з авокадо у ролі', prepTime: '10 хв', calories: 440, balanceScore: 90, ingredients: ['Куряче філе', 'Авокадо', 'Помідори', 'Сир'], tagsUk: ['Багато білку', 'Швидко'], emoji: '🌯', mealTypes: ['lunch'], protein: 32, carbs: 35, fat: 18, programs: ['maintain', 'gain'] },
]

const PROGRAM_OPTIONS: Array<{ value: ProgramType; label: string; emoji: string; desc: string }> = [
  { value: 'lose', label: 'Схуднути', emoji: '📉', desc: 'Низькокалорійні страви для схуднення' },
  { value: 'maintain', label: 'Зберегти вагу', emoji: '⚖️', desc: 'Збалансовані страви для збереження ваги' },
  { value: 'gain', label: 'Набрати вагу', emoji: '📈', desc: 'Калорійні страви для набору ваги' },
]

const CALORIE_TIERS = [950, 1150, 1350, 1525, 2025]

const COMMON_INGREDIENTS = ['Куряче філе', 'Рис', 'Яйця', 'Помідори', 'Цибуля', 'Часник', 'Броколі', 'Паста', 'Перець', 'Шпинат', 'Картопля', 'Морква', 'Сир', 'Квасоля', 'Лосось', 'Авокадо', 'Тофу', 'Гриби']
const MEAL_TYPE_LABELS: Record<MealType, string> = { breakfast: '🌅 Сніданок', lunch: '☀️ Обід', dinner: '🌙 Вечеря' }
const DAY_NAMES = ['Понеділок', 'Вівторок', 'Середа', 'Четвер', "П'ятниця", 'Субота', 'Неділя']

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

// ─── Recipe Card ─────────────────────────────────────────────────────────────

function RecipeCard({ recipe, matchedIngredients, onAdd, onClickRecipe }: {
  recipe: Recipe
  matchedIngredients?: string[]
  onAdd?: (r: Recipe) => void
  onClickRecipe: (r: Recipe) => void
}) {
  return (
    <div
      className="group recipe-card rounded-2xl border p-6 transition-all duration-300 cursor-pointer hover:shadow-lg hover:border-primary"
      style={{ backgroundColor: 'var(--background)', borderColor: 'var(--border)' }}
      onClick={() => onClickRecipe(recipe)}
      role="article"
      aria-label={`${recipe.nameUk} - ${recipe.calories} калорій`}
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClickRecipe(recipe)}
    >
      <div className="flex items-start justify-between mb-3">
        <span className="text-4xl" aria-hidden="true">{recipe.emoji}</span>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold font-body"
            style={{ backgroundColor: getBalanceBg(recipe.balanceScore), color: getBalanceColor(recipe.balanceScore) }}
            title={`Баланс: ${recipe.balanceScore}%`}>
            <Leaf size={11} aria-hidden="true" /> {recipe.balanceScore}%
          </span>
          {onAdd && (
            <button
              onClick={e => { e.stopPropagation(); onAdd(recipe) }}
              className="p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:scale-110 focus:opacity-100 focus:ring-2 focus:ring-offset-2"
              style={{ backgroundColor: 'var(--primary)', color: 'var(--primary-foreground)' }}
              aria-label={`Додати ${recipe.nameUk}`}
              title={`Додати ${recipe.nameUk} до плану`}>
              <Plus size={14} aria-hidden="true" />
            </button>
          )}
        </div>
      </div>
      <h3 className="font-display text-xl mb-2 transition-colors group-hover:text-green-700"
        style={{ color: 'var(--foreground)' }}>{recipe.nameUk}</h3>
      <div className="flex items-center gap-3 text-xs font-body mb-3" style={{ color: 'var(--muted-foreground)' }}>
        <span className="flex items-center gap-1"><Clock size={12} />{recipe.prepTime}</span>
        <span className="flex items-center gap-1"><Flame size={12} />{recipe.calories} кал</span>
      </div>
      <div className="flex flex-wrap gap-1.5 mb-3">
        {recipe.tagsUk.map(tag => (
          <span key={tag} className="px-2 py-0.5 rounded-md text-xs font-body font-medium"
            style={{ backgroundColor: 'var(--secondary)', color: 'var(--secondary-foreground)' }}>{tag}</span>
        ))}
      </div>
      {matchedIngredients && matchedIngredients.length > 0 && (
        <div className="pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
          <p className="text-xs font-body mb-0.5" style={{ color: 'var(--muted-foreground)' }}>Збіги:</p>
          <p className="text-sm font-body font-medium" style={{ color: 'var(--primary)' }}>{matchedIngredients.join(', ')}</p>
        </div>
      )}
    </div>
  )
}

// ─── Meal Planner ────────────────────────────────────────────────────────────

type MealSlot = { mealType: MealType; recipe: Recipe | null }
type DayPlan = { day: number; label: string; meals: MealSlot[] }

function createEmptyPlan(days: number): DayPlan[] {
  return Array.from({ length: days }, (_, i) => ({
    day: i, label: DAY_NAMES[i % 7],
    meals: (['breakfast', 'lunch', 'dinner'] as MealType[]).map(mt => ({ mealType: mt, recipe: null })),
  }))
}

function MealPlannerSection({ selectedIngredients, onBuildShoppingList }: {
  selectedIngredients: string[]
  onBuildShoppingList: (plan: DayPlan[]) => void
}) {
  const [numDays, setNumDays] = useState(7)
  const [selectedProgram, setSelectedProgram] = useState<ProgramType>('maintain')
  const [selectedCalories, setSelectedCalories] = useState(1350)
  const [plan, setPlan] = useState<DayPlan[]>(createEmptyPlan(7))
  const [pickingSlot, setPickingSlot] = useState<{ dayIndex: number; mealIndex: number } | null>(null)
  const [selectedRecipeDetail, setSelectedRecipeDetail] = useState<typeof EXTENDED_RECIPES[0] | null>(null)

  const handleDaysChange = (days: number) => { setNumDays(days); setPlan(createEmptyPlan(days)); setPickingSlot(null) }

  const assignRecipe = (recipe: Recipe) => {
    if (!pickingSlot) return
    setPlan(prev => prev.map((day, di) => di === pickingSlot.dayIndex
      ? { ...day, meals: day.meals.map((m, mi) => mi === pickingSlot.mealIndex ? { ...m, recipe } : m) }
      : day))
    setPickingSlot(null)
  }

  const removeRecipe = (dayIndex: number, mealIndex: number) => {
    setPlan(prev => prev.map((day, di) => di === dayIndex
      ? { ...day, meals: day.meals.map((m, mi) => mi === mealIndex ? { ...m, recipe: null } : m) }
      : day))
  }

  const autoFill = () => {
    const mealsPerDay = 3
    const caloriesPerMeal = selectedCalories / mealsPerDay
    const calorieRange = { min: caloriesPerMeal * 0.9, max: caloriesPerMeal * 1.1 }
    let available = RECIPES.filter(r =>
      r.programs.includes(selectedProgram) &&
      r.calories >= calorieRange.min &&
      r.calories <= calorieRange.max
    )

    if (selectedIngredients.length > 0) {
      available = available.filter(r => r.ingredients.some(ing => selectedIngredients.includes(ing)))
    }

    if (available.length === 0) {
      available = RECIPES.filter(r => r.programs.includes(selectedProgram))
    }

    setPlan(prev => prev.map(day => ({
      ...day,
      meals: day.meals.map(slot => {
        if (slot.recipe) return slot
        const options = available.filter(r => r.mealTypes.includes(slot.mealType))
        return options.length ? { ...slot, recipe: options[Math.floor(Math.random() * options.length)] } : slot
      }),
    })))
  }

  const filledSlots = plan.reduce((s, d) => s + d.meals.filter(m => m.recipe).length, 0)
  const totalSlots = plan.reduce((s, d) => s + d.meals.length, 0)
  const totalCalories = plan.reduce((s, d) => s + d.meals.reduce((ss, m) => ss + (m.recipe?.calories ?? 0), 0), 0)
  const avgBalance = (() => {
    const rs = plan.flatMap(d => d.meals.map(m => m.recipe).filter(Boolean) as Recipe[])
    return rs.length ? Math.round(rs.reduce((s, r) => s + r.balanceScore, 0) / rs.length) : 0
  })()

  const pickerMealType = pickingSlot ? plan[pickingSlot.dayIndex].meals[pickingSlot.mealIndex].mealType : null
  const mealsPerDay = 3
  const caloriesPerMeal = selectedCalories / mealsPerDay
  const calorieRange = { min: caloriesPerMeal * 0.9, max: caloriesPerMeal * 1.1 }
  const pickerRecipes = pickerMealType
    ? RECIPES.filter(r =>
        r.mealTypes.includes(pickerMealType) &&
        r.programs.includes(selectedProgram) &&
        r.calories >= calorieRange.min &&
        r.calories <= calorieRange.max
      )
    : []

  const avgCaloriesPerMeal = filledSlots > 0 ? Math.round(totalCalories / filledSlots) : 0
  const calorieDeviation = filledSlots > 0 ? Math.round(((totalCalories / numDays) / selectedCalories - 1) * 100) : 0

  return (
    <section className="py-20 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="font-display text-4xl md:text-5xl mb-4" style={{ color: 'var(--foreground)' }}>Меню на тиждень</h2>
          <p className="text-lg font-body max-w-lg mx-auto" style={{ color: 'var(--muted-foreground)' }}>
            Складіть збалансований план харчування. Натисніть на будь-який слот, щоб додати рецепт.
          </p>
        </div>

        {/* Controls */}
        <div className="space-y-4 mb-8">
          {/* Program Selector */}
          <div className="flex flex-wrap gap-2 justify-center">
            {PROGRAM_OPTIONS.map(option => (
              <button key={option.value}
                onClick={() => setSelectedProgram(option.value)}
                className="px-4 py-2 rounded-full font-body text-sm font-medium transition-all duration-200 border group focus:ring-2 focus:ring-offset-2"
                style={{
                  backgroundColor: selectedProgram === option.value ? 'var(--primary)' : 'var(--card)',
                  borderColor: selectedProgram === option.value ? 'var(--primary)' : 'var(--border)',
                  color: selectedProgram === option.value ? 'var(--primary-foreground)' : 'var(--card-foreground)',
                  transform: selectedProgram === option.value ? 'scale(1.05)' : 'scale(1)',
                  boxShadow: selectedProgram === option.value ? '0 2px 8px hsla(152,35%,38%,0.3)' : 'none',
                }}
                title={option.desc}
                aria-pressed={selectedProgram === option.value}>
                {option.emoji} {option.label}
              </button>
            ))}
          </div>

          {/* Day and Calorie Controls */}
          <div className="flex flex-wrap items-center justify-center gap-4">
            <div className="flex items-center gap-2 rounded-full px-2 py-1 border"
              style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>
              <button onClick={() => numDays > 1 && handleDaysChange(numDays - 1)}
                className="p-1.5 rounded-full transition-colors hover:bg-secondary focus:ring-2 focus:ring-offset-2"
                aria-label="Зменшити кількість днів"
                disabled={numDays <= 1}>
                <ChevronLeft size={16} aria-hidden="true" />
              </button>
              <span className="font-body font-semibold text-sm min-w-[80px] text-center" aria-live="polite">{numDays} дн.</span>
              <button onClick={() => numDays < 14 && handleDaysChange(numDays + 1)}
                className="p-1.5 rounded-full transition-colors hover:bg-secondary focus:ring-2 focus:ring-offset-2"
                aria-label="Збільшити кількість днів"
                disabled={numDays >= 14}>
                <ChevronRight size={16} aria-hidden="true" />
              </button>
            </div>

            <div className="flex items-center gap-2 rounded-full px-2 py-1 border"
              style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>
              <button onClick={() => {
                const currentIdx = CALORIE_TIERS.indexOf(selectedCalories)
                if (currentIdx > 0) setSelectedCalories(CALORIE_TIERS[currentIdx - 1])
              }}
                className="p-1.5 rounded-full transition-colors hover:bg-secondary focus:ring-2 focus:ring-offset-2"
                aria-label="Зменшити калорійність"
                disabled={CALORIE_TIERS.indexOf(selectedCalories) === 0}>
                <ChevronLeft size={16} aria-hidden="true" />
              </button>
              <span className="font-body font-semibold text-sm min-w-[100px] text-center" style={{ color: 'var(--foreground)' }} aria-live="polite">~{selectedCalories} ккал</span>
              <button onClick={() => {
                const currentIdx = CALORIE_TIERS.indexOf(selectedCalories)
                if (currentIdx < CALORIE_TIERS.length - 1) setSelectedCalories(CALORIE_TIERS[currentIdx + 1])
              }}
                className="p-1.5 rounded-full transition-colors hover:bg-secondary focus:ring-2 focus:ring-offset-2"
                aria-label="Збільшити калорійність"
                disabled={CALORIE_TIERS.indexOf(selectedCalories) === CALORIE_TIERS.length - 1}>
                <ChevronRight size={16} aria-hidden="true" />
              </button>
            </div>

            <button onClick={autoFill}
              className="px-5 py-2 rounded-full font-body text-sm font-semibold transition-all hover:opacity-90 focus:ring-2 focus:ring-offset-2"
              style={{ backgroundColor: 'var(--primary)', color: 'var(--primary-foreground)' }}
              title="Автоматично заповнити план рецептами">
              ✨ Заповнити автоматично
            </button>
          </div>
        </div>

        {/* Summary */}
        <div className="flex flex-wrap justify-center gap-6 mb-10 text-sm font-body">
          <div className="flex items-center gap-2" style={{ color: 'var(--muted-foreground)' }}>
            <Calendar size={16} style={{ color: 'var(--primary)' }} />
            <span>{filledSlots}/{totalSlots} прийомів заплановано</span>
          </div>
          <div className="flex items-center gap-2" style={{ color: 'var(--muted-foreground)' }}>
            <Flame size={16} style={{ color: 'hsl(28,70%,55%)' }} />
            <span>{filledSlots > 0 ? Math.round(totalCalories / numDays) : '—'} / {selectedCalories} ккал/день
              {filledSlots > 0 && calorieDeviation !== 0 && (
                <span style={{ color: Math.abs(calorieDeviation) <= 10 ? 'var(--primary)' : 'hsl(28,70%,55%)' }}>
                  {' '}({calorieDeviation > 0 ? '+' : ''}{calorieDeviation}%)
                </span>
              )}
            </span>
          </div>
          {avgBalance > 0 && (
            <div className="flex items-center gap-2" style={{ color: getBalanceColor(avgBalance) }}>
              <Leaf size={16} /><span>{avgBalance}% сер. баланс</span>
            </div>
          )}
          <div className="flex items-center gap-2" style={{ color: 'var(--muted-foreground)' }}>
            <span>{PROGRAM_OPTIONS.find(p => p.value === selectedProgram)?.emoji} {PROGRAM_OPTIONS.find(p => p.value === selectedProgram)?.label}</span>
          </div>
        </div>

        {/* Grid */}
        <div className="space-y-4">
          {plan.map((day, dayIndex) => (
            <div key={dayIndex} className="rounded-2xl border p-4 md:p-5"
              style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>
              <div className="flex items-center gap-3 mb-4">
                <span className="font-display text-lg" style={{ color: 'var(--foreground)' }}>{day.label}</span>
                <span className="text-xs font-body" style={{ color: 'var(--muted-foreground)' }}>День {day.day + 1}</span>
              </div>
              <div className="grid md:grid-cols-3 gap-3">
                {day.meals.map((slot, mealIndex) => (
                  <div key={slot.mealType}>
                    <p className="text-xs font-body font-medium mb-2" style={{ color: 'var(--muted-foreground)' }}>
                      {MEAL_TYPE_LABELS[slot.mealType]}
                    </p>
                    {slot.recipe ? (
                      <div className="relative group rounded-xl border p-3 transition-colors hover:border-red-300"
                        style={{ backgroundColor: 'var(--background)', borderColor: 'var(--border)' }}>
                        <div className="flex items-center gap-2">
                          <span className="text-xl" aria-hidden="true">{slot.recipe.emoji}</span>
                          <div className="flex-1 min-w-0">
                            <p className="font-body text-sm font-medium truncate" style={{ color: 'var(--foreground)' }} title={slot.recipe.nameUk}>{slot.recipe.nameUk}</p>
                            <p className="text-xs font-body" style={{ color: 'var(--muted-foreground)' }}>{slot.recipe.calories} кал · {slot.recipe.prepTime}</p>
                          </div>
                          <span className="px-2 py-0.5 rounded-full text-xs font-semibold font-body flex-shrink-0"
                            style={{ backgroundColor: getBalanceBg(slot.recipe.balanceScore), color: getBalanceColor(slot.recipe.balanceScore) }}>
                            {slot.recipe.balanceScore}%
                          </span>
                        </div>
                        <button onClick={() => removeRecipe(dayIndex, mealIndex)}
                          className="absolute top-2 right-2 p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110 focus:opacity-100 focus:ring-2 focus:ring-offset-2"
                          style={{ backgroundColor: 'hsl(0,65%,50%)', color: 'white' }}
                          aria-label={`Видалити ${slot.recipe.nameUk} з плану`}
                          title={`Видалити ${slot.recipe.nameUk}`}>
                          <Trash2 size={14} aria-hidden="true" />
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => setPickingSlot({ dayIndex, mealIndex })}
                        className="w-full rounded-xl border-2 border-dashed p-4 text-center text-sm font-body transition-all duration-200 focus:ring-2 focus:ring-offset-2 hover:shadow-sm"
                        style={{
                          borderColor: pickingSlot?.dayIndex === dayIndex && pickingSlot?.mealIndex === mealIndex ? 'var(--primary)' : 'var(--border)',
                          color: pickingSlot?.dayIndex === dayIndex && pickingSlot?.mealIndex === mealIndex ? 'var(--primary)' : 'var(--muted-foreground)',
                          backgroundColor: pickingSlot?.dayIndex === dayIndex && pickingSlot?.mealIndex === mealIndex ? 'hsla(152,35%,38%,0.05)' : 'transparent',
                        }}
                        aria-label={`Додати страву для ${MEAL_TYPE_LABELS[slot.mealType]}`}>
                        <Plus size={16} className="mx-auto mb-1" aria-hidden="true" />
                        Додати страву
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        {filledSlots > 0 && (
          <div className="mt-10 text-center">
            <button
              onClick={() => onBuildShoppingList(plan)}
              className="inline-flex items-center gap-2 px-8 py-3 rounded-full font-body font-semibold text-base transition-all hover:opacity-90 focus:ring-2 focus:ring-offset-2"
              style={{ backgroundColor: 'var(--primary)', color: 'var(--primary-foreground)' }}
              aria-label="Скласти список покупок на основі плану">
              🛒 Скласти список покупок →
            </button>
          </div>
        )}

        {/* Recipe picker modal */}
        {pickingSlot && (
          <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4"
            style={{ backgroundColor: 'hsla(150,20%,10%,0.4)', backdropFilter: 'blur(4px)' }}
            onClick={() => { setPickingSlot(null); setSelectedRecipeDetail(null); }}
            onKeyDown={(e) => e.key === 'Escape' && (setPickingSlot(null), setSelectedRecipeDetail(null))}
            role="dialog"
            aria-modal="true"
            aria-label="Вибір рецепту"
          >

            {/* Recipe Details View */}
            {selectedRecipeDetail && (
              <div className="rounded-2xl border p-6 max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-2xl"
                style={{ backgroundColor: 'var(--background)', borderColor: 'var(--border)' }}
                onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-display text-2xl" style={{ color: 'var(--foreground)' }}>
                    {selectedRecipeDetail.emoji} {selectedRecipeDetail.nameUk}
                  </h2>
                  <button
                    onClick={() => setSelectedRecipeDetail(null)}
                    className="p-1.5 rounded-full hover:bg-secondary transition-colors focus:ring-2 focus:ring-offset-2"
                    style={{ color: 'var(--muted-foreground)' }}
                    aria-label="Закрити деталі рецепту">
                    ✕
                  </button>
                </div>

                {selectedRecipeDetail.photo && (
                  <div className="mb-6 rounded-xl overflow-hidden h-64">
                    <img
                      src={selectedRecipeDetail.photo}
                      alt={selectedRecipeDetail.nameUk}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                <p className="text-sm font-body mb-6" style={{ color: 'var(--muted-foreground)' }}>
                  {selectedRecipeDetail.description}
                </p>

                {/* Nutrition Info */}
                <div className="grid grid-cols-4 gap-2 mb-6">
                  <div className="p-3 rounded-lg" style={{ backgroundColor: 'hsla(152,35%,38%,0.1)' }}>
                    <p className="text-xs font-body" style={{ color: 'var(--muted-foreground)' }}>Калорії</p>
                    <p className="font-body font-semibold" style={{ color: 'var(--foreground)' }}>{selectedRecipeDetail.calories}</p>
                  </div>
                  <div className="p-3 rounded-lg" style={{ backgroundColor: 'hsla(28,70%,55%,0.1)' }}>
                    <p className="text-xs font-body" style={{ color: 'var(--muted-foreground)' }}>Білки</p>
                    <p className="font-body font-semibold" style={{ color: 'var(--foreground)' }}>{selectedRecipeDetail.protein}г</p>
                  </div>
                  <div className="p-3 rounded-lg" style={{ backgroundColor: 'hsla(15,80%,55%,0.1)' }}>
                    <p className="text-xs font-body" style={{ color: 'var(--muted-foreground)' }}>Жири</p>
                    <p className="font-body font-semibold" style={{ color: 'var(--foreground)' }}>{selectedRecipeDetail.fat}г</p>
                  </div>
                  <div className="p-3 rounded-lg" style={{ backgroundColor: 'hsla(45,80%,50%,0.1)' }}>
                    <p className="text-xs font-body" style={{ color: 'var(--muted-foreground)' }}>Вуглеводи</p>
                    <p className="font-body font-semibold" style={{ color: 'var(--foreground)' }}>{selectedRecipeDetail.carbs}г</p>
                  </div>
                </div>

                {/* Ingredients */}
                <div className="mb-6">
                  <h3 className="font-display text-lg mb-3" style={{ color: 'var(--foreground)' }}>
                    <ChefHat size={18} className="inline mr-2" />Інгредієнти
                  </h3>
                  <ul className="space-y-2">
                    {selectedRecipeDetail.ingredients.map((ing, i) => (
                      <li key={i} className="flex justify-between text-sm font-body" style={{ color: 'var(--foreground)' }}>
                        <span>{ing.name}</span>
                        <span style={{ color: 'var(--muted-foreground)' }}>{ing.quantity}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Recipe Steps */}
                <div className="mb-6">
                  <h3 className="font-display text-lg mb-3" style={{ color: 'var(--foreground)' }}>
                    <Zap size={18} className="inline mr-2" />Рецепт
                  </h3>
                  <ol className="space-y-2">
                    {selectedRecipeDetail.steps.map((step, i) => (
                      <li key={i} className="text-sm font-body" style={{ color: 'var(--foreground)' }}>
                        <span className="font-semibold" style={{ color: 'var(--primary)' }}>Крок {i + 1}:</span> {step}
                      </li>
                    ))}
                  </ol>
                </div>

                {/* Action Button */}
                <button
                  onClick={() => {
                    assignRecipe({
                      ...selectedRecipeDetail,
                      balanceScore: selectedRecipeDetail.balanceScore,
                      tagsUk: selectedRecipeDetail.tagsUk,
                      ingredients: selectedRecipeDetail.ingredients.map(ing => ing.name),
                    } as Recipe);
                    setSelectedRecipeDetail(null);
                    setPickingSlot(null);
                  }}
                  className="w-full py-3 rounded-full font-body font-semibold transition-all hover:opacity-90 focus:ring-2 focus:ring-offset-2"
                  style={{ backgroundColor: 'var(--primary)', color: 'var(--primary-foreground)' }}
                  title={`Вибрати ${selectedRecipeDetail.nameUk} для плану`}>
                  Вибрати цю страву
                </button>
              </div>
            )}

            {/* Recipe List View */}
            {!selectedRecipeDetail && pickingSlot && (
              <div className="rounded-2xl border p-6 max-w-lg w-full max-h-[70vh] overflow-y-auto shadow-2xl"
                style={{ backgroundColor: 'var(--background)', borderColor: 'var(--border)' }}
                onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-display text-xl" style={{ color: 'var(--foreground)' }}>
                    Оберіть {pickerMealType === 'breakfast' ? 'сніданок' : pickerMealType === 'lunch' ? 'обід' : 'вечерю'}
                  </h3>
                  <button
                    onClick={() => setPickingSlot(null)}
                    className="p-1.5 rounded-full hover:bg-secondary transition-colors focus:ring-2 focus:ring-offset-2"
                    style={{ color: 'var(--muted-foreground)' }}
                    aria-label="Закрити вибір рецепту">
                    ✕
                  </button>
                </div>
                <p className="text-sm font-body mb-4" style={{ color: 'var(--muted-foreground)' }}>
                  {plan[pickingSlot.dayIndex].label} · {pickerMealType && MEAL_TYPE_LABELS[pickerMealType]}
                </p>
                {(() => {
                  const currentDay = pickingSlot ? plan[pickingSlot.dayIndex] : null
                  const usedCalories = currentDay
                    ? currentDay.meals.reduce((sum, m) => sum + (m.recipe?.calories ?? 0), 0)
                    : 0
                  const remainingBudget = selectedCalories - usedCalories
                  return (
                    <>
                      <div className="mb-4 p-3 rounded-lg" style={{ backgroundColor: 'hsla(152,35%,38%,0.1)' }}>
                        <p className="text-xs font-body" style={{ color: 'var(--muted-foreground)' }}>Залишилось для дня</p>
                        <p className="font-body font-semibold" style={{ color: 'var(--foreground)' }}>
                          {remainingBudget} ккал {remainingBudget < 0 && <span style={{ color: '#d96b2a' }}>(перебір: {-remainingBudget})</span>}
                        </p>
                      </div>
                      <div className="space-y-3">
                        {(() => {
                          const filteredRecipes = EXTENDED_RECIPES.filter(r =>
                            r.mealTypes.includes(pickerMealType || 'breakfast') &&
                            r.programs.includes(selectedProgram) &&
                            r.calories <= remainingBudget * 1.1
                          );

                          if (filteredRecipes.length === 0) {
                            return (
                              <div className="text-center py-8">
                                <p className="text-sm font-body mb-2" style={{ color: 'var(--muted-foreground)' }}>
                                  На жаль, немає рецептів, які відповідають вашим параметрам
                                </p>
                                <p className="text-xs font-body" style={{ color: 'var(--muted-foreground)' }}>
                                  Спробуйте вибрати іншу калорійність або змініть програму
                                </p>
                              </div>
                            );
                          }

                          return filteredRecipes.map(recipe => (
                            <button key={recipe.id} onClick={() => setSelectedRecipeDetail(recipe)}
                              className="w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all hover:border-green-500 focus:ring-2 focus:ring-offset-2"
                              style={{ borderColor: 'var(--border)', backgroundColor: 'var(--card)' }}
                              aria-label={`Вибрати ${recipe.nameUk} (${recipe.calories} ккал)`}>
                              <span className="text-2xl" aria-hidden="true">{recipe.emoji}</span>
                              <div className="flex-1 min-w-0">
                                <p className="font-body text-sm font-medium" style={{ color: 'var(--foreground)' }}>{recipe.nameUk}</p>
                                <p className="text-xs font-body" style={{ color: 'var(--muted-foreground)' }}>
                                  {recipe.calories} кал · {recipe.prepTime}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="px-2 py-0.5 rounded-full text-xs font-semibold font-body"
                                  style={{ backgroundColor: getBalanceBg(recipe.balanceScore), color: getBalanceColor(recipe.balanceScore) }}>
                                  {recipe.balanceScore}%
                                </span>
                                <Info size={14} style={{ color: 'var(--muted-foreground)' }} aria-hidden="true" />
                              </div>
                            </button>
                          ));
                        })()}
                      </div>
                    </>
                  )
                })()}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  )
}

// ─── Main Page ───────────────────────────────────────────────────────────────

type Mode = 'cook-now' | 'meal-plan'

export default function LandingPage() {
  const { data: session } = useSession()
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([])
  const [mode, setMode] = useState<Mode>('cook-now')
  const [customIngredient, setCustomIngredient] = useState('')
  const router = useRouter()
  const { setItems } = useShoppingStore()

  const toggleIngredient = (ing: string) => {
    setSelectedIngredients(prev => prev.includes(ing) ? prev.filter(i => i !== ing) : [...prev, ing])
  }

  const addCustom = () => {
    const trimmed = customIngredient.trim()
    if (trimmed && !selectedIngredients.includes(trimmed)) {
      setSelectedIngredients(prev => [...prev, trimmed])
      setCustomIngredient('')
    }
  }

  // When a recipe card is clicked — if logged in go straight to recipe, else login with callbackUrl
  const handleRecipeClick = (recipe: Recipe) => {
    const dest = `/recipe/${recipe.id}`
    if (session) {
      router.push(dest)
    } else {
      router.push(`/auth/signin?callbackUrl=${encodeURIComponent(dest)}`)
    }
  }

  // When "Скласти список покупок" is clicked — build list then login or go directly
  const handleBuildShoppingList = (plan: DayPlan[]) => {
    const ingredientMap = new Map<string, ShoppingItem>()
    plan.forEach(day => {
      day.meals.forEach(slot => {
        if (!slot.recipe) return
        slot.recipe.ingredients.forEach(ing => {
          const key = ing.toLowerCase()
          if (ingredientMap.has(key)) {
            ingredientMap.get(key)!.quantity += 1
            ingredientMap.get(key)!.fromRecipes.push(slot.recipe!.nameUk)
          } else {
            ingredientMap.set(key, {
              id: generateId(),
              ingredientName: ing,
              quantity: 1,
              unit: 'шт',
              category: 'produce',
              fromRecipes: [slot.recipe!.nameUk],
              checked: false,
            })
          }
        })
      })
    })
    setItems(Array.from(ingredientMap.values()))

    if (session) {
      router.push('/shopping')
    } else {
      router.push(`/auth/signin?callbackUrl=${encodeURIComponent('/shopping')}`)
    }
  }

  const filteredRecipes = selectedIngredients.length === 0
    ? RECIPES
    : RECIPES.filter(r => r.ingredients.some(ing => selectedIngredients.includes(ing)))
        .sort((a, b) =>
          b.ingredients.filter(i => selectedIngredients.includes(i)).length -
          a.ingredients.filter(i => selectedIngredients.includes(i)).length
        )

  const displayRecipes = filteredRecipes.slice(0, 6)

  return (
    <main style={{ backgroundColor: 'var(--background)', color: 'var(--foreground)' }}>

      {/* ── Navbar ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-5">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2" style={{ color: 'var(--primary-foreground)' }}>
            <Leaf size={22} />
            <span className="font-display text-xl">BalanceBite</span>
          </div>

          {session ? (
            /* Logged in — show avatar + menu link + sign out */
            <div className="flex items-center gap-3">
              <Link href="/#ingredients"
                className="px-4 py-2 rounded-full text-sm font-body font-medium transition-colors"
                style={{ color: 'var(--primary-foreground)', backgroundColor: 'hsla(40,33%,97%,0.15)', backdropFilter: 'blur(8px)' }}>
                Моє меню
              </Link>
              {session.user?.image && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={session.user.image} alt="" className="w-8 h-8 rounded-full border-2 border-white/30" />
              )}
              <button
                onClick={() => signOut({ callbackUrl: '/' })}
                className="px-4 py-2 rounded-full text-sm font-body font-medium border transition-colors"
                style={{ color: 'var(--primary-foreground)', borderColor: 'hsla(40,33%,97%,0.3)', backgroundColor: 'hsla(40,33%,97%,0.1)', backdropFilter: 'blur(8px)' }}>
                Вийти
              </button>
            </div>
          ) : (
            /* Not logged in — show Увійти */
            <Link href="/auth/signin"
              className="px-5 py-2 rounded-full text-sm font-body font-medium border transition-colors"
              style={{ color: 'var(--primary-foreground)', borderColor: 'hsla(40,33%,97%,0.3)', backgroundColor: 'hsla(40,33%,97%,0.1)', backdropFilter: 'blur(8px)' }}>
              Увійти
            </Link>
          )}
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <img src="https://images.unsplash.com/photo-1506368249639-73a05d6f6488?w=1600&q=80"
            alt="Fresh ingredients" className="w-full h-full object-cover" loading="eager" />
          <div className="absolute inset-0" style={{ backgroundColor: 'hsla(150,20%,10%,0.6)' }} />
        </div>
        <div className="relative z-10 text-center px-6 max-w-3xl mx-auto">
          <p className="animate-fade-up text-sm tracking-widest uppercase mb-4 font-body"
            style={{ color: 'hsla(40,33%,97%,0.8)' }}>
            Здорове харчування, нуль стресу
          </p>
          <h1 className="animate-fade-up-delay-1 font-display text-5xl md:text-7xl leading-tight mb-6"
            style={{ color: 'var(--primary-foreground)' }}>
            Готуйте збалансовано<br />з тим, що маєте
          </h1>
          <p className="animate-fade-up-delay-2 text-lg md:text-xl font-body mb-10 max-w-xl mx-auto"
            style={{ color: 'hsla(40,33%,97%,0.75)' }}>
            Розкажіть, що у вашому холодильнику. Ми підберемо швидкі, збалансовані рецепти, які сподобаються всій родині.
          </p>
          <a href="#ingredients"
            className="animate-fade-up-delay-3 inline-flex items-center gap-2 px-8 py-4 rounded-full font-body font-semibold text-lg transition-all hover:opacity-90 focus:ring-2 focus:ring-offset-2 focus:ring-white"
            style={{ backgroundColor: 'var(--primary)', color: 'var(--primary-foreground)' }}>
            Почати
          </a>
        </div>
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce-slow"
          style={{ color: 'hsla(40,33%,97%,0.5)' }}>
          <ChevronDown size={28} />
        </div>
      </section>

      {/* ── Ingredient Selector ── */}
      <section id="ingredients" className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-display text-4xl md:text-5xl mb-4" style={{ color: 'var(--foreground)' }}>
              Що у вашому холодильнику?
            </h2>
            <p className="text-lg font-body max-w-lg mx-auto" style={{ color: 'var(--muted-foreground)' }}>
              Оберіть інгредієнти, які є вдома. Ми знайдемо збалансовані страви прямо зараз.
            </p>
          </div>

          <div className="flex flex-wrap gap-3 justify-center mb-8">
            {COMMON_INGREDIENTS.map(ing => {
              const selected = selectedIngredients.includes(ing)
              return (
                <button key={ing} onClick={() => toggleIngredient(ing)}
                  className="px-4 py-2 rounded-full font-body text-sm font-medium transition-all duration-200 border focus:ring-2 focus:ring-offset-2"
                  style={{
                    backgroundColor: selected ? 'var(--primary)' : 'var(--card)',
                    borderColor: selected ? 'var(--primary)' : 'var(--border)',
                    color: selected ? 'var(--primary-foreground)' : 'var(--card-foreground)',
                    transform: selected ? 'scale(1.05)' : 'scale(1)',
                    boxShadow: selected ? '0 2px 8px hsla(152,35%,38%,0.3)' : 'none',
                  }}
                  title={selected ? `Видалити ${ing}` : `Додати ${ing}`}
                  aria-pressed={selected}>
                  {selected && <span className="mr-1">✓</span>}
                  {ing}
                </button>
              )
            })}
          </div>

          <div className="flex items-center gap-3 max-w-md mx-auto">
            <input value={customIngredient} onChange={e => setCustomIngredient(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addCustom()}
              placeholder="Додати інший інгредієнт..."
              className="flex-1 px-4 py-3 rounded-full font-body text-sm outline-none transition-all focus:ring-2 focus:ring-offset-2"
              style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', color: 'var(--foreground)' }}
              aria-label="Поле для додавання нового інгредієнта" />
            <button onClick={addCustom}
              className="p-3 rounded-full transition-all hover:opacity-90 focus:ring-2 focus:ring-offset-2"
              style={{ backgroundColor: 'var(--primary)', color: 'var(--primary-foreground)' }}
              aria-label="Додати інгредієнт">
              <Plus size={18} aria-hidden="true" />
            </button>
          </div>

          {selectedIngredients.length > 0 && (
            <div className="mt-8 text-center">
              <p className="text-sm font-body mb-3" style={{ color: 'var(--muted-foreground)' }}>
                {selectedIngredients.length} інгредієнт{selectedIngredients.length !== 1 ? 'ів' : ''} обрано
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                {selectedIngredients.filter(ing => !COMMON_INGREDIENTS.includes(ing)).map(ing => (
                  <span key={ing} className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-body"
                    style={{ backgroundColor: 'var(--secondary)', color: 'var(--secondary-foreground)' }}>
                    {ing}
                    <button onClick={() => toggleIngredient(ing)} className="hover:text-red-500 transition-colors"><X size={14} /></button>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── Mode Switcher ── */}
      <div className="flex justify-center px-6 -mt-6 mb-2">
        <div className="inline-flex items-center rounded-full p-1.5 border"
          style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', boxShadow: '0 1px 4px hsla(150,20%,15%,0.08)' }}>
          {([
            { key: 'cook-now' as Mode, label: 'Готуємо зараз', icon: UtensilsCrossed },
            { key: 'meal-plan' as Mode, label: 'Меню на тиждень', icon: CalendarDays },
          ]).map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => setMode(key)}
              className="relative flex items-center gap-2 px-5 py-2.5 rounded-full font-body text-sm font-semibold transition-all duration-300 focus:ring-2 focus:ring-offset-2"
              style={{
                backgroundColor: mode === key ? 'var(--primary)' : 'transparent',
                color: mode === key ? 'var(--primary-foreground)' : 'var(--muted-foreground)',
              }}
              aria-pressed={mode === key}
              title={label}>
              <Icon size={16} aria-hidden="true" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Cook Now / Meal Plan ── */}
      {mode === 'cook-now' ? (
        <section className="py-20 px-6" style={{ backgroundColor: 'hsla(40,30%,95%,0.5)' }}>
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-14">
              <h2 className="font-display text-4xl md:text-5xl mb-4">
                {selectedIngredients.length > 0 ? 'Рецепти з вашими інгредієнтами' : 'Популярні збалансовані рецепти'}
              </h2>
              <p className="font-body text-lg" style={{ color: 'var(--muted-foreground)' }}>
                {selectedIngredients.length > 0
                  ? `Знайдено ${filteredRecipes.length} рецептів з вашими інгредієнтами`
                  : 'Оберіть інгредієнти вище або натисніть на рецепт, щоб переглянути деталі'}
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayRecipes.map((recipe, i) => (
                <RecipeCard
                  key={recipe.id}
                  recipe={recipe}
                  matchedIngredients={selectedIngredients.length > 0
                    ? recipe.ingredients.filter(ing => selectedIngredients.includes(ing))
                    : undefined}
                  onClickRecipe={handleRecipeClick}
                />
              ))}
            </div>
            {filteredRecipes.length === 0 && (
              <div className="text-center py-16">
                <p className="font-body text-lg" style={{ color: 'var(--muted-foreground)' }}>
                  Рецептів не знайдено. Спробуйте додати більше інгредієнтів!
                </p>
              </div>
            )}
          </div>
        </section>
      ) : (
        <MealPlannerSection
          selectedIngredients={selectedIngredients}
          onBuildShoppingList={handleBuildShoppingList}
        />
      )}

      {/* ── Why ── */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-display text-4xl md:text-5xl mb-4">Чому BalanceBite?</h2>
            <p className="text-lg font-body max-w-lg mx-auto" style={{ color: 'var(--muted-foreground)' }}>
              Ми робимо здорове харчування простим для людей, у яких немає часу на планування.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-10 text-center">
            {[
              { Icon: ShieldCheck, title: 'Збалансоване харчування', desc: 'Кожен рецепт містить оцінку балансу — ви знаєте, що їсте.' },
              { Icon: Clock, title: 'До 30 хвилин', desc: 'Більшість страв готується за 15–25 хвилин. Ідеально для зайнятих сімей.' },
              { Icon: Heart, title: 'Улюблене всією родиною', desc: 'Рецепти, які сподобаються дітям і дорослим. Без прісної їжі.' },
            ].map(({ Icon, title, desc }) => (
              <div key={title} className="flex flex-col items-center gap-4">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl"
                  style={{ backgroundColor: 'hsla(152,35%,38%,0.1)', color: 'var(--primary)' }}>
                  <Icon size={26} />
                </div>
                <h3 className="font-display text-xl" style={{ color: 'var(--foreground)' }}>{title}</h3>
                <p className="text-sm font-body leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="py-10 px-6 border-t" style={{ borderColor: 'var(--border)' }}>
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2" style={{ color: 'var(--foreground)' }}>
            <Leaf size={20} style={{ color: 'var(--primary)' }} />
            <span className="font-display text-lg">BalanceBite</span>
          </div>
          <p className="text-sm font-body" style={{ color: 'var(--muted-foreground)' }}>
            Їжте краще з тим, що маєте. © 2026
          </p>
        </div>
      </footer>

    </main>
  )
}
