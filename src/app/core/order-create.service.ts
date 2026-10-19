import { Injectable } from '@angular/core';
import { collection, doc, getDoc, runTransaction } from 'firebase/firestore';
import { FirebaseService } from './firebase.service';
import { AuthService } from './auth.service';
import { ProductService } from './product.service';
import { MailerService } from './mailer.service';
import { ZONES, FREE_DELIVERY_THRESHOLD, VIP_FREE_SHIPPING_THRESHOLD, PROMO_CODES, ONLINE_PAYMENT_METHODS } from './pricing.config';

export interface CreateOrderInput {
  items: { productId: string; variantId: string; quantity: number }[];
  addressId: string;
  zoneId: string;
  slotId: string;
  deliveryDate: string;
  paymentMethod: string;
  promoCode?: string;
}

export class OrderCreateError extends Error {}

/**
 * Client-side replacement for POST /api/orders. There's no backend in
 * this build, so this service does everything the Express route used
 * to: look up live product prices, validate stock, apply promo/delivery
 * pricing, deduct inventory, and write the order — all directly against
 * Firestore inside one transaction so the price check and the stock
 * deduction can't be split apart by a race.
 *
 * Trade-off (documented, not hidden): the server used to be the one
 * place a tampered client couldn't lie to about prices. Doing this
 * client-side means Firestore's security rules are the only backstop —
 * they sanity-check the total/deliveryFee/item count, but per-item price
 * validation against the exact variant isn't practical in rules against
 * an array-shaped `variants` field. Acceptable for a class project on
 * sandbox data; would need a real backend (or a variants-as-map schema
 * change to make rules-based price checks possible) for production use.
 */
@Injectable({ providedIn: 'root' })
export class OrderCreateService {
  constructor(private fb: FirebaseService, private auth: AuthService, private products: ProductService, private mailer: MailerService) {}

  async createOrder(input: CreateOrderInput): Promise<{ id: string; total: number }> {
    const user = this.auth.currentUser();
    if (!user) throw new OrderCreateError('You must be logged in.');
    if (!input.items.length) throw new OrderCreateError('Your cart is empty.');

    const address = (user.addresses || []).find((a: any) => a.id === input.addressId);
    if (!address) throw new OrderCreateError('Address not found on your account.');

    const zone = ZONES.find(z => z.id === input.zoneId);
    if (!zone) throw new OrderCreateError('Invalid delivery zone.');

    const slot = ({ morning: '8:00 AM – 12:00 PM', afternoon: '1:00 PM – 5:00 PM', evening: '5:00 PM – 8:00 PM' } as Record<string, string>)[input.slotId];
    if (!slot) throw new OrderCreateError('Invalid delivery slot.');

    // Loyalty tier read happens outside the transaction, same as the
    // old server code — it only affects the delivery-fee waiver, not
    // stock correctness, so it doesn't need transactional isolation.
    const loyaltyRef = doc(this.fb.db, 'loyalty', user.id);
    const loyaltyDoc = await getDoc(loyaltyRef);
    const loyalty = loyaltyDoc.exists() ? loyaltyDoc.data() as any : { points: 0, tier: 'regular' };

    const orderRef = doc(collection(this.fb.db, 'orders'));

    let placedOrder: any = null;
    const created = await runTransaction(this.fb.db, async (tx) => {
      // --- Read every product doc first (Firestore transactions require
      // all reads before any writes). ---
      const productRefs = input.items.map(i => doc(this.fb.db, 'products', i.productId));
      const productDocs = await Promise.all(productRefs.map(r => tx.get(r)));

      const orderItems = input.items.map((raw, idx) => {
        const pDoc = productDocs[idx];
        if (!pDoc.exists()) throw new OrderCreateError(`Product ${raw.productId} no longer exists.`);
        const product = pDoc.data() as any;
        const variant = (product.variants || []).find((v: any) => v.id === raw.variantId);
        if (!variant) throw new OrderCreateError(`Variant not found on product "${product.name}".`);
        if (variant.stock < raw.quantity) {
          throw new OrderCreateError(`Insufficient stock for "${product.name}" (${variant.unit}). Only ${variant.stock} left.`);
        }
        return {
          productId: raw.productId,
          variantId: raw.variantId,
          quantity: raw.quantity,
          name: product.name,
          unit: variant.unit,
          price: variant.price,
          lineTotal: Math.round(variant.price * raw.quantity * 100) / 100
        };
      });

      const subtotal = Math.round(orderItems.reduce((s, i) => s + i.lineTotal, 0) * 100) / 100;

      let discount = 0;
      let freeShip = false;
      let appliedPromoCode = '';
      if (input.promoCode) {
        const promo = PROMO_CODES[input.promoCode.toUpperCase()];
        if (!promo) throw new OrderCreateError(`Invalid promo code "${input.promoCode}".`);
        appliedPromoCode = input.promoCode.toUpperCase();
        if (promo.type === 'percent') discount = Math.round(subtotal * (promo.value || 0) * 100) / 100;
        else if (promo.type === 'free_shipping') freeShip = true;
      }

      let deliveryFee = zone.fee;
      if (freeShip) deliveryFee = 0;
      else if (subtotal >= FREE_DELIVERY_THRESHOLD) deliveryFee = 0;
      else if (loyalty.tier === 'gold') deliveryFee = 0;
      else if (loyalty.tier === 'vip' && subtotal >= VIP_FREE_SHIPPING_THRESHOLD) deliveryFee = 0;

      const total = Math.round((subtotal - discount + deliveryFee) * 100) / 100;
      const isCod = input.paymentMethod === 'Cash on Delivery' || input.paymentMethod === 'cod';

      const order = {
        id: orderRef.id,
        userId: user.id,
        userName: user.name || user.email,
        userEmail: user.email || '',
        items: orderItems,
        productIds: orderItems.map(i => i.productId),
        subtotal,
        discount,
        promoCode: appliedPromoCode,
        deliveryFee,
        total,
        address,
        zone: zone.name,
        deliveryDate: input.deliveryDate || null,
        deliverySlot: slot,
        paymentMethod: input.paymentMethod,
        status: 'Pending',
        paymentStatus: isCod ? 'pending_collection' : (ONLINE_PAYMENT_METHODS.indexOf(input.paymentMethod) >= 0 ? 'awaiting_payment' : 'awaiting_manual_verification'),
        inventoryDeducted: true,
        statusHistory: [{ status: 'Pending', timestamp: new Date().toISOString() }],
        createdAt: new Date().toISOString()
      };

      // --- Writes: deduct stock on every touched product, write the order. ---
      productDocs.forEach((pDoc, idx) => {
        const product = pDoc.data() as any;
        const raw = input.items[idx];
        const variants = product.variants.map((v: any) =>
          v.id === raw.variantId ? { ...v, stock: Math.max(0, v.stock - raw.quantity) } : v
        );
        tx.update(productRefs[idx], { variants });
      });
      tx.set(orderRef, order);

      const multiplier = loyalty.tier === 'gold' ? 3 : loyalty.tier === 'vip' ? 2 : 1;
      const newPoints = (loyalty.points || 0) + Math.floor(total / 100) * multiplier;
      const newTier = newPoints >= 2000 ? 'gold' : newPoints >= 500 ? 'vip' : (loyalty.tier || 'regular');
      tx.set(loyaltyRef, { points: newPoints, tier: newTier, referrals: loyalty.referrals || 0 }, { merge: true });

      placedOrder = order;
      return { id: orderRef.id, total };
    });
    this.products.clearCache();
    if (placedOrder) this.mailer.sendOrderStatus(placedOrder, 'Pending');
    return created;
  }
}
