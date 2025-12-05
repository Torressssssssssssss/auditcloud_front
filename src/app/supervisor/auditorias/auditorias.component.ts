import { Component, OnInit, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { Auditoria } from '../../models/auditoria.model';

@Component({
  selector: 'app-auditorias',
  standalone: true,
  imports: [
    CommonModule,
    DatePipe,
    RouterModule,
    LoadingSpinnerComponent,
    EmptyStateComponent,
    StatusBadgeComponent
  ],
  templateUrl: './auditorias.component.html',
  styleUrl: './auditorias.component.css'
})
export class AuditoriasComponent implements OnInit {
  loading = signal<boolean>(true);
  auditorias = signal<Auditoria[]>([]);
  filtroEstado = signal<number | null>(null);
  filtroCliente = signal<string>('');

  constructor(
    private apiService: ApiService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadAuditorias();
  }

  loadAuditorias(): void {
    this.loading.set(true);
    const idEmpresa = this.authService.getIdEmpresa();
    
    if (!idEmpresa) {
      this.loading.set(false);
      return;
    }

    // Nota: Ajustar endpoint según tu backend
    this.apiService.get<any>(`/api/supervisor/auditorias/${idEmpresa}`, { page: 1, limit: 100 })
      .subscribe({
        next: (response) => {
          const auditorias = Array.isArray(response) ? response : (response?.data || []);
          this.auditorias.set(auditorias);
          this.loading.set(false);
        },
        error: (error) => {
          console.error('Error cargando auditorías:', error);
          this.loading.set(false);
        }
      });
  }

  get auditoriasFiltradas(): Auditoria[] {
    let result = this.auditorias();
    
    if (this.filtroEstado()) {
      result = result.filter(a => a.id_estado === this.filtroEstado());
    }
    
    if (this.filtroCliente()) {
      const search = this.filtroCliente().toLowerCase();
      result = result.filter(a => 
        a.cliente?.nombre?.toLowerCase().includes(search) ||
        a.cliente?.nombre_empresa?.toLowerCase().includes(search)
      );
    }
    
    return result;
  }

  getModulosTexto(modulos: number[] | undefined): string {
    if (!modulos || modulos.length === 0) return '-';
    const nombres: Record<number, string> = { 1: 'Agua', 2: 'Residuos', 3: 'Energía' };
    return modulos.map(m => nombres[m] || m.toString()).join(', ');
  }

  onEstadoChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.filtroEstado.set(target.value ? +target.value : null);
  }

  onClienteChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.filtroCliente.set(target.value);
  }
}
