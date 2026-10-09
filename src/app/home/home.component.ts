import { Component, ElementRef, OnInit, ViewChild, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ProductService, Product, CATEGORIES } from '../core/product.service';
import { CartService } from '../core/cart.service';
import { ProductCardComponent } from '../shared/product-card/product-card.component';
import { NotifBellComponent } from '../shared/notif-bell/notif-bell.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, FormsModule, ProductCardComponent, NotifBellComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit {
  @ViewChild('rail') rail!: ElementRef<HTMLDivElement>;

  featured = signal<Product[]>([]);
  loading = signal(true);
  menuOpen = signal(false);

  search = '';
  quantities = new Map<string, number>();

  categories = CATEGORIES.slice(0, 4);

  constructor(private products: ProductService, public cart: CartService, private router: Router) {}

  async ngOnInit() {
    const all = await this.products.getAll();
    // Best sellers first, then other featured products.
    const best = all.filter(p => (p.tags || []).indexOf('best-seller') >= 0);
    const featured = all.filter(p => p.featured && best.indexOf(p) < 0);
    this.featured.set(best.concat(featured).slice(0, 8));
    this.loading.set(false);
  }

  scrollRail(direction: number) {
    this.rail?.nativeElement.scrollBy({ left: direction * 220, behavior: 'smooth' });
  }

  runSearch() {
    this.router.navigate(['/shop'], this.search.trim() ? { queryParams: { search: this.search.trim() } } : {});
  }

  goToCategory(categoryId: string) {
    this.router.navigate(['/shop'], { queryParams: { category: categoryId } });
  }

  toggleMenu() {
    this.menuOpen.update(v => !v);
  }

  closeMenu() {
    this.menuOpen.set(false);
  }
}
