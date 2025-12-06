import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { BaseLayoutComponent } from '../../shared/layouts/base-layout/base-layout.component';
import { NavItem } from '../../shared/components/navbar/navbar.component';

@Component({
  selector: 'app-auditor-layout',
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
export class AuditorLayoutComponent {
  currentTitle = 'Dashboard';

  navItems: NavItem[] = [
    { ruta: '/auditor/dashboard', icono: 'dashboard', etiqueta: 'Dashboard' },
    { ruta: '/auditor/auditorias', icono: 'document', etiqueta: 'Mis Auditorías' },
    { ruta: '/auditor/evidencias', icono: 'paperclip', etiqueta: 'Evidencias' },
    { ruta: '/auditor/reportes', icono: 'file-text', etiqueta: 'Reportes' },
    { ruta: '/auditor/mensajes', icono: 'chat', etiqueta: 'Mensajes' },
    { ruta: '/auditor/perfil', icono: 'user', etiqueta: 'Perfil' }
  ];
}

