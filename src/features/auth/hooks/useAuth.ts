'use client';

import { useAppDispatch, useAppSelector } from '@/store';
import { requestOtp, verifyOtp, logout } from '@/store/slices/authSlice';
import { useRouter } from 'next/navigation';

export function useAuth() {
  const dispatch = useAppDispatch();
  const { user, isLoading, error } = useAppSelector((state) => state.auth);
  const router = useRouter();

  const sendOtp = async (phone: string, type: 'login' | 'register' = 'login') => {
    const result = await dispatch(requestOtp({ phone, type }));
    return !result.type.endsWith('rejected');
  };

  const confirmOtp = async (phone: string, code: string, type: 'login' | 'register' = 'login') => {
    const result = await dispatch(verifyOtp({ phone, code, type }));
    if (!result.type.endsWith('rejected')) {
      router.push('/dashboard');
      return true;
    }
    return false;
  };

  const signOut = () => {
    dispatch(logout());
    router.push('/login');
  };

  return {
    user,
    isLoading,
    error,
    isAuthenticated: !!user,
    isShopOwner: user?.role === 'shop_owner' || user?.role === 'admin',
    sendOtp,
    confirmOtp,
    signOut,
  };
}
