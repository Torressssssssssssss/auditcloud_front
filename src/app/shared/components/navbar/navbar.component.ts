import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { IconComponent, IconName } from '../icon/icon.component';

export interface NavItem {
  ruta: string;
  icono: IconName;
  etiqueta: string;
  exact?: boolean; 
  rolesPermitidos?: number[];
  badge?: number;
}

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule, IconComponent],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class NavbarComponent {
  @Input() items: NavItem[] = [];
  @Input() usuarioNombre: string = '';
  @Input() usuarioRol: string = '';
  @Input() isOpen = false;
  @Output() logout = new EventEmitter<void>();
  @Output() close = new EventEmitter<void>();

  currentRoute = signal<string>('');

  constructor(private router: Router) {
    this.router.events.subscribe(() => {
      this.currentRoute.set(this.router.url);
    });
  }

  isActive(route: string): boolean {
    return this.currentRoute().startsWith(route);
  }

  closeMenu(): void {
    this.close.emit();
  }

  onLogout(): void {
    this.logout.emit();
  }
}
