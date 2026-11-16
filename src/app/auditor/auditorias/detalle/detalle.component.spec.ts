import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { environment } from '../../../../environments/environment';
import { ApiService } from '../../../services/api.service';
import { FileService } from '../../../services/file.service';
import { AuditoriaDetalleComponent } from './detalle.component';

describe('Detalle de auditoría: alta de evidencias', () => {
  let http: HttpTestingController;
  const get = vi.fn();

  beforeEach(() => {
    localStorage.setItem('auditcloud_token', 'token-prueba');
    get.mockImplementation((ruta: string) => of(ruta.startsWith('/api/timeline/') ? [] : {
      id_auditoria: 42, id_empresa_auditora: 1, id_cliente: 2,
      id_estado: 2, modulos: [1, 3], fecha_creacion: '2026-11-12',
    }));
    TestBed.configureTestingModule({
      imports: [AuditoriaDetalleComponent],
      providers: [
        provideRouter([]), provideHttpClient(), provideHttpClientTesting(),
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => '42' } } } },
        { provide: FileService, useValue: {} },
      ],
    });
    http = TestBed.inject(HttpTestingController);
    vi.spyOn(TestBed.inject(ApiService), 'get').mockImplementation(get);
  });

  afterEach(() => {
    http.verify();
    localStorage.removeItem('auditcloud_token');
    get.mockReset();
    TestBed.resetTestingModule();
  });

  it('asigna automáticamente la auditoría actual al archivo y actualiza la bitácora', () => {
    const fixture = TestBed.createComponent(AuditoriaDetalleComponent);
    fixture.detectChanges();
    const boton = [...fixture.nativeElement.querySelectorAll('button')]
      .find((element: HTMLButtonElement) => element.textContent?.includes('Agregar evidencia')) as HTMLButtonElement;
    boton.click();
    fixture.detectChanges();

    const formulario = fixture.componentInstance.evidenciaForm;
    formulario.patchValue({ id_modulo: '3', tipo: 'DOC', descripcion: 'Informe de energía' });
    fixture.detectChanges();
    const archivo = new File(['datos'], 'informe.pdf', { type: 'application/pdf' });
    const input = fixture.nativeElement.querySelector('#evidencia-archivo') as HTMLInputElement;
    Object.defineProperty(input, 'files', { configurable: true, value: [archivo] });
    input.dispatchEvent(new Event('change'));
    (fixture.nativeElement.querySelector('.evidencia-modal form') as HTMLFormElement)
      .dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

    const solicitud = http.expectOne(`${environment.apiUrl}/api/auditor/evidencias`);
    const datos = solicitud.request.body as FormData;
    expect(datos.get('id_auditoria')).toBe('42');
    expect(datos.get('id_modulo')).toBe('3');
    expect(datos.get('archivo')).toBe(archivo);
    expect(solicitud.request.headers.get('Authorization')).toBe('Bearer token-prueba');
    expect(solicitud.request.headers.has('Content-Type')).toBe(false);
    solicitud.flush({ evidencia: { id_evidencia: 1 } });
    expect(fixture.componentInstance.showModalEvidencia()).toBe(false);
    expect(get.mock.calls.filter(([ruta]) => ruta === '/api/timeline/42')).toHaveLength(2);
    fixture.destroy();
  }, 20000);

  it('impide el alta en auditorías finalizadas', () => {
    const fixture = TestBed.createComponent(AuditoriaDetalleComponent);
    fixture.detectChanges();
    fixture.componentInstance.auditoria.update(actual => ({ ...actual!, id_estado: 3 }));
    fixture.detectChanges();
    const boton = [...fixture.nativeElement.querySelectorAll('button')]
      .find((element: HTMLButtonElement) => element.textContent?.includes('Agregar evidencia')) as HTMLButtonElement;
    expect(boton.disabled).toBe(true);
    fixture.componentInstance.abrirModalEvidencia();
    expect(fixture.componentInstance.showModalEvidencia()).toBe(false);
    fixture.destroy();
  }, 20000);
});
