import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { OrderService } from '../../core/order.service';
import { AuthService } from '../../core/auth.service';
import { PageHeaderComponent } from '../../shared/page-header/page-header.component';
import { NavIconComponent } from '../../shared/nav-icon/nav-icon.component';

@Component({
  selector: 'app-order-list',
  standalone: true,
  imports: [CommonModule, RouterLink, PageHeaderComponent, NavIconComponent],
  templateUrl: './order-list.component.html',
  styleUrl: './order-list.component.css'
})
export class OrderListComponent implements OnInit {
  orders = signal<any[]>([]);
  loading = signal(true);

  constructor(private orderService: OrderService, private auth: AuthService) {}

  paymentLabel(o: any): string {
    if (o.status === 'Cancelled') return 'Cancelled';
    if (o.paymentStatus === 'paid') return 'Paid';
    if (o.paymentStatus === 'awaiting_manual_verification') return o.receiptUrl ? 'Awaiting verification' : 'Receipt needed';
    return 'Pay on delivery';
  }

  async ngOnInit() {
    const user = this.auth.currentUser();
    if (user) this.orders.set(await this.orderService.getMyOrders(user.id));
    this.loading.set(false);
  }
}
