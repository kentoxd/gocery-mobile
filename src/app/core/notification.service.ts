import { Injectable, signal } from '@angular/core';
import { OrderService } from './order.service';
import { AuthService } from './auth.service';

export const NOTIF_SEEN_KEY = 'gocery_mobile_notif_seen';

/** Counts order status updates the customer has not opened yet (shown on the bell). */
@Injectable({ providedIn: 'root' })
export class NotificationService {
  unread = signal(0);
  private lastFetch = 0;

  constructor(private orders: OrderService, private auth: AuthService) {}

  async refresh(force = false) {
    const user = this.auth.currentUser();
    if (!user) { this.unread.set(0); return; }
    // Avoid hitting Firestore every time a screen with the bell opens.
    if (!force && Date.now() - this.lastFetch < 60000) return;
    this.lastFetch = Date.now();

    try {
      const list = await this.orders.getMyOrders(user.id);
      const lastSeen = localStorage.getItem(NOTIF_SEEN_KEY);
      let count = 0;
      for (let i = 0; i < list.length; i++) {
        const history = list[i].statusHistory || [];
        for (let j = 0; j < history.length; j++) {
          if (!lastSeen || new Date(history[j].timestamp) > new Date(lastSeen)) count++;
        }
      }
      this.unread.set(count);
    } catch {
      this.unread.set(0);
    }
  }

  markSeen() {
    localStorage.setItem(NOTIF_SEEN_KEY, new Date().toISOString());
    this.unread.set(0);
  }
}
