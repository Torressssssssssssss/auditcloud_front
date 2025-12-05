import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, RouterOutlet, ActivatedRoute } from '@angular/router';
import { NavbarComponent, NavItem } from '../../components/navbar/navbar.component';
import { ThemeToggleComponent } from '../../components/theme-toggle/theme-toggle.component';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-base-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, NavbarComponent, ThemeToggleComponent],
  templateUrl: './base-layout.component.html',
  styleUrl: './base-layout.component.css'
})
export class BaseLayoutComponent {
  @Input() navItems: NavItem[] = [];
  @Input() title: string = 'Dashboard';

  constructor(
    private authService: AuthService,
    private route: ActivatedRoute
  ) {}

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

  onLogout(): void {
    this.authService.logout();
  }

  onActivate(component: any): void {
    // Puedes actualizar el título dinámicamente si el componente hijo lo expone
    if (component && component.title) {
      this.title = component.title;
    }
  }
}

