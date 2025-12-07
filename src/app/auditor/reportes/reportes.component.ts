import { Component, OnInit, signal, inject, ViewChild, ElementRef } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';

@Component({
  selector: 'app-auditor-reportes',
  standalone: true,
  imports: [
    CommonModule,
    DatePipe,
    ReactiveFormsModule,
    LoadingSpinnerComponent,
    EmptyStateComponent,
    IconComponent,
    StatusBadgeComponent
  ],
  templateUrl: './reportes.component.html',
  styleUrls: ['./reportes.component.css']
})
export class ReportesComponent implements OnInit {
  private http = inject(HttpClient);
  private apiService = inject(ApiService);
  private authService = inject(AuthService);
  private fb = inject(FormBuilder);

  loading = signal<boolean>(true);
  enviando = signal<boolean>(false);
  
  reportes = signal<any[]>([]);
  auditoriasPendientes = signal<any[]>([]); // Solo listaremos las que no están finalizadas para subir reporte
  
  showForm = signal<boolean>(false);
  reporteForm: FormGroup;
  selectedFile: File | null = null;

  @ViewChild('fileInput') fileInput!: ElementRef;

  constructor() {
    this.reporteForm = this.fb.group({
      id_auditoria: ['', Validators.required],
      nombre: ['Reporte Final de Auditoría', Validators.required],
      observaciones: ['']
    });
  }

  ngOnInit(): void {
    this.loadData();
  }

  loadData() {
    this.loading.set(true);
    const idAuditor = this.authService.getIdUsuario();

    // 1. Cargar Reportes ya subidos
    this.apiService.get<any[]>('/api/auditor/reportes').subscribe({
      next: (data) => this.reportes.set(data),
      error: (e) => console.error(e)
    });

    // 2. Cargar Auditorías asignadas (Para el select)
    this.apiService.get<any[]>(`/api/auditor/auditorias-asignadas/${idAuditor}`).subscribe({
      next: (data) => {
        // Filtramos: Opcional, si quieres permitir resubir reporte a finalizadas, quita el filter.
        // Aquí mostramos todas, pero visualmente marcaremos las finalizadas.
        this.auditoriasPendientes.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

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
    formData.append('observaciones', this.reporteForm.get('observaciones')?.value);

    const token = localStorage.getItem('auditcloud_token');
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });

    this.http.post('http://localhost:3000/api/auditor/reportes', formData, { headers }).subscribe({
      next: () => {
        alert('Reporte subido y auditoría finalizada con éxito.');
        this.enviando.set(false);
        this.showForm.set(false);
        this.reporteForm.reset({ nombre: 'Reporte Final de Auditoría' });
        this.limpiarArchivo();
        this.loadData(); // Recargar tablas
      },
      error: (err) => {
        console.error(err);
        alert('Error al subir el reporte');
        this.enviando.set(false);
      }
    });
  }
}