import { Component, OnInit, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { Evidencia } from '../../models/evidencia.model';
import { Auditoria } from '../../models/auditoria.model';
import { ModuloAmbiental } from '../../models/usuario.model';

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
  loading = signal<boolean>(true);
  evidencias = signal<Evidencia[]>([]);
  auditorias = signal<Auditoria[]>([]);
  showForm = signal<boolean>(false);
  evidenciaForm: FormGroup;
  filtroAuditoria = signal<number | null>(null);
  filtroModulo = signal<number | null>(null);

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    private fb: FormBuilder
  ) {
    this.evidenciaForm = this.fb.group({
      id_auditoria: ['', Validators.required],
      id_modulo: ['', Validators.required],
      tipo: ['FOTO', Validators.required],
      descripcion: ['', Validators.required],
      url: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadAuditorias();
    this.loadEvidencias();
  }

  loadAuditorias(): void {
    const idAuditor = this.authService.getIdUsuario();
    if (!idAuditor) return;

    this.apiService.get<Auditoria[]>(`/api/auditor/auditorias-asignadas/${idAuditor}`)
      .subscribe({
        next: (auditorias) => {
          this.auditorias.set(auditorias);
        },
        error: (error) => {
          console.error('Error cargando auditorías:', error);
        }
      });
  }

  loadEvidencias(): void {
    this.loading.set(true);
    const idAuditor = this.authService.getIdUsuario();
    
    if (!idAuditor) {
      this.loading.set(false);
      return;
    }

    // Nota: Ajustar endpoint según tu backend
    this.apiService.get<any>(`/api/auditor/evidencias?auditor=${idAuditor}`)
      .subscribe({
        next: (response) => {
          const evidencias = Array.isArray(response) ? response : (response?.data || []);
          this.evidencias.set(evidencias);
          this.loading.set(false);
        },
        error: (error) => {
          console.error('Error cargando evidencias:', error);
          this.loading.set(false);
        }
      });
  }

  onSubmit(): void {
    if (this.evidenciaForm.invalid) return;

    const idAuditor = this.authService.getIdUsuario();
    if (!idAuditor) return;

    const formData = {
      ...this.evidenciaForm.value,
      id_auditor: idAuditor,
      id_auditoria: +this.evidenciaForm.value.id_auditoria,
      id_modulo: +this.evidenciaForm.value.id_modulo
    };

    this.apiService.post<Evidencia>('/api/auditor/evidencias', formData)
      .subscribe({
        next: () => {
          this.loadEvidencias();
          this.showForm.set(false);
          this.evidenciaForm.reset();
        },
        error: (error) => {
          console.error('Error creando evidencia:', error);
        }
      });
  }

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

  get id_auditoria() { return this.evidenciaForm.get('id_auditoria'); }
  get id_modulo() { return this.evidenciaForm.get('id_modulo'); }
  get tipo() { return this.evidenciaForm.get('tipo'); }
  get descripcion() { return this.evidenciaForm.get('descripcion'); }
  get url() { return this.evidenciaForm.get('url'); }

  onAuditoriaChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.filtroAuditoria.set(target.value ? +target.value : null);
  }

  onModuloChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.filtroModulo.set(target.value ? +target.value : null);
  }
}
