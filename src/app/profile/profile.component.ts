import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../core/auth.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent {
  editing = signal(false);
  name = '';
  phone = '';
  saving = signal(false);

  constructor(public auth: AuthService, private router: Router) {
    const user = this.auth.currentUser();
    this.name = user?.name || '';
    this.phone = user?.phone || '';
  }

  async save() {
    this.saving.set(true);
    await this.auth.updateProfile({ name: this.name, phone: this.phone });
    this.saving.set(false);
    this.editing.set(false);
  }

  async logout() {
    await this.auth.logout();
    this.router.navigate(['/home']);
  }
}
