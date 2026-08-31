import { Injectable } from '@angular/core';
import { collection, getDocs, addDoc, query, where, limit } from 'firebase/firestore';
import { FirebaseService } from './firebase.service';

export interface Review {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  date: string;
  orderId?: string;
  verified?: boolean;
}

/**
 * Mirrors the web app's API.reviews module (js/modules/api.js): a
 * customer can only review a product after it shows Delivered on one
 * of their own orders, and only once per product.
 */
@Injectable({ providedIn: 'root' })
export class ReviewService {
  constructor(private fb: FirebaseService) {}

  async getByProduct(productId: string): Promise<Review[]> {
    const snap = await getDocs(query(collection(this.fb.db, 'reviews'), where('productId', '==', productId)));
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Review));
  }

  async getAll(): Promise<Review[]> {
    const snap = await getDocs(collection(this.fb.db, 'reviews'));
    return snap.docs
      .map(d => ({ id: d.id, ...d.data() } as Review))
      .sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')));
  }

  getAverageRating(reviews: Review[]): number {
    if (!reviews.length) return 0;
    return reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
  }

  /** The first Delivered order (if any) containing this product — required before reviewing. */
  async getEligibleOrder(userId: string, productId: string): Promise<any | null> {
    if (!userId) return null;
    const snap = await getDocs(query(
      collection(this.fb.db, 'orders'),
      where('userId', '==', userId),
      where('status', '==', 'Delivered'),
      where('productIds', 'array-contains', productId),
      limit(1)
    ));
    return snap.empty ? null : { id: snap.docs[0].id, ...snap.docs[0].data() };
  }

  async hasReviewed(userId: string, productId: string): Promise<boolean> {
    if (!userId) return false;
    const snap = await getDocs(query(
      collection(this.fb.db, 'reviews'),
      where('userId', '==', userId),
      where('productId', '==', productId),
      limit(1)
    ));
    return !snap.empty;
  }

  async add(review: { productId: string; userId: string; userName: string; rating: number; comment: string }): Promise<{ success: boolean; error?: string }> {
    const eligibleOrder = await this.getEligibleOrder(review.userId, review.productId);
    if (!eligibleOrder) {
      return { success: false, error: 'You can only review a product after it has been delivered to you.' };
    }
    if (await this.hasReviewed(review.userId, review.productId)) {
      return { success: false, error: 'You\u2019ve already reviewed this product.' };
    }
    await addDoc(collection(this.fb.db, 'reviews'), {
      ...review,
      orderId: eligibleOrder.id,
      date: new Date().toISOString().split('T')[0]
    });
    return { success: true };
  }
}
