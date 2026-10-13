import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CmsService, RecipePost, RecipeIngredient } from '../core/cms.service';
import { ProductService, Product, Variant } from '../core/product.service';
import { CartService } from '../core/cart.service';
import { ToastService } from '../core/toast.service';
import { MiniCartService } from '../core/mini-cart.service';
import { optimizeImageUrl } from '../core/image-url.util';

const FAVORITES_KEY = 'gocery_recipe_favorites';

/** Mobile equivalent of the web app's pages/blog.html (recipes/blog with favorites). */
@Component({
  selector: 'app-blog',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './blog.component.html',
  styleUrl: './blog.component.css'
})
export class BlogComponent implements OnInit {
  posts = signal<RecipePost[]>([]);
  favoriteIds = signal<string[]>(this._loadFavorites());
  openPost = signal<RecipePost | null>(null);
  loading = signal(true);
  searchText = signal('');
  category = signal('');
  failedImages = signal<string[]>([]);
  private products = new Map<string, Product>();

  constructor(
    private cms: CmsService,
    private productService: ProductService,
    private cart: CartService,
    private toast: ToastService,
    private mini: MiniCartService
  ) {}

  /** Category names found in the recipes, for the filter chips. */
  get categories(): string[] {
    const names: string[] = [];
    const all = this.posts();
    for (let i = 0; i < all.length; i++) {
      const c = all[i].category || 'Recipes';
      if (names.indexOf(c) < 0) names.push(c);
    }
    return names;
  }

  /** Recipes that match the search box and the chosen category. */
  get visiblePosts(): RecipePost[] {
    const words = this.searchText().trim().toLowerCase();
    const chosen = this.category();
    const list: RecipePost[] = [];
    const all = this.posts();
    for (let i = 0; i < all.length; i++) {
      const p = all[i];
      if (chosen && (p.category || 'Recipes') !== chosen) continue;
      if (words) {
        let text = (p.title + ' ' + (p.excerpt || '') + ' ' + (p.category || '')).toLowerCase();
        const ings = p.ingredients || [];
        for (let j = 0; j < ings.length; j++) text += ' ' + String(ings[j].name).toLowerCase();
        if (text.indexOf(words) < 0) continue;
      }
      list.push(p);
    }
    return list;
  }

  clearFilters() {
    this.searchText.set('');
    this.category.set('');
  }

  async ngOnInit() {
    const [recipes, all] = await Promise.all([this.cms.getRecipes(), this.productService.getAll().catch(() => [] as Product[])]);
    for (let i = 0; i < all.length; i++) this.products.set(all[i].id, all[i]);
    this.posts.set(recipes);
    this.loading.set(false);
  }

  /** The product and size an ingredient points to (null for pantry items we don't sell). */
  match(ing: RecipeIngredient): { product: Product; variant: Variant } | null {
    if (!ing.productId) return null;
    const product = this.products.get(ing.productId);
    if (!product) return null;
    let variant: Variant | undefined;
    for (let i = 0; i < product.variants.length; i++) {
      if (product.variants[i].id === ing.variantId) variant = product.variants[i];
    }
    if (!variant) variant = product.variants.find(v => v.stock > 0) || product.variants[0];
    return { product, variant };
  }

  inStock(ing: RecipeIngredient): boolean {
    const m = this.match(ing);
    return !!m && m.variant.stock > 0;
  }

  ingredientPrice(ing: RecipeIngredient): number {
    const m = this.match(ing);
    return m ? m.variant.price * (ing.qty || 1) : 0;
  }

  orderable(post: RecipePost): RecipeIngredient[] {
    const list: RecipeIngredient[] = [];
    const all = post.ingredients || [];
    for (let i = 0; i < all.length; i++) {
      if (this.inStock(all[i])) list.push(all[i]);
    }
    return list;
  }

  orderTotal(post: RecipePost): number {
    const list = this.orderable(post);
    let total = 0;
    for (let i = 0; i < list.length; i++) total += this.ingredientPrice(list[i]);
    return total;
  }

  addIngredients(list: RecipeIngredient[], label: string, openSheet: boolean) {
    let added = 0;
    for (let i = 0; i < list.length; i++) {
      const m = this.match(list[i]);
      if (!m || m.variant.stock <= 0) continue;
      this.cart.add({
        productId: m.product.id, variantId: m.variant.id, quantity: list[i].qty || 1,
        product: { name: m.product.name, image: m.product.image, imageUrl: m.product.imageUrl },
        variant: { unit: m.variant.unit, price: m.variant.price }
      });
      added++;
    }
    if (!added) { this.toast.show('Those items are out of stock right now.', 'error'); return; }
    this.toast.show('Added ' + added + ' item' + (added === 1 ? '' : 's') + ' for ' + label + ' to your cart!');
    if (openSheet) this.mini.open('Ingredients for ' + label);
  }

  /** Recipe photo, else the first ingredient's product photo, else empty (the emoji shows). */
  imageFor(post: RecipePost): string {
    if (this.failedImages().indexOf(post.id) >= 0) return '';
    if (this.isImageUrl(post.image)) return optimizeImageUrl(post.image);
    const list = post.ingredients || [];
    for (let i = 0; i < list.length; i++) {
      const m = this.match(list[i]);
      if (m && m.product.imageUrl) return m.product.imageUrl;
    }
    return '';
  }

  emojiFor(post: RecipePost): string {
    return this.isImageUrl(post.image) ? '🍲' : (post.image || '🍲');
  }

  imageFailed(id: string) {
    this.failedImages.update(list => list.concat([id]));
  }

  private _loadFavorites(): string[] {
    try {
      const raw = localStorage.getItem(FAVORITES_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  private _saveFavorites(ids: string[]) {
    this.favoriteIds.set(ids);
    try { localStorage.setItem(FAVORITES_KEY, JSON.stringify(ids)); } catch { /* storage unavailable */ }
  }

  isFavorite(id: string): boolean {
    return this.favoriteIds().includes(id);
  }

  toggleFavorite(id: string, event?: Event) {
    event?.stopPropagation();
    const favs = this.favoriteIds();
    this._saveFavorites(favs.includes(id) ? favs.filter(f => f !== id) : [...favs, id]);
  }

  get favoritePosts(): RecipePost[] {
    const favs = this.favoriteIds();
    return this.posts().filter(p => favs.includes(p.id));
  }

  isImageUrl(image: string | undefined): boolean {
    return !!image && image.startsWith('http');
  }

  optimize(image: string | undefined): string {
    return optimizeImageUrl(image);
  }

  view(post: RecipePost) {
    this.openPost.set(post);
  }

  closeModal() {
    this.openPost.set(null);
  }
}
