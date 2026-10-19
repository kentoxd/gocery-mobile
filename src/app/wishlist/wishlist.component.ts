import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { WishlistService } from '../core/wishlist.service';
import { ProductService, Product } from '../core/product.service';
import { CartService } from '../core/cart.service';
import { AuthService } from '../core/auth.service';
import { ToastService } from '../core/toast.service';
import { PageHeaderComponent } from '../shared/page-header/page-header.component';
import { NavIconComponent } from '../shared/nav-icon/nav-icon.component';

@Component({
  selector: 'app-wishlist',
  standalone: true,
  imports: [CommonModule, RouterLink, PageHeaderComponent, NavIconComponent],
  templateUrl: './wishlist.component.html',
  styleUrl: './wishlist.component.css'
})
export class WishlistComponent implements OnInit {
  products = signal<Product[]>([]);
  loading = signal(true);

  constructor(
    private wishlist: WishlistService,
    private productService: ProductService,
    public cart: CartService,
    private auth: AuthService,
    private toast: ToastService
  ) {}

  async ngOnInit() {
    const user = this.auth.currentUser();
    if (!user) return;
    const ids = await this.wishlist.get(user.id);
    const all = await this.productService.getAll();
    this.products.set(all.filter(p => ids.includes(p.id)));
    this.loading.set(false);
  }

  async remove(productId: string) {
    const user = this.auth.currentUser();
    if (!user) return;
    await this.wishlist.toggle(user.id, productId);
    this.products.update(list => list.filter(p => p.id !== productId));
  }

  moveToCart(p: Product) {
    const v = p.variants.find(x => x.stock > 0);
    if (!v) { this.toast.show('That item is sold out right now.', 'error'); return; }
    this.toast.show('Added 1x ' + p.name + ' to your cart!');
    this.cart.add({
      productId: p.id, variantId: v.id, quantity: 1,
      product: { name: p.name, image: p.image, imageUrl: p.imageUrl },
      variant: { unit: v.unit, price: v.price }
    });
    this.remove(p.id);
  }
}
