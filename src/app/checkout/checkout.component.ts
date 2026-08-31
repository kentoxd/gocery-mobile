import { Component, OnInit, signal } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CartService } from '../core/cart.service';
import { AuthService } from '../core/auth.service';
import { ApiService } from '../core/api.service';
import { PsgcService, PsgcNode } from '../core/psgc.service';
import { CmsService } from '../core/cms.service';

// Zone ids/fees must match server/config.js exactly — the server is the
// pricing source of truth and rejects any zoneId it doesn't recognize.
const ZONES = [
  { id: 'metro-manila', name: 'Metro Manila (NCR)', fee: 99 },
  { id: 'rizal', name: 'Rizal Province', fee: 149 }
];
const SLOTS = [
  { id: 'morning', label: '8:00 AM – 12:00 PM' },
  { id: 'afternoon', label: '1:00 PM – 5:00 PM' },
  { id: 'evening', label: '5:00 PM – 8:00 PM' }
];
const PAYMENT_METHODS = [
  { id: 'cod', name: 'Cash on Delivery', icon: '💵' },
  { id: 'gcash', name: 'GCash', icon: '📱' },
  { id: 'maya', name: 'Maya', icon: '💳' },
  { id: 'card', name: 'Credit/Debit Card', icon: '💳' }
];
const PROMO_CODES: Record<string, { type: 'percent' | 'free_shipping'; value?: number }> = {
  SUKI10: { type: 'percent', value: 0.10 },
  FREESHIP: { type: 'free_shipping' }
};

function isManualQrPayment(method: string): boolean {
  return method === 'gcash' || method === 'maya';
}

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
  showNewAddressForm = false;
  zoneId = ZONES[0].id;
  slotId = SLOTS[0].id;
  deliveryDate = this.nextDeliveryDate();
  paymentMethod = 'cod';
  cardNumber = '4571 7360 0000 0008';
  cardExpMonth = '12';
  cardExpYear = '2028';
  cardCvc = '123';
  promoInput = '';
  promoCode = '';
  discount = 0;
  freeShip = false;

  // --- New-address form: PSGC cascading Region → Province → City → Barangay ---
  newAddress = { label: '', street: '', city: '', region: '', province: '', zoneId: ZONES[0].id };
  regions: PsgcNode[] = [];
  provinces: PsgcNode[] = [];
  cities: PsgcNode[] = [];
  barangays: PsgcNode[] = [];
  selectedRegionId = '';
  selectedProvinceId = '';
  selectedCityId = '';
  selectedBarangayName = '';
  addressError = signal('');

  // --- Manual GCash/Maya QR payment panel ---
  showQrPanel = signal(false);
  qrUrl = '';
  qrOrderId = '';
  qrMethodName = '';

  placing = signal(false);
  error = signal('');

  constructor(
    public cart: CartService,
    public auth: AuthService,
    private api: ApiService,
    private psgc: PsgcService,
    private cms: CmsService,
    private router: Router,
    private location: Location
  ) {}

  ngOnInit() {
    const user = this.auth.currentUser();
    if (user?.addresses?.length) this.addressId = user.addresses[0].id;
    else this.showNewAddressForm = true;
    this.regions = this.psgc.getRegions();
  }

  goBack() {
    if (this.step() > 1) this.step.update(s => s - 1);
    else this.location.back();
  }

  nextDeliveryDate(): string {
    const now = new Date();
    const cutoff = new Date(now); cutoff.setHours(19, 30, 0, 0);
    const delivery = new Date(now);
    delivery.setDate(delivery.getDate() + (now > cutoff ? 2 : 1));
    return delivery.toISOString().split('T')[0];
  }

  get deliveryFee(): number {
    if (this.freeShip) return 0;
    const zone = this.zones.find(z => z.id === this.zoneId);
    if (!zone) return 0;
    return this.cart.subtotal() >= 4000 ? 0 : zone.fee;
  }

  get estimatedTotal(): number {
    return Math.max(0, this.cart.subtotal() - this.discount) + this.deliveryFee;
  }

  applyPromo() {
    const code = this.promoInput.trim().toUpperCase();
    const promo = PROMO_CODES[code];
    if (!promo) { this.addressError.set(''); this.error.set('Invalid promo code'); return; }
    this.error.set('');
    if (promo.type === 'percent') {
      this.discount = this.cart.subtotal() * (promo.value || 0);
      this.promoCode = code;
      this.freeShip = false;
    } else if (promo.type === 'free_shipping') {
      this.discount = 0;
      this.freeShip = true;
      this.promoCode = code;
    }
  }

  // --- PSGC cascade ---
  onRegionChange() {
    const region = this.regions.find(r => r.psgc_id === this.selectedRegionId);
    this.newAddress.region = region?.name || '';
    this.newAddress.zoneId = this.psgc.zoneIdForRegion(this.selectedRegionId);
    this.provinces = this.selectedRegionId ? this.psgc.getProvinces(this.selectedRegionId) : [];
    this.selectedProvinceId = '';
    this.selectedCityId = '';
    this.cities = [];
    this.barangays = [];
    this.newAddress.province = '';
    this.newAddress.city = '';
    this.selectedBarangayName = '';

    // Regions with no province layer (e.g. Rizal) list cities directly under the region.
    if (this.selectedRegionId && !this.provinces.length) {
      this.cities = this.psgc.getCitiesMunicipalities(this.selectedRegionId);
    }
  }

  onProvinceChange() {
    const province = this.provinces.find(p => p.psgc_id === this.selectedProvinceId);
    this.newAddress.province = province?.name || '';
    this.cities = this.selectedProvinceId ? this.psgc.getCitiesMunicipalities(this.selectedProvinceId) : [];
    this.selectedCityId = '';
    this.barangays = [];
    this.newAddress.city = '';
    this.selectedBarangayName = '';
  }

  onCityChange() {
    this.barangays = this.selectedCityId ? this.psgc.getBarangays(this.selectedCityId) : [];
    this.selectedBarangayName = '';
    this._composeCityField();
  }

  onBarangayChange() {
    this._composeCityField();
  }

  private _composeCityField() {
    const city = this.cities.find(c => c.psgc_id === this.selectedCityId)?.name || '';
    const parts = [this.selectedBarangayName, city, this.newAddress.province].filter(Boolean);
    this.newAddress.city = parts.join(', ');
  }

  async saveNewAddress() {
    this.addressError.set('');
    if (!this.selectedCityId || !this.newAddress.street.trim()) {
      this.addressError.set('Please select region, province/city, barangay, and enter a street address.');
      return;
    }
    await this.auth.addAddress({
      label: this.newAddress.label || 'Home',
      street: this.newAddress.street,
      city: this.newAddress.city,
      region: this.newAddress.region,
      zoneId: this.newAddress.zoneId
    });
    const user = this.auth.currentUser();
    this.addressId = user?.addresses?.[user.addresses.length - 1]?.id || '';
    this.zoneId = this.newAddress.zoneId;
    this.showNewAddressForm = false;
  }

  async placeOrder() {
    const user = this.auth.currentUser();
    if (!user) return;
    this.placing.set(true);
    this.error.set('');

    const method = this.paymentMethods.find(m => m.id === this.paymentMethod);
    const orderPayload = {
      items: this.cart.cartItems().map(i => ({ productId: i.productId, variantId: i.variantId, quantity: i.quantity })),
      addressId: this.addressId,
      zoneId: this.zoneId,
      slotId: this.slotId,
      deliveryDate: this.deliveryDate,
      paymentMethod: method?.name || 'Cash on Delivery',
      promoCode: this.promoCode
    };

    const order = await this.api.createOrder(orderPayload);
    if (!order.success) {
      this.error.set(order.error || 'Could not create order.');
      this.placing.set(false);
      return;
    }

    if (this.paymentMethod === 'cod') {
      this.cart.clear();
      this.router.navigate(['/orders', order.data!.id]);
      return;
    }

    if (isManualQrPayment(this.paymentMethod)) {
      const qrCodes = await this.cms.getPaymentQrCodes();
      const url = this.paymentMethod === 'gcash' ? qrCodes.gcashQrUrl : qrCodes.mayaQrUrl;
      if (!url) {
        this.error.set(`${method?.name} isn't set up yet — please choose a different payment method.`);
        this.placing.set(false);
        return;
      }
      this.cart.clear();
      this.qrUrl = url;
      this.qrOrderId = order.data!.id;
      this.qrMethodName = method?.name || '';
      this.showQrPanel.set(true);
      this.placing.set(false);
      return;
    }

    // Card — PayMongo Payment Intent + attach flow, same as the web app.
    const intent = await this.api.createPaymentIntent(order.data!.id);
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

      const returnUrl = `${window.location.origin}/orders/${order.data!.id}`;
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
        this.router.navigate(['/orders', order.data!.id]);
      }
    } catch (e: any) {
      this.error.set(e.message || 'Payment failed. Please try again.');
      this.placing.set(false);
    }
  }

  goToQrOrder() {
    this.router.navigate(['/orders', this.qrOrderId]);
  }
}
