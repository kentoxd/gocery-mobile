import { Injectable, computed, signal } from '@angular/core';

export interface CartItem {
  productId: string;
  variantId: string;
  quantity: number;
  product: { name: string; image: string; imageUrl?: string };
  variant: { unit: string; price: number };
}

const STORAGE_KEY = 'gocery_mobile_cart';

@Injectable({ providedIn: 'root' })
export class CartService {
  private items = signal<CartItem[]>(this.load());

  readonly cartItems = this.items.asReadonly();
  readonly itemCount = computed(() => this.items().reduce((s, i) => s + i.quantity, 0));
  readonly subtotal = computed(() => this.items().reduce((s, i) => s + i.variant.price * i.quantity, 0));

  private load(): CartItem[] {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    } catch {
      return [];
    }
  }

  private save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.items()));
  }

  add(item: CartItem) {
    const existing = this.items().find(i => i.productId === item.productId && i.variantId === item.variantId);
    if (existing) {
      this.items.update(items => items.map(i => i === existing ? { ...i, quantity: i.quantity + item.quantity } : i));
    } else {
      this.items.update(items => [...items, item]);
    }
    this.save();
  }

  updateQuantity(productId: string, variantId: string, quantity: number) {
    this.items.update(items =>
      items.map(i => (i.productId === productId && i.variantId === variantId) ? { ...i, quantity: Math.max(1, quantity) } : i)
    );
    this.save();
  }

  remove(productId: string, variantId: string) {
    this.items.update(items => items.filter(i => !(i.productId === productId && i.variantId === variantId)));
    this.save();
  }

  clear() {
    this.items.set([]);
    this.save();
  }
}
