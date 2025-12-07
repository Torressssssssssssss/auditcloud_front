import { Component, OnInit, signal, inject, ViewChild, ElementRef } from '@angular/core';
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
  styleUrls: ['./evidencias.component.css']
})
export class EvidenciasComponent implements OnInit {
  private http = inject(HttpClient);
  private apiService = inject(ApiService);
  private authService = inject(AuthService);
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);

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
      id_auditoria: ['', Validators.required],
      id_modulo: ['', Validators.required],
      tipo: ['FOTO', Validators.required],
      descripcion: ['', [Validators.required, Validators.minLength(5)]]
    });
  }

  ngOnInit(): void {
    this.loadAuditorias();
    
    // Si viene parámetro en URL (desde detalle auditoría)
    this.route.queryParams.subscribe(params => {
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

  onFileSelect(event: any): void {
    const file = event.target.files[0];
    if (file) {
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

  onSubmit(): void {
    if (this.evidenciaForm.invalid) {
      this.evidenciaForm.markAllAsTouched();
      return;
    }

    const tipo = this.evidenciaForm.get('tipo')?.value;

    // Validación manual de archivo (solo si NO es comentario)
    if (tipo !== 'COMENTARIO' && !this.selectedFile) {
      alert('Para este tipo de evidencia debes subir un archivo.');
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
    formData.append('descripcion', this.evidenciaForm.get('descripcion')?.value);

    const token = localStorage.getItem('auditcloud_token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    this.http.post('http://localhost:3000/api/auditor/evidencias', formData, { headers })
      .subscribe({
        next: () => {
          alert('Registrado correctamente');
          this.loadEvidencias();
          this.resetFormulario();
          this.enviando.set(false);
        },
        error: (err) => {
          console.error('Error:', err);
          alert(err.error?.message || 'Error al guardar');
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
      id_auditoria: currentAudit || '' 
    });
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

  onAuditoriaChange(event: Event): void {
    const val = (event.target as HTMLSelectElement).value;
    this.filtroAuditoria.set(val ? +val : null);
  }

  onModuloChange(event: Event): void {
    const val = (event.target as HTMLSelectElement).value;
    this.filtroModulo.set(val ? +val : null);
  }
}