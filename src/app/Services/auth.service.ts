import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, catchError, map, of, throwError } from 'rxjs';
import { environment } from '../../environment/environment';
import { Router } from '@angular/router';
import { User, Admin, Annonceur, Paneliste } from '../models/utilisateur.model';

export interface AuthResponse {
  token: string;
  user?: User;
  expiresIn?: number;
  // Additional fields from backend response
  type?: string;
  id?: number;
  nom?: string;
  email?: string;
  role?: string; // Kept for backward compatibility
  userType?: string; // Added for new user type system
  dateInscription?: string;
  // Other possible fields
  [key: string]: any;
}

export interface RegisterRequest {
  nom: string;
  email: string;
  motDePasse: string;
  userType: string; // Changed from role to userType
  dateInscription: Date;
  entreprise?: string;
  interets?: string | string[];
  permissions?: string | string[];
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}/api/auth`;
  private currentUserSubject: BehaviorSubject<User | null>;
  public currentUser: Observable<User | null>;
  private tokenExpirationTimer: any;

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    this.currentUserSubject = new BehaviorSubject<User | null>(this.getUserFromLocalStorage());
    this.currentUser = this.currentUserSubject.asObservable();
  }

  public get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  login(email: string, password: string): Observable<User> {
    console.log('Login attempt with:', { email, motDePasse: password });
    
    // Create the request payload
    const loginPayload = { email, motDePasse: password };
    console.log('Login payload:', loginPayload);
    
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, loginPayload)
      .pipe(
        map((response: AuthResponse): User => {
          console.log('Login response:', response);
          
          // Validate response structure
          if (!response || !response.token) {
            console.error('Invalid response structure - missing token:', response);
            throw new Error('Invalid response from server - missing token');
          }
          
          // Convert backend response format to User object if needed
          let user: User;
          let expiresIn: number = 3600 * 1000; // Default to 1 hour if not provided
          
          if (response.user) {
            // If response already has a user object, use it
            user = response.user;
          } else if (response.id && response.email) {
            // If response has user properties directly, create a User object
            user = {
              id: response.id,
              nom: response.nom || '',
              email: response.email,
              role: response.role || '',
              userType: response.userType || response.role || '', // Use userType if available, fall back to role
              dateInscription: response.dateInscription ? new Date(response.dateInscription) : new Date()
            };
            console.log('Created user object from response:', user);
          } else {
            console.error('Invalid response structure - missing user data:', response);
            throw new Error('Invalid response from server - missing user data');
          }
          
          // Use expiresIn from response or default
          if (response.expiresIn) {
            expiresIn = response.expiresIn;
          }
          
          // Create a normalized auth response
          const normalizedResponse: AuthResponse = {
            token: response.token,
            user: user,
            expiresIn: expiresIn
          };
          
          // Store user details and JWT token in local storage
          this.setAuthData(normalizedResponse);
          this.currentUserSubject.next(user);
          this.autoLogout(expiresIn);
          
          console.log('User authenticated:', user);
          console.log('Token stored, expires in:', expiresIn);
          
          return user;
        }),
        catchError((error: HttpErrorResponse) => {
          console.error('Login error in service:', error);
          
          // Check if it's a network error
          if (error.status === 0) {
            return throwError(() => new Error('Network error - please check if the backend server is running'));
          }
          
          // Check if it's a 401 Unauthorized
          if (error.status === 401) {
            return throwError(() => error);
          }
          
          // For other errors
          return throwError(() => error);
        })
      );
  }

  register(userData: RegisterRequest): Observable<User> {
    console.log('Sending registration data:', userData);
    // Log the full URL for debugging
    const url = `${this.apiUrl}/register`;
    console.log('Registration URL:', url);
    
    // Add headers for CORS and content type
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
    
    return this.http.post<AuthResponse>(url, userData, { headers }).pipe(
      map(response => {
        // For registration, we typically don't auto-login the user
        console.log('Registration successful:', response);
        
        // Convert backend response format to User object if needed
        let user: User;
        
        if (response.user) {
          // If response already has a user object, use it
          user = response.user;
        } else if (response.id && response.email) {
          // If response has user properties directly, create a User object
          user = {
            id: response.id,
            nom: response.nom || '',
            email: response.email,
            role: response.role || '',
            userType: response.userType || response.role || '', // Use userType if available, fall back to role
            dateInscription: response.dateInscription ? new Date(response.dateInscription) : new Date()
          };
        } else {
          // If we don't have user data but registration was successful,
          // create a minimal user object with the data we sent
          user = {
            id: 0, // We don't know the ID yet
            nom: userData.nom,
            email: userData.email,
            role: userData.userType,
            userType: userData.userType,
            dateInscription: userData.dateInscription
          };
          console.log('Created minimal user object from request data:', user);
        }
        
        return user;
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('Registration error:', error);
        
        // Check if it's a network error
        if (error.status === 0) {
          return throwError(() => new Error('Network error - please check if the backend server is running'));
        }
        
        // For other errors
        return throwError(() => error);
      })
    );
  }

  logout(): void {
    // Remove user from local storage and set current user to null
    localStorage.removeItem('currentUser');
    localStorage.removeItem('token');
    localStorage.removeItem('tokenExpiration');
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
    
    if (this.tokenExpirationTimer) {
      clearTimeout(this.tokenExpirationTimer);
    }
    this.tokenExpirationTimer = null;
  }

  autoLogin(): void {
    try {
      const userData = this.getUserFromLocalStorage();
      const expirationDate = localStorage.getItem('tokenExpiration');
      const token = localStorage.getItem('token');
      
      console.log('Auto login - User data:', userData ? 'Found' : 'Not found');
      console.log('Auto login - Token:', token ? 'Found' : 'Not found');
      console.log('Auto login - Expiration:', expirationDate ? 'Found' : 'Not found');
      
      if (!userData || !expirationDate || !token) {
        console.log('Auto login failed - Missing data');
        // Clean up any partial data
        this.cleanupStorageData();
        return;
      }
      
      try {
        const expirationTimestamp = new Date(expirationDate).getTime();
        const now = new Date().getTime();
        const expiresIn = expirationTimestamp - now;
        
        console.log('Token expires in:', Math.floor(expiresIn / 1000), 'seconds');
        
        if (expiresIn > 0) {
          this.currentUserSubject.next(userData);
          this.autoLogout(expiresIn);
          console.log('Auto login successful');
        } else {
          console.log('Token expired, logging out');
          this.logout();
        }
      } catch (e) {
        console.error('Error processing expiration date:', e);
        this.cleanupStorageData();
      }
    } catch (e) {
      console.error('Unexpected error in autoLogin:', e);
      this.cleanupStorageData();
    }
  }
  
  private cleanupStorageData(): void {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('token');
    localStorage.removeItem('tokenExpiration');
    this.currentUserSubject.next(null);
  }

  autoLogout(expirationDuration: number): void {
    this.tokenExpirationTimer = setTimeout(() => {
      this.logout();
    }, expirationDuration);
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  isAuthenticated(): boolean {
    return !!this.currentUserValue;
  }

  hasRole(role: string): boolean {
    // Check both role and userType fields for backward compatibility
    return this.currentUserValue?.role === role || this.currentUserValue?.userType === role;
  }

  isAdmin(): boolean {
    return this.hasRole('ADMIN');
  }

  isAnnonceur(): boolean {
    return this.hasRole('ANNONCEUR');
  }

  isPaneliste(): boolean {
    return this.hasRole('PANELISTE');
  }

  // Check if user has super admin privileges (can access advanced stats)
 /* isSuperAdmin(): boolean {
    const user = this.currentUserValue;
    if (!user || !this.isAdmin()) {
      return false;
    }
    
    // Check if admin has specific permissions for advanced features
    // This could be based on permissions array or specific admin properties
    if (user && 'permissions' in user) {
      const admin = user as Admin;
      return admin.permissions?.includes('SUPER_ADMIN') || 
             admin.permissions?.includes('VIEW_ADVANCED_STATS') ||
             admin.permissions?.includes('ALL_PERMISSIONS');
    }
    
    // For now, assume all admins have basic access but not super admin
    // This can be refined based on your backend permission system
    return false;
  }*/

  private setAuthData(authData: AuthResponse): void {
    try {
      // First clear any existing data
      this.cleanupStorageData();
      
      // Validate user object
      if (!authData.user || !authData.user.id || !authData.user.email) {
        console.error('Invalid user object in auth response:', authData.user);
        throw new Error('Invalid user data received');
      }
      
      // Store user data
      const userJson = JSON.stringify(authData.user);
      localStorage.setItem('currentUser', userJson);
      console.log('User data stored:', userJson);
      
      // Store token
      localStorage.setItem('token', authData.token);
      console.log('Token stored:', authData.token.substring(0, 10) + '...');
      
      // Calculate and store expiration date
      let expiresInMs = 3600 * 1000; // Default to 1 hour if not provided
      
      if (authData.expiresIn) {
        expiresInMs = typeof authData.expiresIn === 'number' ? 
          authData.expiresIn : 
          parseInt(authData.expiresIn as any, 10) * 1000; // Convert to milliseconds if needed
      }
        
      const expirationDate = new Date(new Date().getTime() + expiresInMs);
      localStorage.setItem('tokenExpiration', expirationDate.toISOString());
      console.log('Token expiration set to:', expirationDate.toISOString());
    } catch (e) {
      console.error('Error setting auth data:', e);
      this.cleanupStorageData();
      throw e;
    }
  }

  private getUserFromLocalStorage(): User | null {
    const userJson = localStorage.getItem('currentUser');
    if (userJson && userJson !== 'undefined' && userJson !== 'null') {
      try {
        return JSON.parse(userJson);
      } catch (e) {
        console.error('Error parsing user data from localStorage', e);
        // Clean up invalid data
        localStorage.removeItem('currentUser');
        return null;
      }
    }
    // Clean up if we have invalid values
    if (userJson === 'undefined' || userJson === 'null') {
      localStorage.removeItem('currentUser');
    }
    return null;
  }
}