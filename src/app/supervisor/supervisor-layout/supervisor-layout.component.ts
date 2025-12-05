import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { BaseLayoutComponent } from '../../shared/layouts/base-layout/base-layout.component';
import { NavItem } from '../../shared/components/navbar/navbar.component';

@Component({
  selector: 'app-supervisor-layout',
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
export class SupervisorLayoutComponent {
  currentTitle = 'Dashboard';

  navItems: NavItem[] = [
    { ruta: '/supervisor/dashboard', icono: 'dashboard', etiqueta: 'Dashboard' },
    { ruta: '/supervisor/clientes', icono: 'building', etiqueta: 'Empresas Cliente' },
    { ruta: '/supervisor/auditorias', icono: 'document', etiqueta: 'Auditorías' },
    { ruta: '/supervisor/pagos', icono: 'credit-card', etiqueta: 'Solicitudes de Pago' },
    { ruta: '/supervisor/mensajes', icono: 'chat', etiqueta: 'Mensajes' },
    { ruta: '/supervisor/evidencias', icono: 'paperclip', etiqueta: 'Evidencias' },
    { ruta: '/supervisor/reportes', icono: 'file-text', etiqueta: 'Reportes' },
    { ruta: '/supervisor/usuarios', icono: 'users', etiqueta: 'Usuarios Internos' },
    { ruta: '/supervisor/configuracion', icono: 'settings', etiqueta: 'Configuración' },
    { ruta: '/supervisor/perfil', icono: 'user', etiqueta: 'Perfil' }
  ];
}

