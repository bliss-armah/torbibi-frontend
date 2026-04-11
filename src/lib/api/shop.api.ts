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

export interface UpdateShopPayload extends Partial<CreateShopPayload> {
  brandColor?: string | null;
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

  update: (shopId: string, payload: UpdateShopPayload) =>
    apiClient
      .patch<ApiResponse<{ shop: Shop }>>(`/shops/${shopId}`, payload)
      .then((r) => r.data.data.shop),

  uploadLogo: (shopId: string, file: File) => {
    const formData = new FormData();
    formData.append('logo', file);
    return apiClient
      .patch<ApiResponse<{ logoUrl: string; publicId: string }>>(
        `/shops/${shopId}/logo`,
        formData,
        { headers: { 'Content-Type': undefined } }
      )
      .then((r) => r.data.data);
  },

  uploadBanner: (shopId: string, file: File) => {
    const formData = new FormData();
    formData.append('banner', file);
    return apiClient
      .patch<ApiResponse<{ bannerUrl: string; publicId: string }>>(
        `/shops/${shopId}/banner`,
        formData,
        { headers: { 'Content-Type': undefined } }
      )
      .then((r) => r.data.data);
  },
};
