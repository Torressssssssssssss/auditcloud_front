import { Component, Input, Output, EventEmitter, ViewChild, ElementRef, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { loadScript } from '@paypal/paypal-js';

// TODO: Configura tu Client ID de PayPal Sandbox/Production
const PAYPAL_CLIENT_ID = 'AecrVLNqy9BcJV5i8xvwpz9u8aaD-KqVT6Wn3LI9gY_a_fzlWHPJYLnqFxMYuJhM7sePR3LZ9nrEpW4p';

@Component({
  selector: 'app-pago-paypal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pago-paypal-component.html',
  styleUrls: ['./pago-paypal-component.css']
})
export class PagoPaypalComponent implements OnInit {
  @Input() solicitud: any;
  @Output() pagoExitoso = new EventEmitter<any>();

  @ViewChild('paypalRef', { static: false }) paypalElement!: ElementRef;
  
  cargando = signal(true);
  errorMsg = signal('');
  procesando = signal(false);

  async ngOnInit() {
    try {
      this.cargando.set(true);
      const paypal = await loadScript({ 
        clientId: 'AUkzwkuSfU0YTs1qhP5aTXBGI6xGuBUMPumSov_DsjzSYXOnL-ge9S4YrNXC0U3ZzexQI6WgMH4QHcN5', 
        currency: 'MXN'
      });

      if (paypal && paypal.Buttons) {
        await paypal.Buttons({
          style: {
            layout: 'vertical',
            color: 'blue',
            shape: 'rect',
            label: 'pay'
          },
          
          // 1. Crear Orden
          createOrder: (data: any, actions: any) => {
            this.procesando.set(true);
            return fetch('http://localhost:3000/api/paypal/create-order', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('auditcloud_token')}`
              },
              body: JSON.stringify({
                id_solicitud: this.solicitud.id_solicitud
              })
            })
            .then(res => {
              if (!res.ok) throw new Error('Error al iniciar pago');
              return res.json();
            })
            .then(order => {
              this.procesando.set(false);
              return order.id;
            })
            .catch(err => {
              this.procesando.set(false);
              this.errorMsg.set('Error al crear la orden de pago');
              throw err;
            });
          },

          // 2. Capturar Pago
          onApprove: (data: any, actions: any) => {
            this.procesando.set(true);
            return fetch('http://localhost:3000/api/paypal/capture-order', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('auditcloud_token')}`
              },
              body: JSON.stringify({
                orderID: data.orderID
              })
            })
            .then(res => {
              if (!res.ok) throw new Error('Error al capturar el pago');
              return res.json();
            })
            .then(details => {
              this.procesando.set(false);
              if (details.status === 'COMPLETED') {
                this.pagoExitoso.emit(details.auditoria);
              } else {
                this.errorMsg.set('El pago no se completó correctamente');
              }
            })
            .catch(err => {
              this.procesando.set(false);
              this.errorMsg.set('Error al procesar el pago');
              console.error(err);
            });
          },

          onError: (err: any) => {
            console.error('PayPal Error:', err);
            this.errorMsg.set('Hubo un error procesando el pago.');
            this.procesando.set(false);
          },

          onCancel: (data: any) => {
            this.procesando.set(false);
            this.errorMsg.set('Pago cancelado');
          }
        }).render(this.paypalElement.nativeElement);
        
        this.cargando.set(false);
      }
    } catch (err) {
      console.error('Error cargando SDK', err);
      this.errorMsg.set('No se pudo cargar el botón de PayPal.');
      this.cargando.set(false);
    }
  }
}