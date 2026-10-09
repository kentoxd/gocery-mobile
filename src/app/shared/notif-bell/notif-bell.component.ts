import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { NotificationService } from '../../core/notification.service';

/** Notification bell with an unread count. Put it in any screen header. */
@Component({
  selector: 'app-notif-bell',
  standalone: true,
  imports: [RouterLink],
  template: `
    @if (auth.currentUser()) {
      <a routerLink="/notifications" class="bell" aria-label="Notifications">
        🔔
        @if (notif.unread() > 0) {
          <span class="bell__badge">{{ notif.unread() > 9 ? '9+' : notif.unread() }}</span>
        }
      </a>
    }
  `,
  styles: [`
    .bell {
      position: relative; display: inline-flex; align-items: center; justify-content: center;
      width: 44px; height: 44px; border-radius: 999px; background: #fff;
      border: 1px solid var(--color-border); font-size: 1.2rem; flex-shrink: 0;
    }
    .bell__badge {
      position: absolute; top: -4px; right: -4px; background: #c2410c; color: #fff;
      font-size: 0.65rem; font-weight: 700; border-radius: 999px; min-width: 18px; height: 18px;
      padding: 0 4px; display: flex; align-items: center; justify-content: center;
    }
  `]
})
export class NotifBellComponent implements OnInit {
  constructor(public auth: AuthService, public notif: NotificationService) {}

  async ngOnInit() {
    await this.auth.ready;
    this.notif.refresh();
  }
}
