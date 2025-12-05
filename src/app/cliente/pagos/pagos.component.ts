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
  selector: 'app-cliente-pagos',
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
    const idCliente = this.authService.getIdUsuario();
    
    if (!idCliente) {
      this.loading.set(false);
      return;
    }

    this.apiService.get<any>(`/api/cliente/solicitudes-pago/${idCliente}`)
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

  puedePagar(solicitud: SolicitudPago): boolean {
    if (solicitud.id_estado !== EstadoPago.PENDIENTE) return false;
    if (!solicitud.fecha_expiracion) return true;
    return new Date(solicitud.fecha_expiracion) > new Date();
  }

  pagar(solicitud: SolicitudPago): void {
    // Redirigir a detalle de pago para procesar
    window.location.href = `/cliente/pagos/${solicitud.id_solicitud}`;
  }

  formatearMonto(monto: number): string {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(monto);
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
