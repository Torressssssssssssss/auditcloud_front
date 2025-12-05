import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { Rol } from '../models/usuario.model';

export const roleGuard = (allowedRoles: Rol[]): CanActivateFn => {
  return (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    if (!authService.isLoggedIn()) {
      router.navigate(['/login']);
      return false;
    }

    const userRole = authService.getRol();
    if (userRole && allowedRoles.includes(userRole)) {
      return true;
    }

    // Redirigir al dashboard según el rol del usuario
    const role = authService.getRol();
    if (role === Rol.SUPERVISOR) {
      router.navigate(['/supervisor/dashboard']);
    } else if (role === Rol.AUDITOR) {
      router.navigate(['/auditor/dashboard']);
    } else if (role === Rol.CLIENTE) {
      router.navigate(['/cliente/dashboard']);
    } else {
      router.navigate(['/login']);
    }

    return false;
  };
};






