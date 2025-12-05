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
    const user = this.currentUser();
    return user ? user.id_rol as Rol : null;
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






