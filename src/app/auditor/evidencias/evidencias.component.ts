import { Component, OnInit, signal, inject, ViewChild, ElementRef } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http'; // 👈 Importamos HttpClient directo
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { Evidencia } from '../../models/evidencia.model';
import { Auditoria } from '../../models/auditoria.model';

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
  styleUrl: './evidencias.component.css'
})
export class EvidenciasComponent implements OnInit {
  // Inyecciones
  private http = inject(HttpClient); // 👈 Usaremos esto para el upload
  private apiService = inject(ApiService);
  private authService = inject(AuthService);
  private fb = inject(FormBuilder);

  // Señales de estado
  loading = signal<boolean>(true);
  enviando = signal<boolean>(false);
  evidencias = signal<Evidencia[]>([]);
  auditorias = signal<Auditoria[]>([]);
  
  // Control visual
  showForm = signal<boolean>(false);
  
  // Filtros
  filtroAuditoria = signal<number | null>(null);
  filtroModulo = signal<number | null>(null);

  // Formulario y Archivos
  evidenciaForm: FormGroup;
  selectedFile: File | null = null;
  
  // Referencia al input file para limpiarlo después
  @ViewChild('fileInput') fileInput!: ElementRef; 

  constructor() {
    this.evidenciaForm = this.fb.group({
      id_auditoria: ['', Validators.required],
      id_modulo: ['', Validators.required],
      tipo: ['FOTO', Validators.required],
      descripcion: ['', [Validators.required, Validators.minLength(5)]]
      // Nota: Ya no usamos 'url' aquí, lo manejamos con selectedFile
    });
  }

  ngOnInit(): void {
    this.loadAuditorias();
    this.loadEvidencias();
  }

  // --- Carga de Datos ---

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

    // Obtenemos todas las evidencias del auditor
    this.apiService.get<any>(`/api/auditor/evidencias/0`) // 0 o endpoint general
      .subscribe({ // Ajusta según tu endpoint real de lista
        next: (response) => {
          // Si tu API filtra por auditoría en lugar de auditor, quizás necesites ajustar esto
          // o iterar sobre las auditorías.
          // Asumiremos que tienes una ruta para ver TODAS tus evidencias o usas el filtro
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

  // --- Manejo de Archivos ---

  onFileSelect(event: any): void {
    const file = event.target.files[0];
    if (file) {
      // Validar tamaño (ej. máx 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('El archivo es demasiado grande (Máx 5MB)');
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

  // --- Envío del Formulario ---

  onSubmit(): void {
    if (this.evidenciaForm.invalid) {
      this.evidenciaForm.markAllAsTouched();
      return;
    }

    if (!this.selectedFile) {
      alert('Por favor selecciona un archivo de evidencia.');
      return;
    }

    this.enviando.set(true);

    // 1. Preparar FormData
    const formData = new FormData();
    formData.append('archivo', this.selectedFile); // Clave 'archivo' coincide con backend multer
    formData.append('id_auditoria', this.evidenciaForm.get('id_auditoria')?.value);
    formData.append('id_modulo', this.evidenciaForm.get('id_modulo')?.value);
    formData.append('tipo', this.evidenciaForm.get('tipo')?.value);
    formData.append('descripcion', this.evidenciaForm.get('descripcion')?.value);

    // 2. Preparar Headers (Solo Auth, NO Content-Type)
    const token = localStorage.getItem('auditcloud_token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
      // IMPORTANTE: No definir Content-Type aquí, Angular lo hace automático para Multipart
    });

    // 3. Enviar directo con HttpClient
    this.http.post('http://localhost:3000/api/auditor/evidencias', formData, { headers })
      .subscribe({
        next: () => {
          alert('Evidencia subida correctamente');
          this.loadEvidencias(); // Recargar tabla
          this.resetFormulario();
          this.enviando.set(false);
        },
        error: (err) => {
          console.error('Error subiendo evidencia:', err);
          alert(err.error?.message || 'Error al subir el archivo');
          this.enviando.set(false);
        }
      });
  }

  resetFormulario(): void {
    this.showForm.set(false);
    this.evidenciaForm.reset({ tipo: 'FOTO' }); // Resetear valores
    this.limpiarArchivo(); // Limpiar input file
  }

  // --- Filtros y Helpers ---

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

  onAuditoriaChange(event: Event): void {
    const val = (event.target as HTMLSelectElement).value;
    this.filtroAuditoria.set(val ? +val : null);
  }

  onModuloChange(event: Event): void {
    const val = (event.target as HTMLSelectElement).value;
    this.filtroModulo.set(val ? +val : null);
  }
}