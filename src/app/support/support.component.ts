import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { collection, addDoc } from 'firebase/firestore';
import { FirebaseService } from '../core/firebase.service';
import { AuthService } from '../core/auth.service';
import { CmsService, FaqItem } from '../core/cms.service';

@Component({
  selector: 'app-support',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './support.component.html',
  styleUrl: './support.component.css'
})
export class SupportComponent implements OnInit {
  name = '';
  email = '';
  message = '';
  submitting = signal(false);
  submitted = signal(false);
  error = signal('');

  faqs = signal<FaqItem[]>([
    { q: 'What areas do you deliver to?', a: 'Metro Manila and Rizal Province, split into delivery zones with different fees shown at checkout.' },
    { q: 'When will my order arrive?', a: 'Orders placed before 7:30 PM are delivered the next day, based on the time slot you choose at checkout.' },
    { q: 'What payment methods are accepted?', a: 'Cash on Delivery, GCash, Maya, and Credit/Debit Card.' },
    { q: 'How do I track my order?', a: 'Go to My Orders in your Profile tab — each order shows its live status.' }
  ]);

  contactCards = [
    { icon: '●', title: 'Company Address', lines: ['938 Aurora Blvd, Cubao,', 'Quezon City, 1109 Metro Manila'], mapUrl: 'https://www.google.com/maps/search/?api=1&query=938+Aurora+Blvd+Cubao+Quezon+City+1109+Metro+Manila' },
    { icon: '☎', title: 'Contact Number', lines: ['(02) 89110964', '(63+) 922260115'] },
    { icon: '✉', title: 'Email Address', lines: ['shopwithGOCERY@gmail.com'], mailto: 'mailto:shopwithGOCERY@gmail.com' },
    { icon: '🕐', title: 'Business Hours', lines: ['Mon–Sat: 8 AM – 9 PM', 'Sun: 9 AM – 6 PM'] }
  ];

  constructor(private fb: FirebaseService, private auth: AuthService, private cms: CmsService) {
    const user = this.auth.currentUser();
    this.name = user?.name || '';
    this.email = user?.email || '';
  }

  async ngOnInit() {
    const faqs = await this.cms.getFaq();
    if (faqs.length) this.faqs.set(faqs);
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
