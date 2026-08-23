import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { CartService } from '../core/cart.service';
import { AuthService } from '../core/auth.service';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './cart.component.html',
  styleUrl: './cart.component.css'
})
export class CartComponent {
  constructor(public cart: CartService, public auth: AuthService, private router: Router) {}

  goToCheckout() {
    if (!this.auth.currentUser()) { this.router.navigate(['/login']); return; }
    this.router.navigate(['/checkout']);
  }
}
