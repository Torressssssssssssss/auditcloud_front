import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule
  ],
  templateUrl: './perfil.component.html',
  styleUrl: './perfil.component.css'
})
export class PerfilComponent implements OnInit {
  passwordForm: FormGroup;
  errorMessage = signal<string>('');
  successMessage = signal<string>('');
  showConfirm = signal<boolean>(false);

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    private fb: FormBuilder
  ) {
    this.passwordForm = this.fb.group({
      actual: ['', Validators.required],
      nueva: ['', [Validators.required, Validators.minLength(6)]],
      confirmar: ['', Validators.required]
    }, { validators: this.passwordMatchValidator });
  }

  ngOnInit(): void {}

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
          this.successMessage.set('Contraseña cambiada exitosamente');
          this.errorMessage.set('');
          this.passwordForm.reset();
          setTimeout(() => this.successMessage.set(''), 3000);
        },
        error: (error) => {
          this.errorMessage.set('Error al cambiar la contraseña. Verifica tu contraseña actual.');
          this.successMessage.set('');
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
