import { Injectable } from '@angular/core';
import { collection, doc, getDoc, getDocs, query, where, orderBy } from 'firebase/firestore';
import { FirebaseService } from './firebase.service';

@Injectable({ providedIn: 'root' })
export class OrderService {
  constructor(private fb: FirebaseService) {}

  async getMyOrders(userId: string) {
    const snap = await getDocs(query(collection(this.fb.db, 'orders'), where('userId', '==', userId), orderBy('createdAt', 'desc')));
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as any));
  }

  async getById(id: string) {
    const d = await getDoc(doc(this.fb.db, 'orders', id));
    return d.exists() ? { id: d.id, ...d.data() } as any : null;
  }
}
