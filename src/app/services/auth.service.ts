import { Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { ApiService } from './api.service';
import { Usuario, LoginResponse, Rol } from '../models/usuario.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly STORAGE_KEY = 'auditcloud_user';
  private readonly TOKEN_KEY = 'auditcloud_token';

  currentUser = signal<Usuario | null>(null);

  constructor(
    private apiService: ApiService,
    private router: Router
  ) {
    this.loadUserFromStorage();
  }

  login(correo: string, password: string): Observable<LoginResponse> {
    return this.apiService.post<LoginResponse>('/api/auth/login', { correo, password })
      .pipe(
        tap(response => {
          this.setSession(response);
        }),
        catchError(error => {
          throw error;
        })
      );
  }

  logout(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    localStorage.removeItem(this.TOKEN_KEY);
    this.currentUser.set(null);
    this.router.navigate(['/login']);
  }

  getUsuarioActual(): Usuario | null {
    return this.currentUser();
  }

  isLoggedIn(): boolean {
    return this.currentUser() !== null;
  }

  getRol(): Rol | null {
    return this.normalizeRol(this.currentUser());
  }

  getDashboardRoute(user: Usuario | null = this.currentUser()): string {
    const role = this.normalizeRol(user);

    if (role === Rol.SUPERVISOR) {
      return '/supervisor/dashboard';
    }

    if (role === Rol.AUDITOR) {
      return '/auditor/dashboard';
    }

    if (role === Rol.CLIENTE) {
      return '/cliente/dashboard';
    }

    return '/login';
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  getIdEmpresa(): number | null {
    const user = this.currentUser();
    return user ? user.id_empresa : null;
  }

  getIdUsuario(): number | null {
    const user = this.currentUser();
    return user ? user.id_usuario : null;
  }

  cambiarPassword(actual: string, nueva: string): Observable<any> {
    return this.apiService.put('/api/auth/cambiar-password', { actual, nueva });
  }

  registrarCliente(payload: { nombre: string; correo: string; password: string; nombre_empresa: string; ciudad?: string; estado?: string; rfc?: string }): Observable<LoginResponse> {
    // Endpoint asumido para registro de cliente; ajusta si tu backend expone otro.
    return this.apiService.post<LoginResponse>('/api/cliente/registro', payload).pipe(
      tap(response => this.setSession(response))
    );
  }

  private setSession(response: LoginResponse): void {
    localStorage.setItem(this.TOKEN_KEY, response.token);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(response.usuario));
    this.currentUser.set(response.usuario);
  }

  private normalizeRol(user: Usuario | null): Rol | null {
    if (!user) {
      return null;
    }

    if (user.id_rol === Rol.SUPERVISOR || user.id_rol === Rol.AUDITOR || user.id_rol === Rol.CLIENTE) {
      return user.id_rol;
    }

    switch ((user.rol || '').toUpperCase()) {
      case 'SUPERVISOR':
        return Rol.SUPERVISOR;
      case 'AUDITOR':
        return Rol.AUDITOR;
      case 'CLIENTE':
        return Rol.CLIENTE;
      default:
        return null;
    }
  }

  private loadUserFromStorage(): void {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (stored) {
      try {
        const user = JSON.parse(stored);
        this.currentUser.set(user);
      } catch (e) {
        localStorage.removeItem(this.STORAGE_KEY);
        localStorage.removeItem(this.TOKEN_KEY);
      }
    }
  }
}








