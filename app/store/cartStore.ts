import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface CartItem {
  id: string
  productId: string
  name: string
  price: number
  quantity: number
  discount: number
  subtotal: number
  sku: string
}

interface CartStore {
  items: CartItem[]
  customerId: string | null
  discount: number
  addItem: (item: Omit<CartItem, 'subtotal'>) => void
  updateQuantity: (id: string, quantity: number) => void
  removeItem: (id: string) => void
  setDiscount: (discount: number) => void
  setCustomer: (customerId: string | null) => void
  clearCart: () => void
  getTotal: () => number
  getSubtotal: () => number
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      customerId: null,
      discount: 0,

      addItem: (item) => {
        const items = get().items
        const existingItem = items.find(i => i.productId === item.productId)

        if (existingItem) {
          set({
            items: items.map(i =>
              i.productId === item.productId
                ? { ...i, quantity: i.quantity + item.quantity, subtotal: (i.quantity + item.quantity) * i.price - i.discount }
                : i
            )
          })
        } else {
          const subtotal = item.quantity * item.price - item.discount
          set({ items: [...items, { ...item, subtotal }] })
        }
      },

      updateQuantity: (id, quantity) => {
        if (quantity <= 0) {
          get().removeItem(id)
          return
        }
        set({
          items: get().items.map(item =>
            item.id === id
              ? { ...item, quantity, subtotal: quantity * item.price - item.discount }
              : item
          )
        })
      },

      removeItem: (id) => {
        set({ items: get().items.filter(item => item.id !== id) })
      },

      setDiscount: (discount) => set({ discount }),

      setCustomer: (customerId) => set({ customerId }),

      clearCart: () => set({ items: [], customerId: null, discount: 0 }),

      getSubtotal: () => {
        return get().items.reduce((sum, item) => sum + item.subtotal, 0)
      },

      getTotal: () => {
        const subtotal = get().getSubtotal()
        return subtotal - get().discount
      }
    }),
    {
      name: 'cart-storage',
    }
  )
)
