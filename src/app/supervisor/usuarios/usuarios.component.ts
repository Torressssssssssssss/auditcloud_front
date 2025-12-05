import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { Usuario } from '../../models/usuario.model';

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    LoadingSpinnerComponent,
    EmptyStateComponent,
    ConfirmDialogComponent
  ],
  templateUrl: './usuarios.component.html',
  styleUrl: './usuarios.component.css'
})
export class UsuariosComponent implements OnInit {
  loading = signal<boolean>(true);
  usuarios = signal<Usuario[]>([]);
  showForm = signal<boolean>(false);
  usuarioForm: FormGroup;
  errorMessage = signal<string>('');
  showConfirm = signal<boolean>(false);
  usuarioToToggle: Usuario | null = null;

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    private fb: FormBuilder
  ) {
    this.usuarioForm = this.fb.group({
      nombre: ['', Validators.required],
      correo: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  ngOnInit(): void {
    this.loadUsuarios();
  }

  loadUsuarios(): void {
    this.loading.set(true);
    const idEmpresa = this.authService.getIdEmpresa();
    
    if (!idEmpresa) {
      this.loading.set(false);
      return;
    }

    this.apiService.get<any>(`/api/supervisor/auditores/${idEmpresa}`, { page: 1, limit: 100 })
      .subscribe({
        next: (response) => {
          const usuarios = Array.isArray(response) ? response : (response?.data || []);
          this.usuarios.set(usuarios);
          this.loading.set(false);
        },
        error: (error) => {
          console.error('Error cargando usuarios:', error);
          this.errorMessage.set('Error al cargar usuarios');
          this.loading.set(false);
        }
      });
  }

  onSubmit(): void {
    if (this.usuarioForm.invalid) {
      return;
    }

    const idEmpresa = this.authService.getIdEmpresa();
    if (!idEmpresa) return;

    const formData = {
      ...this.usuarioForm.value,
      id_empresa: idEmpresa
    };

    this.apiService.post<Usuario>('/api/supervisor/auditores', formData)
      .subscribe({
        next: () => {
          this.loadUsuarios();
          this.showForm.set(false);
          this.usuarioForm.reset();
          this.errorMessage.set('');
        },
        error: (error) => {
          this.errorMessage.set('Error al crear auditor');
          console.error(error);
        }
      });
  }

  toggleActivo(usuario: Usuario): void {
    this.usuarioToToggle = usuario;
    this.showConfirm.set(true);
  }

  confirmToggle(): void {
    if (!this.usuarioToToggle) return;
    
    // Aquí implementarías el toggle de activo según tu backend
    // Por ahora solo recargamos
    this.loadUsuarios();
    this.showConfirm.set(false);
    this.usuarioToToggle = null;
  }

  cancelToggle(): void {
    this.showConfirm.set(false);
    this.usuarioToToggle = null;
  }

  get nombre() { return this.usuarioForm.get('nombre'); }
  get correo() { return this.usuarioForm.get('correo'); }
  get password() { return this.usuarioForm.get('password'); }
}
