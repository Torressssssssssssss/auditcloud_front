import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService, AuditorDisponible, CarteraClienteItem } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { IconComponent } from '../../shared/components/icon/icon.component';

@Component({
  selector: 'app-supervisor-clientes',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    CurrencyPipe,
    DatePipe,
    LoadingSpinnerComponent,
    EmptyStateComponent,
    IconComponent
  ],
  templateUrl: './clientes.components.html',
  styleUrls: ['./clientes.components.css']
})
export class ClientesComponent implements OnInit {
  private api = inject(ApiService);
  private auth = inject(AuthService);

  clientes = signal<CarteraClienteItem[]>([]);
  auditores = signal<AuditorDisponible[]>([]);
  loading = signal<boolean>(true);
  asignando = signal<number | null>(null);
  editandoAuditor = signal<number | null>(null);
  quitandoAuditor = signal<number | null>(null);
  error = signal<string | null>(null);
  exito = signal<string | null>(null);
  seleccionAuditor: Record<number, number | null> = {};

  ngOnInit() {
    this.cargarDatos();
  }

  cargarDatos() {
    this.loading.set(true);
    this.error.set(null);
    const idEmpresa = this.auth.getIdEmpresa();

    this.api.listSupervisorCarteraClientes().subscribe({
      next: (data) => {
        this.clientes.set(Array.isArray(data) ? data : []);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error cargando cartera', err);
        this.error.set(err?.error?.message || 'No fue posible cargar la cartera de clientes.');
        this.loading.set(false);
      }
    });

    if (idEmpresa) {
      this.api.listSupervisorAuditores(idEmpresa).subscribe({
        next: (response) => this.auditores.set(response?.data || []),
        error: (err) => console.error('Error cargando auditores', err)
      });
    }
  }

  asignarAuditor(cliente: CarteraClienteItem) {
    const idAuditor = Number(this.seleccionAuditor[cliente.id_solicitud] || 0);
    if (!idAuditor) {
      this.error.set('Selecciona un auditor para continuar.');
      return;
    }

    if (cliente.auditor_asignado && Number(cliente.auditor_asignado.id_usuario) === idAuditor) {
      this.error.set('Este auditor ya está asignado.');
      return;
    }

    this.asignando.set(cliente.id_solicitud);
    this.error.set(null);
    this.exito.set(null);

    const request$ = cliente.auditor_asignado && cliente.id_auditoria
      ? this.api.changeSupervisorAuditorToAuditoria(cliente.id_auditoria, idAuditor)
      : this.api.assignSupervisorAuditorToSolicitud(cliente.id_solicitud, idAuditor);

    request$.subscribe({
      next: () => {
        this.asignando.set(null);
        this.editandoAuditor.set(null);
        this.seleccionAuditor[cliente.id_solicitud] = null;
        this.exito.set(cliente.auditor_asignado ? 'Auditor cambiado correctamente.' : 'Auditor asignado correctamente.');
        this.cargarDatos();
      },
      error: (err) => {
        this.asignando.set(null);
        this.error.set(err?.error?.message || 'No fue posible asignar el auditor.');
      }
    });
  }

  iniciarCambioAuditor(cliente: CarteraClienteItem) {
    this.error.set(null);
    this.exito.set(null);
    this.editandoAuditor.set(cliente.id_solicitud);
    this.seleccionAuditor[cliente.id_solicitud] = cliente.auditor_asignado?.id_usuario || null;
  }

  cancelarCambioAuditor(cliente: CarteraClienteItem) {
    this.editandoAuditor.set(null);
    this.seleccionAuditor[cliente.id_solicitud] = null;
  }

  quitarAuditor(cliente: CarteraClienteItem) {
    if (!cliente.id_auditoria) return;
    const confirmado = window.confirm('¿Quitar el auditor asignado? La auditoría volverá a pendiente de asignar auditor.');
    if (!confirmado) return;

    this.quitandoAuditor.set(cliente.id_solicitud);
    this.error.set(null);
    this.exito.set(null);

    this.api.removeSupervisorAuditorFromAuditoria(cliente.id_auditoria).subscribe({
      next: () => {
        this.quitandoAuditor.set(null);
        this.editandoAuditor.set(null);
        this.exito.set('Auditor removido. La auditoría queda pendiente de asignar auditor.');
        this.cargarDatos();
      },
      error: (err) => {
        this.quitandoAuditor.set(null);
        this.error.set(err?.error?.message || 'No fue posible quitar el auditor.');
      }
    });
  }

  mostrarSelector(cliente: CarteraClienteItem): boolean {
    return !cliente.auditor_asignado || this.editandoAuditor() === cliente.id_solicitud;
  }

  estadoVisual(cliente: CarteraClienteItem): string {
    return this.formatEstado(cliente.estado_operativo);
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

  estadoClase(cliente: CarteraClienteItem): string {
    const estado = this.formatEstado(cliente.estado_operativo).toLowerCase();
    if (estado.includes('pendiente')) return 'status-pending';
    if (estado.includes('asignado')) return 'status-assigned';
    if (estado.includes('activa') || estado.includes('proceso')) return 'status-active';
    if (estado.includes('finalizada')) return 'status-complete';
    return 'status-neutral';
  }

  trackBySolicitud(_: number, item: CarteraClienteItem) {
    return item.id_solicitud;
  }
}
