import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from './auth.service';
import { Router } from '@angular/router';

export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>, 
  next: HttpHandlerFn
) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Log all requests for debugging
  console.log('HTTP Request:', {
    url: req.url,
    method: req.method,
    headers: req.headers.keys().map(key => `${key}: ${req.headers.get(key)}`),
    body: req.body
  });

  // Skip adding token for registration and login endpoints
  const isAuthEndpoint = req.url.includes('/api/auth/register') || req.url.includes('/api/auth/login');
  console.log('Request URL:', req.url, 'Is Auth Endpoint:', isAuthEndpoint);

  // Get the auth token from the service
  const token = authService.getToken();
  console.log('Token available:', token ? 'Yes' : 'No');
  console.log('Token preview:', token ? token.substring(0, 20) + '...' : 'None');

  // Clone the request and add the authorization header if token exists
   if (token && !isAuthEndpoint) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
    console.log('Authorization header added to request:', req.url);
  } else {
    console.log('No authorization header added. Token:', !!token, 'Is auth endpoint:', isAuthEndpoint);
  }

  // Handle the request and catch any authentication errors
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // Only log detailed errors for unexpected status codes
      if (error.status !== 403) {
        console.error('HTTP Error:', {
          status: error.status,
          statusText: error.statusText,
          url: error.url,
          error: error.error,
          message: error.message
        });
      }
      
      if (error.status === 401) {
        // If we get an unauthorized response, log the user out
        console.log('Authentication error detected, logging out');
        
        // Only logout if not trying to register or login
        if (!req.url.includes('/api/auth/register') && !req.url.includes('/api/auth/login')) {
          authService.logout();
          router.navigate(['/login'], { 
            queryParams: { returnUrl: router.url } 
          });
        }
      } else if (error.status === 403) {
        // 403 Forbidden - user is authenticated but doesn't have permission
        // Only log for non-admin endpoints to reduce noise
        if (!req.url.includes('/api/utilisateurs/stats') && !req.url.includes('/api/utilisateurs/with-campaigns')) {
          console.log('Access forbidden - insufficient permissions for:', req.url);
        }
        // Don't log out the user, just let the component handle the error
      }
      return throwError(() => error);
    })
  );
};