import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { OrderService } from '../../core/order.service';
import { ToastService } from '../../core/toast.service';
import { NotificationService } from '../../core/notification.service';
import { PaymentService } from '../../core/payment.service';
import { AuthService } from '../../core/auth.service';
import { ONLINE_PAYMENT_METHODS } from '../../core/pricing.config';
import { PageHeaderComponent } from '../../shared/page-header/page-header.component';

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
  imports: [CommonModule, FormsModule, PageHeaderComponent],
  templateUrl: './order-detail.component.html',
  styleUrl: './order-detail.component.css'
})
export class OrderDetailComponent implements OnInit, OnDestroy {
  order = signal<any>(null);
  statusSteps = STATUS_STEPS;
  actionError = signal('');
  busy = signal(false);

  // ---- online payment (card / QR Ph through PayMongo) ----
  payError = signal('');
  paying = signal(false);
  payMode = signal('');
  qrImage = signal('');
  qrTestUrl = signal('');
  card = { name: '', number: '', expiry: '', cvc: '' };
  private destroyed = false;
  private polling = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private orderService: OrderService,
    private toast: ToastService,
    private notif: NotificationService,
    public pay: PaymentService,
    private auth: AuthService
  ) {}

  async ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id')!;
    const o = await this.orderService.getById(id);
    if (!o) { this.router.navigate(['/orders']); return; }
    this.order.set(o);

    if (this.needsPayment && this.pay.enabled) {
      const user = this.auth.currentUser();
      this.card.name = (user && user.name) || '';
      this.payMode.set((await this.pay.getConfig()).mode || '');
      // Coming back from PayMongo (we send pm=return; PayMongo also appends payment_intent_id).
      const q = this.route.snapshot.queryParamMap;
      if (q.get('pm') === 'return' || q.get('payment_intent_id')) {
        this.router.navigate([], { queryParams: {}, replaceUrl: true });
        this.paying.set(true);
        await this.waitForPayment(8, false);
        this.paying.set(false);
      }
    }
  }

  ngOnDestroy() {
    this.destroyed = true;
  }

  get isOnline(): boolean {
    const method = String(this.order()?.paymentMethod || '');
    if (ONLINE_PAYMENT_METHODS.indexOf(method) >= 0) return true;
    const lower = method.toLowerCase();
    return lower === 'card' || (lower.includes('credit') && lower.includes('card'));
  }

  get isGcash(): boolean {
    const method = this.order()?.paymentMethod;
    return method === 'GCash (Online)' || method === 'Maya (Online)';
  }

  /** 'GCash' or 'Maya', for the e-wallet payment buttons. */
  get walletName(): string {
    return this.order()?.paymentMethod === 'Maya (Online)' ? 'Maya' : 'GCash';
  }

  async payByGcash() {
    const o = this.order();
    if (!o) return;
    this.payError.set('');
    this.paying.set(true);
    try {
      const result = await this.pay.startEwallet(o.id);
      if (!result.success) {
        this.payError.set(result.error || 'Could not start payment. Please try again.');
        this.paying.set(false);
        return;
      }
      if (!result.data?.redirectUrl) {
        this.payError.set('Payment server did not return a redirect URL.');
        this.paying.set(false);
        return;
      }
      window.location.href = result.data.redirectUrl;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Payment failed. Please try again.';
      this.payError.set(message);
      this.paying.set(false);
    }
  }

  get isQr(): boolean {
    return this.order()?.paymentMethod === 'QR Ph';
  }

  get needsPayment(): boolean {
    const o = this.order();
    return !!o && this.isOnline && o.paymentStatus !== 'paid' && o.status !== 'Cancelled' && o.status !== 'Refunded';
  }

  formatCardNumber(event: Event) {
    const input = event.target as HTMLInputElement;
    const digits = input.value.replace(/\D/g, '').slice(0, 19);
    let out = '';
    for (let i = 0; i < digits.length; i++) {
      if (i > 0 && i % 4 === 0) out += ' ';
      out += digits[i];
    }
    this.card.number = out;
    input.value = out;
  }

  formatExpiry(event: Event) {
    const input = event.target as HTMLInputElement;
    const digits = input.value.replace(/\D/g, '').slice(0, 4);
    const out = digits.length > 2 ? digits.slice(0, 2) + '/' + digits.slice(2) : digits;
    this.card.expiry = out;
    input.value = out;
  }

  async payByCard() {
    const o = this.order();
    this.payError.set('');
    const digits = this.card.number.replace(/\D/g, '');
    if (!this.card.name.trim() || digits.length < 13 || !this.card.expiry || this.card.cvc.trim().length < 3) {
      this.payError.set('Please fill in the name, card number, expiry date, and CVC.');
      return;
    }
    this.paying.set(true);
    const user = this.auth.currentUser();
    const result = await this.pay.payWithCard(o.id, {
      name: this.card.name.trim(), number: this.card.number, expiry: this.card.expiry, cvc: this.card.cvc.trim()
    }, (user && user.email) || '');
    this.card.number = '';
    this.card.cvc = '';
    if (!result.success) {
      this.payError.set(result.error || 'The payment did not go through.');
      this.paying.set(false);
      return;
    }
    if (result.status === 'redirect' && result.redirectUrl) {
      window.location.href = result.redirectUrl;
      return;
    }
    await this.waitForPayment(8, false);
    this.paying.set(false);
  }

  async showQr() {
    const o = this.order();
    this.payError.set('');
    this.paying.set(true);
    const result = await this.pay.startQr(o.id);
    this.paying.set(false);
    if (!result.success) { this.payError.set(result.error); return; }
    this.qrImage.set(result.data.imageUrl);
    this.qrTestUrl.set(result.data.testUrl || '');
    this.waitForPayment(450, true);
  }

  /** Asks the server every few seconds whether PayMongo has marked the payment as paid. */
  private async waitForPayment(tries: number, quiet: boolean) {
    if (this.polling) return;
    this.polling = true;
    const orderId = this.order().id;
    for (let i = 0; i < tries && !this.destroyed; i++) {
      const result = await this.pay.verify(orderId);
      if (result.success && result.data.paymentStatus === 'paid') {
        this.polling = false;
        this.toast.show('Payment received. Thank you!');
        this.qrImage.set('');
        const fresh = await this.orderService.getById(orderId);
        if (fresh) this.order.set(fresh);
        this.notif.refresh(true);
        return;
      }
      if (result.success && result.data.paymentStatus === 'failed') {
        this.polling = false;
        this.payError.set(result.data.message || 'The payment did not go through.');
        return;
      }
      await new Promise(r => setTimeout(r, quiet ? 4000 : 2000));
    }
    this.polling = false;
    if (!quiet && !this.destroyed) this.payError.set('We are still waiting for the bank to confirm. Pull down and reopen this order in a moment.');
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
    if (o.paymentStatus === 'awaiting_payment') return 'Waiting for your payment';
    if (o.paymentStatus === 'failed') return 'Payment failed, you can try again';
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
