import { ValidatorFn } from '@angular/forms';

export const UNIDADES_RECURSO: Readonly<Record<string, readonly string[]>> = {
  Agua: ['L', 'm3'],
  Energía: ['kWh', 'MWh'],
  Residuos: ['kg', 't'],
  Emisiones: ['kgCO2e', 'tCO2e'],
};

export const CANTIDAD_CONSUMO = /^(0|[1-9]\d{0,11})(\.\d{1,3})?$/;

export const fechaReal: ValidatorFn = (control) => {
  const value: unknown = control.value;
  if (!value) return null; // Validators.required informa el campo vacío.
  if (typeof value !== 'string' || !/^[1-9]\d{3}-\d{2}-\d{2}$/.test(value)) {
    return { fechaReal: true };
  }
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value
    ? null : { fechaReal: true };
};

export const consumoCoherente: ValidatorFn = (control) => {
  const recurso: unknown = control.get('tipo_recurso')?.value;
  const unidad: unknown = control.get('unidad_medida')?.value;
  const inicio = control.get('fecha_inicio');
  const fin = control.get('fecha_fin');
  const errors: Record<string, boolean> = {};
  if (typeof recurso !== 'string' || !Object.hasOwn(UNIDADES_RECURSO, recurso) ||
      typeof unidad !== 'string' || !UNIDADES_RECURSO[recurso]!.includes(unidad)) {
    errors['unidadIncompatible'] = true;
  }
  if (inicio?.valid && fin?.valid && fin.value < inicio.value) {
    errors['periodoInvalido'] = true;
  }
  return Object.keys(errors).length ? errors : null;
};

export const descripcionEvidencia: ValidatorFn = (control) => {
  const value: unknown = control.value;
  return typeof value === 'string' && value.trim().length >= 5 && value.trim().length <= 5000
    ? null : { descripcion: true };
};
