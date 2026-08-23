import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

/**
 * Waits for Firebase's initial auth-state check to resolve before
 * deciding — the same race condition we hit repeatedly on the web app
 * (checking currentUser before Firebase reports the real session state)
 * is prevented here by polling authReady() first.
 */
export const authGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  while (!auth.authReady()) {
    await new Promise(r => setTimeout(r, 30));
  }

  if (auth.currentUser()) return true;
  router.navigate(['/login']);
  return false;
};
