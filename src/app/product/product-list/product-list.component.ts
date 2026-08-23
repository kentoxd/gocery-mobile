import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ProductService, Product } from '../../core/product.service';
import { CartService } from '../../core/cart.service';

const CATEGORIES = [
  { id: 'fruits', name: 'Fruits' },
  { id: 'vegetables', name: 'Vegetables' },
  { id: 'herbs-spices', name: 'Herbs & Spices' },
  { id: 'seafood', name: 'Fresh Seafood' },
  { id: 'meat', name: 'Fresh Meat' },
  { id: 'eggs-dairy', name: 'Eggs & Dairy' }
];

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

  constructor(private products: ProductService, public cart: CartService) {}

  async ngOnInit() {
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
