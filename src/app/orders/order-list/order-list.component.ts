import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { OrderService } from '../../core/order.service';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-order-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './order-list.component.html',
  styleUrl: './order-list.component.css'
})
export class OrderListComponent implements OnInit {
  orders = signal<any[]>([]);
  loading = signal(true);

  constructor(private orderService: OrderService, private auth: AuthService) {}

  async ngOnInit() {
    const user = this.auth.currentUser();
    if (user) this.orders.set(await this.orderService.getMyOrders(user.id));
    this.loading.set(false);
  }
}
