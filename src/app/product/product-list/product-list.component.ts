import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { ProductService, Product, CATEGORIES } from '../../core/product.service';
import { CartService } from '../../core/cart.service';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './product-list.component.html',
  styleUrl: './product-list.component.css'
})
export class ProductListComponent implements OnInit {
  categories = CATEGORIES;
  all: Product[] = [];
  results = signal<Product[]>([]);
  loading = signal(true);

  search = '';
  categoryId = '';
  sort = '';

  constructor(private products: ProductService, public cart: CartService, private route: ActivatedRoute) {}

  async ngOnInit() {
    const params = this.route.snapshot.queryParamMap;
    this.categoryId = params.get('category') || '';
    this.search = params.get('search') || '';

    this.all = await this.products.getAll();
    this.applyFilters();
    this.loading.set(false);
  }

  applyFilters() {
    this.results.set(this.products.filterAndSort(this.all, {
      search: this.search, categoryId: this.categoryId, sort: this.sort
    }));
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
