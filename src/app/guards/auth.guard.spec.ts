import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthService } from '../services/auth.service';
import { authGuard } from './auth.guard';

describe('authGuard', () => {
  const route = {} as ActivatedRouteSnapshot;
  const state = { url: '/auditor/auditorias/42?tab=evidencias' } as RouterStateSnapshot;
  let isLoggedIn: ReturnType<typeof vi.fn>;
  let navigate: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    isLoggedIn = vi.fn();
    navigate = vi.fn().mockResolvedValue(true);
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: { isLoggedIn } },
        { provide: Router, useValue: { navigate } },
      ],
    });
  });

  it('permite navegar cuando el usuario está autenticado', () => {
    isLoggedIn.mockReturnValue(true);
    const result = TestBed.runInInjectionContext(() => authGuard(route, state));
    expect(result).toBe(true);
    expect(isLoggedIn).toHaveBeenCalledOnce();
    expect(navigate).not.toHaveBeenCalled();
  });

  it('bloquea y redirige al login conservando returnUrl cuando no hay sesión', () => {
    isLoggedIn.mockReturnValue(false);
    const result = TestBed.runInInjectionContext(() => authGuard(route, state));
    expect(result).toBe(false);
    expect(navigate).toHaveBeenCalledExactlyOnceWith(['/login'], {
      queryParams: { returnUrl: state.url },
    });
  });
});
