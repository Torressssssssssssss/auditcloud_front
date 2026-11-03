import { Component, DestroyRef, OnInit, signal, inject, ViewChild, ElementRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule, DatePipe } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { Evidencia } from '../../models/evidencia.model';
import { Auditoria } from '../../models/auditoria.model';
import { ActivatedRoute } from '@angular/router';
import { environment } from '../../../environments/environment';
import { FileService } from '../../services/file.service';
import { CANTIDAD_CONSUMO, UNIDADES_RECURSO, consumoCoherente, descripcionEvidencia, fechaReal } from './consumo.validators';

@Component({
  selector: 'app-auditor-evidencia',
  standalone: true,
  imports: [
    CommonModule,
    DatePipe,
    ReactiveFormsModule,
    LoadingSpinnerComponent,
    EmptyStateComponent
  ],
  templateUrl: './evidencias.component.html',
  styleUrls: ["./evidencias.component.css"]
})
export class EvidenciasComponent implements OnInit {
  private http = inject(HttpClient);
  private apiService = inject(ApiService);
  private authService = inject(AuthService);
  private fileService = inject(FileService);
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private destroyRef = inject(DestroyRef);

  readonly recursos = Object.keys(UNIDADES_RECURSO);
  errorFormulario = signal('');
  errorArchivo = signal('');
  mensajeExito = signal('');
  evidenciaEnEdicion = signal<Evidencia | null>(null);
  descripcionEdicion = signal('');
  guardandoCambio = signal(false);

  loading = signal<boolean>(true);
  enviando = signal<boolean>(false);
  evidencias = signal<Evidencia[]>([]);
  auditorias = signal<Auditoria[]>([]);
  
  showForm = signal<boolean>(false);
  
  filtroAuditoria = signal<number | null>(null);
  filtroModulo = signal<number | null>(null);

  evidenciaForm: FormGroup;
  selectedFile: File | null = null;
  
  @ViewChild('fileInput') fileInput!: ElementRef; 

  constructor() {
    this.evidenciaForm = this.fb.group({
      id_auditoria: ['', [Validators.required, Validators.pattern(/^[1-9]\d*$/)]],
      id_modulo: ['', [Validators.required, Validators.pattern(/^[1-9]\d*$/)]],
      tipo: ['FOTO', Validators.required],
      descripcion: ['', descripcionEvidencia],
      es_consumo: [false],
      consumo: this.fb.group({
        tipo_recurso: ['', Validators.required],
        cantidad: ['', [Validators.required, Validators.pattern(CANTIDAD_CONSUMO)]],
        unidad_medida: ['', Validators.required],
        fecha_inicio: ['', [Validators.required, fechaReal]],
        fecha_fin: ['', [Validators.required, fechaReal]],
      }, { validators: consumoCoherente }),
    });
    this.consumoForm.disable({ emitEvent: false });
    this.evidenciaForm.get('es_consumo')!.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef)).subscribe((enabled: boolean) => {
        // Activar/desactivar emite valores de los hijos por defecto. Evitar que
        // esos eventos borren la unidad o reactiven validadores durante el cambio.
        if (enabled) this.consumoForm.enable({ emitEvent: false });
        else this.consumoForm.disable({ emitEvent: false });
        this.errorFormulario.set('');
      });
    this.consumoForm.get('tipo_recurso')!.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
        this.consumoForm.get('unidad_medida')!.setValue('');
      });
  }

  ngOnInit(): void {
    this.loadAuditorias();
    
    // Si viene parámetro en URL (desde detalle auditoría)
    this.route.queryParams.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
      if (params['auditoria']) {
        const id = +params['auditoria'];
        this.filtroAuditoria.set(id);
        // Pre-llenar el formulario
        this.evidenciaForm.patchValue({ id_auditoria: id });
        this.showForm.set(true);
      }
    });

    this.loadEvidencias();
  }

  loadAuditorias(): void {
    const idAuditor = this.authService.getIdUsuario();
    if (!idAuditor) return;

    this.apiService.get<Auditoria[]>(`/api/auditor/auditorias-asignadas/${idAuditor}`)
      .subscribe({
        next: (auditorias) => this.auditorias.set(auditorias),
        error: (error) => console.error('Error cargando auditorías:', error)
      });
  }

  loadEvidencias(): void {
    this.loading.set(true);
    const idAuditor = this.authService.getIdUsuario();
    
    if (!idAuditor) {
      this.loading.set(false);
      return;
    }

    // 0 para traer todas las del auditor
    this.apiService.get<any>(`/api/auditor/evidencias/0`) 
      .subscribe({
        next: (response) => {
          const data = Array.isArray(response) ? response : (response?.data || []);
          this.evidencias.set(data);
          this.loading.set(false);
        },
        error: (error) => {
          console.error('Error cargando evidencias:', error);
          this.loading.set(false);
        }
      });
  }

  onFileSelect(event: Event): void {
    this.errorArchivo.set('');
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        this.errorArchivo.set('El archivo supera el máximo de 5 MB.');
        this.limpiarArchivo();
        return;
      }
      if (!['image/jpeg', 'image/png', 'application/pdf'].includes(file.type)) {
        this.errorArchivo.set('Selecciona un archivo JPG, PNG o PDF.');
        this.limpiarArchivo();
        return;
      }
      this.selectedFile = file;
    }
  }

  limpiarArchivo(): void {
    this.selectedFile = null;
    if (this.fileInput) {
      this.fileInput.nativeElement.value = '';
    }
  }

  onSubmit(): void {
    if (this.enviando()) return;
    this.errorFormulario.set('');
    this.mensajeExito.set('');
    const seleccionada = this.auditorias().find(auditoria => auditoria.id_auditoria === Number(this.id_auditoria?.value));
    if (!seleccionada || seleccionada.id_estado === 3)
    {
      this.errorFormulario.set(seleccionada ? 'La auditoría está FINALIZADA y es de solo lectura.' : 'Selecciona una auditoría disponible.');
      return;
    }
    if (this.evidenciaForm.invalid) {
      this.evidenciaForm.markAllAsTouched();
      return;
    }

    const tipo = this.evidenciaForm.get('tipo')?.value;

    // Validación manual de archivo (solo si NO es comentario)
    if (tipo !== 'COMENTARIO' && !this.selectedFile) {
      this.errorArchivo.set('Selecciona un archivo o elige Comentario / Nota.');
      return;
    }

    this.enviando.set(true);

    const formData = new FormData();
    if (this.selectedFile && tipo !== 'COMENTARIO') {
      formData.append('archivo', this.selectedFile);
    }
    
    formData.append('id_auditoria', this.evidenciaForm.get('id_auditoria')?.value);
    formData.append('id_modulo', this.evidenciaForm.get('id_modulo')?.value);
    formData.append('tipo', tipo);
    formData.append('descripcion', this.evidenciaForm.get('descripcion')!.value.trim());
    const esConsumo = this.evidenciaForm.get('es_consumo')!.value === true;
    formData.append('es_consumo', String(esConsumo));
    if (esConsumo) {
      for (const [field, value] of Object.entries(this.consumoForm.getRawValue())) {
        formData.append(field, String(value));
      }
    }

    const token = localStorage.getItem('auditcloud_token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    this.http.post(environment.apiUrl + '/api/auditor/evidencias', formData, { headers })
      .subscribe({
        next: () => {
          this.mensajeExito.set('Evidencia registrada correctamente.');
          this.loadEvidencias();
          this.resetFormulario();
          this.enviando.set(false);
        },
        error: (err) => {
          if (err.error?.code === 'AUDITORIA_FINALIZADA') this.marcarFinalizada(seleccionada.id_auditoria);
          this.errorFormulario.set(err.error?.message || 'No se pudo guardar. Inténtalo de nuevo.');
          const errors = err.error?.errors as Record<string, string> | undefined;
          for (const [field, message] of Object.entries(errors || {})) {
            const control = this.consumoForm.get(field);
            if (control) {
              control.setErrors({ server: message });
              control.markAsTouched();
            }
          }
          this.enviando.set(false);
        }
      });
  }

  resetFormulario(): void {
    this.showForm.set(false);
    // Mantener la auditoría seleccionada si estamos filtrando
    const currentAudit = this.filtroAuditoria();
    this.evidenciaForm.reset({ 
      tipo: 'FOTO', 
      id_auditoria: currentAudit || '',
      id_modulo: '',
      descripcion: '',
      es_consumo: false,
      consumo: { tipo_recurso: '', cantidad: '', unidad_medida: '', fecha_inicio: '', fecha_fin: '' },
    }, { emitEvent: false });
    this.consumoForm.disable({ emitEvent: false });
    this.errorFormulario.set('');
    this.errorArchivo.set('');
    this.limpiarArchivo();
  }

  // Getters y Helpers
  get evidenciasFiltradas(): Evidencia[] {
    let result = this.evidencias();
    if (this.filtroAuditoria()) {
      result = result.filter(e => e.id_auditoria === this.filtroAuditoria());
    }
    if (this.filtroModulo()) {
      result = result.filter(e => e.id_modulo === this.filtroModulo());
    }
    return result;
  }

  getModuloNombre(id: number): string {
    const nombres: Record<number, string> = { 1: 'Agua', 2: 'Residuos', 3: 'Energía' };
    return nombres[id] || id.toString();
  }

  // Getters para el HTML
  get id_auditoria() { return this.evidenciaForm.get('id_auditoria'); }
  get id_modulo() { return this.evidenciaForm.get('id_modulo'); }
  get tipo() { return this.evidenciaForm.get('tipo'); }
  get descripcion() { return this.evidenciaForm.get('descripcion'); }
  get auditoriaFinalizada(): boolean
  {
    return this.auditorias().find(auditoria => auditoria.id_auditoria === Number(this.id_auditoria?.value))?.id_estado === 3;
  }

  get hayAuditoriasEditables(): boolean
  {
    return this.auditorias().some(auditoria => auditoria.id_estado !== 3);
  }

  puedeModificarEvidencia(evidencia: Evidencia): boolean
  {
    const auditoria = this.auditorias().find(elemento => elemento.id_auditoria === evidencia.id_auditoria);
    return !!auditoria && auditoria.id_estado !== 3 && evidencia.id_auditor === this.authService.getIdUsuario();
  }

  private marcarFinalizada(idAuditoria: number): void
  {
    this.auditorias.update(lista => lista.map(auditoria => auditoria.id_auditoria === idAuditoria
      ? { ...auditoria, id_estado: 3 } : auditoria));
  }

  editarEvidencia(evidencia: Evidencia): void
  {
    if (!this.puedeModificarEvidencia(evidencia)) return;
    this.evidenciaEnEdicion.set(evidencia);
    this.descripcionEdicion.set(evidencia.descripcion);
    this.errorFormulario.set('');
  }

  guardarEdicion(): void
  {
    const evidencia = this.evidenciaEnEdicion();
    const descripcion = this.descripcionEdicion().trim();
    if (!evidencia || !this.puedeModificarEvidencia(evidencia) || this.guardandoCambio()) return;
    if (descripcion.length < 5 || descripcion.length > 5000)
    {
      this.errorFormulario.set('Escribe una descripción de 5 a 5000 caracteres.');
      return;
    }
    this.guardandoCambio.set(true);
    this.apiService.put(`/api/auditor/evidencias/${evidencia.id_evidencia}`, { descripcion }).subscribe({
      next: () =>
      {
        this.guardandoCambio.set(false);
        this.evidenciaEnEdicion.set(null);
        this.loadEvidencias();
        this.mensajeExito.set('Evidencia actualizada.');
      },
      error: (error) =>
      {
        this.guardandoCambio.set(false);
        if (error.error?.code === 'AUDITORIA_FINALIZADA') this.marcarFinalizada(evidencia.id_auditoria);
        this.errorFormulario.set(error.error?.message || 'No se pudo editar la evidencia.');
      },
    });
  }

  eliminarEvidencia(evidencia: Evidencia): void
  {
    if (!this.puedeModificarEvidencia(evidencia) || this.guardandoCambio()) return;
    if (!window.confirm('¿Eliminar esta evidencia y su consumo asociado?')) return;
    this.guardandoCambio.set(true);
    this.apiService.delete(`/api/auditor/evidencias/${evidencia.id_evidencia}`).subscribe({
      next: () =>
      {
        this.guardandoCambio.set(false);
        this.evidenciaEnEdicion.set(null);
        this.loadEvidencias();
        this.mensajeExito.set('Evidencia eliminada.');
      },
      error: (error) =>
      {
        this.guardandoCambio.set(false);
        if (error.error?.code === 'AUDITORIA_FINALIZADA') this.marcarFinalizada(evidencia.id_auditoria);
        this.errorFormulario.set(error.error?.message || 'No se pudo eliminar la evidencia.');
      },
    });
  }

  cambiarDescripcion(evento: Event): void
  {
    this.descripcionEdicion.set((evento.target as HTMLTextAreaElement).value);
  }
  get consumoForm(): FormGroup { return this.evidenciaForm.get('consumo') as FormGroup; }
  get unidadesDisponibles(): readonly string[] {
    const recurso: unknown = this.consumoForm.get('tipo_recurso')!.value;
    return typeof recurso === 'string' && Object.hasOwn(UNIDADES_RECURSO, recurso)
      ? UNIDADES_RECURSO[recurso]! : [];
  }

  consumoInvalido(field: string): boolean {
    const control = this.consumoForm.get(field);
    return !!control?.invalid && control.touched;
  }

  nombreUnidad(unidad: string): string {
    const labels: Record<string, string> = {
      L: 'L (litros)', m3: 'm³ (metros cúbicos)', kWh: 'kWh', MWh: 'MWh',
      kg: 'kg (kilogramos)', t: 't (toneladas)',
      kgCO2e: 'kg CO₂e', tCO2e: 't CO₂e',
    };
    return labels[unidad] || unidad;
  }

  onAuditoriaChange(event: Event): void {
    const val = (event.target as HTMLSelectElement).value;
    this.filtroAuditoria.set(val ? +val : null);
  }

  onModuloChange(event: Event): void {
    const val = (event.target as HTMLSelectElement).value;
    this.filtroModulo.set(val ? +val : null);
  }

  verArchivo(evidencia: Evidencia): void {
    this.fileService.open(evidencia.url, evidencia.nombre_archivo);
  }

  descargarArchivo(evidencia: Evidencia): void {
    this.fileService.download(evidencia.url, evidencia.nombre_archivo);
  }
}
