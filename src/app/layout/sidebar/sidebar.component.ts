import { Component, inject, input, output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../core/services/auth.service';

interface NavItem {
  label: string;
  icon: string;
  route: string;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [MatListModule, MatIconModule, RouterLink, RouterLinkActive],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
})
export class SidebarComponent {
  readonly auth = inject(AuthService);
  collapsed = input(false);
  navClick = output<void>();

  readonly navItems: NavItem[] = [
    { label: 'Dashboard', icon: 'dashboard', route: '/dashboard' },
    { label: 'Companies', icon: 'business', route: '/companies' },
    { label: 'Diagnostic Studies', icon: 'assignment', route: '/diagnostic-studies' },
    { label: 'Create Study', icon: 'add_circle', route: '/diagnostic-studies/create' },
    { label: 'Reports', icon: 'description', route: '/diagnostic-studies' },
  ];

  logout(): void {
    this.auth.logout();
  }

  onNav(): void {
    this.navClick.emit();
  }
}
