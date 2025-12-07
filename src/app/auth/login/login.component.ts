import { Component, signal, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { Rol } from '../../models/usuario.model';

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
  googleClientId = '417831327586-01dvdhj92iao6kgcfpkp20dkiseiv4bq.apps.googleusercontent.com'; // Reemplaza con tu Client ID

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.loginForm = this.fb.group({
      correo: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  ngOnInit(): void {
    // Configurar el callback global de Google
    window.handleGoogleCredential = (response: any) => {
      this.handleGoogleCredentialResponse(response);
    };
  }

  private googleButtonElement: HTMLElement | null = null;

  ngAfterViewInit(): void {
    // Inicializar Google Identity Services cuando el componente esté listo
    const initializeGoogle = () => {
      if (window.google) {
        window.google.accounts.id.initialize({
          client_id: this.googleClientId,
          callback: (response: any) => {
            this.handleGoogleCredentialResponse(response);
          }
        });

        // Crear un contenedor oculto para el botón oficial de Google
        const hiddenContainer = document.createElement('div');
        hiddenContainer.id = 'hidden-google-button';
        hiddenContainer.style.position = 'absolute';
        hiddenContainer.style.left = '-9999px';
        hiddenContainer.style.top = '-9999px';
        hiddenContainer.style.opacity = '0';
        hiddenContainer.style.pointerEvents = 'none';
        document.body.appendChild(hiddenContainer);

        // Renderizar el botón oficial de Google en el contenedor oculto
        window.google.accounts.id.renderButton(hiddenContainer, {
          type: 'standard',
          size: 'large',
          theme: 'outline',
          text: 'signin_with',
          shape: 'rectangular',
          logo_alignment: 'left'
        });

        // Guardar referencia al elemento del botón
        setTimeout(() => {
          this.googleButtonElement = hiddenContainer.querySelector('div[role="button"]') as HTMLElement;
        }, 300);
      } else {
        // Esperar a que el script de Google se cargue
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

    // Intentar hacer clic en el botón oficial de Google
    if (this.googleButtonElement) {
      this.googleButtonElement.click();
    } else {
      // Si el botón no está listo, usar el método prompt
      window.google.accounts.id.prompt((notification: any) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment() || notification.isDismissedMoment()) {
          this.loading.set(false);
          // Intentar renderizar el botón de nuevo
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

  private handleGoogleCredentialResponse(response: any): void {
    if (!response.credential) {
      this.errorMessage.set('Error al obtener credenciales de Google');
      this.loading.set(false);
      return;
    }

    this.loading.set(true);
    this.errorMessage.set('');

    const idToken = response.credential;

    // Enviar el idToken al backend con POST
    this.authService.loginWithGoogle(idToken, Rol.CLIENTE).subscribe({
      next: () => {
        const rol = this.authService.getRol();
        if (rol === Rol.SUPERVISOR) {
          this.router.navigate(['/supervisor/dashboard']);
        } else if (rol === Rol.AUDITOR) {
          this.router.navigate(['/auditor/dashboard']);
        } else if (rol === Rol.CLIENTE) {
          this.router.navigate(['/cliente/dashboard']);
        } else {
          this.router.navigate(['/login']);
        }
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error en login con Google:', error);
        this.errorMessage.set('Error al iniciar sesión con Google. Por favor, intenta de nuevo.');
        this.loading.set(false);
      }
    });
  }

  private redirectByRole(idRol: number): void {
    if (idRol === Rol.SUPERVISOR) {
      this.router.navigate(['/supervisor/dashboard']);
    } else if (idRol === Rol.AUDITOR) {
      this.router.navigate(['/auditor/dashboard']);
    } else if (idRol === Rol.CLIENTE) {
      this.router.navigate(['/cliente/dashboard']);
    } else {
      this.router.navigate(['/login']);
    }
    this.loading.set(false);
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
      next: () => {
        const rol = this.authService.getRol();
        if (rol === Rol.SUPERVISOR) {
          this.router.navigate(['/supervisor/dashboard']);
        } else if (rol === Rol.AUDITOR) {
          this.router.navigate(['/auditor/dashboard']);
        } else if (rol === Rol.CLIENTE) {
          this.router.navigate(['/cliente/dashboard']);
        }
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







