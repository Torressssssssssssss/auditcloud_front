import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-auditor-pagos',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div style="max-width:720px;margin:2rem auto;padding:1.5rem;background:#fff;border-radius:8px;border:1px solid #eee;text-align:center;">
      <h3 style="margin:0 0 0.5rem 0;color:#111827;">Sección de Pagos (deshabilitada)</h3>
      <p style="margin:0;color:#6b7280;">El módulo de Pagos para el perfil Auditor fue removido. Usa la sección de Supervisor o Cliente para gestionar cobros.</p>
    </div>
  `
})
export class PagosComponent {
  // Componente stub: ya no se usa desde las rutas. Mantener por compatibilidad local.
}