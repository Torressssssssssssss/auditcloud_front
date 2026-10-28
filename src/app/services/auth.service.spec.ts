import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { environment } from '../../environments/environment';
import { LoginResponse, Rol } from '../models/usuario.model';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  const response: LoginResponse = {
    token: 'jwt-de-prueba',
    usuario: {
      id_usuario: 7,
      id_empresa: 3,
      id_rol: Rol.AUDITOR,
      nombre: 'Auditor de prueba',
      correo: 'auditor@example.test',
    },
  };
  let http: HttpTestingController;
  let navigate: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    localStorage.clear();
    navigate = vi.fn().mockResolvedValue(true);
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: Router, useValue: { navigate } },
      ],
    });
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    try {
      http.verify();
    } finally {
      localStorage.clear();
    }
  });

  it('inicia sin token ni usuario cuando no hay una sesión guardada', () => {
    const service = TestBed.inject(AuthService);
    expect(service.getToken()).toBeNull();
    expect(service.currentUser()).toBeNull();
    expect(service.isLoggedIn()).toBe(false);
  });

  it('guarda y recupera el JWT y actualiza el usuario al recibir el login', async () => {
    const service = TestBed.inject(AuthService);
    const result = firstValueFrom(service.login(response.usuario.correo, 'password-de-prueba'));
    const request = http.expectOne(`${environment.apiUrl}/api/auth/login`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      correo: response.usuario.correo,
      password: 'password-de-prueba',
    });
    expect(service.getToken()).toBeNull();
    expect(service.isLoggedIn()).toBe(false);

    request.flush(response);

    expect(await result).toEqual(response);
    expect(localStorage.getItem('auditcloud_token')).toBe(response.token);
    expect(service.getToken()).toBe(response.token);
    expect(JSON.parse(localStorage.getItem('auditcloud_user')!)).toEqual(response.usuario);
    expect(service.currentUser()).toEqual(response.usuario);
    expect(service.getUsuarioActual()).toEqual(response.usuario);
    expect(service.isLoggedIn()).toBe(true);
  });

  it('restaura el usuario y recupera el token de una sesión persistida', () => {
    localStorage.setItem('auditcloud_token', response.token);
    localStorage.setItem('auditcloud_user', JSON.stringify(response.usuario));

    const service = TestBed.inject(AuthService);

    expect(service.getToken()).toBe(response.token);
    expect(service.currentUser()).toEqual(response.usuario);
    expect(service.isLoggedIn()).toBe(true);
    expect(service.getRol()).toBe(Rol.AUDITOR);
  });

  it('elimina la sesión persistida si el usuario contiene JSON inválido', () => {
    localStorage.setItem('auditcloud_token', response.token);
    localStorage.setItem('auditcloud_user', '{json inválido');

    const service = TestBed.inject(AuthService);

    expect(localStorage.getItem('auditcloud_user')).toBeNull();
    expect(service.getToken()).toBeNull();
    expect(service.currentUser()).toBeNull();
    expect(service.isLoggedIn()).toBe(false);
  });

  it('propaga el rechazo del login sin guardar una sesión', async () => {
    const service = TestBed.inject(AuthService);
    const result = firstValueFrom(service.login(response.usuario.correo, 'incorrecta'));
    const rejected = expect(result).rejects.toMatchObject({ status: 401 });

    http.expectOne(`${environment.apiUrl}/api/auth/login`).flush(
      { message: 'Credenciales inválidas' },
      { status: 401, statusText: 'Unauthorized' },
    );

    await rejected;
    expect(localStorage.getItem('auditcloud_user')).toBeNull();
    expect(service.getToken()).toBeNull();
    expect(service.isLoggedIn()).toBe(false);
  });

  it('guarda el JWT de la respuesta del login con Google', async () => {
    const service = TestBed.inject(AuthService);
    const result = firstValueFrom(service.loginWithGoogle('google-id-token', Rol.AUDITOR));
    const request = http.expectOne(`${environment.apiUrl}/api/auth/google`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ token: 'google-id-token' });
    request.flush(response);

    await result;
    expect(service.getToken()).toBe(response.token);
    expect(localStorage.getItem('auditcloud_user')).toBe(JSON.stringify(response.usuario));
    expect(service.currentUser()).toEqual(response.usuario);
    expect(service.isLoggedIn()).toBe(true);
  });

  it('guarda la sesión recibida al registrar un cliente', async () => {
    const service = TestBed.inject(AuthService);
    const payload = {
      nombre: 'Cliente', correo: 'cliente@example.test',
      password: 'password-de-prueba', nombre_empresa: 'Empresa de prueba',
    };
    const result = firstValueFrom(service.registrarCliente(payload));
    const request = http.expectOne(`${environment.apiUrl}/api/cliente/registro`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(payload);
    request.flush(response);

    await result;
    expect(service.getToken()).toBe(response.token);
    expect(localStorage.getItem('auditcloud_user')).toBe(JSON.stringify(response.usuario));
    expect(service.currentUser()).toEqual(response.usuario);
  });

  it('elimina el token y el usuario y redirige al login al cerrar sesión', () => {
    localStorage.setItem('auditcloud_token', response.token);
    localStorage.setItem('auditcloud_user', JSON.stringify(response.usuario));
    const service = TestBed.inject(AuthService);

    service.logout();

    expect(service.getToken()).toBeNull();
    expect(localStorage.getItem('auditcloud_user')).toBeNull();
    expect(service.currentUser()).toBeNull();
    expect(service.isLoggedIn()).toBe(false);
    expect(navigate).toHaveBeenCalledExactlyOnceWith(['/login']);
  });
});
