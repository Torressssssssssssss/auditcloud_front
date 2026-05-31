import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { Auditoria } from '../../models/auditoria.model';
import { forkJoin } from 'rxjs'; // 👈 Importante para hacer múltiples peticiones

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
  private apiService = inject(ApiService);
  private authService = inject(AuthService);

  loading = signal<boolean>(true);
  
  // Contadores
  totalClientes = signal<number>(0);
  solicitudesPendientes = signal<number>(0);
  
  // Listas
  auditoriasActivas = signal<Auditoria[]>([]);

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

    // Realizamos las 3 peticiones en paralelo
    forkJoin({
      // 1. Solicitudes de Pago (URL corregida: SIN ID en la ruta)
      pagos: this.apiService.get<any>('/api/supervisor/solicitudes-pago'),
      
      // 2. Auditorías de la empresa (Aquí SÍ va el ID porque así lo definiste en el back)
      auditorias: this.apiService.get<any>(`/api/supervisor/auditorias/${idEmpresa}`),
      
      // 3. Clientes con los que se ha trabajado
      clientes: this.apiService.get<any[]>('/api/supervisor/clientes-con-auditorias')
    }).subscribe({
      next: (results) => {
        // A. Procesar Pagos Pendientes (Estado 1)
        const pagosData = Array.isArray(results.pagos) ? results.pagos : results.pagos.data || [];
        const pendientes = pagosData.filter((p: any) => p.id_estado === 1).length;
        this.solicitudesPendientes.set(pendientes);

        // B. Procesar Auditorías Activas (Estado 1 o 2)
        const auditData = Array.isArray(results.auditorias) ? results.auditorias : results.auditorias.data || [];
        // Filtramos las que no estén finalizadas (estado 3)
        const activas = auditData.filter((a: any) => a.id_estado !== 3);
        
        // Ordenamos: las más recientes primero
        activas.sort((a: any, b: any) => new Date(b.creada_en).getTime() - new Date(a.creada_en).getTime());
        this.auditoriasActivas.set(activas);

        // C. Procesar Total de Clientes
        this.totalClientes.set(results.clientes.length);

        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error cargando dashboard:', err);
        this.loading.set(false);
      }
    });
  }
}