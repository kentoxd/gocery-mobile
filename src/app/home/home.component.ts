import { Component, ElementRef, OnInit, ViewChild, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ProductService, Product, CATEGORIES } from '../core/product.service';
import { CartService } from '../core/cart.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, FormsModule],
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
    this.featured.set(all.filter(p => p.featured).slice(0, 8));
    this.loading.set(false);
  }

  qty(p: Product): number {
    return this.quantities.get(p.id) ?? 1;
  }

  changeQty(p: Product, delta: number) {
    const next = Math.max(1, this.qty(p) + delta);
    this.quantities.set(p.id, next);
  }

  addToCart(p: Product) {
    const variant = p.variants[0];
    this.cart.add({
      productId: p.id, variantId: variant.id, quantity: this.qty(p),
      product: { name: p.name, image: p.image, imageUrl: p.imageUrl },
      variant: { unit: variant.unit, price: variant.price }
    });
    this.quantities.set(p.id, 1);
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
