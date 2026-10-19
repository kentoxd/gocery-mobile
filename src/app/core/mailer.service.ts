import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

const SITE_URL = 'https://go--cery.web.app';

const TEXT: Record<string, { title: string; message: string }> = {
  'Pending': { title: 'We received your order', message: 'Thank you for ordering from Go! Cery. We will confirm your order shortly.' },
  'Confirmed': { title: 'Your order is confirmed', message: 'Your order is confirmed and we are getting it ready.' },
  'Preparing': { title: 'We are preparing your order', message: 'Our team is picking and packing your items fresh from the market.' },
  'Out for Delivery': { title: 'Your order is on its way', message: 'Your order is out for delivery. Please be ready to receive it.' },
  'Delivered': { title: 'Your order was delivered', message: 'Your order has been delivered. Enjoy! You can now leave a review for the items you received.' },
  'Cancelled': { title: 'Your order was cancelled', message: 'Your order has been cancelled. If you already paid, please contact us about your refund.' },
  'Refunded': { title: 'Your order was refunded', message: 'Your order has been refunded.' }
};

/**
 * Emails the customer when their order is placed or cancelled from the app (same EmailJS account and
 * template as the website's js/modules/mailer.js). Status changes made by the seller in the admin panel
 * are emailed from the website. A failed email never blocks the order.
 */
@Injectable({ providedIn: 'root' })
export class MailerService {
  get configured(): boolean {
    const c = environment.orderEmail;
    return !!c.serviceId && c.serviceId !== 'YOUR_SERVICE_ID'
      && !!c.publicKey && c.publicKey !== 'YOUR_PUBLIC_KEY'
      && !!c.templateId && c.templateId !== 'YOUR_ORDER_TEMPLATE_ID';
  }

  /** order must include id, userEmail, items, total... Returns true when sent. Never throws. */
  async sendOrderStatus(order: any, status: string, note = ''): Promise<boolean> {
    try {
      if (!this.configured || !order.userEmail) return false;
      const text = TEXT[status] || { title: 'Your order status changed', message: 'Your order is now: ' + status + '.' };
      const items: any[] = order.items || [];
      const parts: string[] = [];
      for (let i = 0; i < items.length; i++) parts.push(items[i].quantity + 'x ' + items[i].name);
      const paid = order.paymentStatus === 'paid' ? 'Paid' : (order.paymentMethod === 'Cash on Delivery' ? 'Pay on delivery' : 'Payment pending');
      const when = order.deliveryDate ? new Date(order.deliveryDate).toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' }) : '';

      const res = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service_id: environment.orderEmail.serviceId,
          template_id: environment.orderEmail.templateId,
          user_id: environment.orderEmail.publicKey,
          template_params: {
            email: order.userEmail,
            user_name: order.userName || 'Customer',
            order_id: order.id,
            order_status: status,
            status_title: text.title,
            status_message: text.message,
            note,
            order_total: '₱' + Number(order.total || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
            item_count: String(items.length),
            items_summary: parts.join(', '),
            delivery_info: [when, order.deliverySlot].filter(Boolean).join(', '),
            payment_info: order.paymentMethod + ' - ' + paid,
            order_link: SITE_URL + '/pages/orders.html?id=' + order.id
          }
        })
      });
      return res.ok;
    } catch {
      return false;
    }
  }
}
