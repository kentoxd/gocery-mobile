import { Component, OnInit, signal } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { OrderService } from '../../core/order.service';
import { ToastService } from '../../core/toast.service';
import { NotificationService } from '../../core/notification.service';

const STATUS_STEPS = ['Pending', 'Confirmed', 'Preparing', 'Out for Delivery', 'Delivered'];

const STATUS_MESSAGES: Record<string, string> = {
  'Pending': 'We received your order and will confirm it shortly.',
  'Confirmed': 'Your order is confirmed. We are getting it ready.',
  'Preparing': 'Your order is being prepared at the market.',
  'Out for Delivery': 'Your order is on its way to you.',
  'Delivered': 'Your order was delivered. Enjoy! You can now review your products.',
  'Cancelled': 'This order was cancelled.',
  'Refunded': 'This order was refunded.'
};

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
  actionError = signal('');
  busy = signal(false);

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private orderService: OrderService,
    private location: Location,
    private toast: ToastService,
    private notif: NotificationService
  ) {}

  goBack() {
    this.location.back();
  }

  async ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id')!;
    const o = await this.orderService.getById(id);
    if (!o) { this.router.navigate(['/orders']); return; }
    this.order.set(o);
  }

  get currentStepIndex(): number {
    return this.statusSteps.indexOf(this.order()?.status);
  }

  get statusMessage(): string {
    return STATUS_MESSAGES[this.order()?.status] || '';
  }

  /** The date a status was reached, taken from the order's status history. */
  stepDate(status: string): string {
    const history = this.order()?.statusHistory || [];
    for (let i = 0; i < history.length; i++) {
      if (history[i].status === status) return history[i].timestamp;
    }
    return '';
  }

  get isManualQr(): boolean {
    const m = String(this.order()?.paymentMethod || '').toLowerCase();
    return m === 'gcash' || m === 'maya';
  }

  get needsReceipt(): boolean {
    const o = this.order();
    return this.isManualQr && o.paymentStatus !== 'paid' && o.status !== 'Cancelled' && o.status !== 'Refunded';
  }

  get paymentLabel(): string {
    const o = this.order();
    if (o.status === 'Cancelled') return 'Cancelled';
    if (o.paymentStatus === 'paid') return 'Paid';
    if (o.paymentStatus === 'awaiting_manual_verification') {
      return o.receiptUrl ? 'Receipt received, awaiting verification' : 'Upload your receipt to continue';
    }
    return 'Pay on delivery';
  }

  async onReceiptPicked(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files && input.files[0];
    if (!file) return;
    this.busy.set(true);
    this.actionError.set('');
    const result = await this.orderService.uploadReceipt(this.order().id, file);
    this.busy.set(false);
    input.value = '';
    if (!result.success) {
      this.actionError.set(result.error || 'Could not upload the receipt.');
      return;
    }
    this.order.set({ ...this.order(), receiptUrl: result.url, receiptUploadedAt: new Date().toISOString() });
    this.toast.show('Receipt uploaded. The seller will verify your payment.');
  }

  async cancelOrder() {
    if (!confirm('Cancel this order? This cannot be undone.')) return;
    this.busy.set(true);
    this.actionError.set('');
    const result = await this.orderService.cancel(this.order().id);
    this.busy.set(false);
    if (!result.success) {
      this.actionError.set(result.error || 'Could not cancel the order.');
      return;
    }
    this.toast.show('Order cancelled.');
    this.notif.refresh(true);
    const fresh = await this.orderService.getById(this.order().id);
    if (fresh) this.order.set(fresh);
  }
}
