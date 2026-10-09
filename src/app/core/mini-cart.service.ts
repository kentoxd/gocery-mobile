import { Injectable, signal } from '@angular/core';

/** Controls the bottom sheet that previews the cart right after "Add to Cart". */
@Injectable({ providedIn: 'root' })
export class MiniCartService {
  visible = signal(false);
  message = signal('');

  open(message: string) {
    this.message.set(message);
    this.visible.set(true);
  }

  close() {
    this.visible.set(false);
  }
}
