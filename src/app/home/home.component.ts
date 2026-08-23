import { Component, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ProductService, Product } from '../core/product.service';
import { CartService } from '../core/cart.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit {
  featured = signal<Product[]>([]);
  loading = signal(true);

  constructor(private products: ProductService, public cart: CartService) {}

  async ngOnInit() {
    const all = await this.products.getAll();
    this.featured.set(all.filter(p => p.featured).slice(0, 8));
    this.loading.set(false);
  }

  addToCart(p: Product) {
    const variant = p.variants[0];
    this.cart.add({
      productId: p.id, variantId: variant.id, quantity: 1,
      product: { name: p.name, image: p.image, imageUrl: p.imageUrl },
      variant: { unit: variant.unit, price: variant.price }
    });
  }
}
