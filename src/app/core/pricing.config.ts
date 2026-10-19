/**
 * Mirrors the pricing-relevant parts of server/config.js. Now that order
 * creation happens directly from the client (see order-create.service.ts),
 * this is the mobile app's own source of truth for delivery zones, promo
 * codes, and thresholds — keep in sync manually with server/config.js and
 * js/config.js if either changes.
 */
export const ZONES = [
  { id: 'metro-manila', name: 'Metro Manila (NCR)', fee: 99 },
  { id: 'rizal', name: 'Rizal Province', fee: 149 }
];

export const SLOTS = [
  { id: 'morning', label: '8:00 AM – 12:00 PM' },
  { id: 'afternoon', label: '1:00 PM – 5:00 PM' },
  { id: 'evening', label: '5:00 PM – 8:00 PM' }
];

export const FREE_DELIVERY_THRESHOLD = 4000;
export const VIP_FREE_SHIPPING_THRESHOLD = 2000;

export const PROMO_CODES: Record<string, { type: 'percent' | 'free_shipping'; value?: number }> = {
  SUKI10: { type: 'percent', value: 0.10 },
  FREESHIP: { type: 'free_shipping' }
};
