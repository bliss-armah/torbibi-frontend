import { apiClient } from './client';
import { ApiResponse, Product, ProductImage, PaginatedResponse } from '@/types';

export interface CreateProductPayload {
  name: string;
  description?: string;
  price: number;
  compareAtPrice?: number;
  sku?: string;
  quantity?: number;
  trackInventory?: boolean;
  categoryId?: string;
  tags?: string[];
  images?: ProductImage[];
}

export interface ProductListParams {
  page?: number;
  limit?: number;
  status?: 'active' | 'draft' | 'archived';
  search?: string;
  categoryId?: string;
}

export const productApi = {
  // Storefront (public)
  listStorefront: (shopSlug: string, params?: ProductListParams) =>
    apiClient
      .get<ApiResponse<PaginatedResponse<Product>>>(`/products/storefront/${shopSlug}`, { params })
      .then((r) => r.data.data),

  getStorefrontProduct: (shopSlug: string, productId: string) =>
    apiClient
      .get<ApiResponse<{ product: Product }>>(`/products/storefront/${shopSlug}/${productId}`)
      .then((r) => r.data.data.product),

  // Dashboard (protected)
  listDashboard: (shopId: string, params?: ProductListParams) =>
    apiClient
      .get<ApiResponse<PaginatedResponse<Product>>>(`/products/shop/${shopId}`, { params })
      .then((r) => r.data.data),

  create: (shopId: string, payload: CreateProductPayload) =>
    apiClient
      .post<ApiResponse<{ product: Product }>>(`/products/shop/${shopId}`, payload)
      .then((r) => r.data.data.product),

  update: (shopId: string, productId: string, payload: Partial<CreateProductPayload>) =>
    apiClient
      .patch<ApiResponse<{ product: Product }>>(`/products/shop/${shopId}/${productId}`, payload)
      .then((r) => r.data.data.product),

  updateStatus: (shopId: string, productId: string, status: 'active' | 'draft' | 'archived') =>
    apiClient
      .patch<ApiResponse<{ product: Product }>>(`/products/shop/${shopId}/${productId}/status`, { status })
      .then((r) => r.data.data.product),

  delete: (shopId: string, productId: string) =>
    apiClient.delete(`/products/shop/${shopId}/${productId}`),

  uploadImages: (shopId: string, files: File[]) => {
    const formData = new FormData();
    files.forEach((f) => formData.append('images', f));
    return apiClient
      .post<ApiResponse<{ images: Array<{ url: string; publicId: string }> }>>(
        `/products/shop/${shopId}/images`,
        formData,
        // Unset Content-Type so the browser sets multipart/form-data with the
        // correct boundary. The axios instance default of application/json would
        // otherwise prevent multer from parsing the request body.
        { headers: { 'Content-Type': undefined } }
      )
      .then((r) => r.data.data.images);
  },
};
