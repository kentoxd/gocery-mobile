# Go! Cery — Mobile (Angular)

A mobile client for the same Go! Cery project, built with Angular 18 (standalone components — the modern default, no NgModules). It shares the **exact same Firebase project and Firestore data** as the web app, and calls the **exact same Express backend** (`server/`) for order pricing and PayMongo payments — so orders placed here show up in the same admin panel, and vice versa.

## What's built

Covers the "IV. Mobile Application (Customer Side)" checklist sections:

| Section | Status |
|---|---|
| 1. Mobile User Authentication | ✅ Register, Login, Google Sign-In. (Password reset not included — see below) |
| 2. Mobile Home Screen | ✅ Featured products, quick shop access |
| 3. Product Browsing | ✅ List, detail, search, category filter, sort |
| 4. Shopping Cart | ✅ Add/update/remove, persisted locally |
| 5. Mobile Checkout | ✅ Address, delivery slot, payment (COD + Card via PayMongo), order review |
| 6. Order Management | ✅ Order list, detail with visual status tracker |
| 7. Customer Profile | ✅ View/edit profile, manage addresses |
| 8. Wishlist | ✅ Add/remove, move to cart |
| 9. Notifications | ✅ Derived from order status history (same pattern as the web app) |
| 10. Reviews and Ratings | ✅ View + **submit** reviews — this is actually more complete than the web app, which only ever displayed reviews |
| 11. Customer Support | ✅ FAQ + contact form |

**Not included, on purpose (flagging rather than silently skipping):**
- **Password reset** — Firebase Auth supports this in one call (`sendPasswordResetEmail`), just not wired into a UI screen yet.
- **Push notifications** — the in-app Notifications tab works, but actual OS-level push notifications require either a Capacitor/Cordova native wrapper or a service worker + FCM setup, which is a separate deployment concern from the Angular code itself.
- **Address map/PSGC integration** — the web app's Mapbox + PSGC cascading dropdowns weren't ported here; checkout uses a simpler manual address form. Worth adding later if you want parity.
- **GCash/Maya/QR Ph on mobile checkout** — only Cash on Delivery and Card are wired up here; the web app's manual-QR and QR Ph flows weren't ported. Card uses the same PayMongo Payment Intent flow as the web app.

## Setup

```bash
npm install
```

### 1. Fill in your Firebase config
Open `src/environments/environment.ts` and paste the same values from your web project's `js/config.firebase.js` (`apiKey`, `messagingSenderId`, `appId` — the rest are already filled in since they're the same project).

### 2. Add the missing Firestore rule for the Support form
This app's Support/Contact form writes to a new `supportMessages` collection that your current `firestore.rules` doesn't have a rule for yet — it'll fail with permission-denied until you add:
```
match /supportMessages/{id} {
  allow create: if true;
  allow read, update, delete: if isAdmin();
}
```
Add this inside the `match /databases/{database}/documents { ... }` block in your existing `firestore.rules`, then `firebase deploy --only firestore:rules`.

### 3. Run it
Make sure your backend is running first (`npm start` in the main project, same as always), then:
```bash
npm start
```
This runs `ng serve` — opens at `http://localhost:4200` by default. Test in your browser's device-emulation mode (Chrome DevTools → Toggle device toolbar) for a real mobile viewport.

### 4. Build for production
```bash
npm run build
```
Outputs to `dist/go-cery-mobile/` — deployable as a static site (Firebase Hosting, same as discussed for the web app) or wrapped with Capacitor for an actual installable mobile app later if your course requires that.

## Architecture notes for your report
- **Standalone components** (Angular's current default/recommended approach since v17) — no `NgModule` boilerplate, each component declares its own imports.
- **Signals** for state (cart, current user, loading states) instead of older `BehaviorSubject`/RxJS patterns — Angular's modern reactivity model.
- **Same backend, same database** — this isn't a separate app with duplicated logic; it's a second frontend on the same system, which is exactly what "Internal API Communication" in your architecture checklist item is describing.
- **Auth-state race condition avoided deliberately** — `auth.guard.ts` explicitly waits for `authReady()` before checking login state, the same bug we spent a long time diagnosing and fixing on the web app's admin/account pages. Doing it right from the start here.
# gocery-mobile
