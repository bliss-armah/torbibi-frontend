import { apiClient } from './client';
import { ApiResponse, Shop, PaginatedResponse } from '@/types';

export interface PublicShopsParams {
  page?: number;
  limit?: number;
}

export interface CreateShopPayload {
  name: string;
  description?: string;
  phone: string;
  email?: string;
  address?: {
    region: string;
    city: string;
    area?: string;
    digitalAddress?: string;
  };
}

export const shopApi = {
  listPublic: (params?: PublicShopsParams) =>
    apiClient
      .get<ApiResponse<PaginatedResponse<Shop>>>('/shops', { params })
      .then((r) => r.data.data),

  create: (payload: CreateShopPayload) =>
    apiClient
      .post<ApiResponse<{ shop: Shop }>>('/shops', payload)
      .then((r) => r.data.data.shop),

  getBySlug: (slug: string) =>
    apiClient
      .get<ApiResponse<{ shop: Shop }>>(`/shops/${slug}`)
      .then((r) => r.data.data.shop),

  getMyShops: () =>
    apiClient
      .get<ApiResponse<{ shops: Shop[] }>>('/shops/my/shops')
      .then((r) => r.data.data.shops),

  update: (shopId: string, payload: Partial<CreateShopPayload>) =>
    apiClient
      .patch<ApiResponse<{ shop: Shop }>>(`/shops/${shopId}`, payload)
      .then((r) => r.data.data.shop),
};
