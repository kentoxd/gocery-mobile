import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { collection, addDoc } from 'firebase/firestore';
import { FirebaseService } from '../core/firebase.service';
import { AuthService } from '../core/auth.service';

@Component({
  selector: 'app-support',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './support.component.html',
  styleUrl: './support.component.css'
})
export class SupportComponent {
  name = '';
  email = '';
  message = '';
  submitting = signal(false);
  submitted = signal(false);
  error = signal('');

  faqs = [
    { q: 'What areas do you deliver to?', a: 'Metro Manila and Rizal Province, split into delivery zones with different fees shown at checkout.' },
    { q: 'When will my order arrive?', a: 'Orders placed before 7:30 PM are delivered the next day, based on the time slot you choose at checkout.' },
    { q: 'What payment methods are accepted?', a: 'Cash on Delivery, GCash, Maya, Credit/Debit Card, and QR Ph.' },
    { q: 'How do I track my order?', a: 'Go to My Orders in your Profile tab — each order shows its live status.' }
  ];

  constructor(private fb: FirebaseService, private auth: AuthService) {
    const user = this.auth.currentUser();
    this.name = user?.name || '';
    this.email = user?.email || '';
  }

  async submit() {
    if (!this.message.trim()) { this.error.set('Please write a message.'); return; }
    this.submitting.set(true);
    this.error.set('');
    try {
      await addDoc(collection(this.fb.db, 'supportMessages'), {
        name: this.name, email: this.email, message: this.message.trim(),
        createdAt: new Date().toISOString()
      });
      this.submitted.set(true);
      this.message = '';
    } catch {
      this.error.set('Could not send your message. Please try again.');
    } finally {
      this.submitting.set(false);
    }
  }
}
