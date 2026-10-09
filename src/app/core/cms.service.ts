import { Injectable } from '@angular/core';
import { doc, getDoc } from 'firebase/firestore';
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

  async getRecipes(): Promise<RecipePost[]> {
    const cms = await this._getCms();
    return (cms.recipes && cms.recipes.length) ? cms.recipes : SEED_RECIPES;
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
