import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CartService } from '../core/cart.service';
import { AuthService } from '../core/auth.service';
import { ApiService } from '../core/api.service';

const ZONES = [
  { id: 'mm-north', name: 'Metro Manila – North', fee: 99 },
  { id: 'mm-south', name: 'Metro Manila – South', fee: 99 },
  { id: 'rizal', name: 'Rizal Province', fee: 149 }
];
const SLOTS = [
  { id: 'morning', label: '8:00 AM – 12:00 PM' },
  { id: 'afternoon', label: '1:00 PM – 5:00 PM' },
  { id: 'evening', label: '5:00 PM – 8:00 PM' }
];
const PAYMENT_METHODS = [
  { id: 'cod', name: 'Cash on Delivery', icon: '💵' },
  { id: 'card', name: 'Credit/Debit Card', icon: '💳' }
];

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './checkout.component.html',
  styleUrl: './checkout.component.css'
})
export class CheckoutComponent implements OnInit {
  step = signal(1);
  zones = ZONES;
  slots = SLOTS;
  paymentMethods = PAYMENT_METHODS;

  addressId = '';
  newAddress = { label: '', street: '', city: '', zoneId: ZONES[0].id };
  showNewAddressForm = false;
  zoneId = ZONES[0].id;
  slotId = SLOTS[0].id;
  deliveryDate = this.nextDeliveryDate();
  paymentMethod = 'cod';
  cardNumber = '4571 7360 0000 0008';
  cardExpMonth = '12';
  cardExpYear = '2028';
  cardCvc = '123';

  placing = signal(false);
  error = signal('');

  constructor(public cart: CartService, public auth: AuthService, private api: ApiService, private router: Router) {}

  ngOnInit() {
    const user = this.auth.currentUser();
    if (user?.addresses?.length) this.addressId = user.addresses[0].id;
    else this.showNewAddressForm = true;
  }

  nextDeliveryDate(): string {
    const now = new Date();
    const cutoff = new Date(now); cutoff.setHours(19, 30, 0, 0);
    const delivery = new Date(now);
    delivery.setDate(delivery.getDate() + (now > cutoff ? 2 : 1));
    return delivery.toISOString().split('T')[0];
  }

  get deliveryFee(): number {
    const zone = this.zones.find(z => z.id === this.zoneId);
    if (!zone) return 0;
    return this.cart.subtotal() >= 4000 ? 0 : zone.fee;
  }

  get estimatedTotal(): number {
    return this.cart.subtotal() + this.deliveryFee;
  }

  async saveNewAddress() {
    await this.auth.addAddress(this.newAddress);
    const user = this.auth.currentUser();
    this.addressId = user?.addresses?.[user.addresses.length - 1]?.id || '';
    this.showNewAddressForm = false;
  }

  async placeOrder() {
    const user = this.auth.currentUser();
    if (!user) return;
    this.placing.set(true);
    this.error.set('');

    const orderPayload = {
      items: this.cart.cartItems().map(i => ({ productId: i.productId, variantId: i.variantId, quantity: i.quantity })),
      addressId: this.addressId,
      zoneId: this.zoneId,
      slotId: this.slotId,
      deliveryDate: this.deliveryDate,
      paymentMethod: this.paymentMethods.find(m => m.id === this.paymentMethod)?.name || 'Cash on Delivery'
    };

    const order = await this.api.createOrder(orderPayload);
    if (!order.success) {
      this.error.set(order.error || 'Could not create order.');
      this.placing.set(false);
      return;
    }

    if (this.paymentMethod === 'cod') {
      this.cart.clear();
      this.router.navigate(['/orders', order.data.id]);
      return;
    }

    // Card — same PayMongo Payment Intent + attach flow as the web app.
    const intent = await this.api.createPaymentIntent(order.data.id);
    if (!intent.success) {
      this.error.set(intent.error || 'Payment setup failed.');
      this.placing.set(false);
      return;
    }
    const config = await this.api.getPaymentConfig();
    if (!config.success) {
      this.error.set('Payment is not available right now.');
      this.placing.set(false);
      return;
    }

    try {
      const authHeader = 'Basic ' + btoa(`${config.data!.publicKey}:`);
      const pmRes = await fetch('https://api.paymongo.com/v1/payment_methods', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: authHeader },
        body: JSON.stringify({
          data: {
            attributes: {
              type: 'card',
              billing: { name: user.name, email: user.email },
              details: {
                card_number: this.cardNumber.replace(/\s+/g, ''),
                exp_month: parseInt(this.cardExpMonth, 10),
                exp_year: parseInt(this.cardExpYear, 10),
                cvc: this.cardCvc
              }
            }
          }
        })
      });
      const pmBody = await pmRes.json();
      if (!pmRes.ok) throw new Error(pmBody?.errors?.[0]?.detail || 'Could not save card details.');

      const returnUrl = `${window.location.origin}/orders/${order.data.id}`;
      const attachRes = await fetch(`https://api.paymongo.com/v1/payment_intents/${intent.data!.paymentIntentId}/attach`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: authHeader },
        body: JSON.stringify({
          data: { attributes: { payment_method: pmBody.data.id, client_key: intent.data!.clientKey, return_url: returnUrl } }
        })
      });
      const attachBody = await attachRes.json();
      if (!attachRes.ok) throw new Error(attachBody?.errors?.[0]?.detail || 'Payment could not be processed.');

      this.cart.clear();
      const redirectUrl = attachBody.data.attributes.next_action?.redirect?.url;
      if (redirectUrl) {
        window.location.href = redirectUrl; // 3D Secure — browser must go here
      } else {
        this.router.navigate(['/orders', order.data.id]);
      }
    } catch (e: any) {
      this.error.set(e.message || 'Payment failed. Please try again.');
      this.placing.set(false);
    }
  }
}
