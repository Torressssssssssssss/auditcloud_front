import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { environment } from '../../environments/environment';
import { ApiService } from './api.service';

describe('ApiService: cabecera de autenticación', () => {
  let service: ApiService;
  let http: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ApiService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    try {
      http.verify();
    } finally {
      localStorage.clear();
    }
  });

  it('lee el JWT almacenado y lo envía como Bearer en la petición simulada', async () => {
    localStorage.setItem('auditcloud_token', 'jwt-de-prueba');
    const result = firstValueFrom(service.get('/api/recurso-protegido'));
    const request = http.expectOne(`${environment.apiUrl}/api/recurso-protegido`);
    expect(request.request.headers.get('Authorization')).toBe('Bearer jwt-de-prueba');
    request.flush({ ok: true });
    expect(await result).toEqual({ ok: true });
  });

  it('omite Authorization cuando no hay un token guardado', async () => {
    const result = firstValueFrom(service.post('/api/auth/login', {}));
    const request = http.expectOne(`${environment.apiUrl}/api/auth/login`);
    expect(request.request.headers.has('Authorization')).toBe(false);
    request.flush({});
    await result;
  });
});
