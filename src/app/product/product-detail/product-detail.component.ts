import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProductService, Product } from '../../core/product.service';
import { CartService } from '../../core/cart.service';
import { WishlistService } from '../../core/wishlist.service';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './product-detail.component.html',
  styleUrl: './product-detail.component.css'
})
export class ProductDetailComponent implements OnInit {
  product = signal<Product | null>(null);
  reviews = signal<any[]>([]);
  selectedVariantId = '';
  quantity = 1;
  isWishlisted = signal(false);

  // Review submission form (mobile checklist: Submit Product Reviews / Give Ratings)
  reviewRating = 5;
  reviewComment = '';
  reviewSubmitting = signal(false);
  reviewError = signal('');

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private products: ProductService,
    public cart: CartService,
    private wishlist: WishlistService,
    public auth: AuthService
  ) {}

  async ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id')!;
    const p = await this.products.getById(id);
    if (!p) { this.router.navigate(['/shop']); return; }
    this.product.set(p);
    this.selectedVariantId = p.variants[0]?.id || '';
    this.reviews.set(await this.products.getReviews(id));

    const user = this.auth.currentUser();
    if (user) {
      const ids = await this.wishlist.get(user.id);
      this.isWishlisted.set(ids.includes(id));
    }
  }

  get selectedVariant() {
    return this.product()?.variants.find(v => v.id === this.selectedVariantId);
  }

  get averageRating(): number {
    const r = this.reviews();
    if (!r.length) return 0;
    return r.reduce((s, x) => s + x.rating, 0) / r.length;
  }

  addToCart() {
    const p = this.product();
    const v = this.selectedVariant;
    if (!p || !v) return;
    this.cart.add({
      productId: p.id, variantId: v.id, quantity: this.quantity,
      product: { name: p.name, image: p.image, imageUrl: p.imageUrl },
      variant: { unit: v.unit, price: v.price }
    });
  }

  async toggleWishlist() {
    const user = this.auth.currentUser();
    const p = this.product();
    if (!user || !p) { this.router.navigate(['/login']); return; }
    const ids = await this.wishlist.toggle(user.id, p.id);
    this.isWishlisted.set(ids.includes(p.id));
  }

  async submitReview() {
    const user = this.auth.currentUser();
    const p = this.product();
    if (!user) { this.router.navigate(['/login']); return; }
    if (!p) return;
    if (!this.reviewComment.trim()) { this.reviewError.set('Please write a comment.'); return; }

    this.reviewSubmitting.set(true);
    this.reviewError.set('');
    try {
      await this.products.addReview({
        productId: p.id, userId: user.id, userName: user.name,
        rating: this.reviewRating, comment: this.reviewComment.trim()
      });
      this.reviewComment = '';
      this.reviewRating = 5;
      this.reviews.set(await this.products.getReviews(p.id));
    } catch {
      this.reviewError.set('Could not submit review. Please try again.');
    } finally {
      this.reviewSubmitting.set(false);
    }
  }
}
