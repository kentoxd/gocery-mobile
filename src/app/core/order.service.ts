import { Injectable } from '@angular/core';
import { collection, doc, getDoc, getDocs, query, where, orderBy, runTransaction, updateDoc } from 'firebase/firestore';
import { FirebaseService } from './firebase.service';
import { AuthService } from './auth.service';
import { CloudinaryService } from './cloudinary.service';
import { ProductService } from './product.service';

@Injectable({ providedIn: 'root' })
export class OrderService {
  constructor(
    private fb: FirebaseService,
    private auth: AuthService,
    private cloud: CloudinaryService,
    private products: ProductService
  ) {}

  async getMyOrders(userId: string) {
    const snap = await getDocs(query(collection(this.fb.db, 'orders'), where('userId', '==', userId), orderBy('createdAt', 'desc')));
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as any));
  }

  async getById(id: string) {
    const d = await getDoc(doc(this.fb.db, 'orders', id));
    return d.exists() ? { id: d.id, ...d.data() } as any : null;
  }

  /**
   * Customers can cancel only while the order is still Pending.
   * This app takes stock off the shelf when the order is placed, so cancelling gives it back.
   */
  async cancel(orderId: string): Promise<{ success: boolean; error?: string }> {
    const user = this.auth.currentUser();
    if (!user) return { success: false, error: 'You must be logged in.' };
    const orderRef = doc(this.fb.db, 'orders', orderId);

    try {
      await runTransaction(this.fb.db, async (tx) => {
        const orderDoc = await tx.get(orderRef);
        if (!orderDoc.exists()) throw new Error('Order not found.');
        const order = orderDoc.data() as any;
        if (order.userId !== user.id) throw new Error('This is not your order.');
        if (order.status !== 'Pending') throw new Error('Only pending orders can be cancelled.');

        // All reads first, then writes.
        const items: any[] = order.items || [];
        const productRefs: any[] = [];
        const productDocs: any[] = [];
        if (order.inventoryDeducted) {
          for (let i = 0; i < items.length; i++) {
            const ref = doc(this.fb.db, 'products', items[i].productId);
            productRefs.push(ref);
            productDocs.push(await tx.get(ref));
          }
        }

        const history = (order.statusHistory || []).concat([{
          status: 'Cancelled', timestamp: new Date().toISOString(), note: 'Cancelled by customer'
        }]);
        tx.update(orderRef, { status: 'Cancelled', statusHistory: history });

        for (let i = 0; i < productDocs.length; i++) {
          if (!productDocs[i].exists()) continue;
          const product = productDocs[i].data() as any;
          const variants = (product.variants || []).map((v: any) =>
            v.id === items[i].variantId ? { ...v, stock: (v.stock || 0) + items[i].quantity } : v
          );
          tx.update(productRefs[i], { variants });
        }
      });
      this.products.clearCache();
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message || 'Could not cancel the order.' };
    }
  }

  /** Uploads a GCash/Maya payment receipt photo and attaches it to the order. */
  async uploadReceipt(orderId: string, file: File): Promise<{ success: boolean; url?: string; error?: string }> {
    try {
      const url = await this.cloud.uploadImage(file, 'receipts/' + orderId);
      await updateDoc(doc(this.fb.db, 'orders', orderId), {
        receiptUrl: url,
        receiptUploadedAt: new Date().toISOString()
      });
      return { success: true, url };
    } catch (e: any) {
      return { success: false, error: e.message || 'Could not upload the receipt.' };
    }
  }
}
