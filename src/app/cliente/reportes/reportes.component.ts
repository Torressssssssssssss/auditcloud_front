import { Component, OnInit, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { IconComponent, IconName } from '../../shared/components/icon/icon.component';
import { Auditoria } from '../../models/auditoria.model';

interface Reporte {
  id_reporte: number;
  id_auditoria: number;
  nombre: string;
  tipo?: string;
  fecha_elaboracion: string;
  fecha_subida?: string;
  url?: string;
  auditoria?: Auditoria;
}

@Component({
  selector: 'app-cliente-reportes',
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
export class ClienteReportesComponent implements OnInit {
  loading = signal<boolean>(true);
  reportes = signal<Reporte[]>([]);
  filtroAuditoria = signal<number | null>(null);
  auditorias = signal<Auditoria[]>([]);

  constructor(
    private apiService: ApiService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadAuditorias();
    this.loadReportes();
  }

  loadAuditorias(): void {
    const idCliente = this.authService.getIdUsuario();
    if (!idCliente) return;

    this.apiService.get<any>(`/api/cliente/auditorias/${idCliente}`)
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
    const idCliente = this.authService.getIdUsuario();
    
    if (!idCliente) {
      this.loading.set(false);
      return;
    }

    // Endpoint: GET /api/cliente/reportes/:idCliente
    this.apiService.get<any>(`/api/cliente/reportes/${idCliente}`)
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

  descargarReporte(reporte: Reporte): void {
    if (reporte.url) {
      // Si la URL es relativa, construir la URL completa
      const url = reporte.url.startsWith('http') 
        ? reporte.url 
        : `http://localhost:3000${reporte.url}`;
      window.open(url, '_blank');
    } else {
      // Intentar descargar desde el endpoint
      this.apiService.get<Blob>(`/api/cliente/auditorias/${reporte.id_auditoria}/reporte`, {}, { responseType: 'blob' })
        .subscribe({
          next: (blob: Blob) => {
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${reporte.nombre}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
          },
          error: (error) => {
            console.error('Error descargando reporte:', error);
            alert('No se pudo descargar el reporte. Por favor, intente más tarde.');
          }
        });
    }
  }

  onAuditoriaChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.filtroAuditoria.set(target.value ? +target.value : null);
  }

  getTipoReporte(nombre: string): string {
    const nombreLower = nombre.toLowerCase();
    if (nombreLower.includes('final') || nombreLower.includes('completo')) return 'Reporte Final';
    if (nombreLower.includes('parcial') || nombreLower.includes('avance')) return 'Reporte Parcial';
    if (nombreLower.includes('preliminar')) return 'Reporte Preliminar';
    return 'Reporte';
  }

  getIconoTipo(tipo: string): IconName {
    if (tipo.includes('Final')) return 'document-check';
    if (tipo.includes('Parcial')) return 'document';
    return 'file-text';
  }

  getCardGradient(reporte: Reporte): string {
    const tipo = this.getTipoReporte(reporte.nombre);
    if (tipo.includes('Final')) {
      return 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
    }
    if (tipo.includes('Parcial')) {
      return 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)';
    }
    return 'linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-secondary) 100%)';
  }
}

