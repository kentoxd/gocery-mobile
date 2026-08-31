import { Injectable } from '@angular/core';
import emailjs from '@emailjs/browser';
import { environment } from '../../environments/environment';

const STORAGE_KEY = 'gocery_pending_registration';
const OTP_TTL_MS = 10 * 60 * 1000;

export interface PendingRegistration {
  profile: { name: string; email: string; password: string; phone?: string };
  otp: string;
  expiresAt: number;
}

/**
 * Email OTP verification for registration — same EmailJS project and flow
 * as the web app's js/modules/otp.js. A 6-digit code is generated
 * client-side, emailed via EmailJS, and held in sessionStorage (with a
 * 10-minute expiry) until the user confirms it.
 */
@Injectable({ providedIn: 'root' })
export class OtpService {
  private _initialized = false;

  isConfigured(): boolean {
    const c = environment.emailjs;
    return !!(c?.publicKey && c.publicKey !== 'YOUR_PUBLIC_KEY' && c?.templateId && c.templateId !== 'YOUR_TEMPLATE_ID');
  }

  generate(): string {
    return String(Math.floor(100000 + Math.random() * 900000));
  }

  savePending(profile: PendingRegistration['profile'], otp: string) {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ profile, otp, expiresAt: Date.now() + OTP_TTL_MS }));
  }

  getPending(): PendingRegistration | null {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as PendingRegistration;
    if (Date.now() > data.expiresAt) {
      this.clearPending();
      return null;
    }
    return data;
  }

  verify(inputOtp: string): { valid: boolean; profile?: PendingRegistration['profile']; error?: string } {
    const pending = this.getPending();
    if (!pending) return { valid: false, error: 'Verification code expired. Please register again.' };
    if (String(inputOtp).trim() !== pending.otp) return { valid: false, error: 'Invalid verification code. Please try again.' };
    return { valid: true, profile: pending.profile };
  }

  clearPending() {
    sessionStorage.removeItem(STORAGE_KEY);
  }

  private _ensureReady() {
    if (!this._initialized) {
      emailjs.init({ publicKey: environment.emailjs.publicKey });
      this._initialized = true;
    }
  }

  async sendOtp({ email, name, otp }: { email: string; name: string; otp: string }): Promise<void> {
    if (!this.isConfigured()) {
      throw new Error('EmailJS is not configured. Add serviceId/templateId/publicKey in src/environments/environment.ts');
    }
    this._ensureReady();

    const expiryDate = new Date(Date.now() + OTP_TTL_MS);
    const formattedTime = expiryDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    try {
      await emailjs.send(environment.emailjs.serviceId, environment.emailjs.templateId, {
        email,
        user_name: name,
        message: `Your Go! Cery verification code is: ${otp}. It expires in 10 minutes.`,
        passcode: otp,
        time: formattedTime
      });
    } catch (err: any) {
      throw new Error(err?.text || err?.message || 'Could not send verification email');
    }
  }
}
