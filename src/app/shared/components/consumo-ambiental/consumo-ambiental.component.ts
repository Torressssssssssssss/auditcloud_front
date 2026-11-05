import { Component, Input } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ConsumoAmbiental } from '../../../models/evidencia.model';

@Component(
{
  selector: 'app-consumo-ambiental',
  standalone: true,
  imports: [DatePipe],
  template: `
    <strong>{{ consumo.tipo_recurso }}</strong>
    <div>{{ consumo.cantidad }} {{ nombreUnidad(consumo.unidad_medida) }}</div>
    <small>{{ consumo.fecha_inicio | date:'dd/MM/yyyy':'UTC' }} – {{ consumo.fecha_fin | date:'dd/MM/yyyy':'UTC' }}</small>
  `
})
export class ConsumoAmbientalComponent
{
  @Input({ required: true }) consumo!: ConsumoAmbiental;

  nombreUnidad(unidad: string): string
  {
    const nombres: Record<string, string> =
    {
      L: 'L (litros)',
      m3: 'm³ (metros cúbicos)',
      kWh: 'kWh',
      MWh: 'MWh',
      kg: 'kg (kilogramos)',
      t: 't (toneladas)',
      kgCO2e: 'kg CO₂e',
      tCO2e: 't CO₂e'
    };
    return nombres[unidad] || unidad;
  }
}
