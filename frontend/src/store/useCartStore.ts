import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '@/api/axiosInstance';

const DEFAULT_STOCK_FALLBACK = 999;

const isAuthenticated = () => !!localStorage.getItem('token');

interface CartItem {
  id: number;
  cartItemId: number;
  name: string;
  price: number;
  imageUrl?: string;
  quantity: number;
  stock: number;
}

interface CartState {
  items: CartItem[];
  isLoading: boolean;
  error: string | null;
  fetchCart: () => Promise<void>;
  addToCart: (item: Omit<CartItem, 'quantity' | 'cartItemId' | 'stock'>) => Promise<void>;
  removeFromCart: (kitId: number) => Promise<void>;
  updateQuantity: (kitId: number, delta: number) => Promise<void>;
  clearCart: () => void;
  getTotal: () => number;
  resetError: () => void;
  syncCartToBackend: () => Promise<void>;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isLoading: false,
      error: null,

      fetchCart: async () => {
        // Guest mode: cart is already in localStorage via zustand persist
        if (!isAuthenticated()) {
          set({ isLoading: false, error: null });
          return;
        }
        set({ isLoading: true, error: null });
        try {
          const { data } = await api.get('/Carts/MyCart');         
          let rawItems: any[] = [];
          if (Array.isArray(data)) {
            rawItems = data;
          } else if (data && Array.isArray(data.items)) {
            rawItems = data.items;
          } else if (data && Array.isArray(data.cartItems)) {
            rawItems = data.cartItems;
          }

          const formattedItems = rawItems.map((item: any) => ({
            id: item.kitId || item.kit?.id || item.id,
            cartItemId: item.cartItemId || item.id, 
            name: item.kitName || item.kit?.name || item.name || "Unknown Kit",
            price: Number(item.price || item.kit?.price || 0),
            imageUrl: item.imageUrl || item.kit?.imageUrl || "",
            quantity: item.quantity,
            stock: item.kit?.stockQuantity || DEFAULT_STOCK_FALLBACK
          }));
          
          set({ items: formattedItems, isLoading: false, error: null });
        } catch (error) {
          console.error("Failed to fetch cart:", error);
          let errorMessage = "Failed to load cart";
          if (error && typeof error === 'object') {
            if ('response' in error && error.response && typeof error.response === 'object') {
              if ('data' in error.response && error.response.data && typeof error.response.data === 'object' && 'message' in error.response.data) {
                errorMessage = String(error.response.data.message);
              }
              if ('status' in error.response && error.response.status === 401) {
                // Keep local items for guest, don't clear
              }
            } else if ('message' in error) {
              errorMessage = String(error.message);
            }
          }
          set({ error: errorMessage, isLoading: false });
        }
      },

      addToCart: async (item) => {
        if (!isAuthenticated()) {
          // Guest mode: add locally
          const existing = get().items.find((i) => i.id === item.id);
          if (existing) {
            set({
              items: get().items.map((i) =>
                i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
              ),
            });
          } else {
            set({
              items: [...get().items, {
                ...item,
                cartItemId: 0,
                quantity: 1,
                stock: DEFAULT_STOCK_FALLBACK,
              }],
            });
          }
          return;
        }
        try {
          await api.post('/Carts/Add', { kitId: item.id, quantity: 1 });
          await get().fetchCart(); 
        } catch (error) {
          console.error("Add to cart failed:", error);
        }
      },

      removeFromCart: async (kitId) => {
        if (!isAuthenticated()) {
          // Guest mode: remove locally
          set({ items: get().items.filter((i) => i.id !== kitId) });
          return;
        }
        try {
          const itemToRemove = get().items.find((i) => i.id === kitId);
          if (!itemToRemove) {
             console.error("Item not found in local store");
             return;
          }
          const deleteId = itemToRemove.cartItemId;
          if (!deleteId) {
             console.error("Missing CartItemId, cannot delete.");
             return;
          }
          await api.delete(`/Carts/RemoveItem/${deleteId}`);
          await get().fetchCart();
        } catch (error) {
          console.error("Removal failed:", error);
          set({ items: get().items.filter((i) => i.id !== kitId) });
        }
      },

      updateQuantity: async (kitId, delta) => {
        const item = get().items.find((i) => i.id === kitId);
        if (!item) return;
        const newQty = Math.max(1, item.quantity + delta);

        if (!isAuthenticated()) {
          // Guest mode: update locally
          set({
            items: get().items.map((i) =>
              i.id === kitId ? { ...i, quantity: newQty } : i
            ),
          });
          return;
        }
        try {
          await api.put('/Carts/UpdateQuantity', { kitId: kitId, quantity: newQty });
          set({
            items: get().items.map((i) =>
              i.id === kitId ? { ...i, quantity: newQty } : i
            ),
          });
          get().fetchCart();
        } catch (error) {
          console.error("Quantity sync failed:", error);
        }
      },

      clearCart: () => set({ items: [] }),
      
      getTotal: () => {
        const items = get().items || [];
        return items.reduce((acc, i) => acc + (Number(i.price) * i.quantity), 0);
      },

      resetError: () => set({ error: null }),

      syncCartToBackend: async () => {
        const localItems = get().items;
        if (!isAuthenticated() || localItems.length === 0) return;
        
        try {
          // Push each local item to the backend cart
          for (const item of localItems) {
            await api.post('/Carts/Add', { kitId: item.id, quantity: item.quantity });
          }
          // Refresh cart from backend (backend may have merged duplicates)
          await get().fetchCart();
        } catch (error) {
          console.error("Cart sync failed:", error);
          // Still try to fetch server cart even if some adds failed
          await get().fetchCart();
        }
      },
    }),
    { name: 'shopping-cart' }
  )
);