import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '@/api/axiosInstance';

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
  fetchCart: () => Promise<void>;
  addToCart: (item: Omit<CartItem, 'quantity' | 'cartItemId' | 'stock'>) => Promise<void>;
  removeFromCart: (kitId: number) => Promise<void>;
  updateQuantity: (kitId: number, delta: number) => Promise<void>;
  clearCart: () => void;
  getTotal: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      fetchCart: async () => {
        try {
          const { data } = await api.get('/Carts/MyCart');         
          console.log("Raw Cart Data:", data);
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
            stock: item.kit?.stockQuantity || 999
          }));
          
          set({ items: formattedItems });
        } catch (error) {
          console.error("Failed to fetch cart:", error);
          if ((error as any)?.response?.status === 401) set({ items: [] });
        }
      },

      addToCart: async (item) => {
        try {
          await api.post('/Carts/Add', { kitId: item.id, quantity: 1 });
          await get().fetchCart(); 
        } catch (error) {
          console.error("Add to cart failed:", error);
        }
      },

      removeFromCart: async (kitId) => {
        try {
          const itemToRemove = get().items.find((i) => i.id === kitId);

          if (!itemToRemove) {
             console.error("Item not found in local store");
             return;
          }

          const deleteId = itemToRemove.cartItemId;
          console.log(`Deleting Kit ${kitId} -> CartItemId: ${deleteId}`);

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
    }),
    { name: 'shopping-cart' }
  )
);