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
    title: 'Login',
    loadComponent: () => import('./auth/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'registro',
    title: 'Registro',
    loadComponent: () => import('./auth/registro/registro.component').then(m => m.RegistroComponent)
  },
  {
    path: 'supervisor',
    title: 'Supervisor',
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
        title: 'Dashboard',
        loadComponent: () => import('./supervisor/dashboard/dashboard.component').then(m => m.SupervisorDashboardComponent)
      },
      {
        path: 'dashboard-directivo',
        title: 'Dashboard directivo',
        loadComponent: () => import('./supervisor/dashboard-directivo/dashboard-directivo.component').then(modulo => modulo.DashboardDirectivoComponent)
      },
      {
        path: 'clientes',
        title: 'Clientes',
        loadComponent: () => import('./supervisor/clientes/clientes.component').then(m => m.ClientesComponent)
      },
      {
        path: 'auditorias',
        title: 'Auditorías',
        loadComponent: () => import('./supervisor/auditorias/auditorias.component').then(m => m.AuditoriasComponent)
      },
      {
        path: 'auditorias/:id',
        title: 'Detalle de auditoría',
        loadComponent: () => import('./supervisor/auditorias/detalle/detalle.component').then(m => m.AuditoriaDetalleComponent)
      },

      {
        path: 'mensajes',
        title: 'Mensajes',
        loadComponent: () => import('./supervisor/mensajes/mensajes.component').then(m => m.MensajesComponent)
      },
      {
        path: 'evidencias',
        title: 'Evidencias',
        loadComponent: () => import('./supervisor/evidencias/evidencias.component').then(m => m.EvidenciasComponent)
      },
      {
        path: 'reportes',
        title: 'Reportes',
        loadComponent: () => import('./supervisor/reportes/reportes.component').then(m => m.ReportesComponent)
      },
      {
        path: 'usuarios',
        title: 'Usuarios',
        loadComponent: () => import('./supervisor/usuarios/usuarios.component').then(m => m.UsuariosComponent)
      },
      {
        path: 'configuracion',
        title: 'Configuración',
        loadComponent: () => import('./supervisor/configuracion/configuracion.component').then(m => m.ConfiguracionComponent)
      },
      {
        path: 'perfil',
        title: 'Perfil',
        loadComponent: () => import('./supervisor/perfil/perfil.component').then(m => m.PerfilComponent)
      }
      ,
      {
        path: 'pagos',
        title: 'Pagos',
        loadComponent: () => import('./supervisor/pagos/pagos.component').then(m => m.PagosComponent)
      },
      {
        path: 'pagos/nueva',
        redirectTo: 'mensajes',
        pathMatch: 'full'
      }
    ]
  },
  {
    path: 'auditor',
    title: 'Auditor',
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
        title: 'Dashboard',
        loadComponent: () => import('./auditor/dashboard/dashboard.component').then(m => m.AuditorDashboardComponent)
      },
      {
        path: 'auditorias',
        title: 'Auditorías',
        loadComponent: () => import('./auditor/auditorias/auditorias.component').then(m => m.AuditoriasComponent)
      },
      {
        path: 'auditorias/:id',
        title: 'Detalle de auditoría',
        loadComponent: () => import('./auditor/auditorias/detalle/detalle.component').then(m => m.AuditoriaDetalleComponent)
      },
      {
        path: 'evidencias',
        title: 'Evidencias',
        loadComponent: () => import('./auditor/evidencias/evidencias.component').then(m => m.EvidenciasComponent)
      },
      {
        path: 'reportes',
        title: 'Reportes',
        loadComponent: () => import('./auditor/reportes/reportes.component').then(m => m.ReportesComponent)
      },
      {
        path: 'mensajes',
        title: 'Mensajes',
        loadComponent: () => import('./auditor/mensajes/mensajes.component').then(m => m.MensajesComponent)
      },
      {
        path: 'perfil',
        title: 'Perfil',
        loadComponent: () => import('./auditor/perfil/perfil.component').then(m => m.PerfilComponent)
      },
      
    ]
  },
  {
    path: 'cliente',
    title: 'Cliente',
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
        title: 'Dashboard',
        loadComponent: () => import('./cliente/dashboard/dashboard.component').then(m => m.ClienteDashboardComponent)
      },
      {
        path: 'empresas',
        title: 'Empresas',
        loadComponent: () => import('./cliente/empresas/empresas.component').then(m => m.EmpresasComponent)
      },
      {
        path: 'empresas/:id',
        title: 'Detalle de empresa',
        loadComponent: () => import('./cliente/empresas/detalle/detalle.component').then(m => m.EmpresaDetalleComponent)
      },
      {
        path: 'mensajes',
        title: 'Mensajes',
        loadComponent: () => import('./cliente/mensajes/mensajes.component').then(m => m.MensajesComponent)
      },
      {
        path: 'mensajes/:id',
        title: 'Conversación',
        loadComponent: () => import('./cliente/mensajes/chat/chat.component').then(m => m.ChatComponent)
      },
      {
        path: 'pagos',
        title: 'Pagos',
        loadComponent: () => import('./cliente/pagos/pagos.component').then(m => m.PagosComponent)
      },
      {
        path: 'pagos/:id',
        title: 'Detalle de pago',
        loadComponent: () => import('./cliente/pagos/detalle/detalle.component').then(m => m.PagoDetalleComponent)
      },
      {
        path: 'auditorias',
        title: 'Auditorías',
        loadComponent: () => import('./cliente/auditorias/auditorias.component').then(m => m.AuditoriasComponent)
      },
      {
        path: 'timeline',
        title: 'Cronología',
        loadComponent: () => import('./cliente/timeline-component/timeline-component').then(m => m.TimelineComponent)
      },
      {
        path: 'auditorias/:id/timeline',
        title: 'Cronología de auditoría',
        loadComponent: () => import('./cliente/timeline-component/timeline-component').then(m => m.TimelineComponent)
      },
      {
        path: 'reportes',
        title: 'Reportes',
        loadComponent: () => import('./cliente/reportes/reportes.component').then(m => m.ClienteReportesComponent)
      },
      {
        path: 'perfil',
        title: 'Perfil',
        loadComponent: () => import('./cliente/perfil/perfil.component').then(m => m.PerfilComponent)
      },
    ]
  },
  {
    path: '**',
    redirectTo: '/login'
  }
];
