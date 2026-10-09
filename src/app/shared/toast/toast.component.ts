import { Component } from '@angular/core';
import { ToastService } from '../../core/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  template: `
    <div class="toast-stack" role="status" aria-live="polite">
      @for (t of toasts.toasts(); track t.id) {
        <div class="toast" [class.toast--error]="t.type === 'error'">{{ t.message }}</div>
      }
    </div>
  `,
  styles: [`
    .toast-stack {
      position: fixed; left: 0; right: 0; bottom: calc(84px + var(--safe-bottom));
      display: flex; flex-direction: column; align-items: center; gap: 0.5rem;
      z-index: 400; pointer-events: none; padding: 0 1rem;
    }
    .toast {
      background: #1b4332; color: #fff; padding: 0.7rem 1.1rem; border-radius: 999px;
      font-size: 0.85rem; font-weight: 600; box-shadow: var(--shadow-md);
      max-width: 100%; text-align: center; animation: toast-in 0.25s ease;
    }
    .toast--error { background: #b91c1c; }
    @keyframes toast-in { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: none; } }
  `]
})
export class ToastComponent {
  constructor(public toasts: ToastService) {}
}
