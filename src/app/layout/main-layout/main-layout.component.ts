import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { HeaderComponent } from '../header/header.component';
import { SidebarComponent } from '../sidebar/sidebar.component';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [RouterOutlet, MatSidenavModule, HeaderComponent, SidebarComponent],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.scss',
})
export class MainLayoutComponent {
  sidenavOpen = signal(true);
  mobileOpen = signal(false);

  toggleSidenav(): void {
    if (window.innerWidth <= 768) {
      this.mobileOpen.update((v) => !v);
    } else {
      this.sidenavOpen.update((v) => !v);
    }
  }

  closeMobile(): void {
    this.mobileOpen.set(false);
  }
}
