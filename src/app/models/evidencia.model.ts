import { ModuloAmbiental } from './usuario.model';

export interface Evidencia {
  id_evidencia: number;
  id_auditoria: number;
  id_modulo: ModuloAmbiental;
  id_auditor: number;
  tipo: 'FOTO' | 'DOC' | 'VIDEO';
  descripcion: string;
  url: string;
  fecha_subida: string;
  auditor?: {
    nombre: string;
  };
}






