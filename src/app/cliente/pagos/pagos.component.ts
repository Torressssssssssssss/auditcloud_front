import { Component, OnInit, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
// Importamos el botón de PayPal que ya tienes
import { PagoPaypalComponent } from '../../pago-paypal-component/pago-paypal-component'; 

interface SolicitudPago {
  id_solicitud: number;
  monto: number;
  concepto: string;
  id_estado: number; // 1 = PENDIENTE, 2 = PAGADA
  creado_en: string;
  pagada_en?: string;
  empresa_auditora?: number; // ID de la empresa que cobra
}

@Component({
  selector: 'app-cliente-pagos',
  standalone: true,
  imports: [CommonModule, PagoPaypalComponent], // Solo importamos PayPal, NO nueva solicitud
  templateUrl: './pagos.component.html',
  styleUrls: ['./pagos.component.css']
})
export class PagosComponent implements OnInit {
  private http = inject(HttpClient);
  private router = inject(Router);
  
  // Lista cruda de todas las solicitudes
  todasLasSolicitudes = signal<SolicitudPago[]>([]);
  cargando = signal(true);

  // Filtros automáticos (Signals computadas)
  pendientes = computed(() => this.todasLasSolicitudes().filter(s => s.id_estado === 1));
  historial = computed(() => this.todasLasSolicitudes().filter(s => s.id_estado === 2));

  ngOnInit() {
    this.cargarDatos();
  }

  cargarDatos() {
    this.cargando.set(true);
    
    const token = localStorage.getItem('auditcloud_token');
    const userStr = localStorage.getItem('auditcloud_user');

    if (!token || !userStr) {
      this.router.navigate(['/login']);
      return;
    }

    const usuario = JSON.parse(userStr);
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });

    // Consumimos el endpoint de cliente
    this.http.get<SolicitudPago[]>(`http://localhost:3000/api/cliente/solicitudes-pago/${usuario.id_usuario}`, { headers })
      .subscribe({
        next: (data) => {
          this.todasLasSolicitudes.set(data);
          this.cargando.set(false);
        },
        error: (err) => {
          console.error('Error', err);
          this.cargando.set(false);
        }
      });
  }

  // Se ejecuta cuando el hijo (PayPal) termina el proceso
  onPagoRealizado(auditoria: any) {
    alert(`¡Pago exitoso! Se ha generado la auditoría #${auditoria.id_auditoria}`);
    this.cargarDatos(); // Recargamos para que la solicitud pase de "Pendiente" a "Historial"
  }
}