import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormGroup, FormBuilder, Validators } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { AuthService, RegisterRequest } from '../../../Services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent implements OnInit {
  registerForm: FormGroup;
  loading = false;
  submitted = false;
  error = "";

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private authService: AuthService,
  ) {
    this.registerForm = this.formBuilder.group(
      {
        nom: ["", Validators.required],
        email: ["", [Validators.required, Validators.email]],
        motDePasse: ["", [Validators.required, Validators.minLength(6)]],
        confirmPassword: ["", Validators.required],
        userType: ["", Validators.required], // Changed from role to userType
        entreprise: [""],
        interets: [""],
        permissions: [""],
      },
      {
        validators: this.mustMatch("motDePasse", "confirmPassword"),
      },
    );
    
    // Redirect to home if already logged in
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/']);
    }
  }

  ngOnInit(): void {
    // Initialize form validation based on default role
    this.onRoleChange();
  }

  get f() {
    return this.registerForm.controls;
  }

  mustMatch(controlName: string, matchingControlName: string) {
    return (formGroup: FormGroup) => {
      const control = formGroup.controls[controlName];
      const matchingControl = formGroup.controls[matchingControlName];

      if (matchingControl.errors && !matchingControl.errors["mustMatch"]) {
        return;
      }

      if (control.value !== matchingControl.value) {
        matchingControl.setErrors({ mustMatch: true });
      } else {
        matchingControl.setErrors(null);
      }
    };
  }

  onRoleChange() {
    const userType = this.f["userType"].value;

    if (userType === "ANNONCEUR") {
      this.f["entreprise"].setValidators(Validators.required);
      this.f["interets"].clearValidators();
      this.f["permissions"].clearValidators();
    } else if (userType === "PANELISTE") {
      this.f["interets"].setValidators(Validators.required);
      this.f["entreprise"].clearValidators();
      this.f["permissions"].clearValidators();
    } else if (userType === "ADMIN") {
      this.f["permissions"].setValidators(Validators.required);
      this.f["entreprise"].clearValidators();
      this.f["interets"].clearValidators();
    } else {
      this.f["entreprise"].clearValidators();
      this.f["interets"].clearValidators();
      this.f["permissions"].clearValidators();
    }

    this.f["entreprise"].updateValueAndValidity();
    this.f["interets"].updateValueAndValidity();
    this.f["permissions"].updateValueAndValidity();
  }

  public onSubmit() {
    this.submitted = true;

    if (this.registerForm.invalid) {
      return;
    }

    this.loading = true;
    this.error = "";

    // Create a temporary form data object without type annotation
    const formData = { ...this.registerForm.value };
    // Remove confirmPassword as it's not part of RegisterRequest
    delete formData.confirmPassword;
    
    // Now assign to properly typed variable
    const userData: RegisterRequest = formData;

    // Handle field-specific logic based on user type
    if (userData.userType === "PANELISTE") {
      // Convert interests string to array if provided
      if (userData.interets && typeof userData.interets === 'string' && userData.interets.trim()) {
        userData.interets = userData.interets.split(",").map(interets => interets.trim()).filter(i => i.length > 0);
      } else {
        userData.interets = [];
      }
      // Remove fields not needed for PANELISTE
      delete userData.entreprise;
      delete userData.permissions;
    } else if (userData.userType === "ANNONCEUR") {
      // Keep entreprise field, remove others
      if (!userData.entreprise || !userData.entreprise.trim()) {
        userData.entreprise = "";
      }
      delete userData.interets;
      delete userData.permissions;
    } else if (userData.userType === "ADMIN") {
      // Convert permissions string to array if provided
      if (userData.permissions && typeof userData.permissions === 'string' && userData.permissions.trim()) {
        userData.permissions = userData.permissions.split(",").map(permission => permission.trim()).filter(p => p.length > 0);
      } else {
        userData.permissions = [];
      }
      // Remove fields not needed for ADMIN
      delete userData.entreprise;
      delete userData.interets;
    } else {
      // For unknown user types, remove all optional fields
      delete userData.entreprise;
      delete userData.interets;
      delete userData.permissions;
    }

    // Set date of registration
    userData.dateInscription = new Date();
    
    // Log the final request data
    console.log('Final registration data:', JSON.stringify(userData, null, 2));
    console.log('User type:', userData.userType);
    console.log('Fields included:', Object.keys(userData));

    this.authService.register(userData).subscribe({
      next: (user) => {
        console.log('Registration successful, user:', user);
        this.router.navigate(["/login"], { queryParams: { registered: true } });
      },
      error: (error) => {
        console.error('Registration error:', error);
        if (error.status === 200 || error.status === 201) {
          // If we get a success status code but it was caught as an error due to response format
          console.log('Registration appears successful despite error, redirecting to login');
          this.router.navigate(["/login"], { queryParams: { registered: true } });
        } else {
          this.error = error.error?.message || error.message || "Registration failed";
          this.loading = false;
        }
      },
    });
  }
}
