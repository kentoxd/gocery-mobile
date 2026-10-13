import { Injectable } from '@angular/core';
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { FirebaseService } from './firebase.service';
import { SEED_RECIPES } from './recipes-seed';

export interface RecipeIngredient {
  name: string;
  amount?: string;
  /** When set, the ingredient can be ordered straight from the recipe. */
  productId?: string;
  variantId?: string;
  qty?: number;
}

export interface RecipePost {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  category?: string;
  image?: string;
  date?: string;
  servings?: number | string;
  prepTime?: string;
  cookTime?: string;
  difficulty?: string;
  ingredients?: RecipeIngredient[];
  steps?: string[];
  tips?: string[];
  /** 'published' recipes are shown to customers; 'draft' ones are hidden. */
  status?: string;
}

export interface FaqItem { q: string; a: string; }

/**
 * Reads the same `cms/main` Firestore document the web app's API.cms
 * module reads (js/modules/api.js) — recipes/blog posts, FAQ, the About
 * copy, and the merchant's GCash/Maya QR codes are all managed from the
 * same admin panel and shared across both clients.
 */
@Injectable({ providedIn: 'root' })
export class CmsService {
  private _cms: any = null;

  constructor(private fb: FirebaseService) {}

  private async _getCms(): Promise<any> {
    if (this._cms) return this._cms;
    const d = await getDoc(doc(this.fb.db, 'cms', 'main'));
    this._cms = d.exists() ? d.data() : {};
    return this._cms;
  }

  private _recipes: { time: number; data: RecipePost[] } | null = null;

  /**
   * Recipes live in their own Firestore collection (one document each, set up from the admin page).
   * Until the admin opens Recipes for the first time, the old list in cms/main (or the seed data) is used.
   */
  async getRecipes(): Promise<RecipePost[]> {
    if (this._recipes && Date.now() - this._recipes.time < 60000) return this._recipes.data;
    const cms = await this._getCms();
    let list: RecipePost[] | null = null;
    try {
      const snap = await getDocs(query(collection(this.fb.db, 'recipes'), where('status', '==', 'published')));
      if (!snap.empty || cms.recipesMigrated) {
        list = snap.docs.map(d => ({ id: d.id, ...d.data() } as RecipePost));
        list.sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')));
      }
    } catch {
      list = null; // collection not available yet (rules not deployed): use the old list
    }
    if (list === null) {
      list = (cms.recipes && cms.recipes.length) ? cms.recipes : SEED_RECIPES;
    }
    this._recipes = { time: Date.now(), data: list! };
    return list!;
  }

  async getFaq(): Promise<FaqItem[]> {
    const cms = await this._getCms();
    return cms.pages?.faq || [];
  }

  async getAbout(): Promise<string> {
    const cms = await this._getCms();
    return cms.pages?.about || '';
  }

  async getPaymentQrCodes(): Promise<{ gcashQrUrl: string; mayaQrUrl: string }> {
    const cms = await this._getCms();
    return { gcashQrUrl: cms.gcashQrUrl || '', mayaQrUrl: cms.mayaQrUrl || '' };
  }

  async getBanners(): Promise<any[]> {
    const cms = await this._getCms();
    return (cms.banners || []).filter((b: any) => b.active);
  }
}
