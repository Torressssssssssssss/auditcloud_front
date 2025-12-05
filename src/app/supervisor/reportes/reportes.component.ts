import { Component, OnInit, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { Auditoria } from '../../models/auditoria.model';

interface Reporte {
  id_reporte: number;
  id_auditoria: number;
  nombre: string;
  fecha_elaboracion: string;
  url?: string;
  aprobado: boolean;
  auditoria?: Auditoria;
}

@Component({
  selector: 'app-reportes',
  standalone: true,
  imports: [
    CommonModule,
    DatePipe,
    RouterModule,
    LoadingSpinnerComponent,
    EmptyStateComponent,
    IconComponent
  ],
  templateUrl: './reportes.component.html',
  styleUrl: './reportes.component.css'
})
export class ReportesComponent implements OnInit {
  loading = signal<boolean>(true);
  reportes = signal<Reporte[]>([]);
  filtroAuditoria = signal<number | null>(null);
  auditorias = signal<Auditoria[]>([]);

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.loadAuditorias();
    this.loadReportes();
    
    // Verificar si hay filtro de auditoría en query params
    this.route.queryParams.subscribe(params => {
      if (params['auditoria']) {
        this.filtroAuditoria.set(+params['auditoria']);
      }
    });
  }

  loadAuditorias(): void {
    const idEmpresa = this.authService.getIdEmpresa();
    if (!idEmpresa) return;

    // Nota: Ajustar endpoint según tu backend
    this.apiService.get<any>(`/api/supervisor/auditorias/${idEmpresa}`, { page: 1, limit: 100 })
      .subscribe({
        next: (response) => {
          const auditorias = Array.isArray(response) ? response : (response?.data || []);
          this.auditorias.set(auditorias);
        },
        error: (error) => {
          console.error('Error cargando auditorías:', error);
        }
      });
  }

  loadReportes(): void {
    this.loading.set(true);
    const idEmpresa = this.authService.getIdEmpresa();
    
    if (!idEmpresa) {
      this.loading.set(false);
      return;
    }

    // Nota: Ajustar endpoint según tu backend
    this.apiService.get<any>(`/api/supervisor/reportes/${idEmpresa}`)
      .subscribe({
        next: (response) => {
          const reportes = Array.isArray(response) ? response : (response?.data || []);
          this.reportes.set(reportes);
          this.loading.set(false);
        },
        error: (error) => {
          console.error('Error cargando reportes:', error);
          this.loading.set(false);
        }
      });
  }

  get reportesFiltrados(): Reporte[] {
    let result = this.reportes();
    
    if (this.filtroAuditoria()) {
      result = result.filter(r => r.id_auditoria === this.filtroAuditoria());
    }
    
    return result;
  }

  subirReporte(event: any, idAuditoria: number): void {
    const file = event.target.files[0];
    if (!file) return;

    // Nota: Implementar subida de archivo
    alert('Funcionalidad de subida de reporte pendiente de implementar');
  }

  descargarReporte(reporte: Reporte): void {
    if (reporte.url) {
      window.open(reporte.url, '_blank');
    } else {
      alert('No hay URL disponible para este reporte');
    }
  }

  onAuditoriaChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.filtroAuditoria.set(target.value ? +target.value : null);
  }
}
