import { Component, OnInit, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ApiService } from '../../../services/api.service';
import { AuthService } from '../../../services/auth.service';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { SolicitudPago } from '../../../models/pago.model';
import { EstadoPago } from '../../../models/usuario.model';

@Component({
  selector: 'app-pago-detalle',
  standalone: true,
  imports: [
    CommonModule,
    DatePipe,
    RouterModule,
    LoadingSpinnerComponent,
    EmptyStateComponent,
    StatusBadgeComponent,
    IconComponent
  ],
  templateUrl: './detalle.component.html',
  styleUrl: './detalle.component.css'
})
export class PagoDetalleComponent implements OnInit {
  loading = signal<boolean>(true);
  solicitud = signal<SolicitudPago | null>(null);

  constructor(
    private route: ActivatedRoute,
    public router: Router,
    private apiService: ApiService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadSolicitud(+id);
    }
  }

  loadSolicitud(id: number): void {
    this.loading.set(true);
    const idCliente = this.authService.getIdUsuario();
    if (!idCliente) {
      this.loading.set(false);
      return;
    }

    // Nota: Ajustar endpoint según tu backend
    this.apiService.get<SolicitudPago>(`/api/cliente/solicitudes-pago/${idCliente}/${id}`)
      .subscribe({
        next: (solicitud) => {
          this.solicitud.set(solicitud);
          this.loading.set(false);
        },
        error: (error) => {
          console.error('Error cargando solicitud:', error);
          this.loading.set(false);
        }
      });
  }

  puedePagar(): boolean {
    const solicitud = this.solicitud();
    if (!solicitud || solicitud.id_estado !== EstadoPago.PENDIENTE) return false;
    if (!solicitud.fecha_expiracion) return true;
    return new Date(solicitud.fecha_expiracion) > new Date();
  }

  estaExpirada(): boolean {
    const solicitud = this.solicitud();
    if (!solicitud || !solicitud.fecha_expiracion) return false;
    return new Date(solicitud.fecha_expiracion) <= new Date();
  }

  pagar(): void {
    const solicitud = this.solicitud();
    if (!solicitud || !this.puedePagar()) return;

    // Nota: Implementar flujo de pago real (PayPal, etc.)
    alert('Funcionalidad de pago pendiente de implementar. En producción, aquí se integraría con PayPal u otro procesador de pagos.');
    
    // Simular pago exitoso
    // this.apiService.post(`/api/cliente/pagos/${solicitud.id_solicitud}/pagar`, {})
    //   .subscribe({
    //     next: () => {
    //       this.loadSolicitud(solicitud.id_solicitud);
    //     },
    //     error: (error) => {
    //       console.error('Error procesando pago:', error);
    //     }
    //   });
  }

  formatearMonto(monto: number): string {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(monto);
  }
}
