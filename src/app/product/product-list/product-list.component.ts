import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { ProductService, Product, CATEGORIES } from '../../core/product.service';
import { CartService } from '../../core/cart.service';
import { AuthService } from '../../core/auth.service';
import { ProductCardComponent } from '../../shared/product-card/product-card.component';
import { NotifBellComponent } from '../../shared/notif-bell/notif-bell.component';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [FormsModule, RouterLink, ProductCardComponent, NotifBellComponent],
  templateUrl: './product-list.component.html',
  styleUrl: './product-list.component.css'
})
export class ProductListComponent implements OnInit {
  categories = CATEGORIES;
  all: Product[] = [];
  results = signal<Product[]>([]);
  loading = signal(true);
  loadError = signal(false);
  inStockOnly = false;
  menuOpen = signal(false);

  search = '';
  categoryId = '';
  sort = '';

  constructor(private products: ProductService, public cart: CartService, private route: ActivatedRoute, public auth: AuthService) {}


  async ngOnInit() {
    const params = this.route.snapshot.queryParamMap;
    this.categoryId = params.get('category') || '';
    this.search = params.get('search') || '';
    await this.load();
  }

  async load() {
    this.loading.set(true);
    this.loadError.set(false);
    try {
      this.all = await this.products.getAll();
      this.applyFilters();
    } catch {
      this.loadError.set(true);
    }
    this.loading.set(false);
  }

  applyFilters() {
    let list = this.products.filterAndSort(this.all, {
      search: this.search, categoryId: this.categoryId, sort: this.sort
    });
    if (this.inStockOnly) {
      list = list.filter(p => p.variants.some(v => v.stock > 0));
    }
    this.results.set(list);
  }

  clearFilters() {
    this.search = '';
    this.categoryId = '';
    this.sort = '';
    this.inStockOnly = false;
    this.applyFilters();
  }
    closeMenu() {
    this.menuOpen.set(false);
  }
    toggleMenu() {
    this.menuOpen.update(v => !v);
  }
}
