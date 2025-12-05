import { Component, OnInit, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { SolicitudPago } from '../../models/pago.model';
import { EstadoPago } from '../../models/usuario.model';

@Component({
  selector: 'app-pagos',
  standalone: true,
  imports: [
    CommonModule,
    DatePipe,
    RouterModule,
    LoadingSpinnerComponent,
    EmptyStateComponent,
    StatusBadgeComponent
  ],
  templateUrl: './pagos.component.html',
  styleUrl: './pagos.component.css'
})
export class PagosComponent implements OnInit {
  loading = signal<boolean>(true);
  solicitudes = signal<SolicitudPago[]>([]);
  filtroEstado = signal<number | null>(null);

  constructor(
    private apiService: ApiService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadSolicitudes();
  }

  loadSolicitudes(): void {
    this.loading.set(true);
    const idEmpresa = this.authService.getIdEmpresa();
    
    if (!idEmpresa) {
      this.loading.set(false);
      return;
    }

    this.apiService.get<any>(`/api/supervisor/solicitudes-pago/${idEmpresa}`, { page: 1, limit: 100 })
      .subscribe({
        next: (response) => {
          const solicitudes = Array.isArray(response) ? response : (response?.data || []);
          this.solicitudes.set(solicitudes);
          this.loading.set(false);
        },
        error: (error) => {
          console.error('Error cargando solicitudes:', error);
          this.loading.set(false);
        }
      });
  }

  get solicitudesFiltradas(): SolicitudPago[] {
    let result = this.solicitudes();
    
    if (this.filtroEstado()) {
      result = result.filter(s => s.id_estado === this.filtroEstado());
    }
    
    return result;
  }

  formatearMonto(monto: number): string {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(monto);
  }

  pagarSolicitud(solicitud: SolicitudPago): void {
    if (solicitud.id_estado !== EstadoPago.PENDIENTE) return;

    this.apiService.post<any>(`/api/supervisor/solicitudes-pago/${solicitud.id_solicitud}/pagar`, {})
      .subscribe({
        next: () => {
          this.loadSolicitudes();
        },
        error: (error) => {
          console.error('Error pagando solicitud:', error);
        }
      });
  }

  estaExpirada(solicitud: SolicitudPago): boolean {
    if (!solicitud.fecha_expiracion) return false;
    return new Date(solicitud.fecha_expiracion) <= new Date();
  }

  onEstadoChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.filtroEstado.set(target.value ? +target.value : null);
  }
}
