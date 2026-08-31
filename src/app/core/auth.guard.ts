import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

/**
 * Waits for Firebase's initial auth-state check to resolve before
 * deciding — the same race condition we hit repeatedly on the web app
 * (checking currentUser before Firebase reports the real session state)
 * is prevented here by awaiting auth.ready, which resolves as soon as
 * Firebase's local session check completes (no network round trip and
 * no polling delay, unlike the old timer-based wait on authReady()).
 */
export const authGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  await auth.ready;

  if (auth.currentUser()) return true;
  router.navigate(['/login']);
  return false;
};
