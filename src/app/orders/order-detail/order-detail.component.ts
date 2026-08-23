import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { OrderService } from '../../core/order.service';

const STATUS_STEPS = ['Pending', 'Confirmed', 'Preparing', 'Out for Delivery', 'Delivered'];

@Component({
  selector: 'app-order-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './order-detail.component.html',
  styleUrl: './order-detail.component.css'
})
export class OrderDetailComponent implements OnInit {
  order = signal<any>(null);
  statusSteps = STATUS_STEPS;

  constructor(private route: ActivatedRoute, private router: Router, private orderService: OrderService) {}

  async ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id')!;
    const o = await this.orderService.getById(id);
    if (!o) { this.router.navigate(['/orders']); return; }
    this.order.set(o);
  }

  get currentStepIndex(): number {
    return this.statusSteps.indexOf(this.order()?.status);
  }
}
