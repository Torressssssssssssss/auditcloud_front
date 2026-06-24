import { Component, signal, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { Rol } from '../../models/usuario.model';
import { ApiService } from '../../services/api.service';

declare global {
  interface Window {
    google: any;
    handleGoogleCredential: (response: any) => void;
  }
}

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})

export class LoginComponent implements OnInit, AfterViewInit {
  loginForm: FormGroup;
  errorMessage = signal<string>('');
  loading = signal<boolean>(false);
  googleClientId = '417831327586-01dvdhj92iao6kgcfpkp20dkiseiv4bq.apps.googleusercontent.com';
  showCompanyModal = signal<boolean>(false);
  companyForm: FormGroup;
  completingProfile = signal<boolean>(false);
  demoUsers = [
    { rol: 'Supervisor', correo: 'supervisor@auditcloud.com', password: '123456' },
    { rol: 'Auditor', correo: 'auditor@auditcloud.com', password: '123456' },
    { rol: 'Cliente', correo: 'cliente@auditcloud.com', password: '123456' }
  ];

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private apiService: ApiService
  ) {
    this.loginForm = this.fb.group({
      correo: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });

    this.companyForm = this.fb.group({
      nombre_empresa: ['', [Validators.required, Validators.minLength(2)]],
      ciudad: ['', Validators.required],
      estado: ['', Validators.required],
      rfc: ['']
    });
  }

  ngOnInit(): void {
    window.handleGoogleCredential = (response: any) => {
      this.handleGoogleCredentialResponse(response);
    };
  }

  private googleButtonElement: HTMLElement | null = null;

  ngAfterViewInit(): void {
    const initializeGoogle = () => {
      if (window.google) {
        window.google.accounts.id.initialize({
          client_id: this.googleClientId,
          callback: (response: any) => {
            this.handleGoogleCredentialResponse(response);
          }
        });

        const hiddenContainer = document.createElement('div');
        hiddenContainer.id = 'hidden-google-button';
        hiddenContainer.style.position = 'absolute';
        hiddenContainer.style.left = '-9999px';
        hiddenContainer.style.top = '-9999px';
        hiddenContainer.style.opacity = '0';
        hiddenContainer.style.pointerEvents = 'none';
        document.body.appendChild(hiddenContainer);

        window.google.accounts.id.renderButton(hiddenContainer, {
          type: 'standard',
          size: 'large',
          theme: 'outline',
          text: 'signin_with',
          shape: 'rectangular',
          logo_alignment: 'left'
        });

        setTimeout(() => {
          this.googleButtonElement = hiddenContainer.querySelector('div[role="button"]') as HTMLElement;
        }, 300);
      } else {
        setTimeout(initializeGoogle, 100);
      }
    };
    
    initializeGoogle();
  }

  triggerGoogleSignIn(): void {
    if (!window.google) {
      this.errorMessage.set('Google Identity Services no está disponible. Por favor, recarga la página.');
      return;
    }

    this.loading.set(true);
    this.errorMessage.set('');

    if (this.googleButtonElement) {
      this.googleButtonElement.click();
    } else {
      window.google.accounts.id.prompt((notification: any) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment() || notification.isDismissedMoment()) {
          this.loading.set(false);
          setTimeout(() => {
            const hiddenContainer = document.getElementById('hidden-google-button');
            if (hiddenContainer) {
              const button = hiddenContainer.querySelector('div[role="button"]') as HTMLElement;
              if (button) {
                button.click();
              }
            }
          }, 500);
        }
      });
    }
  }

  submitCompanyDetails() {
    if (this.companyForm.invalid) {
      this.companyForm.markAllAsTouched();
      return;
    }

    this.completingProfile.set(true);
    const formValues = this.companyForm.value;

    this.apiService.post<any>('/api/auth/complete-profile', formValues)
      .subscribe({
        next: (resp: any) => {
          this.completingProfile.set(false);
          this.showCompanyModal.set(false);
          
          const userStr = localStorage.getItem('auditcloud_user');
          if (userStr && resp.id_empresa) {
            const user = JSON.parse(userStr);
            user.id_empresa = resp.id_empresa;
            localStorage.setItem('auditcloud_user', JSON.stringify(user));
          }

          this.router.navigate(['/cliente/dashboard']);
        },
        error: (err) => {
          console.error(err);
          if (err.status === 401) {
             this.errorMessage.set('Sesión expirada. Intenta ingresar nuevamente.');
          } else {
             this.errorMessage.set('Error al guardar datos de la empresa.');
          }
          this.completingProfile.set(false);
        }
      });
  }

  private handleGoogleCredentialResponse(response: any): void {
    if (!response.credential) return;

    this.loading.set(true);
    this.errorMessage.set('');

    this.authService.loginWithGoogle(response.credential, Rol.CLIENTE).subscribe({
      next: (resp: any) => {
        if (resp.require_company_info) {
          this.loading.set(false);
          this.showCompanyModal.set(true); 
        } else {
          const user = resp.usuario || this.authService.getUsuarioActual();
          this.router.navigate([this.authService.getDashboardRoute(user)]);
          this.loading.set(false);
        }
      },
      error: (error) => {
        console.error('Error Google:', error);
        this.errorMessage.set('Error al iniciar sesión con Google.');
        this.loading.set(false);
      }
    });
  }

  usarCredencialesDemo(usuario: { correo: string; password: string }): void {
    this.loginForm.patchValue({
      correo: usuario.correo,
      password: usuario.password
    });
    this.errorMessage.set('');
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.markFormGroupTouched(this.loginForm);
      return;
    }

    this.loading.set(true);
    this.errorMessage.set('');

    const { correo, password } = this.loginForm.value;

    this.authService.login(correo, password).subscribe({
      next: (response) => {
        this.router.navigate([this.authService.getDashboardRoute(response.usuario)]);
      },
      error: (error) => {
        this.errorMessage.set('Correo o contraseña incorrectos');
        this.loading.set(false);
      }
    });
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  get correo() { return this.loginForm.get('correo'); }
  get password() { return this.loginForm.get('password'); }
}







