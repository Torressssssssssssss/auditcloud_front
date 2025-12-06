import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { roleGuard } from './guards/role.guard';
import { Rol } from './models/usuario.model';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/login',
    pathMatch: 'full'
  },
  {
    path: 'login',
    loadComponent: () => import('./auth/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'registro',
    loadComponent: () => import('./auth/registro/registro.component').then(m => m.RegistroComponent)
  },
  {
    path: 'supervisor',
    canActivate: [authGuard, roleGuard([Rol.SUPERVISOR])],
    loadComponent: () => import('./supervisor/supervisor-layout/supervisor-layout.component').then(m => m.SupervisorLayoutComponent),
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        loadComponent: () => import('./supervisor/dashboard/dashboard.component').then(m => m.SupervisorDashboardComponent)
      },
      {
        path: 'clientes',
        loadComponent: () => import('./supervisor/clientes/clientes.component').then(m => m.ClientesComponent)
      },
      {
        path: 'auditorias',
        loadComponent: () => import('./supervisor/auditorias/auditorias.component').then(m => m.AuditoriasComponent)
      },
      {
        path: 'auditorias/:id',
        loadComponent: () => import('./supervisor/auditorias/detalle/detalle.component').then(m => m.AuditoriaDetalleComponent)
      },

      {
        path: 'mensajes',
        loadComponent: () => import('./supervisor/mensajes/mensajes.component').then(m => m.MensajesComponent)
      },
      {
        path: 'evidencias',
        loadComponent: () => import('./supervisor/evidencias/evidencias.component').then(m => m.EvidenciasComponent)
      },
      {
        path: 'reportes',
        loadComponent: () => import('./supervisor/reportes/reportes.component').then(m => m.ReportesComponent)
      },
      {
        path: 'usuarios',
        loadComponent: () => import('./supervisor/usuarios/usuarios.component').then(m => m.UsuariosComponent)
      },
      {
        path: 'configuracion',
        loadComponent: () => import('./supervisor/configuracion/configuracion.component').then(m => m.ConfiguracionComponent)
      },
      {
        path: 'perfil',
        loadComponent: () => import('./supervisor/perfil/perfil.component').then(m => m.PerfilComponent)
      }
      ,
      {
        path: 'pagos',
        loadComponent: () => import('./supervisor/pagos/pagos.component').then(m => m.PagosComponent)
      },
      {
        path: 'pagos/nueva',
        loadComponent: () => import('./supervisor/pagos/nueva-solicitud.component').then(m => m.NuevaSolicitudComponent)
      }
    ]
  },
  {
    path: 'auditor',
    canActivate: [authGuard, roleGuard([Rol.AUDITOR])],
    loadComponent: () => import('./auditor/auditor-layout/auditor-layout.component').then(m => m.AuditorLayoutComponent),
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        loadComponent: () => import('./auditor/dashboard/dashboard.component').then(m => m.AuditorDashboardComponent)
      },
      {
        path: 'auditorias',
        loadComponent: () => import('./auditor/auditorias/auditorias.component').then(m => m.AuditoriasComponent)
      },
      {
        path: 'auditorias/:id',
        loadComponent: () => import('./auditor/auditorias/detalle/detalle.component').then(m => m.AuditoriaDetalleComponent)
      },
      {
        path: 'evidencias',
        loadComponent: () => import('./auditor/evidencias/evidencias.component').then(m => m.EvidenciasComponent)
      },
      {
        path: 'reportes',
        loadComponent: () => import('./auditor/reportes/reportes.component').then(m => m.ReportesComponent)
      },
      {
        path: 'mensajes',
        loadComponent: () => import('./auditor/mensajes/mensajes.component').then(m => m.MensajesComponent)
      },
      {
        path: 'perfil',
        loadComponent: () => import('./auditor/perfil/perfil.component').then(m => m.PerfilComponent)
      },
      
    ]
  },
  {
    path: 'cliente',
    canActivate: [authGuard, roleGuard([Rol.CLIENTE])],
    loadComponent: () => import('./cliente/cliente-layout/cliente-layout.component').then(m => m.ClienteLayoutComponent),
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        loadComponent: () => import('./cliente/dashboard/dashboard.component').then(m => m.ClienteDashboardComponent)
      },
      {
        path: 'empresas',
        loadComponent: () => import('./cliente/empresas/empresas.component').then(m => m.EmpresasComponent)
      },
      {
        path: 'empresas/:id',
        loadComponent: () => import('./cliente/empresas/detalle/detalle.component').then(m => m.EmpresaDetalleComponent)
      },
      {
        path: 'mensajes',
        loadComponent: () => import('./cliente/mensajes/mensajes.component').then(m => m.MensajesComponent)
      },
      {
        path: 'mensajes/:id',
        loadComponent: () => import('./cliente/mensajes/chat/chat.component').then(m => m.ChatComponent)
      },
      {
        path: 'pagos',
        loadComponent: () => import('./cliente/pagos/pagos.component').then(m => m.PagosComponent)
      },
      {
        path: 'pagos/:id',
        loadComponent: () => import('./cliente/pagos/detalle/detalle.component').then(m => m.PagoDetalleComponent)
      },
      {
        path: 'auditorias',
        loadComponent: () => import('./cliente/auditorias/auditorias.component').then(m => m.AuditoriasComponent)
      },
      {
        path: 'auditorias/:id',
        loadComponent: () => import('./cliente/auditorias/detalle/detalle.component').then(m => m.AuditoriaDetalleComponent)
      },
      {
        path: 'perfil',
        loadComponent: () => import('./cliente/perfil/perfil.component').then(m => m.PerfilComponent)
      }
    ]
  },
  {
    path: '**',
    redirectTo: '/login'
  }
];
