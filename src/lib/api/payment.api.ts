import { apiClient } from './client';
import { ApiResponse } from '@/types';

export type MomoNetwork = 'MTN' | 'ATL' | 'VOD';

export interface MobileMoneySubaccount {
  type: 'mobile_money';
  accountName: string;
  accountNumber: string;
  bankCode: MomoNetwork;
}

export interface GhipssSubaccount {
  type: 'ghipss';
  accountName: string;
  accountNumber: string;
  bankCode: string;
}

export type RegisterSubaccountPayload = MobileMoneySubaccount | GhipssSubaccount;

export interface SubaccountResult {
  subaccountCode: string;
  businessName: string;
  accountNumber: string;
  settlementBank: string;
  type: string;
  accountName: string;
}

export interface SubaccountDetails {
  subaccountCode: string | null;
  type: string | null;
  accountName: string | null;
  accountNumber: string | null;
  bankCode: string | null;
}

export const paymentApi = {
  registerSubaccount: (shopId: string, payload: RegisterSubaccountPayload) =>
    apiClient
      .post<ApiResponse<{ subaccount: SubaccountResult }>>(
        `/payments/subaccount/shop/${shopId}`,
        payload
      )
      .then((r) => r.data.data.subaccount),

  getSubaccount: (shopId: string) =>
    apiClient
      .get<ApiResponse<SubaccountDetails>>(
        `/payments/subaccount/shop/${shopId}`
      )
      .then((r) => r.data.data),
};
