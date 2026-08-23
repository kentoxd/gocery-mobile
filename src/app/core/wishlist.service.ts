import { Injectable } from '@angular/core';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { FirebaseService } from './firebase.service';

@Injectable({ providedIn: 'root' })
export class WishlistService {
  constructor(private fb: FirebaseService) {}

  async get(userId: string): Promise<string[]> {
    const d = await getDoc(doc(this.fb.db, 'wishlists', userId));
    return d.exists() ? (d.data()['productIds'] || []) : [];
  }

  async toggle(userId: string, productId: string): Promise<string[]> {
    const productIds = await this.get(userId);
    const idx = productIds.indexOf(productId);
    if (idx >= 0) productIds.splice(idx, 1);
    else productIds.push(productId);
    await setDoc(doc(this.fb.db, 'wishlists', userId), { productIds });
    return productIds;
  }
}
