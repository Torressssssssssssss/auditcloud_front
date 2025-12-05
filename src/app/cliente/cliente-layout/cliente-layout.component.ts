import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { BaseLayoutComponent } from '../../shared/layouts/base-layout/base-layout.component';
import { NavItem } from '../../shared/components/navbar/navbar.component';

@Component({
  selector: 'app-cliente-layout',
  standalone: true,
  imports: [RouterOutlet, BaseLayoutComponent],
  template: `
    <app-base-layout 
      [navItems]="navItems"
      [title]="currentTitle">
      <router-outlet></router-outlet>
    </app-base-layout>
  `
})
export class ClienteLayoutComponent {
  currentTitle = 'Dashboard';

  navItems: NavItem[] = [
    { ruta: '/cliente/dashboard', icono: 'dashboard', etiqueta: 'Dashboard' },
    { ruta: '/cliente/empresas', icono: 'building', etiqueta: 'Empresas Auditoras' },
    { ruta: '/cliente/mensajes', icono: 'chat', etiqueta: 'Mensajes' },
    { ruta: '/cliente/pagos', icono: 'credit-card', etiqueta: 'Pagos' },
    { ruta: '/cliente/auditorias', icono: 'document', etiqueta: 'Mis Auditorías' },
    { ruta: '/cliente/perfil', icono: 'user', etiqueta: 'Perfil' }
  ];
}

