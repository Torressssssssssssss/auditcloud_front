export interface SolicitudPago {
  id_solicitud: number;
  id_empresa: number;         // o id_empresa_auditora
  id_cliente: number;
  monto: number;
  concepto: string;
  id_estado: number;          // 1 = PENDIENTE, 2 = PAGADA
  creado_en: string;
  
  // 👇 AGREGA ESTAS LÍNEAS 👇
  pagada_en?: string;         // Fecha de pago (opcional, solo si ya pagó)
  fecha_expiracion?: string;  // Si lo usas en tu lógica
  paypal_order_id?: string;   // Referencia de PayPal
  
  // Datos extra para visualización (opcionales)
  empresa?: {
    nombre: string;
  };
}