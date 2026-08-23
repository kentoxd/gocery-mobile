import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { getAuth } from 'firebase/auth';
import { environment } from '../../environments/environment';

export type ApiResult<T = any> =
  | { success: true; data: T; error?: undefined }
  | { success: false; data?: undefined; error: string };

/**
 * Talks to the SAME Express backend as the web app (server/routes/*.js)
 * — order creation and pricing stay authoritative and server-side here
 * too, for the same reason: never trust a client-computed total.
 */
@Injectable({ providedIn: 'root' })
export class ApiService {
  constructor(private http: HttpClient) {}

  private async authHeader(): Promise<Record<string, string>> {
    const user = getAuth().currentUser;
    if (!user) return {};
    const token = await user.getIdToken();
    return { Authorization: `Bearer ${token}` };
  }

  async get<T>(path: string): Promise<ApiResult<T>> {
    try {
      const headers = await this.authHeader();
      return await firstValueFrom(this.http.get<ApiResult<T>>(`${environment.apiBaseUrl}${path}`, { headers }));
    } catch (e: any) {
      return { success: false, error: e.error?.error || 'Could not reach the server. Is it running?' };
    }
  }

  async post<T>(path: string, body: any): Promise<ApiResult<T>> {
    try {
      const headers = await this.authHeader();
      return await firstValueFrom(this.http.post<ApiResult<T>>(`${environment.apiBaseUrl}${path}`, body, { headers }));
    } catch (e: any) {
      return { success: false, error: e.error?.error || 'Could not reach the server. Is it running?' };
    }
  }

  createOrder(payload: {
    items: { productId: string; variantId: string; quantity: number }[];
    addressId: string; zoneId: string; slotId: string;
    deliveryDate: string; paymentMethod: string; promoCode?: string;
  }) {
    return this.post<{ id: string }>('/api/orders', payload);
  }

  getPaymentConfig() {
    return this.get<{ publicKey: string }>('/api/payments/config');
  }

  createPaymentIntent(orderId: string) {
    return this.post<{ paymentIntentId: string; clientKey: string; amount: number }>('/api/payments/intent', { orderId });
  }
}
