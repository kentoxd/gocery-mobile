/**
 * Same Firebase project and backend as the web app (js/config.firebase.js
 * and js/config.js in the main project) — this mobile client reads/writes
 * the exact same Firestore data and hits the exact same Express backend.
 */
export const environment = {
  production: false,
  apiBaseUrl: 'http://localhost:3000',
  firebase: {
    apiKey: 'AIzaSyDmr7iIYX21BmJ1LzsGOzVpsfJp33DwTWc',
    authDomain: 'go--cery.firebaseapp.com',
    projectId: 'go--cery',
    storageBucket: 'go--cery.firebasestorage.app',
    messagingSenderId: '350476021469',
    appId: '1:350476021469:web:61e5a14de632334898f534'
  }
};
