import { Injectable, signal } from '@angular/core';
import {
  createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut,
  onAuthStateChanged, GoogleAuthProvider, signInWithPopup, User as FirebaseUser
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { FirebaseService } from './firebase.service';

export interface AppUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  addresses?: any[];
  role?: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  /** Reactive current-user signal — components read this directly, no subscriptions needed. */
  readonly currentUser = signal<AppUser | null>(null);
  readonly authReady = signal(false);

  constructor(private fb: FirebaseService) {
    onAuthStateChanged(this.fb.auth, async (firebaseUser: FirebaseUser | null) => {
      if (!firebaseUser) {
        this.currentUser.set(null);
        this.authReady.set(true);
        return;
      }
      const profileDoc = await getDoc(doc(this.fb.db, 'users', firebaseUser.uid));
      this.currentUser.set(
        profileDoc.exists()
          ? { id: firebaseUser.uid, email: firebaseUser.email || '', ...profileDoc.data() } as AppUser
          : { id: firebaseUser.uid, email: firebaseUser.email || '', name: firebaseUser.displayName || '', addresses: [] }
      );
      this.authReady.set(true);
    });
  }

  async register(name: string, email: string, password: string, phone: string): Promise<{ success: boolean; error?: string }> {
    try {
      const cred = await createUserWithEmailAndPassword(this.fb.auth, email, password);
      const profile = { name, email, phone, addresses: [], createdAt: new Date().toISOString() };
      await setDoc(doc(this.fb.db, 'users', cred.user.uid), profile);
      this.currentUser.set({ id: cred.user.uid, ...profile });
      return { success: true };
    } catch (e: any) {
      const msg = e.code === 'auth/email-already-in-use' ? 'This email is already registered.' : (e.message || 'Registration failed');
      return { success: false, error: msg };
    }
  }

  async login(email: string, password: string): Promise<{ success: boolean; error?: string }> {
    try {
      await signInWithEmailAndPassword(this.fb.auth, email, password);
      return { success: true };
    } catch {
      return { success: false, error: 'Invalid email or password' };
    }
  }

  async loginWithGoogle(): Promise<{ success: boolean; error?: string }> {
    try {
      const cred = await signInWithPopup(this.fb.auth, new GoogleAuthProvider());
      const profileRef = doc(this.fb.db, 'users', cred.user.uid);
      const profileDoc = await getDoc(profileRef);
      if (!profileDoc.exists()) {
        await setDoc(profileRef, {
          name: cred.user.displayName || '',
          email: cred.user.email,
          addresses: [],
          createdAt: new Date().toISOString()
        });
      }
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.code === 'auth/popup-closed-by-user' ? 'Sign-in cancelled' : 'Google sign-in failed' };
    }
  }

  async logout(): Promise<void> {
    await signOut(this.fb.auth);
  }

  async updateProfile(updates: Partial<AppUser>): Promise<void> {
    const user = this.currentUser();
    if (!user) return;
    await updateDoc(doc(this.fb.db, 'users', user.id), updates as any);
    this.currentUser.set({ ...user, ...updates });
  }

  async addAddress(address: any): Promise<void> {
    const user = this.currentUser();
    if (!user) return;
    address.id = 'addr' + Date.now();
    const addresses = [...(user.addresses || []), address];
    await updateDoc(doc(this.fb.db, 'users', user.id), { addresses });
    this.currentUser.set({ ...user, addresses });
  }
}
