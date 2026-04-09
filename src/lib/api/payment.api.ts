import { apiClient } from './client';
import { ApiResponse } from '@/types';

export type MomoNetwork = 'MTN' | 'ATL' | 'VOD';

export interface MobileMoneyRecipient {
  type: 'mobile_money';
  accountName: string;
  accountNumber: string;
  bankCode: MomoNetwork;
}

export interface GhipssRecipient {
  type: 'ghipss';
  accountName: string;
  accountNumber: string;
  bankCode: string;
}

export type RegisterRecipientPayload = MobileMoneyRecipient | GhipssRecipient;

export interface TransferRecipient {
  id: string;
  shopId: string;
  type: string;
  accountName: string;
  accountNumber: string;
  bankCode: string;
  paystackRecipientCode: string | null;
}

export const paymentApi = {
  registerRecipient: (shopId: string, payload: RegisterRecipientPayload) =>
    apiClient
      .post<ApiResponse<{ recipient: TransferRecipient }>>(
        `/payments/recipients/shop/${shopId}`,
        payload
      )
      .then((r) => r.data.data.recipient),

  getRecipient: (shopId: string) =>
    apiClient
      .get<ApiResponse<{ recipient: TransferRecipient | null }>>(
        `/payments/recipients/shop/${shopId}`
      )
      .then((r) => r.data.data.recipient),
};
