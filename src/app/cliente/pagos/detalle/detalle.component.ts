import { Component, OnInit, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ApiService } from '../../../services/api.service';
import { AuthService } from '../../../services/auth.service';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { IconComponent } from '../../../shared/components/icon/icon.component';
// 👇 Importamos el componente de PayPal
import { PagoPaypalComponent } from '../../../pago-paypal-component/pago-paypal-component'; // Ajusta la ruta según donde lo guardaste
import { SolicitudPago } from '../../../models/pago.model';

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
    IconComponent,
    PagoPaypalComponent // 👈 Lo agregamos a los imports
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
    
    // Endpoint para obtener una solicitud especifica
    // Asegúrate de que tu backend tenga: router.get('/solicitudes-pago/:idCliente/:idSolicitud'...)
    // O usa el filtro en el front si tu API solo devuelve la lista completa.
    this.apiService.get<SolicitudPago[]>(`/api/cliente/solicitudes-pago/${idCliente}`)
      .subscribe({
        next: (solicitudes) => {
          const encontrada = solicitudes.find(s => s.id_solicitud === id);
          this.solicitud.set(encontrada || null);
          this.loading.set(false);
        },
        error: (error) => {
          console.error('Error cargando solicitud:', error);
          this.loading.set(false);
        }
      });
  }

  // Se ejecuta cuando PayPal termina el proceso exitosamente
  onPagoCompletado(auditoriaNueva: any): void {
    alert(`¡Pago Exitoso! Se ha generado la auditoría #${auditoriaNueva.id_auditoria}`);
    
    // Recargamos los datos para que el estado cambie a "PAGADA" y aparezca el botón de ver auditoría
    const id = this.solicitud()?.id_solicitud;
    if (id) this.loadSolicitud(id);
  }

  formatearMonto(monto: number): string {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(monto);
  }
}