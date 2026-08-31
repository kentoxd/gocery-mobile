import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ReviewService, Review } from '../core/review.service';
import { ProductService, Product } from '../core/product.service';

/**
 * All-reviews grid — mobile equivalent of the web app's pages/reviews.html.
 * Shows every review across the catalog, newest first, with the
 * reviewed product's name/image alongside each card.
 */
@Component({
  selector: 'app-reviews',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './reviews.component.html',
  styleUrl: './reviews.component.css'
})
export class ReviewsComponent implements OnInit {
  reviews = signal<Review[]>([]);
  products = signal<Map<string, Product>>(new Map());
  loading = signal(true);

  constructor(private reviewsSvc: ReviewService, private productService: ProductService) {}

  async ngOnInit() {
    const [reviews, allProducts] = await Promise.all([
      this.reviewsSvc.getAll(),
      this.productService.getAll()
    ]);
    this.reviews.set(reviews);
    this.products.set(new Map(allProducts.map(p => [p.id, p])));
    this.loading.set(false);
  }

  productFor(review: Review): Product | undefined {
    return this.products().get(review.productId);
  }

  minPrice(p: Product): number {
    return Math.min(...p.variants.map(v => v.price));
  }
}
