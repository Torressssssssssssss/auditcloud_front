import { Component, OnInit, signal, inject, ViewChild, ElementRef } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms'; // 👈 Importante
import { HttpClient, HttpHeaders } from '@angular/common/http'; // 👈 Importante
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { Auditoria } from '../../models/auditoria.model';

interface Reporte {
  id_reporte: number;
  id_auditoria: number;
  nombre: string;
  nombre_archivo?: string;
  fecha_creacion: string;
  url?: string;
  nombre_cliente?: string; // Dato enriquecido
}

@Component({
  selector: 'app-reportes',
  standalone: true,
  imports: [
    CommonModule,
    DatePipe,
    RouterModule,
    ReactiveFormsModule, // 👈 Necesario para el form
    LoadingSpinnerComponent,
    EmptyStateComponent,
    IconComponent
  ],
  templateUrl: './reportes.component.html',
  styleUrl: './reportes.component.css'
})
export class ReportesComponent implements OnInit {
  // Inyecciones
  private apiService = inject(ApiService);
  private authService = inject(AuthService);
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);

  // Señales
  loading = signal<boolean>(true);
  enviando = signal<boolean>(false);
  reportes = signal<Reporte[]>([]);
  
  // Lista de auditorías para el "Select" del formulario
  auditoriasPendientes = signal<Auditoria[]>([]); 
  
  // Filtros
  filtroAuditoria = signal<number | null>(null);

  // Formulario
  showForm = signal<boolean>(false);
  reporteForm: FormGroup;
  selectedFile: File | null = null;

  @ViewChild('fileInput') fileInput!: ElementRef;

  constructor() {
    this.reporteForm = this.fb.group({
      id_auditoria: ['', Validators.required],
      nombre: ['Reporte Final de Auditoría', Validators.required]
    });
  }

  ngOnInit(): void {
    this.cargarDatos();
    
    // Si viene una auditoría pre-seleccionada por URL
    this.route.queryParams.subscribe(params => {
      if (params['auditoria']) {
        const id = +params['auditoria'];
        this.filtroAuditoria.set(id);
        this.reporteForm.patchValue({ id_auditoria: id });
        this.showForm.set(true); // Abrir formulario automáticamente
      }
    });
  }

  cargarDatos() {
    this.loading.set(true);
    const idAuditor = this.authService.getIdUsuario();

    if (!idAuditor) return;

    // 1. Cargar Reportes Existentes
    this.apiService.get<any[]>('/api/auditor/reportes').subscribe({
      next: (data) => {
        this.reportes.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });

    // 2. Cargar Auditorías Asignadas (Para llenar el Select)
    this.apiService.get<Auditoria[]>(`/api/auditor/auditorias-asignadas/${idAuditor}`)
      .subscribe({
        next: (data) => {
          // Opcional: Filtrar solo las que NO están finalizadas (estado != 3)
          // para evitar subir doble reporte final.
          this.auditoriasPendientes.set(data);
        }
      });
  }

  // Selección de Archivo
  onFileSelect(event: any): void {
    const file = event.target.files[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        alert('Solo se permiten archivos PDF');
        this.limpiarArchivo();
        return;
      }
      this.selectedFile = file;
    }
  }

  limpiarArchivo() {
    this.selectedFile = null;
    if (this.fileInput) this.fileInput.nativeElement.value = '';
  }

  // Envío del Formulario
  onSubmit() {
    if (this.reporteForm.invalid || !this.selectedFile) return;

    if (!confirm('Al subir este reporte, la auditoría se marcará como FINALIZADA. ¿Continuar?')) {
      return;
    }

    this.enviando.set(true);
    const formData = new FormData();
    formData.append('archivo', this.selectedFile);
    formData.append('id_auditoria', this.reporteForm.get('id_auditoria')?.value);
    formData.append('nombre', this.reporteForm.get('nombre')?.value);

    const token = localStorage.getItem('auditcloud_token');
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });

    this.http.post('http://localhost:3000/api/auditor/reportes', formData, { headers })
      .subscribe({
        next: () => {
          alert('Reporte subido y auditoría finalizada.');
          this.enviando.set(false);
          this.showForm.set(false);
          this.reporteForm.reset({ nombre: 'Reporte Final' });
          this.limpiarArchivo();
          this.cargarDatos(); // Recargar tabla
        },
        error: (err) => {
          console.error(err);
          alert('Error al subir reporte');
          this.enviando.set(false);
        }
      });
  }

  get reportesFiltrados(): Reporte[] {
    let result = this.reportes();
    if (this.filtroAuditoria()) {
      result = result.filter(r => r.id_auditoria === this.filtroAuditoria());
    }
    return result;
  }

  descargarReporte(url: string | undefined): void {
    if (url) window.open(url, '_blank');
  }

  onAuditoriaChange(event: Event): void {
    const val = (event.target as HTMLSelectElement).value;
    this.filtroAuditoria.set(val ? +val : null);
  }
}