import { apiClient } from './client';
import { ApiResponse, Order, PaginatedResponse, ShippingAddress } from '@/types';

export interface CreateOrderPayload {
  items: { productId: string; quantity: number }[];
  shippingAddress: ShippingAddress;
  deliveryFee?: number;
  notes?: string;
}

export const orderApi = {
  create: (shopId: string, payload: CreateOrderPayload) =>
    apiClient
      .post<ApiResponse<{ order: Order; paymentUrl?: string }>>(`/orders/shop/${shopId}`, payload)
      .then((r) => r.data.data),

  getMyOrders: (params?: { page?: number; limit?: number }) =>
    apiClient
      .get<ApiResponse<PaginatedResponse<Order>>>('/orders/my', { params })
      .then((r) => r.data.data),

  getOne: (orderId: string) =>
    apiClient
      .get<ApiResponse<{ order: Order }>>(`/orders/${orderId}`)
      .then((r) => r.data.data.order),

  listForShop: (shopId: string, params?: { page?: number; status?: string }) =>
    apiClient
      .get<ApiResponse<PaginatedResponse<Order>>>(`/orders/shop/${shopId}/list`, { params })
      .then((r) => r.data.data),

  updateStatus: (shopId: string, orderId: string, status: string, cancelReason?: string) =>
    apiClient
      .patch<ApiResponse<{ order: Order }>>(`/orders/shop/${shopId}/${orderId}/status`, { status, cancelReason })
      .then((r) => r.data.data.order),
};
