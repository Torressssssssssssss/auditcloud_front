import { finalize } from 'rxjs';
import { ConsumoAmbiental } from '../../../models/evidencia.model';
import { ConsumoAmbientalComponent } from '../../../shared/components/consumo-ambiental/consumo-ambiental.component';
import { Component, ElementRef, OnInit, ViewChild, signal, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { ApiService } from '../../../services/api.service';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { Auditoria } from '../../../models/auditoria.model';
import { IconComponent } from '../../../shared/components/icon/icon.component'; // Asegúrate de tener iconos
import { FileService } from '../../../services/file.service';
import { descripcionEvidencia } from '../../evidencias/consumo.validators';

// Interfaz para la tabla unificada
interface BitacoraItem
{
  consumo?: ConsumoAmbiental | null;
  id: string;
  tipo: 'EVIDENCIA' | 'COMENTARIO' | 'AUDITORIA' | 'PAGO' | 'ASIGNACION' | 'MODULO' | 'REPORTE';
  subtipo?: string;
  descripcion: string;
  url?: string;
  nombre_archivo?: string;
  autor: string;
  fecha: string;
}

@Component({
  selector: 'app-auditor-auditoria-detalle',
  standalone: true,
  imports: [
    ConsumoAmbientalComponent,
    CommonModule,
    DatePipe,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
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
  private fb = inject(FormBuilder);
  private fileService = inject(FileService);
  private route = inject(ActivatedRoute);
  public router = inject(Router);

  descargandoReporte = signal(false);
  errorReporte = signal<string | null>(null);

  loading = signal<boolean>(true);
  saving = signal<boolean>(false);
  auditoria = signal<Auditoria | null>(null);
  
  // Bitácora
  bitacora = signal<BitacoraItem[]>([]);
  loadingBitacora = signal<boolean>(false);

  // Control de Modales
  showModalComentario = signal<boolean>(false);
  showModalDetalle = signal<boolean>(false);
  showModalEvidencia = signal(false);
  subiendoEvidencia = signal(false);
  errorEvidencia = signal('');
  errorArchivoEvidencia = signal('');
  mensajeEvidencia = signal('');
  evidenciaForm = this.fb.group({
    id_modulo: ['', Validators.required],
    tipo: ['FOTO', Validators.required],
    descripcion: ['', descripcionEvidencia],
  });
  archivoSeleccionado: File | null = null;
  @ViewChild('archivoEvidencia') archivoEvidencia?: ElementRef<HTMLInputElement>;
  
  // Datos para modales
  nuevoComentario = '';
  itemSeleccionado = signal<BitacoraItem | null>(null);

  // Control edición objetivo
  isEditingObjetivo = signal<boolean>(false);
  tempObjetivo: string = '';
  avisoInmutabilidad = signal('');

  get soloLectura(): boolean
  {
    return this.auditoria()?.id_estado === 3;
  }

  private detectarCierre(error: HttpErrorResponse): void
  {
    this.avisoInmutabilidad.set(error.error?.message || 'No se pudo guardar el cambio.');
    if (error.error?.code === 'AUDITORIA_FINALIZADA')
    {
      this.auditoria.update(actual => actual ? { ...actual, id_estado: 3 } : actual);
      this.isEditingObjetivo.set(false);
      this.showModalComentario.set(false);
      this.showModalEvidencia.set(false);
    }
  }

  descargarReporte(): void
  {
    const idAuditoria = this.auditoria()?.id_auditoria;
    if (!idAuditoria || this.descargandoReporte())
    {
      return;
    }

    this.descargandoReporte.set(true);
    this.errorReporte.set(null);

    this.api.generarReporte(idAuditoria)
      .pipe(finalize(() => this.descargandoReporte.set(false)))
      .subscribe(
      {
        next: (archivo) =>
        {
          const url = window.URL.createObjectURL(archivo);
          const enlace = document.createElement('a');
          enlace.href = url;
          enlace.download = 'reporte.pdf';
          document.body.appendChild(enlace);
          enlace.click();
          enlace.remove();
          window.setTimeout(() => window.URL.revokeObjectURL(url), 1000);
        },
        error: (error: HttpErrorResponse) =>
        {
          this.errorReporte.set(error.error?.message || 'No se pudo descargar el reporte. Inténtalo nuevamente.');
        }
      });
  }

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

  abrirModalEvidencia(): void {
    const auditoria = this.auditoria();
    if (!auditoria || this.soloLectura || !auditoria.modulos?.length) return;
    this.evidenciaForm.reset({ id_modulo: '', tipo: 'FOTO', descripcion: '' });
    this.archivoSeleccionado = null;
    this.errorEvidencia.set('');
    this.errorArchivoEvidencia.set('');
    this.mensajeEvidencia.set('');
    this.showModalEvidencia.set(true);
  }

  cerrarModalEvidencia(): void {
    if (this.subiendoEvidencia()) return;
    this.showModalEvidencia.set(false);
    this.limpiarArchivoEvidencia();
  }

  limpiarArchivoEvidencia(): void {
    this.archivoSeleccionado = null;
    this.errorArchivoEvidencia.set('');
    if (this.archivoEvidencia) this.archivoEvidencia.nativeElement.value = '';
  }

  seleccionarArchivoEvidencia(event: Event): void {
    const archivo = (event.target as HTMLInputElement).files?.[0];
    this.archivoSeleccionado = null;
    this.errorArchivoEvidencia.set('');
    if (!archivo) return;
    if (archivo.size > 5 * 1024 * 1024) {
      this.errorArchivoEvidencia.set('El archivo supera el máximo de 5 MB.');
      (event.target as HTMLInputElement).value = '';
      return;
    }
    const tipo = this.evidenciaForm.get('tipo')?.value;
    const formatos = tipo === 'DOC' ? ['application/pdf'] : ['image/jpeg', 'image/png'];
    if (!formatos.includes(archivo.type)) {
      this.errorArchivoEvidencia.set(tipo === 'DOC' ? 'Selecciona un archivo PDF.' : 'Selecciona una imagen JPG o PNG.');
      (event.target as HTMLInputElement).value = '';
      return;
    }
    this.archivoSeleccionado = archivo;
  }

  guardarEvidencia(): void {
    const auditoria = this.auditoria();
    if (!auditoria || this.soloLectura || this.subiendoEvidencia()) return;
    this.errorEvidencia.set('');
    this.errorArchivoEvidencia.set('');
    if (this.evidenciaForm.invalid) {
      this.evidenciaForm.markAllAsTouched();
      return;
    }
    const idModulo = Number(this.evidenciaForm.get('id_modulo')?.value);
    if (!auditoria.modulos?.includes(idModulo)) {
      this.errorEvidencia.set('Selecciona un módulo asignado a esta auditoría.');
      return;
    }
    if (!this.archivoSeleccionado) {
      this.errorArchivoEvidencia.set('Selecciona un archivo para la evidencia.');
      return;
    }

    const datos = new FormData();
    datos.append('id_auditoria', String(auditoria.id_auditoria));
    datos.append('id_modulo', String(idModulo));
    datos.append('tipo', this.evidenciaForm.get('tipo')!.value!);
    datos.append('descripcion', this.evidenciaForm.get('descripcion')!.value!.trim());
    datos.append('archivo', this.archivoSeleccionado);

    this.subiendoEvidencia.set(true);
    this.api.subirEvidencia(datos)
      .pipe(finalize(() => this.subiendoEvidencia.set(false)))
      .subscribe({
        next: () => {
          this.showModalEvidencia.set(false);
          this.archivoSeleccionado = null;
          this.mensajeEvidencia.set('Evidencia registrada correctamente.');
          this.loadBitacora(auditoria.id_auditoria);
        },
        error: (error: HttpErrorResponse) => {
          if (error.error?.code === 'AUDITORIA_FINALIZADA') this.detectarCierre(error);
          this.errorEvidencia.set(error.error?.message || 'No se pudo guardar la evidencia. Inténtalo de nuevo.');
        }
      });
  }

  // --- COMENTARIOS ---

  abrirModalComentario() {
    if (this.soloLectura) return;
    this.nuevoComentario = '';
    this.showModalComentario.set(true);
  }

  guardarComentario() {
    if (this.soloLectura) return;
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
        this.detectarCierre(err);
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
  verArchivo(item: BitacoraItem): void {
    this.fileService.open(item.url, item.nombre_archivo);
  }


  // --- OBJETIVO (Tu lógica existente) ---
  startEditObjetivo()
  {
    if (this.soloLectura) return;
    this.tempObjetivo = this.auditoria()?.objetivo || '';
    this.isEditingObjetivo.set(true);
  }
  cancelEditObjetivo() { this.isEditingObjetivo.set(false); }
  
  saveObjetivo() {
    const current = this.auditoria();
    if (!current || this.soloLectura) return;
    this.saving.set(true);
    this.api.patch<Auditoria>(`/api/auditor/auditorias/${current.id_auditoria}/objetivo`, { objetivo: this.tempObjetivo })
      .subscribe({
        next: (updated) => {
          this.auditoria.update(prev => ({ ...prev!, objetivo: updated.objetivo }));
          this.isEditingObjetivo.set(false);
          this.saving.set(false);
        },
        error: (error) =>
        {
          this.detectarCierre(error);
          this.saving.set(false);
        }
      });
  }

  // Helpers visuales
  getModuloNombre(id: number) { const n:any={1:'Agua',2:'Residuos',3:'Energía'}; return n[id]||id; }
  getEstadoNombre(id: number) { const n:any={1:'CREADA',2:'EN PROCESO',3:'FINALIZADA'}; return n[id]||''; }
}
