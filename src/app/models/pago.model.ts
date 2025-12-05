import { EstadoPago } from './usuario.model';

export { EstadoPago };

export interface SolicitudPago {
  id_solicitud: number;
  id_empresa: number;
  id_cliente: number;
  monto: number;
  concepto: string;
  id_estado: EstadoPago;
  fecha_creacion: string;
  fecha_expiracion?: string;
  fecha_pago?: string;
  id_auditoria?: number;
  cliente?: {
    nombre: string;
    nombre_empresa?: string;
  };
  empresa?: {
    nombre: string;
  };
}

