import { ConsumoAmbiental } from './evidencia.model';

export interface NuevoConsumo extends ConsumoAmbiental
{
  id_auditoria: number;
}

export interface ConsumosMensuales
{
  anio: number;
  agua: string[];
  energia: string[];
  unidad_agua: 'm3';
  unidad_energia: 'kWh';
}
