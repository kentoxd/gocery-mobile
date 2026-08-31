import { Component, OnInit, signal } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProductService, Product } from '../../core/product.service';
import { CartService } from '../../core/cart.service';
import { WishlistService } from '../../core/wishlist.service';
import { AuthService } from '../../core/auth.service';
import { ReviewService, Review } from '../../core/review.service';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './product-detail.component.html',
  styleUrl: './product-detail.component.css'
})
export class ProductDetailComponent implements OnInit {
  product = signal<Product | null>(null);
  reviews = signal<Review[]>([]);
  selectedVariantId = '';
  quantity = 1;
  isWishlisted = signal(false);

  // Review submission form (mobile checklist: Submit Product Reviews / Give Ratings).
  // Gated the same way as the web app: only customers with a Delivered
  // order containing this product may review it, and only once.
  reviewRating = 5;
  reviewComment = '';
  reviewSubmitting = signal(false);
  reviewError = signal('');
  reviewGateStatus = signal<'checking' | 'eligible' | 'not-eligible' | 'already-reviewed' | 'logged-out'>('logged-out');

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private products: ProductService,
    public cart: CartService,
    private wishlist: WishlistService,
    public auth: AuthService,
    private reviewsSvc: ReviewService,
    private location: Location
  ) {}

  goBack() {
    this.location.back();
  }

  async ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id')!;
    const p = await this.products.getById(id);
    if (!p) { this.router.navigate(['/shop']); return; }
    this.product.set(p);
    this.selectedVariantId = p.variants[0]?.id || '';
    this.reviews.set(await this.reviewsSvc.getByProduct(id));

    const user = this.auth.currentUser();
    if (user) {
      const ids = await this.wishlist.get(user.id);
      this.isWishlisted.set(ids.includes(id));
      await this.checkReviewEligibility(user.id, id);
    } else {
      this.reviewGateStatus.set('logged-out');
    }
  }

  private async checkReviewEligibility(userId: string, productId: string) {
    this.reviewGateStatus.set('checking');
    if (await this.reviewsSvc.hasReviewed(userId, productId)) {
      this.reviewGateStatus.set('already-reviewed');
      return;
    }
    const eligibleOrder = await this.reviewsSvc.getEligibleOrder(userId, productId);
    this.reviewGateStatus.set(eligibleOrder ? 'eligible' : 'not-eligible');
  }

  get selectedVariant() {
    return this.product()?.variants.find(v => v.id === this.selectedVariantId);
  }

  get averageRating(): number {
    return this.reviewsSvc.getAverageRating(this.reviews());
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
      const result = await this.reviewsSvc.add({
        productId: p.id, userId: user.id, userName: user.name,
        rating: this.reviewRating, comment: this.reviewComment.trim()
      });
      if (!result.success) {
        this.reviewError.set(result.error || 'Could not submit review.');
        return;
      }
      this.reviewComment = '';
      this.reviewRating = 5;
      this.reviews.set(await this.reviewsSvc.getByProduct(p.id));
      this.reviewGateStatus.set('already-reviewed');
    } catch {
      this.reviewError.set('Could not submit review. Please try again.');
    } finally {
      this.reviewSubmitting.set(false);
    }
  }
}
