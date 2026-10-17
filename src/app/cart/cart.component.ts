import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { CartService } from '../core/cart.service';
import { AuthService } from '../core/auth.service';
import { ProductService, Product } from '../core/product.service';
import { ToastService } from '../core/toast.service';
import { FREE_DELIVERY_THRESHOLD } from '../core/pricing.config';
import { ProductCardComponent } from '../shared/product-card/product-card.component';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, RouterLink, ProductCardComponent],
  templateUrl: './cart.component.html',
  styleUrl: './cart.component.css'
})
export class CartComponent implements OnInit {
  popular = signal<Product[]>([]);
  threshold = FREE_DELIVERY_THRESHOLD;
  menuOpen = signal(false);

  constructor(
    public cart: CartService,
    public auth: AuthService,
    private router: Router,
    private products: ProductService,
    private toast: ToastService
  ) {}

  async ngOnInit() {
    // Suggest popular items when the cart is empty.
    if (!this.cart.cartItems().length) {
      try {
        const all = await this.products.getAll();
        this.popular.set(all.filter(p => p.featured).slice(0, 4));
      } catch {
        this.popular.set([]);
      }
    }
  }

  get remaining(): number {
    return Math.max(0, this.threshold - this.cart.selectedSubtotal());
  }

  get progress(): number {
    return Math.min(100, (this.cart.selectedSubtotal() / this.threshold) * 100);
  }

  onSelectAll(event: Event) {
    this.cart.selectAll((event.target as HTMLInputElement).checked);
  }

  goToCheckout() {
    if (!this.cart.selectedCount()) {
      this.toast.show('Select at least one item to check out.', 'error');
      return;
    }
    if (!this.auth.currentUser()) {
      this.toast.show('Please log in to continue to checkout. Your cart is saved.', 'error');
      this.router.navigate(['/login']);
      return;
    }
    this.router.navigate(['/checkout']);
  }
      closeMenu() {
    this.menuOpen.set(false);
  }
    toggleMenu() {
    this.menuOpen.update(v => !v);
  }
}
