import { Component, OnInit, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ApiService } from '../../../services/api.service';
import { AuthService } from '../../../services/auth.service';

// 👇 1. IMPORTAR LOS COMPONENTES COMPARTIDOS QUE FALTABAN
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';

// Importa tu modelo actualizado
import { Auditoria } from '../../../models/auditoria.model';

@Component({
  selector: 'app-auditoria-detalle',
  standalone: true,
  // 👇 2. AGREGARLOS AL ARRAY DE IMPORTS
  imports: [
    CommonModule, 
    DatePipe, 
    RouterModule, 
    ReactiveFormsModule,
    ConfirmDialogComponent,
    LoadingSpinnerComponent, // <--- Soluciona NG8001
    EmptyStateComponent,     // <--- Soluciona NG8001
    StatusBadgeComponent     // <--- Soluciona NG8001 y NG8002
  ],
  templateUrl: './detalle.component.html',
  styleUrls: ['./detalle.component.css']
})
export class AuditoriaDetalleComponent implements OnInit {
  loading = signal<boolean>(true);
  auditoria = signal<Auditoria | null>(null);
  
  auditoresDisponibles = signal<any[]>([]);
  auditoresAsignados = signal<any[]>([]);
  
  showAsignacion = signal<boolean>(false);
  asignacionModo = signal<'asignar' | 'cambiar'>('asignar');
  moduloAviso = signal<{ tipo: 'success' | 'error'; mensaje: string } | null>(null);
  asignacionAviso = signal<{ tipo: 'success' | 'error'; mensaje: string } | null>(null);
  asignacionForm: FormGroup;

  showConfirmEstado = signal(false);
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
  }

  // 👇 3. AGREGAR EL GETTER PARA EL FORMULARIO (Soluciona TS2339 id_auditor)
  get id_auditor() {
    return this.asignacionForm.get('id_auditor');
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadAuditoria(+id);
    }
  }

  loadAuditoria(id: number): void {
    this.loading.set(true);
    const idEmpresa = this.authService.getIdEmpresa()||0;
    console.log('Cargando auditoría con ID:', id);

    this.apiService.get<any>(`/api/supervisor/auditorias/${idEmpresa}`)
      .subscribe({
        next: (response) => {
          const lista = Array.isArray(response) ? response : (response.data || []);
          const encontrada = lista.find((a: any) => a.id_auditoria === id);
          
          if (encontrada) {
            this.auditoria.set(encontrada);
            this.loadAuditoresAsignados(id);
            this.loadAuditoresDisponibles(idEmpresa);
          }
          this.loading.set(false);
        },
        error: (err) => {
          console.error(err);
          this.loading.set(false);
        }
      });
  }

  loadAuditoresDisponibles(idEmpresa: number) {
    this.apiService.get<any>(`/api/supervisor/auditores/${idEmpresa}`)
      .subscribe({
        next: (res) => this.auditoresDisponibles.set(res.data || res)
      });
  }

  loadAuditoresAsignados(idAuditoria: number) {
    this.apiService.get<any[]>(`/api/supervisor/auditorias/${idAuditoria}/participantes`)
      .subscribe({
        next: (data) => this.auditoresAsignados.set(data),
        error: (err) => console.error('Error cargando participantes', err)
      });
  }

  get modulosUnicos(): number[] {
    const ids = this.auditoria()?.modulos || [];
    return [...new Set(ids.map(id => Number(id)))];
  }

  moduloYaAgregado(idModulo: number): boolean {
    return this.modulosUnicos.includes(Number(idModulo));
  }

  agregarModulo(idModulo: number): void {
    const current = this.auditoria();
    if (!current || !current.id_auditoria) return;

    if (this.moduloYaAgregado(idModulo)) {
      this.moduloAviso.set({ tipo: 'error', mensaje: 'Este módulo ya fue agregado.' });
      return;
    }

    this.moduloAviso.set(null);
    this.apiService.post(`/api/supervisor/auditorias/${current.id_auditoria}/modulos`, { id_modulo: idModulo })
      .subscribe({
        next: () => {
          this.moduloAviso.set({ tipo: 'success', mensaje: 'Módulo agregado correctamente.' });
          this.loadAuditoria(current.id_auditoria);
        },
        error: (err) => this.moduloAviso.set({ tipo: 'error', mensaje: err.error?.message || 'Error al agregar módulo' })
      });
  }

  abrirAsignacion(modo: 'asignar' | 'cambiar') {
    this.asignacionModo.set(modo);
    this.asignacionAviso.set(null);
    this.asignacionForm.reset();
    this.showAsignacion.set(true);
  }

  cerrarAsignacion() {
    this.showAsignacion.set(false);
    this.asignacionForm.reset();
  }

  asignarAuditor() {
    if (this.asignacionForm.invalid) return;
    const idAuditoria = this.auditoria()?.id_auditoria || 0;
    const idAuditor = Number(this.asignacionForm.value.id_auditor);
    const actual = this.auditoresAsignados()[0];

    if (actual && Number(actual.id_usuario) === idAuditor) {
      this.asignacionAviso.set({ tipo: 'error', mensaje: 'Este auditor ya está asignado.' });
      return;
    }

    const request$ = this.asignacionModo() === 'cambiar'
      ? this.apiService.changeSupervisorAuditorToAuditoria(idAuditoria, idAuditor)
      : this.apiService.assignSupervisorAuditorToAuditoria(idAuditoria, idAuditor);

    request$.subscribe({
      next: () => {
        this.asignacionAviso.set({ tipo: 'success', mensaje: this.asignacionModo() === 'cambiar' ? 'Auditor cambiado correctamente.' : 'Auditor asignado correctamente.' });
        this.loadAuditoresAsignados(idAuditoria);
        this.loadAuditoria(idAuditoria);
        this.asignacionForm.reset();
        this.showAsignacion.set(false);
      },
      error: (err) => this.asignacionAviso.set({ tipo: 'error', mensaje: err.error?.message || 'Error al asignar auditor' })
    });
  }

  quitarAuditor() {
    const idAuditoria = this.auditoria()?.id_auditoria || 0;
    if (!idAuditoria) return;
    const confirmado = window.confirm('¿Quitar el auditor asignado? La auditoría quedará pendiente de asignar auditor.');
    if (!confirmado) return;

    this.apiService.removeSupervisorAuditorFromAuditoria(idAuditoria).subscribe({
      next: () => {
        this.asignacionAviso.set({ tipo: 'success', mensaje: 'Auditor removido. La auditoría queda pendiente de asignar auditor.' });
        this.auditoresAsignados.set([]);
        this.showAsignacion.set(false);
        this.loadAuditoria(idAuditoria);
      },
      error: (err) => this.asignacionAviso.set({ tipo: 'error', mensaje: err.error?.message || 'Error al quitar auditor' })
    });
  }
  
  solicitarCambioEstado(estado: number) {
    this.nuevoEstado.set(estado);
    this.showConfirmEstado.set(true);
  }

  cancelarCambioEstado() {
    this.showConfirmEstado.set(false);
    this.nuevoEstado.set(null);
  }

  confirmarCambioEstado() {
    const current = this.auditoria();
    console.log('Cambiando estado a:', this.nuevoEstado());
    const estado = this.nuevoEstado();

    if (!current || !estado) return;

    this.apiService.put(`/api/supervisor/auditorias/${current.id_auditoria}/estado`, { id_estado: estado })
      .subscribe({
        next: () => {
          alert('Estado actualizado correctamente');
          this.showConfirmEstado.set(false);
          this.loadAuditoria(current.id_auditoria);
        },
        error: (err) => alert(err.error?.message || 'Error al cambiar estado')
      });
  }

  getEstadoNombre(id: number | string): string {
    const estados: Record<number, string> = { 1: 'Creada', 2: 'En proceso', 3: 'Finalizada' };
    if (typeof id === 'number') return estados[id] || 'Desconocido';
    return this.formatEstado(id);
  }

  formatEstado(estado: string): string {
    const raw = String(estado || 'Desconocido').trim().replace(/_/g, ' ').replace(/\s+/g, ' ');
    const normalizado = raw.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const especiales: Record<string, string> = {
      'en proceso': 'En proceso',
      'pendiente asignar auditor': 'Pendiente de asignar auditor',
      'pendiente de asignar auditor': 'Pendiente de asignar auditor',
      'auditor asignado': 'Auditor asignado'
    };
    if (especiales[normalizado]) return especiales[normalizado];
    return raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase();
  }

  getModuloNombre(id: number): string {
    const nombres: any = { 1: 'Agua', 2: 'Residuos', 3: 'Energía' };
    return nombres[id] || `Módulo ${id}`;
  }
}