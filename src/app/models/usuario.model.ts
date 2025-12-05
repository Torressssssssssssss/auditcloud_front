export interface Usuario {
  id_usuario: number;
  id_empresa: number;
  id_rol: number;
  nombre: string;
  correo: string;
  activo?: boolean;
}

export interface LoginResponse {
  token: string;
  usuario: Usuario;
}

export enum Rol {
  SUPERVISOR = 1,
  AUDITOR = 2,
  CLIENTE = 3
}

export enum EstadoAuditoria {
  CREADA = 1,
  EN_PROCESO = 2,
  FINALIZADA = 3
}

export enum EstadoPago {
  PENDIENTE = 1,
  PAGADA = 2
}

export enum ModuloAmbiental {
  AGUA = 1,
  RESIDUOS = 2,
  ENERGIA = 3
}







