import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CartService } from '../../core/cart.service';
import { MiniCartService } from '../../core/mini-cart.service';
import { FREE_DELIVERY_THRESHOLD } from '../../core/pricing.config';

/** Bottom sheet shown after "Add to Cart": what was added, free-delivery progress, and quick links. */
@Component({
  selector: 'app-mini-cart',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './mini-cart.component.html',
  styleUrl: './mini-cart.component.css'
})
export class MiniCartComponent {
  threshold = FREE_DELIVERY_THRESHOLD;

  constructor(public cart: CartService, public mini: MiniCartService) {}

  get latestItems() {
    const items = this.cart.cartItems();
    return items.slice(-3).reverse();
  }

  get remaining(): number {
    return Math.max(0, this.threshold - this.cart.subtotal());
  }

  get progress(): number {
    return Math.min(100, (this.cart.subtotal() / this.threshold) * 100);
  }
}
