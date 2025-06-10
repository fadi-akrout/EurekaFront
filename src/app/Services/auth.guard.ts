import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    if (this.authService.isAuthenticated()) {
      // Check if route has data with roles
      const requiredRoles = route.data['roles'] as Array<string>;
      
      if (!requiredRoles || requiredRoles.length === 0) {
        return true; // No specific roles required
      }
      
      // Check if user has any of the required roles
      const hasRequiredRole = requiredRoles.some(role => 
        this.authService.hasRole(role)
      );
      
      if (hasRequiredRole) {
        return true;
      } else {
        // User doesn't have the required role, redirect to home or dashboard
        return this.router.createUrlTree(['/']);
      }
    }
    
    // Not logged in, redirect to login with return url
    return this.router.createUrlTree(['/login'], { 
      queryParams: { returnUrl: state.url } 
    });
  }
}