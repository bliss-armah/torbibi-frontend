'use client';

import { useEffect } from 'react';
import { Provider } from 'react-redux';
import { store } from '@/store';
import { setCredentials } from '@/store/slices/authSlice';
import { hydrateCart, CartState } from '@/store/slices/cartSlice';
import type { User } from '@/types';

const CART_STORAGE_KEY = 'torbibi_cart';

function AuthRehydrator({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    const userRaw = localStorage.getItem('user');
    if (!token || !userRaw) return;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (payload.exp * 1000 < Date.now()) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        document.cookie = 'accessToken=; path=/; max-age=0; SameSite=Lax';
        return;
      }

      const user: User = JSON.parse(userRaw);
      store.dispatch(
        setCredentials({
          accessToken: token,
          refreshToken: localStorage.getItem('refreshToken') ?? '',
          user,
        })
      );
    } catch {
      // Malformed token — leave auth empty, middleware guards routes
    }
  }, []);

  return <>{children}</>;
}

function CartRehydrator({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Restore cart from localStorage on mount
    try {
      const raw = localStorage.getItem(CART_STORAGE_KEY);
      if (raw) {
        const saved: CartState = JSON.parse(raw);
        if (Array.isArray(saved.items)) {
          store.dispatch(hydrateCart(saved));
        }
      }
    } catch {
      // Corrupt storage — ignore, start with empty cart
    }

    // Subscribe to store changes and persist cart state
    const unsubscribe = store.subscribe(() => {
      try {
        const cart = store.getState().cart;
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
      } catch {
        // Storage full or unavailable — fail silently
      }
    });

    return unsubscribe;
  }, []);

  return <>{children}</>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <AuthRehydrator>
        <CartRehydrator>
          {children}
        </CartRehydrator>
      </AuthRehydrator>
    </Provider>
  );
}
