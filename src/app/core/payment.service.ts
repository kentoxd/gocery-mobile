import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { FirebaseService } from './firebase.service';

export interface CardInput { name: string; number: string; expiry: string; cvc: string; }
export interface CardResult { success: boolean; status?: 'succeeded' | 'redirect' | 'processing'; redirectUrl?: string; error?: string; }

/**
 * Online payments through PayMongo (card, GCash/Maya e-wallet, and QR Ph).
 * Our server (environment.apiBaseUrl) creates the payment from the saved order, so the amount can't be changed here.
 * Card details go straight from the app to PayMongo with the PUBLIC key; they never touch our server.
 */
@Injectable({ providedIn: 'root' })
export class PaymentService {
  constructor(private fb: FirebaseService) {}

  get enabled(): boolean {
    return !!environment.apiBaseUrl;
  }

  private async server(method: string, path: string, body?: any): Promise<any> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    const user = this.fb.auth.currentUser;
    if (user) headers['Authorization'] = 'Bearer ' + (await user.getIdToken());
    let res: Response;
    try {
      res = await fetch(environment.apiBaseUrl + path, { method, headers, body: body ? JSON.stringify(body) : undefined });
    } catch {
      return { success: false, error: 'Could not reach the payment server. Please try again in a moment.' };
    }
    let json: any = {};
    try { json = await res.json(); } catch { json = {}; }
    if (!res.ok || json.success === false) {
      return { success: false, error: json.error || 'Payment request failed (' + res.status + ')' };
    }
    return json;
  }

  private async paymongo(path: string, publicKey: string, attributes: any): Promise<{ ok: boolean; data?: any; message?: string }> {
    let res: Response;
    try {
      res = await fetch('https://api.paymongo.com/v1' + path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Basic ' + btoa(publicKey + ':') },
        body: JSON.stringify({ data: { attributes } })
      });
    } catch {
      return { ok: false, message: 'Could not reach PayMongo. Please check your connection.' };
    }
    const json: any = await res.json().catch(() => ({}));
    if (!res.ok) {
      const first = json.errors && json.errors[0];
      return { ok: false, message: (first && (first.detail || first.code)) || 'PayMongo could not process the card.' };
    }
    return { ok: true, data: json.data };
  }

  async getConfig(): Promise<{ publicKey?: string; mode?: string }> {
    try {
      const res = await fetch(environment.apiBaseUrl + '/api/payments/config');
      const json = await res.json();
      return json.data || {};
    } catch {
      return {};
    }
  }

  async payWithCard(orderId: string, card: CardInput, email: string): Promise<CardResult> {
    const intent = await this.server('POST', '/api/payments/intent', { orderId });
    if (!intent.success) return { success: false, error: intent.error };
    const info = intent.data;

    const parts = String(card.expiry).split('/');
    const month = parseInt(parts[0], 10);
    let year = parseInt(parts[1], 10);
    if (year > 99) year = year % 100; // PayMongo takes the 2-digit year
    if (!month || month < 1 || month > 12 || !year) {
      return { success: false, error: 'Enter the expiry date as MM/YY.' };
    }

    const method = await this.paymongo('/payment_methods', info.publicKey, {
      type: 'card',
      details: { card_number: String(card.number).replace(/\D/g, ''), exp_month: month, exp_year: year, cvc: String(card.cvc) },
      billing: { name: card.name, email: email || 'customer@gocery.ph' }
    });
    if (!method.ok) return { success: false, error: method.message };

    // After 3D Secure the bank sends the customer back to this order screen.
    const returnUrl = this.paymentReturnUrl(orderId);
    const attached = await this.paymongo('/payment_intents/' + info.paymentIntentId + '/attach', info.publicKey, {
      payment_method: method.data.id, client_key: info.clientKey, return_url: returnUrl
    });
    if (!attached.ok) return { success: false, error: attached.message };

    const attrs = attached.data.attributes;
    if (attrs.status === 'succeeded') return { success: true, status: 'succeeded' };
    if (attrs.status === 'processing') return { success: true, status: 'processing' };
    if (attrs.status === 'awaiting_next_action' && attrs.next_action && attrs.next_action.redirect) {
      return { success: true, status: 'redirect', redirectUrl: attrs.next_action.redirect.url };
    }
    const lastError = attrs.last_payment_error;
    return { success: false, error: (lastError && (lastError.failed_message || lastError.message)) || 'The card was declined. Please try another card.' };
  }

  /** GCash / Maya: server returns a PayMongo redirect URL for the customer to approve payment. */
  startEwallet(orderId: string) {
    const returnUrl = this.paymentReturnUrl(orderId);
    return this.server('POST', '/api/payments/ewallet', { orderId, returnUrl });
  }

  /**
   * PayMongo finishes in a real browser tab. Capacitor's http://localhost (no port)
   * and capacitor:// origins are not websites, so Authorize would land on
   * "This site can't be reached". Send them to the live site's order page instead
   * (vanilla hosting uses orders.html, not the Ionic /orders/:id route).
   */
  private paymentReturnUrl(orderId: string): string {
    const host = window.location.hostname;
    const notPublic = host === 'localhost' || host === '127.0.0.1' || window.location.protocol === 'capacitor:';
    if (notPublic && environment.publicAppUrl) {
      return environment.publicAppUrl.replace(/\/$/, '') + '/orders.html?id=' + encodeURIComponent(orderId) + '&pm=return';
    }
    return window.location.origin + '/orders/' + encodeURIComponent(orderId) + '?pm=return';
  }

  startQr(orderId: string) {
    return this.server('POST', '/api/payments/qrph', { orderId });
  }

  /** Asks the server to check with PayMongo whether this order has been paid. */
  verify(orderId: string) {
    return this.server('POST', '/api/payments/verify', { orderId });
  }
}
