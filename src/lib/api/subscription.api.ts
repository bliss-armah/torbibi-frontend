import { apiClient } from './client';
import { ApiResponse } from '@/types';

export type SubscriptionStatus = 'trialing' | 'active' | 'past_due' | 'cancelled';

export interface SubscriptionStatusDetails {
  subscriptionStatus: SubscriptionStatus;
  trialEndsAt: string | null;
  currentPeriodEnd: string | null;
  paystackSubscriptionCode: string | null;
}

export const subscriptionApi = {
  subscribe: (shopId: string) =>
    apiClient
      .post<ApiResponse<{ authorizationUrl: string }>>(`/subscriptions/shop/${shopId}`, {})
      .then((r) => r.data.data),

  getStatus: (shopId: string) =>
    apiClient
      .get<ApiResponse<SubscriptionStatusDetails>>(`/subscriptions/shop/${shopId}`)
      .then((r) => r.data.data),

  cancel: (shopId: string) =>
    apiClient.delete(`/subscriptions/shop/${shopId}`).then((r) => r.data),
};
