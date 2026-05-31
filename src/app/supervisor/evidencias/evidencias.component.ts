import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { IconComponent } from '../../shared/components/icon/icon.component';

// Interfaces locales para tipado estricto
interface AuditoriaRow {
  id_auditoria: number;
  id_cliente: number;
  id_solicitud_pago: number;
  id_estado: number;
  fecha_creacion: string; // Mapeado de creada_en
  estado_actualizado_en: string;
  cliente?: { nombre_empresa: string }; // Dato enriquecido
}

interface EvidenciaRow {
  id_evidencia: number;
  id_auditoria: number;
  id_modulo: number;
  id_auditor: number;
  tipo: string;
  descripcion: string;
  url: string;
  nombre_archivo: string;
  creado_en: string;
  nombre_auditor?: string; // Enriquecido
  nombre_modulo?: string;  // Enriquecido
}

@Component({
  selector: 'app-supervisor-evidencias',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    LoadingSpinnerComponent, 
    EmptyStateComponent, 
    StatusBadgeComponent,
    IconComponent
  ],
  templateUrl: './evidencias.component.html',
  styleUrls: ['./evidencias.component.css']
})
export class EvidenciasComponent implements OnInit {
  private api = inject(ApiService);
  private auth = inject(AuthService);

  loadingAuditorias = signal(true);
  loadingEvidencias = signal(false);

  // Datos Crudos
  listaAuditorias = signal<AuditoriaRow[]>([]);
  listaEvidencias = signal<EvidenciaRow[]>([]);
  
  // Selección
  auditoriaSeleccionada = signal<AuditoriaRow | null>(null);

  // Filtros Auditoría (Objeto reactivo)
  filtrosAudit = signal({
    id: '',
    cliente: '',
    estado: ''
  });

  // Filtros Evidencias (Objeto reactivo)
  filtrosEvidencia = signal({
    modulo: '',
    tipo: '',
    auditor: ''
  });

  ngOnInit() {
    this.cargarAuditorias();
  }

  // --- LOGICA AUDITORIAS ---

  cargarAuditorias() {
    this.loadingAuditorias.set(true);
    const idEmpresa = this.auth.getIdEmpresa();

    this.api.get<any>(`/api/supervisor/auditorias/${idEmpresa}`).subscribe({
      next: (response) => {
        console.log('Respuesta Backend Auditorías:', response); // Para depurar

        // 👇 CORRECCIÓN AQUÍ:
        // Si el backend devuelve { data: [...] }, extraemos .data. Si es array directo, lo usamos.
        const listaRaw = Array.isArray(response) ? response : (response.data || []);

        const mapeado = listaRaw.map((a: any) => ({
          id_auditoria: a.id_auditoria,
          id_cliente: a.id_cliente,
          id_solicitud_pago: a.id_solicitud_pago || 0,
          id_estado: a.id_estado,
          fecha_creacion: a.creada_en || a.fecha_creacion,
          estado_actualizado_en: a.estado_actualizado_en,
          cliente: a.cliente // Asegúrate que el backend envíe este objeto enriquecido
        }));

        this.listaAuditorias.set(mapeado);
        this.loadingAuditorias.set(false);
      },
      error: (err) => {
        console.error('Error cargando auditorías', err);
        this.loadingAuditorias.set(false);
      }
    });
  }

  // Computed para filtrar auditorías en tiempo real
  auditoriasFiltradas = computed(() => {
    const filtros = this.filtrosAudit();
    return this.listaAuditorias().filter(a => {
      const matchId = !filtros.id || a.id_auditoria.toString().includes(filtros.id);
      const matchEstado = !filtros.estado || a.id_estado.toString() === filtros.estado;
      
      // Búsqueda laxa por nombre de cliente o ID cliente
      const textoCliente = (a.cliente?.nombre_empresa || '' + a.id_cliente).toLowerCase();
      const matchCliente = !filtros.cliente || textoCliente.includes(filtros.cliente.toLowerCase());

      return matchId && matchEstado && matchCliente;
    });
  });

  seleccionarAuditoria(auditoria: AuditoriaRow) {
    this.auditoriaSeleccionada.set(auditoria);
    this.cargarEvidencias(auditoria.id_auditoria);
    
    // Scroll suave hacia la sección de evidencias
    setTimeout(() => {
      document.getElementById('seccion-evidencias')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }

  // --- LOGICA EVIDENCIAS ---

  cargarEvidencias(idAuditoria: number) {
    this.loadingEvidencias.set(true);
    this.api.get<EvidenciaRow[]>(`/api/supervisor/auditorias/${idAuditoria}/evidencias`).subscribe({
      next: (data: EvidenciaRow[]) => {
        this.listaEvidencias.set(data);
        this.loadingEvidencias.set(false);
      },
      error: () => this.loadingEvidencias.set(false)
    });
  }

  // Computed para filtrar evidencias
  evidenciasFiltradas = computed(() => {
    const filtros = this.filtrosEvidencia();
    return this.listaEvidencias().filter(e => {
      const matchModulo = !filtros.modulo || e.id_modulo.toString() === filtros.modulo;
      const matchTipo = !filtros.tipo || e.tipo === filtros.tipo;
      const matchAuditor = !filtros.auditor || e.id_auditor.toString().includes(filtros.auditor); // Por ID o Nombre si se implementa búsqueda texto

      return matchModulo && matchTipo && matchAuditor;
    });
  });

  // Helpers de actualización de filtros (para usar en el HTML con ngModel)
  updateFiltroAudit(campo: string, valor: string) {
    this.filtrosAudit.update(f => ({ ...f, [campo]: valor }));
  }

  updateFiltroEvidencia(campo: string, valor: string) {
    this.filtrosEvidencia.update(f => ({ ...f, [campo]: valor }));
  }

  limpiarSeleccion() {
    this.auditoriaSeleccionada.set(null);
    this.listaEvidencias.set([]);
  }
}