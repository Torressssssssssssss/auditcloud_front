import type { Mock } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LoginComponent } from './login.component';
import { AuthService } from '../../services/auth.service';
import { environment } from '../../../environments/environment';

describe('Acceso con Google', () =>
{
  const respuestaAcceso =
  {
    token: 'jwt-auditcloud',
    usuario: { id_usuario: 1, id_empresa: 3, id_rol: 3, nombre: 'Cliente', correo: 'cliente@gmail.com' }
  };
  let configuracion: Parameters<NonNullable<Window['google']>['accounts']['id']['initialize']>[0];
  let renderizar: Mock<NonNullable<Window['google']>['accounts']['id']['renderButton']>;
  let iniciarSesion: ReturnType<typeof vi.fn>;

  beforeEach(() =>
  {
    iniciarSesion = vi.fn().mockReturnValue(of(respuestaAcceso));
    renderizar = vi.fn();
    window.google =
    {
      accounts:
      {
        id:
        {
          initialize: opciones =>
          {
            configuracion = opciones;
          },
          renderButton: renderizar
        }
      }
    };
    TestBed.configureTestingModule(
    {
      imports: [LoginComponent],
      providers: [
        provideRouter([]),
        {
          provide: AuthService,
          useValue:
          {
            iniciarSesionGoogle: iniciarSesion,
            getDashboardRoute: () => '/cliente/dashboard',
            completarPerfil: vi.fn()
          }
        }
      ]
    });
  });

  afterEach(() =>
  {
    TestBed.resetTestingModule();
    delete window.google;
    vi.useRealTimers();
  });

  it('renderiza el botón oficial con popup y envía la credencial a la API', () =>
  {
    iniciarSesion.mockReturnValue(of({ ...respuestaAcceso, require_company_info: true }));
    const vista = TestBed.createComponent(LoginComponent);
    vista.detectChanges();
    expect(configuracion.client_id).toBe(environment.identificadorClienteGoogle);
    expect(configuracion.ux_mode).toBe('popup');
    expect(renderizar).toHaveBeenCalledOnce();
    configuracion.callback({ credential: 'id-token-google' });
    expect(iniciarSesion).toHaveBeenCalledExactlyOnceWith('id-token-google');
    expect(vista.componentInstance.mostrarModalEmpresa()).toBe(true);
    expect(vista.componentInstance.cargando()).toBe(false);
  });

  it('muestra el rechazo de la API y permite reintentar', () =>
  {
    iniciarSesion.mockReturnValue(throwError(() => ({ error: { message: 'Token de Google inválido' } })));
    const vista = TestBed.createComponent(LoginComponent);
    vista.detectChanges();
    configuracion.callback({ credential: 'token-invalido' });
    expect(vista.componentInstance.mensajeError()).toBe('Token de Google inválido');
    expect(vista.componentInstance.cargando()).toBe(false);
  });

  it('limita la espera del SDK cuando no está disponible', () =>
  {
    vi.useFakeTimers();
    delete window.google;
    const vista = TestBed.createComponent(LoginComponent);
    vista.detectChanges();
    vi.advanceTimersByTime(10000);
    expect(vista.componentInstance.mensajeError()).toContain('No se pudo cargar Google');
    vista.destroy();

  });

  it('cancela la inicialización pendiente cuando se abandona el login', () =>
  {
    vi.useFakeTimers();
    const serviciosGoogle = window.google;
    delete window.google;
    const vista = TestBed.createComponent(LoginComponent);
    vista.detectChanges();
    vista.destroy();
    window.google = serviciosGoogle;
    vi.advanceTimersByTime(1000);
    expect(renderizar).not.toHaveBeenCalled();
  });
});
