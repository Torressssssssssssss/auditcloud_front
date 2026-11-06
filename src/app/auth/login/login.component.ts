import { environment } from '../../../environments/environment';
import { Component, signal, AfterViewInit, OnDestroy, ElementRef, ViewChild, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';

interface CredencialGoogle
{
  credential?: string;
}

interface ServiciosIdentidadGoogle
{
  accounts:
  {
    id:
    {
      initialize(configuracion:
      {
        client_id: string;
        callback: (respuesta: CredencialGoogle) => void;
        ux_mode: 'popup';
        auto_select: boolean;
      }): void;
      renderButton(contenedor: HTMLElement, configuracion: Record<string, string | number>): void;
    };
  };
}

declare global
{
  interface Window
  {
    google?: ServiciosIdentidadGoogle;
  }
}

@Component(
{
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent implements AfterViewInit, OnDestroy
{
  readonly accesoGoogleHabilitado = environment.googleSignInEnabled;
  formularioAcceso: FormGroup;
  mensajeError = signal('');
  cargando = signal(false);
  mostrarModalEmpresa = signal(false);
  formularioEmpresa: FormGroup;
  completandoPerfil = signal(false);
  usuariosDemo = [
    { rol: 'Supervisor', correo: 'supervisor@auditcloud.com', password: '123456' },
    { rol: 'Auditor', correo: 'auditor@auditcloud.com', password: '123456' },
    { rol: 'Cliente', correo: 'cliente@auditcloud.com', password: '123456' }
  ];

  @ViewChild('contenedorGoogle') private contenedorGoogle?: ElementRef<HTMLElement>;
  private temporizadorGoogle?: ReturnType<typeof setTimeout>;
  private destruido = false;

  constructor(
    private formularios: FormBuilder,
    private autenticacion: AuthService,
    private enrutador: Router,
    private zona: NgZone
  )
  {
    this.formularioAcceso = this.formularios.group(
    {
      correo: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
    this.formularioEmpresa = this.formularios.group(
    {
      nombre_empresa: ['', [Validators.required, Validators.minLength(2)]],
      ciudad: ['', Validators.required],
      estado: ['', Validators.required],
      rfc: ['']
    });
  }

  ngAfterViewInit(): void
  {
    if(this.accesoGoogleHabilitado)
    {
      this.inicializarGoogle();
    }
  }

  ngOnDestroy(): void
  {
    this.destruido = true;
    clearTimeout(this.temporizadorGoogle);
  }

  private inicializarGoogle(intentos = 0): void
  {
    if(this.destruido)
    {
      return;
    }
    const serviciosGoogle = window.google;
    const contenedor = this.contenedorGoogle?.nativeElement;
    if(!serviciosGoogle || !contenedor)
    {
      if(intentos >= 100)
      {
        this.mensajeError.set('No se pudo cargar Google. Recarga la página o utiliza tu contraseña.');
        return;
      }
      this.temporizadorGoogle = setTimeout(() => this.inicializarGoogle(intentos + 1), 100);
      return;
    }

    serviciosGoogle.accounts.id.initialize(
    {
      client_id: environment.identificadorClienteGoogle,
      ux_mode: 'popup',
      auto_select: false,
      callback: (respuesta: CredencialGoogle) =>
      {
        this.zona.run(() => this.procesarCredencialGoogle(respuesta));
      }
    });
    serviciosGoogle.accounts.id.renderButton(contenedor,
    {
      type: 'standard',
      size: 'large',
      theme: 'outline',
      text: 'continue_with',
      shape: 'rectangular',
      locale: 'es',
      width: Math.min(contenedor.clientWidth || 320, 400)
    });
  }

  private procesarCredencialGoogle(respuesta: CredencialGoogle): void
  {
    if(this.destruido || this.cargando() || !respuesta.credential)
    {
      return;
    }
    this.cargando.set(true);
    this.mensajeError.set('');
    this.autenticacion.iniciarSesionGoogle(respuesta.credential).subscribe(
    {
      next: respuestaAcceso =>
      {
        if(this.destruido)
        {
          return;
        }
        this.cargando.set(false);
        if(respuestaAcceso.require_company_info)
        {
          this.mostrarModalEmpresa.set(true);
          return;
        }
        this.enrutador.navigate([this.autenticacion.getDashboardRoute(respuestaAcceso.usuario)]);
      },
      error: fallo =>
      {
        this.mensajeError.set(fallo.error?.message || 'Error al iniciar sesión con Google.');
        this.cargando.set(false);
      }
    });
  }

  enviarDatosEmpresa(): void
  {
    if(this.formularioEmpresa.invalid || this.completandoPerfil())
    {
      this.formularioEmpresa.markAllAsTouched();
      return;
    }
    this.completandoPerfil.set(true);
    this.autenticacion.completarPerfil(this.formularioEmpresa.value).subscribe(
    {
      next: () =>
      {
        this.completandoPerfil.set(false);
        this.mostrarModalEmpresa.set(false);
        this.enrutador.navigate(['/cliente/dashboard']);
      },
      error: fallo =>
      {
        this.mensajeError.set(fallo.error?.message || 'Error al guardar datos de la empresa.');
        this.completandoPerfil.set(false);
      }
    });
  }

  usarCredencialesDemo(usuario: { correo: string; password: string }): void
  {
    this.formularioAcceso.patchValue(
    {
      correo: usuario.correo,
      password: usuario.password
    });
    this.mensajeError.set('');
  }

  enviarAcceso(): void
  {
    if(this.formularioAcceso.invalid || this.cargando())
    {
      this.formularioAcceso.markAllAsTouched();
      return;
    }
    this.cargando.set(true);
    this.mensajeError.set('');
    const { correo, password: contrasena } = this.formularioAcceso.value;
    this.autenticacion.login(correo, contrasena).subscribe(
    {
      next: respuesta =>
      {
        this.enrutador.navigate([this.autenticacion.getDashboardRoute(respuesta.usuario)]);
        this.cargando.set(false);
      },
      error: () =>
      {
        this.mensajeError.set('Correo o contraseña incorrectos');
        this.cargando.set(false);
      }
    });
  }

  get correo()
  {
    return this.formularioAcceso.get('correo');
  }

  get contrasena()
  {
    return this.formularioAcceso.get('password');
  }
}
