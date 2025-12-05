import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { Auditoria } from '../../models/auditoria.model';
import { SolicitudPago } from '../../models/pago.model';

@Component({
  selector: 'app-supervisor-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    LoadingSpinnerComponent,
    EmptyStateComponent,
    StatusBadgeComponent,
    IconComponent
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class SupervisorDashboardComponent implements OnInit {
  loading = signal<boolean>(true);
  totalClientes = signal<number>(0);
  auditoriasPorEstado = signal<Record<number, number>>({});
  solicitudesPendientes = signal<number>(0);
  auditoriasActivas = signal<Auditoria[]>([]);

  constructor(
    private apiService: ApiService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    this.loading.set(true);
    const idEmpresa = this.authService.getIdEmpresa();
    
    if (!idEmpresa) {
      this.loading.set(false);
      return;
    }

    // Cargar solicitudes de pago
    this.apiService.get<any>(`/api/supervisor/solicitudes-pago/${idEmpresa}`, { page: 1, limit: 100 })
      .subscribe({
        next: (response) => {
          const solicitudes = Array.isArray(response) ? response : response.data || [];
          const pendientes = solicitudes.filter((s: SolicitudPago) => s.id_estado === 1).length;
          this.solicitudesPendientes.set(pendientes);
        },
        error: (error) => {
          console.error('Error cargando solicitudes:', error);
        }
      });

    // Cargar auditorías (simulado - ajustar según tu backend)
    this.loading.set(false);
  }

  getEstadoNombre(estado: number): string {
    const estados: Record<number, string> = {
      1: 'CREADA',
      2: 'EN_PROCESO',
      3: 'FINALIZADA'
    };
    return estados[estado] || 'DESCONOCIDO';
  }
}




