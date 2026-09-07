import { Component, OnInit, signal } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CartService } from '../core/cart.service';
import { AuthService } from '../core/auth.service';
import { OrderCreateService, OrderCreateError } from '../core/order-create.service';
import { PsgcService, PsgcNode } from '../core/psgc.service';
import { CmsService } from '../core/cms.service';
import { ZONES, SLOTS, PROMO_CODES, FREE_DELIVERY_THRESHOLD } from '../core/pricing.config';

const PAYMENT_METHODS = [
  { id: 'cod', name: 'Cash on Delivery', icon: '💵' },
  { id: 'gcash', name: 'GCash', icon: '📱' },
  { id: 'maya', name: 'Maya', icon: '💳' }
];

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
    private orderCreate: OrderCreateService,
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
    return this.cart.subtotal() >= FREE_DELIVERY_THRESHOLD ? 0 : zone.fee;
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

    let order: { id: string; total: number };
    try {
      order = await this.orderCreate.createOrder(orderPayload);
    } catch (e: any) {
      this.error.set(e instanceof OrderCreateError ? e.message : 'Could not create order.');
      this.placing.set(false);
      return;
    }

    if (this.paymentMethod === 'cod') {
      this.cart.clear();
      this.router.navigate(['/orders', order.id]);
      return;
    }

    // GCash/Maya — manual QR, no live payment API call needed.
    const qrCodes = await this.cms.getPaymentQrCodes();
    const url = this.paymentMethod === 'gcash' ? qrCodes.gcashQrUrl : qrCodes.mayaQrUrl;
    if (!url) {
      this.error.set(`${method?.name} isn't set up yet — please choose a different payment method.`);
      this.placing.set(false);
      return;
    }
    this.cart.clear();
    this.qrUrl = url;
    this.qrOrderId = order.id;
    this.qrMethodName = method?.name || '';
    this.showQrPanel.set(true);
    this.placing.set(false);
  }

  goToQrOrder() {
    this.router.navigate(['/orders', this.qrOrderId]);
  }
}
