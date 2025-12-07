import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../services/api.service';
import { AuthService } from '../../../services/auth.service';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { Auditoria } from '../../../models/auditoria.model';
import { IconComponent } from '../../../shared/components/icon/icon.component'; // Asegúrate de tener iconos

// Interfaz para la tabla unificada
interface BitacoraItem {
  id_item: string;
  tipo: 'EVIDENCIA' | 'COMENTARIO';
  subtipo?: string; // FOTO, DOC
  titulo: string;
  contenido: string;
  url?: string;
  nombre_archivo?: string;
  autor: string;
  fecha: string;
}

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
    StatusBadgeComponent,
    IconComponent
  ],
  templateUrl: './detalle.component.html',
  styleUrls: ['./detalle.component.css']
})
export class AuditoriaDetalleComponent implements OnInit {
  private api = inject(ApiService);
  private route = inject(ActivatedRoute);
  public router = inject(Router);

  loading = signal<boolean>(true);
  saving = signal<boolean>(false);
  auditoria = signal<Auditoria | null>(null);
  
  // Bitácora
  bitacora = signal<BitacoraItem[]>([]);
  loadingBitacora = signal<boolean>(false);

  // Control de Modales
  showModalComentario = signal<boolean>(false);
  showModalDetalle = signal<boolean>(false);
  
  // Datos para modales
  nuevoComentario = '';
  itemSeleccionado = signal<BitacoraItem | null>(null);

  // Control edición objetivo
  isEditingObjetivo = signal<boolean>(false);
  tempObjetivo: string = '';

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadAuditoria(+id);
      this.loadBitacora(+id);
    }
  }

  loadAuditoria(id: number): void {
    this.loading.set(true);
    this.api.get<Auditoria>(`/api/auditor/auditorias/${id}`).subscribe({
      next: (data) => {
        this.auditoria.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  loadBitacora(idAuditoria: number): void {
    this.loadingBitacora.set(true);
    this.api.get<BitacoraItem[]>(`/api/timeline/${idAuditoria}`).subscribe({
      next: (data) => {
        this.bitacora.set(data);
        this.loadingBitacora.set(false);
      },
      error: () => this.loadingBitacora.set(false)
    });
  }

  // --- COMENTARIOS ---

  abrirModalComentario() {
    this.nuevoComentario = '';
    this.showModalComentario.set(true);
  }

  guardarComentario() {
    if (!this.nuevoComentario.trim()) return;
    
    this.saving.set(true);
    const payload = {
      id_auditoria: this.auditoria()?.id_auditoria,
      mensaje: this.nuevoComentario
    };

    this.api.post('/api/timeline/comentarios', payload).subscribe({
      next: () => {
        this.saving.set(false);
        this.showModalComentario.set(false);
        this.loadBitacora(this.auditoria()!.id_auditoria); // Recargar tabla
      },
      error: (err) => {
        console.error(err);
        this.saving.set(false);
      }
    });
  }

  // --- DETALLES ---

  verDetalleItem(item: BitacoraItem) {
    this.itemSeleccionado.set(item);
    this.showModalDetalle.set(true);
  }

  // --- OBJETIVO (Tu lógica existente) ---
  startEditObjetivo() { this.tempObjetivo = this.auditoria()?.objetivo || ''; this.isEditingObjetivo.set(true); }
  cancelEditObjetivo() { this.isEditingObjetivo.set(false); }
  
  saveObjetivo() {
    const current = this.auditoria();
    if (!current) return;
    this.saving.set(true);
    this.api.patch<Auditoria>(`/api/auditor/auditorias/${current.id_auditoria}/objetivo`, { objetivo: this.tempObjetivo })
      .subscribe({
        next: (updated) => {
          this.auditoria.update(prev => ({ ...prev!, objetivo: updated.objetivo }));
          this.isEditingObjetivo.set(false);
          this.saving.set(false);
        },
        error: () => this.saving.set(false)
      });
  }

  // Helpers visuales
  getModuloNombre(id: number) { const n:any={1:'Agua',2:'Residuos',3:'Energía'}; return n[id]||id; }
  getEstadoNombre(id: number) { const n:any={1:'CREADA',2:'EN PROCESO',3:'FINALIZADA'}; return n[id]||''; }
}