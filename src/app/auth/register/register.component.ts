import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { OtpService } from '../../core/otp.service';

/**
 * Same two-step flow as the web app's pages/register.html +
 * js/pages/register.js: collect the profile, email a 6-digit OTP via
 * EmailJS, and only create the Firebase account once the code is
 * confirmed. The pending profile+OTP survive a refresh via
 * sessionStorage (handled inside OtpService).
 */
@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrl: '../login/login.component.css'
})
export class RegisterComponent {
  step = signal<'register' | 'otp'>('register');

  name = ''; email = ''; phone = ''; password = ''; confirmPassword = '';
  otp = '';
  pendingEmail = signal('');

  error = signal('');
  otpError = signal('');
  loading = signal(false);
  otpLoading = signal(false);
  resending = signal(false);

  constructor(private auth: AuthService, private otpSvc: OtpService, private router: Router) {
    const pending = this.otpSvc.getPending();
    if (pending?.profile?.email) {
      this.pendingEmail.set(pending.profile.email);
      this.step.set('otp');
    }
  }

  async submit() {
    this.error.set('');
    if (this.password !== this.confirmPassword) {
      this.error.set('Passwords do not match');
      return;
    }
    if (!this.name || !this.email || !this.password) {
      this.error.set('Please fill in all required fields.');
      return;
    }

    this.loading.set(true);
    try {
      const otp = this.otpSvc.generate();
      const profile = { name: this.name, email: this.email, password: this.password, phone: this.phone };
      this.otpSvc.savePending(profile, otp);
      await this.otpSvc.sendOtp({ email: this.email, name: this.name, otp });
      this.pendingEmail.set(this.email);
      this.otp = '';
      this.otpError.set('');
      this.step.set('otp');
    } catch (e: any) {
      this.error.set(e.message || 'Could not send verification email');
      this.otpSvc.clearPending();
    } finally {
      this.loading.set(false);
    }
  }

  async confirmOtp() {
    this.otpError.set('');
    const verification = this.otpSvc.verify(this.otp);
    if (!verification.valid) {
      this.otpError.set(verification.error || 'Invalid code');
      return;
    }

    this.otpLoading.set(true);
    const { name, email, password, phone } = verification.profile!;
    const result = await this.auth.register(name, email, password, phone || '');
    this.otpLoading.set(false);

    if (result.success) {
      this.otpSvc.clearPending();
      this.router.navigate(['/home']);
      return;
    }
    this.otpError.set(result.error || 'Registration failed');
  }

  async resendOtp() {
    const pending = this.otpSvc.getPending();
    if (!pending) {
      this.otpError.set('Session expired. Please go back and register again.');
      return;
    }
    this.otpError.set('');
    this.resending.set(true);
    try {
      const otp = this.otpSvc.generate();
      this.otpSvc.savePending(pending.profile, otp);
      await this.otpSvc.sendOtp({ email: pending.profile.email, name: pending.profile.name, otp });
    } catch (e: any) {
      this.otpError.set(e.message || 'Could not resend verification code');
    } finally {
      this.resending.set(false);
    }
  }

  backToRegister() {
    this.otpSvc.clearPending();
    this.error.set('');
    this.step.set('register');
  }
}
