import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Rol } from '../models/usuario.model';
import { AuthService } from '../services/auth.service';
import { roleGuard } from './role.guard';

describe('roleGuard', () => {
  const route = {} as ActivatedRouteSnapshot;
  const state = { url: '/ruta-protegida' } as RouterStateSnapshot;
  let isLoggedIn: ReturnType<typeof vi.fn>;
  let getRol: ReturnType<typeof vi.fn>;
  let navigate: ReturnType<typeof vi.fn>;

  const executeGuard = (roles: Rol[]) => TestBed.runInInjectionContext(
    () => roleGuard(roles)(route, state),
  );

  beforeEach(() => {
    isLoggedIn = vi.fn().mockReturnValue(true);
    getRol = vi.fn();
    navigate = vi.fn().mockResolvedValue(true);
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: { isLoggedIn, getRol } },
        { provide: Router, useValue: { navigate } },
      ],
    });
  });

  it('bloquea y redirige al login si el usuario no está autenticado', () => {
    isLoggedIn.mockReturnValue(false);
    expect(executeGuard([Rol.AUDITOR])).toBe(false);
    expect(navigate).toHaveBeenCalledExactlyOnceWith(['/login']);
    expect(getRol).not.toHaveBeenCalled();
  });

  it.each([Rol.SUPERVISOR, Rol.AUDITOR, Rol.CLIENTE])(
    'permite navegar al rol autorizado %s', (role) => {
      getRol.mockReturnValue(role);
      expect(executeGuard([role])).toBe(true);
      expect(navigate).not.toHaveBeenCalled();
    },
  );

  it('permite navegar si el rol es uno de varios autorizados', () => {
    getRol.mockReturnValue(Rol.AUDITOR);
    expect(executeGuard([Rol.SUPERVISOR, Rol.AUDITOR])).toBe(true);
    expect(navigate).not.toHaveBeenCalled();
  });

  it.each([
    [Rol.SUPERVISOR, '/supervisor/dashboard'],
    [Rol.AUDITOR, '/auditor/dashboard'],
    [Rol.CLIENTE, '/cliente/dashboard'],
  ])('bloquea al rol no autorizado %s y redirige a %s', (role, dashboard) => {
    getRol.mockReturnValue(role);
    const allowedRole = role === Rol.CLIENTE ? Rol.AUDITOR : Rol.CLIENTE;
    expect(executeGuard([allowedRole])).toBe(false);
    expect(navigate).toHaveBeenCalledExactlyOnceWith([dashboard]);
  });

  it('bloquea y redirige al login cuando el usuario no tiene un rol reconocido', () => {
    getRol.mockReturnValue(null);
    expect(executeGuard([Rol.AUDITOR])).toBe(false);
    expect(navigate).toHaveBeenCalledExactlyOnceWith(['/login']);
  });
});
