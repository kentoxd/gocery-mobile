import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CmsService } from '../core/cms.service';
import { PageHeaderComponent } from '../shared/page-header/page-header.component';

const FALLBACK_ABOUT = 'GO! Cery is your one-stop online wet market, sort of thing, made for busy Filipino households who want fresh, quality ingredients without the hassle of a real trip to the palengke. It\u2019s built with a simple easy-to-navigate layout, for shopping online to feel effortless for our target market, basically.';

/** Mobile equivalent of the web app's pages/about.html. */
@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CommonModule, PageHeaderComponent],
  templateUrl: './about.component.html',
  styleUrl: './about.component.css'
})
export class AboutComponent implements OnInit {
  aboutText = signal(FALLBACK_ABOUT);
  categories = ['Fruits', 'Vegetables', 'Herbs', 'Seafood', 'Meat', 'Grains', 'Dairy', 'Deli', 'Essentials'];

  constructor(private cms: CmsService) {}

  async ngOnInit() {
    const text = await this.cms.getAbout();
    if (text) this.aboutText.set(text);
  }
}
