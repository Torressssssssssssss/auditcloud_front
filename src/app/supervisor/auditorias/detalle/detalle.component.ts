import { Component, OnInit, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ApiService } from '../../../services/api.service';
import { AuthService } from '../../../services/auth.service';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { Auditoria } from '../../../models/auditoria.model';
import { Usuario } from '../../../models/usuario.model';
import { ModuloAmbiental } from '../../../models/usuario.model';

@Component({
  selector: 'app-auditoria-detalle',
  standalone: true,
  imports: [
    CommonModule,
    DatePipe,
    RouterModule,
    ReactiveFormsModule,
    LoadingSpinnerComponent,
    EmptyStateComponent,
    StatusBadgeComponent,
    ConfirmDialogComponent
  ],
  templateUrl: './detalle.component.html',
  styleUrl: './detalle.component.css'
})
export class AuditoriaDetalleComponent implements OnInit {
  loading = signal<boolean>(true);
  auditoria = signal<Auditoria | null>(null);
  auditoresDisponibles = signal<Usuario[]>([]);
  auditoresAsignados = signal<Usuario[]>([]);
  asignacionForm: FormGroup;
  estadoForm: FormGroup;
  showAsignacion = signal<boolean>(false);
  showConfirmEstado = signal<boolean>(false);
  nuevoEstado = signal<number | null>(null);

  constructor(
    private route: ActivatedRoute,
    public router: Router,
    private apiService: ApiService,
    private authService: AuthService,
    private fb: FormBuilder
  ) {
    this.asignacionForm = this.fb.group({
      id_auditor: ['', Validators.required]
    });

    this.estadoForm = this.fb.group({
      id_estado: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadAuditoria(+id);
      this.loadAuditores();
    }
  }

  loadAuditoria(id: number): void {
    this.loading.set(true);
    // Nota: Ajustar endpoint según tu backend
    this.apiService.get<Auditoria>(`/api/supervisor/auditorias/${id}`)
      .subscribe({
        next: (auditoria) => {
          this.auditoria.set(auditoria);
          this.estadoForm.patchValue({ id_estado: auditoria.id_estado });
          this.loadAuditoresAsignados(id);
          this.loading.set(false);
        },
        error: (error) => {
          console.error('Error cargando auditoría:', error);
          this.loading.set(false);
        }
      });
  }

  loadAuditores(): void {
    const idEmpresa = this.authService.getIdEmpresa();
    if (!idEmpresa) return;

    this.apiService.get<any>(`/api/supervisor/auditores/${idEmpresa}`, { page: 1, limit: 100 })
      .subscribe({
        next: (response) => {
          const auditores = Array.isArray(response) ? response : (response?.data || []);
          this.auditoresDisponibles.set(auditores);
        },
        error: (error) => {
          console.error('Error cargando auditores:', error);
        }
      });
  }

  loadAuditoresAsignados(idAuditoria: number): void {
    // Nota: Ajustar endpoint según tu backend
    this.apiService.get<any>(`/api/supervisor/auditorias/${idAuditoria}/participantes`)
      .subscribe({
        next: (response) => {
          const auditores = Array.isArray(response) ? response : (response?.data || []);
          this.auditoresAsignados.set(auditores);
        },
        error: (error) => {
          console.error('Error cargando participantes:', error);
        }
      });
  }

  asignarAuditor(): void {
    if (this.asignacionForm.invalid || !this.auditoria()) return;

    const idAuditoria = this.auditoria()!.id_auditoria;
    const idAuditor = +this.asignacionForm.value.id_auditor;

    this.apiService.post<any>(`/api/supervisor/auditorias/${idAuditoria}/asignar`, { id_auditor: idAuditor })
      .subscribe({
        next: () => {
          this.loadAuditoresAsignados(idAuditoria);
          this.asignacionForm.reset();
          this.showAsignacion.set(false);
        },
        error: (error) => {
          console.error('Error asignando auditor:', error);
        }
      });
  }

  cambiarEstado(): void {
    if (!this.auditoria() || !this.nuevoEstado()) return;

    const idAuditoria = this.auditoria()!.id_auditoria;

    this.apiService.put<any>(`/api/supervisor/auditorias/${idAuditoria}/estado`, { id_estado: this.nuevoEstado() })
      .subscribe({
        next: () => {
          this.loadAuditoria(idAuditoria);
          this.showConfirmEstado.set(false);
          this.nuevoEstado.set(null);
        },
        error: (error) => {
          console.error('Error cambiando estado:', error);
        }
      });
  }

  solicitarCambioEstado(nuevoEstado: number): void {
    this.nuevoEstado.set(nuevoEstado);
    this.showConfirmEstado.set(true);
  }

  confirmarCambioEstado(): void {
    this.cambiarEstado();
  }

  cancelarCambioEstado(): void {
    this.showConfirmEstado.set(false);
    this.nuevoEstado.set(null);
  }

  agregarModulo(idModulo: number): void {
    if (!this.auditoria()) return;

    const idAuditoria = this.auditoria()!.id_auditoria;

    this.apiService.post<any>(`/api/supervisor/auditorias/${idAuditoria}/modulos`, { id_modulo: idModulo })
      .subscribe({
        next: () => {
          this.loadAuditoria(idAuditoria);
        },
        error: (error) => {
          console.error('Error agregando módulo:', error);
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

  get id_auditor() { return this.asignacionForm.get('id_auditor'); }
}
