'use client';

import { useEffect } from 'react';
import { Provider } from 'react-redux';
import { store } from '@/store';
import { setCredentials } from '@/store/slices/authSlice';
import type { User } from '@/types';

/**
 * Reads accessToken + user from localStorage on first mount and rehydrates
 * the Redux auth slice. Without this, a page refresh would wipe the auth state
 * even though the cookie (used by middleware) and localStorage token are still valid.
 */
function AuthRehydrator({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    const userRaw = localStorage.getItem('user');
    if (!token || !userRaw) return;

    try {
      // Decode JWT payload (no signature verification — backend validates on every API call)
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (payload.exp * 1000 < Date.now()) {
        // Token expired — clean up everything
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
      // Malformed token or user JSON — leave state empty, middleware will guard routes
    }
  }, []);

  return <>{children}</>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <AuthRehydrator>{children}</AuthRehydrator>
    </Provider>
  );
}
