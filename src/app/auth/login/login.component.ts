import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  email = '';
  password = '';
  error = signal('');
  loading = signal(false);

  constructor(private auth: AuthService, private router: Router) {}

  async submit() {
    this.error.set('');
    this.loading.set(true);
    const result = await this.auth.login(this.email, this.password);
    this.loading.set(false);
    if (result.success) this.router.navigate(['/home']);
    else this.error.set(result.error || 'Login failed');
  }

  async googleLogin() {
    this.error.set('');
    const result = await this.auth.loginWithGoogle();
    if (result.success) this.router.navigate(['/home']);
    else this.error.set(result.error || 'Google sign-in failed');
  }
}
