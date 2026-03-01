// ─── User & Auth ────────────────────────────────────────────────────────────

export interface UserPreferences {
  familySize: number
  dietaryRestrictions: string[]   // e.g. ['vegetarian', 'gluten-free']
  cuisinePreferences: string[]    // e.g. ['italian', 'ukrainian', 'asian']
  allergies: string[]
  budget: 'low' | 'medium' | 'high'
  dislikedIngredients: string[]
}

// ─── Recipes & Menu ──────────────────────────────────────────────────────────

export interface Ingredient {
  name: string
  quantity: number
  unit: string
  category: string               // e.g. 'dairy', 'produce', 'meat'
}

export interface Recipe {
  id: string
  name: string
  nameUk: string
  description: string
  imageUrl?: string
  prepTime: number               // minutes
  cookTime: number               // minutes
  servings: number
  cuisine: string
  tags: string[]
  ingredients: Ingredient[]
  instructions: string[]
  calories?: number
}

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack'

export interface MenuSlot {
  day: number                    // 0 = Monday … 6 = Sunday
  mealType: MealType
  recipe: Recipe | null
}

export interface WeeklyMenu {
  id: string
  weekStart: string              // ISO date
  slots: MenuSlot[]
}

// ─── Shopping List ───────────────────────────────────────────────────────────

export interface ShoppingItem {
  id: string
  ingredientName: string
  quantity: number
  unit: string
  category: string
  fromRecipes: string[]          // recipe names this item comes from
  checked: boolean
  // After product matching:
  matchedProduct?: ZakazProduct
  selectedProductId?: string
}

// ─── Zakaz.ua / Auchan ───────────────────────────────────────────────────────

export interface ZakazProduct {
  ean: string
  title: string
  img: string
  price: number                  // in kopecks (divide by 100 for UAH)
  weight: string
  producer?: string
  in_stock: boolean
  discount?: number
}

export interface ZakazSearchResult {
  results: ZakazProduct[]
  count: number
}

export interface CartItem {
  product: ZakazProduct
  quantity: number
}

export interface CartState {
  items: CartItem[]
  storeId: string
}

// ─── Session ─────────────────────────────────────────────────────────────────

export interface ZakazSession {
  userId: string                 // your app user ID
  token: string                  // zakaz.ua session token
  expiresAt: number              // timestamp
}
