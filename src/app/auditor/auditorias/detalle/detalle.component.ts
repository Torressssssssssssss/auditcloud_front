import { Component, OnInit, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ApiService } from '../../../services/api.service';
import { AuthService } from '../../../services/auth.service';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { Auditoria } from '../../../models/auditoria.model';

@Component({
  selector: 'app-auditor-auditoria-detalle',
  standalone: true,
  imports: [
    CommonModule,
    DatePipe,
    RouterModule,
    LoadingSpinnerComponent,
    EmptyStateComponent,
    StatusBadgeComponent
  ],
  templateUrl: './detalle.component.html',
  styleUrl: './detalle.component.css'
})
export class AuditoriaDetalleComponent implements OnInit {
  loading = signal<boolean>(true);
  auditoria = signal<Auditoria | null>(null);

  constructor(
    private route: ActivatedRoute,
    public router: Router,
    private apiService: ApiService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadAuditoria(+id);
    }
  }

  loadAuditoria(id: number): void {
    this.loading.set(true);
    // Nota: Ajustar endpoint según tu backend
    this.apiService.get<Auditoria>(`/api/auditor/auditorias/${id}`)
      .subscribe({
        next: (auditoria) => {
          this.auditoria.set(auditoria);
          this.loading.set(false);
        },
        error: (error) => {
          console.error('Error cargando auditoría:', error);
          this.loading.set(false);
        }
      });
  }

  getModuloNombre(id: number): string {
    const nombres: Record<number, string> = { 1: 'Agua', 2: 'Residuos', 3: 'Energía' };
    return nombres[id] || id.toString();
  }

  getEstadoNombre(id: number): string {
    const nombres: Record<number, string> = {
      1: 'CREADA',
      2: 'EN_PROCESO',
      3: 'FINALIZADA'
    };
    return nombres[id] || 'DESCONOCIDO';
  }
}
