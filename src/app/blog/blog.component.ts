import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CmsService, RecipePost } from '../core/cms.service';
import { optimizeImageUrl } from '../core/image-url.util';

const FAVORITES_KEY = 'gocery_recipe_favorites';

/** Mobile equivalent of the web app's pages/blog.html (recipes/blog with favorites). */
@Component({
  selector: 'app-blog',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './blog.component.html',
  styleUrl: './blog.component.css'
})
export class BlogComponent implements OnInit {
  posts = signal<RecipePost[]>([]);
  favoriteIds = signal<string[]>(this._loadFavorites());
  openPost = signal<RecipePost | null>(null);
  loading = signal(true);

  constructor(private cms: CmsService) {}

  async ngOnInit() {
    this.posts.set(await this.cms.getRecipes());
    this.loading.set(false);
  }

  private _loadFavorites(): string[] {
    try {
      const raw = localStorage.getItem(FAVORITES_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  private _saveFavorites(ids: string[]) {
    this.favoriteIds.set(ids);
    try { localStorage.setItem(FAVORITES_KEY, JSON.stringify(ids)); } catch { /* storage unavailable */ }
  }

  isFavorite(id: string): boolean {
    return this.favoriteIds().includes(id);
  }

  toggleFavorite(id: string, event?: Event) {
    event?.stopPropagation();
    const favs = this.favoriteIds();
    this._saveFavorites(favs.includes(id) ? favs.filter(f => f !== id) : [...favs, id]);
  }

  get favoritePosts(): RecipePost[] {
    const favs = this.favoriteIds();
    return this.posts().filter(p => favs.includes(p.id));
  }

  isImageUrl(image: string | undefined): boolean {
    return !!image && image.startsWith('http');
  }

  optimize(image: string | undefined): string {
    return optimizeImageUrl(image);
  }

  view(post: RecipePost) {
    this.openPost.set(post);
  }

  closeModal() {
    this.openPost.set(null);
  }
}
