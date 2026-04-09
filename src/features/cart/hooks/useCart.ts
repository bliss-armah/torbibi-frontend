'use client';

import { useAppDispatch, useAppSelector } from '@/store';
import { addItem, removeItem, updateQuantity, clearCart, selectCartTotal, selectCartItemCount } from '@/store/slices/cartSlice';
import { Product } from '@/types';

export function useCart() {
  const dispatch = useAppDispatch();
  const { items, shopId } = useAppSelector((state) => state.cart);
  const total = useAppSelector(selectCartTotal);
  const itemCount = useAppSelector(selectCartItemCount);

  return {
    items,
    shopId,
    total,
    itemCount,
    addToCart: (product: Product, quantity = 1) =>
      dispatch(addItem({ product, quantity })),
    removeFromCart: (productId: string) =>
      dispatch(removeItem(productId)),
    updateItemQuantity: (productId: string, quantity: number) =>
      dispatch(updateQuantity({ productId, quantity })),
    clearCart: () => dispatch(clearCart()),
  };
}
