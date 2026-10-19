import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { Location } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CartService } from '../../core/cart.service';
import { AuthService } from '../../core/auth.service';
import { NotifBellComponent } from '../notif-bell/notif-bell.component';

@Component({
  selector: 'app-page-header',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, NotifBellComponent],
  templateUrl: './page-header.component.html',
  styleUrl: './page-header.component.css'
})
export class PageHeaderComponent {
  @Input({ required: true }) title = '';
  /** Drill-down screens (checkout, product detail): show ← and keep ☰ for global nav. */
  @Input() showBack = false;
  @Input() showNotif = true;
  @Output() back = new EventEmitter<void>();

  menuOpen = signal(false);

  constructor(public cart: CartService, public auth: AuthService, private location: Location) {}

  goBack() {
    if (this.back.observed) this.back.emit();
    else this.location.back();
  }

  openMenu() {
    this.menuOpen.set(true);
  }

  closeMenu() {
    this.menuOpen.set(false);
  }
}
