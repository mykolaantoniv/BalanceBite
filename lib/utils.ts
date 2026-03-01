import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { Ingredient, ShoppingItem } from '@/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPrice(kopecks: number): string {
  return `${(kopecks / 100).toFixed(2)} ₴`
}

export function generateId(): string {
  return Math.random().toString(36).slice(2, 11)
}

// Merge ingredients from multiple recipes into a unified shopping list
export function mergeIngredients(ingredientsList: Ingredient[][]): ShoppingItem[] {
  const map = new Map<string, ShoppingItem>()

  for (const ingredients of ingredientsList) {
    for (const ing of ingredients) {
      const key = ing.name.toLowerCase().trim()
      if (map.has(key)) {
        const existing = map.get(key)!
        // If same unit, sum quantities
        if (existing.unit === ing.unit) {
          existing.quantity += ing.quantity
        }
      } else {
        map.set(key, {
          id: generateId(),
          ingredientName: ing.name,
          quantity: ing.quantity,
          unit: ing.unit,
          category: ing.category,
          fromRecipes: [],
          checked: false,
        })
      }
    }
  }

  return Array.from(map.values())
}

export const DAYS_UK = ['Понеділок', 'Вівторок', 'Середа', 'Четвер', "П'ятниця", 'Субота', 'Неділя']
export const DAYS_EN = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

export const MEAL_LABELS: Record<string, string> = {
  breakfast: '🌅 Сніданок',
  lunch:     '☀️ Обід',
  dinner:    '🌙 Вечеря',
  snack:     '🍎 Перекус',
}

export const CATEGORY_ICONS: Record<string, string> = {
  dairy:     '🥛',
  produce:   '🥦',
  meat:      '🥩',
  seafood:   '🐟',
  bakery:    '🍞',
  frozen:    '❄️',
  grocery:   '🫙',
  beverages: '🧃',
  snacks:    '🍿',
  other:     '🛒',
}
