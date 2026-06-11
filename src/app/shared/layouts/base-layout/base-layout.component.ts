import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NavbarComponent, NavItem } from '../../components/navbar/navbar.component';
import { ThemeToggleComponent } from '../../components/theme-toggle/theme-toggle.component';
import { NotificacionesComponent } from '../../components/notificaciones/notificaciones.component';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-base-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, NavbarComponent, ThemeToggleComponent, NotificacionesComponent],
  templateUrl: './base-layout.component.html',
  styleUrl: './base-layout.component.css'
})
export class BaseLayoutComponent {
  @Input() navItems: NavItem[] = [];
  @Input() title: string = 'Dashboard';

  isMobileMenuOpen = false;

  constructor(private authService: AuthService) {}

  get usuarioNombre(): string {
    return this.authService.getUsuarioActual()?.nombre || '';
  }

  get usuarioRol(): string {
    const rol = this.authService.getRol();
    if (rol === 1) return 'Supervisor';
    if (rol === 2) return 'Auditor';
    if (rol === 3) return 'Cliente';
    return '';
  }

  toggleMobileMenu(): void {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  closeMobileMenu(): void {
    this.isMobileMenuOpen = false;
  }

  onLogout(): void {
    this.closeMobileMenu();
    this.authService.logout();
  }

  onActivate(component: any): void {
    if (component && component.title) {
      this.title = component.title;
    }
  }
}
