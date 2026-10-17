import { Component, AfterViewInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { BottomNavComponent } from './shared/bottom-nav/bottom-nav.component';
import { ToastComponent } from './shared/toast/toast.component';
import { MiniCartComponent } from './shared/mini-cart/mini-cart.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, BottomNavComponent, ToastComponent, MiniCartComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements AfterViewInit {
  ngAfterViewInit() {
    setTimeout(() => {
      const splash = document.getElementById('splash-screen');

      if (splash) {
        splash.style.opacity = '0';
        splash.style.transition = 'opacity 0.4s ease';

        setTimeout(() => splash.remove(), 400);
      }
    }, 4000);
  }
}