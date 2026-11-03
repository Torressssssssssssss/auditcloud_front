import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { environment } from '../../../environments/environment';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { FileService } from '../../services/file.service';
import { EvidenciasComponent } from './evidencias.component';

describe('AC-01: formulario de evidencias cuantificables', () => {
  let fixture: ComponentFixture<EvidenciasComponent>;
  let component: EvidenciasComponent;
  let http: HttpTestingController;
  const consumo = { tipo_recurso: 'Agua', unidad_medida: 'm3', cantidad: '125.500',
    fecha_inicio: '2024-02-29', fecha_fin: '2024-03-01' };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [EvidenciasComponent],
      providers: [
        provideHttpClient(), provideHttpClientTesting(),
        { provide: ApiService, useValue: { get: () => of([]) } },
        { provide: AuthService, useValue: { getIdUsuario: () => 8 } },
        { provide: FileService, useValue: {} },
        { provide: ActivatedRoute, useValue: { queryParams: of({}) } },
      ],
    });
    fixture = TestBed.createComponent(EvidenciasComponent);
    component = fixture.componentInstance;
    http = TestBed.inject(HttpTestingController);
    component.evidenciaForm.patchValue({ id_auditoria: '20', id_modulo: '1',
      tipo: 'COMENTARIO', descripcion: 'Lectura del contador' });
    component.showForm.set(true);
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
    http.verify();
  });

  function activarConsumo() {
    component.evidenciaForm.get('es_consumo')!.setValue(true);
    // Seleccionar primero el recurso, como hace el usuario; cambiarlo borra la unidad.
    component.consumoForm.patchValue(consumo);
    fixture.changeDetectorRef.markForCheck();
    fixture.detectChanges();
  }

  it('muestra los campos al activar la opción y no exige consumo a las evidencias normales', () => {
    expect(component.evidenciaForm.valid).toBe(true);
    expect(fixture.nativeElement.querySelector('#consumo-cantidad')).toBeNull();
    component.evidenciaForm.get('es_consumo')!.setValue(true);
    fixture.changeDetectorRef.markForCheck();
    fixture.detectChanges();
    expect(component.evidenciaForm.invalid).toBe(true);
    expect(fixture.nativeElement.querySelector('#consumo-cantidad')).not.toBeNull();
    component.evidenciaForm.get('es_consumo')!.setValue(false);
    fixture.changeDetectorRef.markForCheck();
    fixture.detectChanges();
    expect(component.evidenciaForm.valid).toBe(true);
  });

  it('limpia la unidad al cambiar de recurso y ofrece solo unidades compatibles', () => {
    activarConsumo();
    expect(component.evidenciaForm.valid).toBe(true);
    component.consumoForm.get('tipo_recurso')!.setValue('Emisiones');
    expect(component.consumoForm.get('unidad_medida')!.value).toBe('');
    expect(component.unidadesDisponibles).toEqual(['kgCO2e', 'tCO2e']);
    component.consumoForm.get('unidad_medida')!.setValue('m3');
    expect(component.consumoForm.hasError('unidadIncompatible')).toBe(true);
  });

  it.each(['-1', '1.0001', '1000000000000', '1e3', '1,5', 'NaN', ''])('rechaza la cantidad %s', (cantidad) => {
    activarConsumo();
    component.consumoForm.get('cantidad')!.setValue(cantidad);
    expect(component.evidenciaForm.invalid).toBe(true);
  });

  it('rechaza fechas inexistentes y periodos invertidos; permite un solo día', () => {
    activarConsumo();
    component.consumoForm.get('fecha_inicio')!.setValue('2025-02-29');
    expect(component.consumoForm.get('fecha_inicio')!.invalid).toBe(true);
    component.consumoForm.patchValue({ fecha_inicio: '2024-03-02', fecha_fin: '2024-03-01' });
    expect(component.consumoForm.hasError('periodoInvalido')).toBe(true);
    component.consumoForm.get('fecha_fin')!.setValue('2024-03-02');
    expect(component.evidenciaForm.valid).toBe(true);
  });

  it('envía decimales exactos por multipart y restablece el formulario después de guardar', () => {
    activarConsumo();
    component.onSubmit();
    const req = http.expectOne(`${environment.apiUrl}/api/auditor/evidencias`);
    const payload = req.request.body as FormData;
    expect(payload.get('es_consumo')).toBe('true');
    expect(payload.get('cantidad')).toBe('125.500');
    expect(payload.get('fecha_inicio')).toBe('2024-02-29');
    req.flush({ evidencia: { id_evidencia: 1 } });
    expect(component.consumoForm.disabled).toBe(true);
    expect(component.showForm()).toBe(false);
    expect(component.mensajeExito()).toContain('correctamente');
  });

  it('omite mediciones desactivadas aunque el usuario haya rellenado los campos antes', () => {
    activarConsumo();
    component.evidenciaForm.get('es_consumo')!.setValue(false);
    component.onSubmit();
    const req = http.expectOne(`${environment.apiUrl}/api/auditor/evidencias`);
    const payload = req.request.body as FormData;
    expect(payload.get('es_consumo')).toBe('false');
    expect(payload.has('cantidad')).toBe(false);
    expect(payload.has('tipo_recurso')).toBe(false);
    req.flush({});
  });

  it('conserva la medición y muestra el rechazo del servidor para corregirlo', () => {
    activarConsumo();
    component.onSubmit();
    http.expectOne(`${environment.apiUrl}/api/auditor/evidencias`).flush({
      message: 'Revisa los datos del consumo.', errors: { cantidad: 'Cantidad inválida.' },
    }, { status: 400, statusText: 'Bad Request' });
    expect(component.errorFormulario()).toContain('Revisa');
    expect(component.consumoForm.get('cantidad')!.hasError('server')).toBe(true);
    expect(component.consumoForm.get('cantidad')!.value).toBe('125.500');
    expect(component.enviando()).toBe(false);
  });
});
