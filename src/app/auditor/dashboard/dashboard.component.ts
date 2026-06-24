import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { Auditoria } from '../../models/auditoria.model';

@Component({
  selector: 'app-auditor-dashboard',
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
export class AuditorDashboardComponent implements OnInit {
  loading = signal<boolean>(true);
  auditoriasPorEstado = signal<Record<number, number>>({});
  proximasVisitas = signal<Auditoria[]>([]);
  auditoriasAsignadas = signal<Auditoria[]>([]);

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
    const idAuditor = this.authService.getIdUsuario();
    
    if (!idAuditor) {
      this.loading.set(false);
      return;
    }

    this.apiService.get<Auditoria[]>(`/api/auditor/auditorias-asignadas/${idAuditor}`)
      .subscribe({
        next: (auditorias) => {
          this.auditoriasAsignadas.set(auditorias);
          const estados: Record<number, number> = {};
          auditorias.forEach(a => {
            estados[a.id_estado] = (estados[a.id_estado] || 0) + 1;
          });
          this.auditoriasPorEstado.set(estados);
          
          // Proximas visitas (EN_PROCESO)
          const enProceso = auditorias.filter(a => a.id_estado === 2);
          this.proximasVisitas.set(enProceso.slice(0, 5));
          this.loading.set(false);
        },
        error: (error) => {
          console.error('Error cargando auditorías:', error);
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
}




