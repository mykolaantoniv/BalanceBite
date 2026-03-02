'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { UserPreferences, WeeklyMenu, ShoppingItem, CartItem, ZakazProduct } from '@/types'
import { generateId } from '@/lib/utils'

// ─── User Preferences ────────────────────────────────────────────────────────

interface PrefsStore {
  prefs: UserPreferences
  setPrefs: (p: Partial<UserPreferences>) => void
  hasOnboarded: boolean
  setHasOnboarded: (v: boolean) => void
}

export const usePrefsStore = create<PrefsStore>()(
  persist(
    (set) => ({
      hasOnboarded: false,
      prefs: {
        familySize: 2,
        dietaryRestrictions: [],
        cuisinePreferences: [],
        allergies: [],
        budget: 'medium',
        dislikedIngredients: [],
      },
      setPrefs: (p) => set((s) => ({ prefs: { ...s.prefs, ...p } })),
      setHasOnboarded: (v) => set({ hasOnboarded: v }),
    }),
    { name: 'user-prefs' }
  )
)

// ─── Menu Store ──────────────────────────────────────────────────────────────

interface MenuStore {
  menu: WeeklyMenu
  setSlot: (day: number, mealType: string, recipeId: string | null) => void
  clearMenu: () => void
}

const emptyMenu = (): WeeklyMenu => ({
  id: generateId(),
  weekStart: new Date().toISOString().slice(0, 10),
  slots: [],
})

export const useMenuStore = create<MenuStore>()(
  persist(
    (set) => ({
      menu: emptyMenu(),
      setSlot: (day, mealType, recipeId) =>
        set((s) => {
          const slots = s.menu.slots.filter(
            (sl) => !(sl.day === day && sl.mealType === mealType as never)
          )
          if (recipeId !== null) {
            slots.push({ day, mealType: mealType as never, recipe: { id: recipeId } as never })
          }
          return { menu: { ...s.menu, slots } }
        }),
      clearMenu: () => set({ menu: emptyMenu() }),
    }),
    { name: 'weekly-menu' }
  )
)

// ─── Shopping List Store ──────────────────────────────────────────────────────

interface ShoppingStore {
  items: ShoppingItem[]
  setItems: (items: ShoppingItem[]) => void
  updateItem: (id: string, patch: Partial<ShoppingItem>) => void
  setMatchedProduct: (itemId: string, product: ZakazProduct) => void
  toggleItem: (id: string) => void
  clearList: () => void
}

export const useShoppingStore = create<ShoppingStore>()(
  persist(
    (set) => ({
      items: [],
      setItems: (items) => set({ items }),
      updateItem: (id, patch) =>
        set((s) => ({
          items: s.items.map((i) => (i.id === id ? { ...i, ...patch } : i)),
        })),
      setMatchedProduct: (itemId, product) =>
        set((s) => ({
          items: s.items.map((i) =>
            i.id === itemId
              ? { ...i, matchedProduct: product, selectedProductId: product.ean }
              : i
          ),
        })),
      toggleItem: (id) =>
        set((s) => ({
          items: s.items.map((i) => (i.id === id ? { ...i, checked: !i.checked } : i)),
        })),
      clearList: () => set({ items: [] }),
    }),
    { name: 'shopping-list' }
  )
)

// ─── Cart Store ───────────────────────────────────────────────────────────────

/**
 * Calculate how many packages of a product to buy.
 * 
 * productWeight = weight of ONE package in grams (from API, e.g. "500" means 500g)
 * 
 * Examples:
 *   Фарш 1 кг, package 500г → 2 packages
 *   Картопля 3 шт, package = piece item → 3 packages  
 *   Сметана 100г, package 400г → 1 package
 *   Молоко 0.5 кг = 500г, package 950г → 1 package
 */
function calcPackageQty(quantity: number, unit: string, productWeightStr: string): number {
  const productWeightG = parseFloat(productWeightStr) || 0

  if (productWeightG > 0) {
    // Convert ingredient quantity to grams
    let ingredientG = 0
    if (unit === 'кг') ingredientG = quantity * 1000
    else if (unit === 'г') ingredientG = quantity
    else if (unit === 'мл') ingredientG = quantity  // approximate ml ≈ g
    else if (unit === 'л') ingredientG = quantity * 1000
    else {
      // шт, зуб, ст.л etc — can't convert to g, just use 1 package
      return Math.max(1, Math.ceil(quantity))
    }
    return Math.max(1, Math.ceil(ingredientG / productWeightG))
  }

  // No weight info — just round up
  return Math.max(1, Math.ceil(quantity))
}

interface CartStore {
  cartItems: CartItem[]
  buildCart: (shoppingItems: ShoppingItem[]) => void
  updateQuantity: (ean: string, qty: number) => void
  setQuantityDirect: (ean: string, qty: number) => void
  removeItem: (ean: string) => void
  clearCart: () => void
  isSubmitting: boolean
  setSubmitting: (v: boolean) => void
  lastResult: { success: boolean; message: string } | null
  setResult: (r: { success: boolean; message: string } | null) => void
}

export const useCartStore = create<CartStore>()(
  persist(
    (set) => ({
  cartItems: [],
  buildCart: (shoppingItems) => {
    const cartItems: CartItem[] = shoppingItems
      .filter((i) => i.matchedProduct)
      .map((i) => ({
        product: i.matchedProduct!,
        quantity: calcPackageQty(i.quantity, i.unit, i.matchedProduct!.weight),
      }))
    set({ cartItems })
  },
  updateQuantity: (ean, qty) =>
    set((s) => ({
      cartItems: qty <= 0
        ? s.cartItems.filter((c) => c.product.ean !== ean)
        : s.cartItems.map((c) => (c.product.ean === ean ? { ...c, quantity: qty } : c)),
    })),
  setQuantityDirect: (ean, qty) =>
    set((s) => ({
      cartItems: s.cartItems.map((c) =>
        c.product.ean === ean ? { ...c, quantity: Math.max(1, qty) } : c
      ),
    })),
  removeItem: (ean) =>
    set((s) => ({ cartItems: s.cartItems.filter((c) => c.product.ean !== ean) })),
  clearCart: () => set({ cartItems: [] }),
  isSubmitting: false,
  setSubmitting: (v) => set({ isSubmitting: v }),
  lastResult: null,
  setResult: (r) => set({ lastResult: r }),
    }),
    { name: 'cart-items' }
  )
)

// ─── Zakaz Connection Store ───────────────────────────────────────────────────

interface ZakazConnectionStore {
  isConnected: boolean
  setConnected: (v: boolean) => void
}

export const useZakazStore = create<ZakazConnectionStore>()((set) => ({
  isConnected: false,
  setConnected: (v) => set({ isConnected: v }),
}))
