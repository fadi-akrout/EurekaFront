import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormGroup, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterLink, Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../Services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  loading = false;
  submitted = false;
  error = "";
  returnUrl: string = '/dashboard';

  constructor(
    private formBuilder: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService
  ) {
    this.loginForm = this.formBuilder.group({
      email: ["", [Validators.required, Validators.email]],
      motDePasse: ["", [Validators.required, Validators.minLength(6)]],
    });
    
    // Redirect to home if already logged in
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/']);
    }
  }

  ngOnInit(): void {
    // Get return url from route parameters or default to '/dashboard'
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';
    
    // Show success message if registered
    if (this.route.snapshot.queryParams['registered']) {
      // You could add a success message here
    }
  }

  get f() {
    return this.loginForm.controls;
  }

  onSubmit() {
    this.submitted = true;

    if (this.loginForm.invalid) {
      return;
    }

    this.loading = true;
    this.error = "";

    const email = this.f["email"].value;
    const password = this.f["motDePasse"].value;
    
    console.log('Login form submitted with:', { email, password: '***' });

    this.authService.login(email, password).subscribe({
      next: (user) => {
        console.log('Login successful, user:', user);
        
        // Verify user object has required properties
        if (!user || !user.role) {
          console.error('Invalid user object returned from login:', user);
          this.error = "Invalid user data received from server";
          this.loading = false;
          return;
        }
        
        console.log('Current user role:', user.role);
        console.log('Is admin:', this.authService.isAdmin());
        console.log('Is annonceur:', this.authService.isAnnonceur());
        console.log('Is paneliste:', this.authService.isPaneliste());
        
        // Add a small delay to ensure auth state is fully updated
        setTimeout(() => {
          // Navigate based on user role
          if (this.authService.isAdmin()) {
            console.log('Navigating to admin dashboard');
            this.router.navigate(['/dashboard']).then(success => {
              console.log('Navigation result:', success ? 'successful' : 'failed');
              this.loading = false;
            }).catch(err => {
              console.error('Navigation error:', err);
              this.loading = false;
            });
          } else if (this.authService.isAnnonceur()) {
            console.log('Navigating to campaigns');
            this.router.navigate(['/campaigns']).then(success => {
              console.log('Navigation result:', success ? 'successful' : 'failed');
              this.loading = false;
            }).catch(err => {
              console.error('Navigation error:', err);
              this.loading = false;
            });
          } else if (this.authService.isPaneliste()) {
            console.log('Navigating to paneliste dashboard');
            this.router.navigate(['/dashboard']).then(success => {
              console.log('Navigation result:', success ? 'successful' : 'failed');
              this.loading = false;
            }).catch(err => {
              console.error('Navigation error:', err);
              this.loading = false;
            });
          } else {
            console.log('Navigating to default return URL:', this.returnUrl);
            this.router.navigate([this.returnUrl]).then(success => {
              console.log('Navigation result:', success ? 'successful' : 'failed');
              this.loading = false;
            }).catch(err => {
              console.error('Navigation error:', err);
              this.loading = false;
            });
          }
        }, 100);
      },
      error: (error) => {
        console.error('Login error:', error);
        
        // More detailed error message
        if (error.error) {
          console.error('Error details:', error.error);
          this.error = error.error.message || 
                      (typeof error.error === 'string' ? error.error : "Invalid credentials");
        } else {
          this.error = error.message || "An error occurred during login";
        }
        
        this.loading = false;
      },
    });
  }
}
