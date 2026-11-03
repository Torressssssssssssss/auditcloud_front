import { Injectable, OnDestroy, inject } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../environments/environment';
import { NuevoConsumo } from '../models/dashboard-directivo.model';
import { AuthService } from './auth.service';

export type EstadoConexion = 'conectando' | 'conectado' | 'desconectado' | 'error';

@Injectable()
export class WebsocketService implements OnDestroy
{
  private readonly autenticacion = inject(AuthService);
  private conexion?: Socket;
  private readonly consumoRecibido = new Subject<NuevoConsumo>();
  private readonly estadoConexion = new BehaviorSubject<EstadoConexion>('desconectado');
  readonly nuevoConsumo$ = this.consumoRecibido.asObservable();
  readonly estado$ = this.estadoConexion.asObservable();

  conectar(): void
  {
    if (this.conexion) return;
    const direccion = new URL(environment.apiUrl || window.location.origin, window.location.origin);
    if (!this.autenticacion.getToken() || (environment.production && direccion.protocol !== 'https:'))
    {
      this.estadoConexion.next('error');
      return;
    }
    this.estadoConexion.next('conectando');
    this.conexion = io(direccion.origin, {
      path: '/api/socket.io',
      autoConnect: false,
      auth: (responder: (credenciales: { token: string | null }) => void) =>
      {
        responder({ token: this.autenticacion.getToken() });
      },
      timeout: 10000,
      reconnectionDelayMax: 5000,
    });
    this.conexion.on('connect', () => this.estadoConexion.next('conectado'));
    this.conexion.on('disconnect', () => this.estadoConexion.next('desconectado'));
    this.conexion.on('connect_error', () => this.estadoConexion.next('error'));
    this.conexion.on('nuevo_consumo', (consumo: NuevoConsumo) => this.consumoRecibido.next(consumo));
    this.conexion.connect();
  }

  desconectar(): void
  {
    this.conexion?.removeAllListeners();
    this.conexion?.disconnect();
    this.conexion = undefined;
    this.estadoConexion.next('desconectado');
  }

  ngOnDestroy(): void
  {
    this.desconectar();
    this.consumoRecibido.complete();
    this.estadoConexion.complete();
  }
}
