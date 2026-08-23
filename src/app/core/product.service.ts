import { Injectable } from '@angular/core';
import { collection, doc, getDoc, getDocs, addDoc, query, where } from 'firebase/firestore';
import { FirebaseService } from './firebase.service';

export interface Variant { id: string; unit: string; price: number; stock: number; }
export interface Product {
  id: string;
  name: string;
  categoryId: string;
  description: string;
  origin?: string;
  image: string;
  imageUrl?: string;
  featured?: boolean;
  tags?: string[];
  variants: Variant[];
}

@Injectable({ providedIn: 'root' })
export class ProductService {
  constructor(private fb: FirebaseService) {}

  async getAll(): Promise<Product[]> {
    const snap = await getDocs(collection(this.fb.db, 'products'));
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Product));
  }

  async getById(id: string): Promise<Product | null> {
    const d = await getDoc(doc(this.fb.db, 'products', id));
    return d.exists() ? ({ id: d.id, ...d.data() } as Product) : null;
  }

  async getReviews(productId: string) {
    const snap = await getDocs(query(collection(this.fb.db, 'reviews'), where('productId', '==', productId)));
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as any));
  }

  async addReview(review: { productId: string; userId: string; userName: string; rating: number; comment: string }) {
    await addDoc(collection(this.fb.db, 'reviews'), { ...review, date: new Date().toISOString().split('T')[0] });
  }

  filterAndSort(products: Product[], opts: { search?: string; categoryId?: string; sort?: string }): Product[] {
    let result = [...products];
    if (opts.search) {
      const q = opts.search.toLowerCase();
      result = result.filter(p => p.name.toLowerCase().includes(q) || (p.tags || []).some(t => t.toLowerCase().includes(q)));
    }
    if (opts.categoryId) result = result.filter(p => p.categoryId === opts.categoryId);
    if (opts.sort === 'price-asc') result.sort((a, b) => Math.min(...a.variants.map(v => v.price)) - Math.min(...b.variants.map(v => v.price)));
    else if (opts.sort === 'price-desc') result.sort((a, b) => Math.max(...b.variants.map(v => v.price)) - Math.max(...a.variants.map(v => v.price)));
    else if (opts.sort === 'name') result.sort((a, b) => a.name.localeCompare(b.name));
    return result;
  }
}
