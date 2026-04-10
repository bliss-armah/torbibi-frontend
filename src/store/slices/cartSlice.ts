import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { CartItem, Product } from '@/types';

interface CartState {
  shopId: string | null;    // Cart is scoped to a single shop
  shopSlug: string | null;  // Used to link back to the shop from checkout
  items: CartItem[];
}

const initialState: CartState = {
  shopId: null,
  shopSlug: null,
  items: [],
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addItem(state, action: PayloadAction<{ product: Product; quantity: number; shopSlug?: string }>) {
      const { product, quantity, shopSlug } = action.payload;

      // Enforce single-shop cart — clear if switching shops
      if (state.shopId && state.shopId !== product.shopId) {
        state.items = [];
      }
      state.shopId = product.shopId;
      if (shopSlug) state.shopSlug = shopSlug;

      const existing = state.items.find((i) => i.product.id === product.id);
      if (existing) {
        existing.quantity += quantity;
      } else {
        state.items.push({ product, quantity });
      }
    },

    removeItem(state, action: PayloadAction<string>) {
      state.items = state.items.filter((i) => i.product.id !== action.payload);
      if (state.items.length === 0) state.shopId = null;
    },

    updateQuantity(state, action: PayloadAction<{ productId: string; quantity: number }>) {
      const item = state.items.find((i) => i.product.id === action.payload.productId);
      if (item) {
        item.quantity = Math.max(1, action.payload.quantity);
      }
    },

    clearCart(state) {
      state.items = [];
      state.shopId = null;
      state.shopSlug = null;
    },

    hydrateCart(state, action: PayloadAction<CartState>) {
      state.shopId = action.payload.shopId;
      state.shopSlug = action.payload.shopSlug;
      state.items = action.payload.items;
    },
  },
});

export const { addItem, removeItem, updateQuantity, clearCart, hydrateCart } = cartSlice.actions;
export type { CartState };

// Selectors
export const selectCartTotal = (state: { cart: CartState }): number =>
  state.cart.items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

export const selectCartItemCount = (state: { cart: CartState }): number =>
  state.cart.items.reduce((sum, item) => sum + item.quantity, 0);

export default cartSlice.reducer;
