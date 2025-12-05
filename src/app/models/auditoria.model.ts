import { EstadoAuditoria, ModuloAmbiental } from './usuario.model';

export { EstadoAuditoria, ModuloAmbiental };

export interface Auditoria {
  id_auditoria: number;
  id_cliente: number;
  id_empresa: number;
  id_estado: EstadoAuditoria;
  objetivo?: string;
  fecha_creacion?: string;
  fecha_inicio?: string;
  fecha_fin?: string;
  cliente?: {
    nombre: string;
    nombre_empresa?: string;
  };
  empresa?: {
    nombre: string;
  };
  modulos?: ModuloAmbiental[];
  participantes?: number[];
}


