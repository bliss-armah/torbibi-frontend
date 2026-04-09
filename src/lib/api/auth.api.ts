import { apiClient } from './client';
import { ApiResponse, User } from '@/types';

export interface RequestOtpPayload {
  phone: string;
  type?: 'login' | 'register';
}

export interface VerifyOtpPayload {
  phone: string;
  code: string;
  type?: 'login' | 'register';
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export const authApi = {
  requestOtp: (payload: RequestOtpPayload) =>
    apiClient
      .post<ApiResponse<{ message: string; isNewUser: boolean }>>('/auth/otp/request', payload)
      .then((r) => r.data.data),

  verifyOtp: (payload: VerifyOtpPayload) =>
    apiClient
      .post<ApiResponse<AuthTokens>>('/auth/otp/verify', payload)
      .then((r) => r.data.data),

  me: () =>
    apiClient
      .get<ApiResponse<{ user: User }>>('/auth/me')
      .then((r) => r.data.data.user),
};
