import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { OrderService } from '../core/order.service';
import { AuthService } from '../core/auth.service';
import { NotificationService, NOTIF_SEEN_KEY } from '../core/notification.service';
import { PageHeaderComponent } from '../shared/page-header/page-header.component';

interface Notification {
  orderId: string;
  status: string;
  note: string;
  timestamp: string;
}


@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule, RouterLink, PageHeaderComponent],
  templateUrl: './notifications.component.html',
  styleUrl: './notifications.component.css'
})
export class NotificationsComponent implements OnInit {
  notifications = signal<Notification[]>([]);
  lastSeen: string | null = null;
  loading = signal(true);

  constructor(private orderService: OrderService, private auth: AuthService, private notif: NotificationService) {}

  async ngOnInit() {
    const user = this.auth.currentUser();
    if (!user) return;
    const orders = await this.orderService.getMyOrders(user.id);

    const feed: Notification[] = orders.flatMap((o: any) =>
      (o.statusHistory || []).map((h: any) => ({
        orderId: o.id, status: h.status, note: h.note || '', timestamp: h.timestamp
      }))
    ).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    this.lastSeen = localStorage.getItem(NOTIF_SEEN_KEY);
    this.notif.markSeen();

    this.notifications.set(feed);
    this.loading.set(false);
  }

  isNew(n: Notification): boolean {
    return !!this.lastSeen && new Date(n.timestamp) > new Date(this.lastSeen);
  }
}
