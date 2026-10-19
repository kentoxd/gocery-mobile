/**
 * Same Firebase project as the web app (js/config.firebase.js). Order
 * creation, pricing, and inventory now happen entirely client-side (see
 * core/order-create.service.ts) — there's no backend URL to configure.
 */
export const environment = {
  production: true,
  // Same Cloudinary account/preset as the web app (js/config.js) - used for review photos and payment receipts.
  // Address of the Go! Cery payment server (the server/ folder of the web project), for example
  // 'https://gocery-api.onrender.com'. Leave empty to hide the card and QR Ph payment methods.
  apiBaseUrl: '',
  cloudinary: { cloudName: 'irdmobtq', uploadPreset: 'gocery_receipts' },
  firebase: {
    apiKey: 'AIzaSyDmr7iIYX21BmJ1LzsGOzVpsfJp33DwTWc',
    authDomain: 'go--cery.firebaseapp.com',
    projectId: 'go--cery',
    storageBucket: 'go--cery.firebasestorage.app',
    messagingSenderId: '350476021469',
    appId: '1:350476021469:web:61e5a14de632334898f534'
  },
  // Same EmailJS project as the web app (js/config.emailjs.js) — sends the
  // registration OTP email. Template variables: {{email}} {{user_name}}
  // {{passcode}} {{time}} {{message}}.
  // Order status emails. All three values must come from the SAME EmailJS account (see EMAIL.md).
  // Keep YOUR_SERVICE_ID until you add your service. No order emails are sent until then.
  orderEmail: {
    serviceId: 'YOUR_SERVICE_ID',
    publicKey: 'gZqfjAQFRdIkihxHU',
    templateId: 'template_eym6quh'
  },
  emailjs: {
    serviceId: 'service_x016mmu',
    templateId: 'template_uos5tae',
    publicKey: 'mA-WV0TFP3RLbMJzb'
  },
  // Same public Mapbox token as the web app (js/config.js).
  mapboxToken: 'pk.eyJ1Ijoic2lsbHliaXJiIiwiYSI6ImNtcnZ2ZWVjejAwZG8yeXB5Mm94ZHV1ejQifQ.9EL2hIT3HdGPXbsmtyOHVQ'
};
