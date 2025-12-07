import { Component, OnInit, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ApiService } from '../../../services/api.service';
import { AuthService } from '../../../services/auth.service';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { Auditoria } from '../../../models/auditoria.model';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-auditor-auditoria-detalle',
  standalone: true,
  imports: [
    CommonModule,
    DatePipe,
    RouterModule,
    FormsModule,
    LoadingSpinnerComponent,
    EmptyStateComponent,
    StatusBadgeComponent
  ],
  templateUrl: './detalle.component.html',
  styleUrl: './detalle.component.css'
})
export class AuditoriaDetalleComponent implements OnInit {
  loading = signal<boolean>(true);
  saving = signal<boolean>(false);
  auditoria = signal<Auditoria | null>(null);

  //control de edicion
  isEditingObjetivo = signal<boolean>(false);
  tempObjetivo: string = '';

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

  // Activa el modo edición
  startEditObjetivo(): void {
    this.tempObjetivo = this.auditoria()?.objetivo || '';
    this.isEditingObjetivo.set(true);
  }

  // Cancela la edición
  cancelEditObjetivo(): void {
    this.isEditingObjetivo.set(false);
    this.tempObjetivo = '';
  }

  // Guarda los cambios
  saveObjetivo(): void {
    const currentAuditoria = this.auditoria();
    if (!currentAuditoria) return;

    this.saving.set(true);
    
    // Llamada al backend
    this.apiService.patch<Auditoria>(
      `/api/auditor/auditorias/${currentAuditoria.id_auditoria}/objetivo`, 
      { objetivo: this.tempObjetivo }
    ).subscribe({
      next: (updatedAuditoria) => {
        // Actualizamos la señal con los datos nuevos (incluyendo fecha_inicio si se generó)
        this.auditoria.update(prev => ({
           ...prev!, 
           objetivo: updatedAuditoria.objetivo
        }));
        
        this.isEditingObjetivo.set(false);
        this.saving.set(false);
      },
      error: (err) => {
        console.error('Error guardando objetivo', err);
        this.saving.set(false);
        // Aquí podrías agregar una notificación de error (Toast)
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
