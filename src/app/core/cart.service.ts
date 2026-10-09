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

  /** Keys ("productId|variantId") picked for checkout. null means every item is picked. */
  private selected = signal<string[] | null>(null);

  readonly cartItems = this.items.asReadonly();
  readonly itemCount = computed(() => this.items().reduce((s, i) => s + i.quantity, 0));
  readonly subtotal = computed(() => this.items().reduce((s, i) => s + i.variant.price * i.quantity, 0));

  readonly selectedItems = computed(() => {
    const picked = this.selected();
    const all = this.items();
    if (picked === null) return all;
    return all.filter(i => picked.indexOf(this.keyOf(i)) >= 0);
  });
  readonly selectedCount = computed(() => this.selectedItems().length);
  readonly selectedSubtotal = computed(() => this.selectedItems().reduce((s, i) => s + i.variant.price * i.quantity, 0));
  readonly allSelected = computed(() => this.selectedItems().length === this.items().length);

  keyOf(i: { productId: string; variantId: string }): string {
    return i.productId + '|' + i.variantId;
  }

  isSelected(i: CartItem): boolean {
    const picked = this.selected();
    return picked === null || picked.indexOf(this.keyOf(i)) >= 0;
  }

  toggleSelected(i: CartItem) {
    const key = this.keyOf(i);
    const picked = this.selected() === null ? this.items().map(x => this.keyOf(x)) : [...this.selected()!];
    const at = picked.indexOf(key);
    if (at >= 0) picked.splice(at, 1);
    else picked.push(key);
    this.selected.set(picked);
  }

  selectAll(on: boolean) {
    this.selected.set(on ? null : []);
  }

  /** After an order: take out only the items that were paid for and keep the rest. */
  removePaidItems() {
    const paid = this.selectedItems().map(i => this.keyOf(i));
    this.items.update(list => list.filter(i => paid.indexOf(this.keyOf(i)) < 0));
    this.selected.set(null);
    this.save();
  }

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
    const picked = this.selected();
    if (picked !== null && picked.indexOf(this.keyOf(item)) < 0) this.selected.set([...picked, this.keyOf(item)]);
    this.save();
  }

  updateQuantity(productId: string, variantId: string, quantity: number) {
    this.items.update(items =>
      items.map(i => (i.productId === productId && i.variantId === variantId) ? { ...i, quantity: Math.max(1, quantity) } : i)
    );
    this.save();
  }

  remove(productId: string, variantId: string) {
    const picked = this.selected();
    if (picked !== null) this.selected.set(picked.filter(k => k !== productId + '|' + variantId));
    this.items.update(items => items.filter(i => !(i.productId === productId && i.variantId === variantId)));
    this.save();
  }

  clear() {
    this.selected.set(null);
    this.items.set([]);
    this.save();
  }
}
