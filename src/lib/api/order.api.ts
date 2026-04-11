import { apiClient } from './client';
import { ApiResponse, DeliveryInfo, Order, PaginatedResponse, ShippingAddress } from '@/types';

export interface CreateOrderPayload {
  items: { productId: string; quantity: number }[];
  shippingAddress: ShippingAddress;
  deliveryFee?: number;
  notes?: string;
  email?: string;
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

  listForShop: (shopId: string, params?: { page?: number; limit?: number; status?: string }) =>
    apiClient
      .get<ApiResponse<PaginatedResponse<Order>>>(`/orders/shop/${shopId}/list`, { params })
      .then((r) => r.data.data),

  updateStatus: (
    shopId: string,
    orderId: string,
    status: string,
    cancelReason?: string,
    deliveryInfo?: DeliveryInfo
  ) =>
    apiClient
      .patch<ApiResponse<{ order: Order }>>(`/orders/shop/${shopId}/${orderId}/status`, {
        status,
        cancelReason,
        deliveryInfo,
      })
      .then((r) => r.data.data.order),

  verifyPayment: (orderId: string, reference: string) =>
    apiClient
      .post<ApiResponse<{ order: Order }>>(`/orders/${orderId}/verify-payment`, {}, {
        params: { reference },
      })
      .then((r) => r.data.data.order),
};
