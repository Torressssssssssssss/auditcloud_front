import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-cliente-perfil',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule
  ],
  templateUrl: './perfil.component.html',
  styleUrl: './perfil.component.css'
})
export class PerfilComponent implements OnInit {
  formularioEmpresa: FormGroup;
  mensajeEmpresa = '';
  guardandoEmpresa = false;
  passwordForm: FormGroup;
  errorMessage = '';
  successMessage = '';

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    private fb: FormBuilder
  ) {
    this.formularioEmpresa = this.fb.group(
    {
      nombre: ['', [Validators.required, Validators.maxLength(160)]],
      ciudad: ['', [Validators.required, Validators.maxLength(120)]],
      estado: ['', [Validators.required, Validators.maxLength(120)]],
      rfc: ['', Validators.maxLength(20)]
    });
    this.passwordForm = this.fb.group({
      actual: ['', Validators.required],
      nueva: ['', [Validators.required, Validators.minLength(6)]],
      confirmar: ['', Validators.required]
    }, { validators: this.passwordMatchValidator });
  }

  ngOnInit(): void
  {
    this.apiService.get<{ nombre: string; ciudad: string | null; estado: string | null; rfc: string | null }>('/api/cliente/perfil-empresa').subscribe(
    {
      next: (empresa) => this.formularioEmpresa.patchValue(empresa),
      error: () => this.mensajeEmpresa = 'No se pudieron cargar los datos de la empresa.'
    });
  }

  guardarEmpresa(): void
  {
    if(this.formularioEmpresa.invalid || this.guardandoEmpresa)
    {
      this.formularioEmpresa.markAllAsTouched();
      return;
    }
    this.guardandoEmpresa = true;
    this.apiService.put('/api/cliente/perfil-empresa', this.formularioEmpresa.getRawValue()).subscribe(
    {
      next: () =>
      {
        this.guardandoEmpresa = false;
        this.mensajeEmpresa = 'Perfil de empresa actualizado.';
      },
      error: (error) =>
      {
        this.guardandoEmpresa = false;
        this.mensajeEmpresa = error.error?.message || 'No se pudo guardar el perfil.';
      }
    });
  }

  passwordMatchValidator(form: FormGroup) {
    const nueva = form.get('nueva');
    const confirmar = form.get('confirmar');
    if (nueva && confirmar && nueva.value !== confirmar.value) {
      confirmar.setErrors({ passwordMismatch: true });
    }
    return null;
  }

  cambiarPassword(): void {
    if (this.passwordForm.invalid) return;

    const { actual, nueva } = this.passwordForm.value;

    this.apiService.put('/api/auth/cambiar-password', { actual, nueva })
      .subscribe({
        next: () => {
          this.successMessage = 'Contraseña cambiada exitosamente';
          this.errorMessage = '';
          this.passwordForm.reset();
          setTimeout(() => this.successMessage = '', 3000);
        },
        error: (error) => {
          this.errorMessage = 'Error al cambiar la contraseña. Verifica tu contraseña actual.';
          this.successMessage = '';
        }
      });
  }

  get usuario() {
    return this.authService.getUsuarioActual();
  }

  get actual() { return this.passwordForm.get('actual'); }
  get nueva() { return this.passwordForm.get('nueva'); }
  get confirmar() { return this.passwordForm.get('confirmar'); }
}
