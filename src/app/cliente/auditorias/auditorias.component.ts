import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { IconComponent } from '../../shared/components/icon/icon.component';

// Interfaz que coincide con lo que manda el backend ahora
interface AuditoriaCliente {
  id_auditoria: number;
  id_estado: number;
  fecha_creacion: string;
  empresa?: { nombre: string };
  modulos?: number[];
}

@Component({
  selector: 'app-cliente-auditorias',
  standalone: true,
  imports: [
    CommonModule,
    DatePipe,
    RouterModule,
    LoadingSpinnerComponent,
    EmptyStateComponent,
    StatusBadgeComponent,
    IconComponent
  ],
  templateUrl: './auditorias.component.html',
  styleUrls: ['./auditorias.component.css']
})
export class AuditoriasComponent implements OnInit {
  private api = inject(ApiService);
  private auth = inject(AuthService);

  loading = signal<boolean>(true);
  listaAuditorias = signal<AuditoriaCliente[]>([]);
  
  // Filtros reactivos
  filtroEstado = signal<number | null>(null);
  filtroModulo = signal<number | null>(null);

  ngOnInit(): void {
    this.cargarDatos();
  }

  cargarDatos() {
    this.loading.set(true);
    const idCliente = this.auth.getIdUsuario();

    this.api.get<AuditoriaCliente[]>(`/api/cliente/auditorias/${idCliente}`)
      .subscribe({
        next: (data) => {
          // Si el backend devuelve { data: [...] }, extraemos el array. Si no, usamos data directo.
          const auditorias = Array.isArray(data) ? data : (data as any).data || [];
          this.listaAuditorias.set(auditorias);
          this.loading.set(false);
        },
        error: (err) => {
          console.error(err);
          this.loading.set(false);
        }
      });
  }

  // Lógica de filtrado en cliente
  auditoriasFiltradas = computed(() => {
    let lista = this.listaAuditorias();
    const estado = this.filtroEstado();
    const modulo = this.filtroModulo();

    if (estado) {
      lista = lista.filter(a => a.id_estado === estado);
    }
    if (modulo) {
      lista = lista.filter(a => a.modulos?.includes(modulo));
    }
    return lista;
  });

  // Helpers para la vista
  getModulosTexto(ids: number[] | undefined): string {
    if (!ids || ids.length === 0) return 'Sin módulos';
    const map: Record<number, string> = { 1: 'Agua', 2: 'Residuos', 3: 'Energía' };
    return ids.map(id => map[id] || `Módulo ${id}`).join(', ');
  }

  onEstadoChange(e: Event) {
    const val = (e.target as HTMLSelectElement).value;
    this.filtroEstado.set(val ? +val : null);
  }

  onModuloChange(e: Event) {
    const val = (e.target as HTMLSelectElement).value;
    this.filtroModulo.set(val ? +val : null);
  }
}