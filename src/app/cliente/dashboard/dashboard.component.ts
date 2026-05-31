import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { Auditoria } from '../../models/auditoria.model';
import { SolicitudPago } from '../../models/pago.model';
import { Conversacion } from '../../models/mensaje.model';

@Component({
  selector: 'app-cliente-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    LoadingSpinnerComponent,
    EmptyStateComponent,
    IconComponent
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class ClienteDashboardComponent implements OnInit {
  loading = signal<boolean>(true);
  auditoriasPorEstado = signal<Record<number, number>>({});
  solicitudesPendientes = signal<number>(0);
  ultimosMensajes = signal<Conversacion[]>([]);

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    this.loading.set(true);
    const idCliente = this.authService.getIdUsuario();
    
    if (!idCliente) {
      this.loading.set(false);
      return;
    }

    // Cargar auditorías
    this.apiService.get<any>(`/api/cliente/auditorias/${idCliente}`, { page: 1, limit: 100 })
      .subscribe({
        next: (response) => {
          // Manejar respuesta como array o objeto con data
          const auditorias = Array.isArray(response) ? response : (response?.data || []);
          const estados: Record<number, number> = {};
          if (Array.isArray(auditorias)) {
            auditorias.forEach((a: Auditoria) => {
              estados[a.id_estado] = (estados[a.id_estado] || 0) + 1;
            });
          }
          this.auditoriasPorEstado.set(estados);
        },
        error: (error) => {
          console.error('Error cargando auditorías:', error);
          this.auditoriasPorEstado.set({});
        }
      });

    // Cargar solicitudes de pago
    this.apiService.get<any>(`/api/cliente/solicitudes-pago/${idCliente}`)
      .subscribe({
        next: (response) => {
          // Manejar respuesta como array o objeto con data
          const solicitudes = Array.isArray(response) ? response : (response?.data || []);
          const pendientes = Array.isArray(solicitudes) 
            ? solicitudes.filter((s: SolicitudPago) => s.id_estado === 1).length 
            : 0;
          this.solicitudesPendientes.set(pendientes);
        },
        error: (error) => {
          console.error('Error cargando solicitudes:', error);
          this.solicitudesPendientes.set(0);
        }
      });

    // Cargar conversaciones
    this.apiService.get<any>(`/api/cliente/conversaciones/${idCliente}`)
      .subscribe({
        next: (response) => {
          // Manejar respuesta como array o objeto con data
          const conversaciones = Array.isArray(response) ? response : (response?.data || []);
          this.ultimosMensajes.set(Array.isArray(conversaciones) ? conversaciones.slice(0, 5) : []);
          this.loading.set(false);
        },
        error: (error) => {
          console.error('Error cargando conversaciones:', error);
          this.ultimosMensajes.set([]);
          this.loading.set(false);
        }
      });
  }

  getTotalAuditorias(): number {
    return Object.values(this.auditoriasPorEstado()).reduce((a, b) => a + b, 0);
  }

  navigateTo(route: string): void {
    this.router.navigate([route]);
  }

  // trackBy para la lista de conversaciones
  trackByConversacion(index: number, item: any) {
    return item.id_conversacion;
  }

  formatDate(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  }
}

