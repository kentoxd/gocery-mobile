import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrl: '../login/login.component.css'
})
export class RegisterComponent {
  name = ''; email = ''; phone = ''; password = '';
  error = signal('');
  loading = signal(false);

  constructor(private auth: AuthService, private router: Router) {}

  async submit() {
    this.error.set('');
    this.loading.set(true);
    const result = await this.auth.register(this.name, this.email, this.password, this.phone);
    this.loading.set(false);
    if (result.success) this.router.navigate(['/home']);
    else this.error.set(result.error || 'Registration failed');
  }
}
