import { Component, Input, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Product } from '../../core/product.service';
import { CartService } from '../../core/cart.service';
import { ToastService } from '../../core/toast.service';
import { MiniCartService } from '../../core/mini-cart.service';

/**
 * One product card used on Home and Shop: unit price, size picker when a product
 * has several sizes, "Only N left" label, sold-out state, and the add-to-cart feedback.
 */
@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './product-card.component.html',
  styleUrl: './product-card.component.css'
})
export class ProductCardComponent implements OnInit {
  @Input({ required: true }) product!: Product;
  /** Show the − 1 + stepper (used on the Home rail). */
  @Input() showQty = false;

  variantId = '';
  quantity = 1;

  constructor(private cart: CartService, private toast: ToastService, private mini: MiniCartService) {}

  ngOnInit() {
    const inStock = this.product.variants.find(v => v.stock > 0);
    this.variantId = (inStock || this.product.variants[0]).id;
  }

  get variant() {
    return this.product.variants.find(v => v.id === this.variantId) || this.product.variants[0];
  }

  get totalStock(): number {
    let total = 0;
    for (let i = 0; i < this.product.variants.length; i++) {
      total += Math.max(0, this.product.variants[i].stock || 0);
    }
    return total;
  }

  get soldOut(): boolean {
    return this.totalStock === 0;
  }

  get lowStock(): boolean {
    return this.totalStock > 0 && this.totalStock <= 10;
  }

  changeQty(delta: number) {
    this.quantity = Math.max(1, this.quantity + delta);
  }

  add() {
    const p = this.product;
    const v = this.variant;
    if (!v || v.stock <= 0) return;
    this.cart.add({
      productId: p.id, variantId: v.id, quantity: this.quantity,
      product: { name: p.name, image: p.image, imageUrl: p.imageUrl },
      variant: { unit: v.unit, price: v.price }
    });
    const message = 'Added ' + this.quantity + 'x ' + p.name + ' to your cart';
    this.toast.show(message + '!');
    this.mini.open(message);
    this.quantity = 1;
  }
}
