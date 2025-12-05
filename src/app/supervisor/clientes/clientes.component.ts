import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-clientes',
  standalone: true,
  imports: [CommonModule],
  template: '<div class="page"><h2>Empresas Cliente</h2><p>Lista de empresas cliente...</p></div>',
  styles: ['.page { padding: 2rem; }']
})
export class ClientesComponent {}




