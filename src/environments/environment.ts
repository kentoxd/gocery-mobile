/**
 * Same Firebase project as the web app (js/config.firebase.js and
 * js/config.js in the main project) — this mobile client reads/writes
 * the exact same Firestore data. Order creation, pricing, and inventory
 * now happen entirely client-side (see core/order-create.service.ts) —
 * there's no backend to point at.
 */
export const environment = {
  production: false,
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
  emailjs: {
    serviceId: 'service_x016mmu',
    templateId: 'template_uos5tae',
    publicKey: 'mA-WV0TFP3RLbMJzb'
  }
};
