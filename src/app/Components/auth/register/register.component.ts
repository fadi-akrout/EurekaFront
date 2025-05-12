import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ReactiveFormsModule ,FormGroup,FormBuilder, Validators} from '@angular/forms';
import { RouterLink,Router } from '@angular/router';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule,ReactiveFormsModule ,RouterLink],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent {
  registerForm: FormGroup
  loading = false
  submitted = false
  error = ""

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
   // private authService: AuthService,
  ) {
    this.registerForm = this.formBuilder.group(
      {
        nom: ["", Validators.required],
        email: ["", [Validators.required, Validators.email]],
        motDePasse: ["", [Validators.required, Validators.minLength(6)]],
        confirmPassword: ["", Validators.required],
        role: ["", Validators.required],
        entreprise: [""],
        interets: [""],
      },
      {
        validators: this.mustMatch("motDePasse", "confirmPassword"),
      },
    )
  }

  get f() {
    return this.registerForm.controls
  }

  mustMatch(controlName: string, matchingControlName: string) {
    return (formGroup: FormGroup) => {
      const control = formGroup.controls[controlName]
      const matchingControl = formGroup.controls[matchingControlName]

      if (matchingControl.errors && !matchingControl.errors["mustMatch"]) {
        return
      }

      if (control.value !== matchingControl.value) {
        matchingControl.setErrors({ mustMatch: true })
      } else {
        matchingControl.setErrors(null)
      }
    }
  }

  onRoleChange() {
    const role = this.f["role"].value

    if (role === "ANNONCEUR") {
      this.f["entreprise"].setValidators(Validators.required)
      this.f["interets"].clearValidators()
    } else if (role === "PANELISTE") {
      this.f["interets"].setValidators(Validators.required)
      this.f["entreprise"].clearValidators()
    } else {
      this.f["entreprise"].clearValidators()
      this.f["interets"].clearValidators()
    }

    this.f["entreprise"].updateValueAndValidity()
    this.f["interets"].updateValueAndValidity()
  }

 /* onSubmit() {
    this.submitted = true

    if (this.registerForm.invalid) {
      return
    }

    this.loading = true
    this.error = ""

    const userData = { ...this.registerForm.value }
    delete userData.confirmPassword

    // Convert interests string to array if role is PANELISTE
    if (userData.role === "PANELISTE" && userData.interets) {
      userData.interets = userData.interets.split(",").map((interest: string) => interest.trim())
    }

    // Set date of registration
    userData.dateInscription = new Date()

    this.authService.register(userData).subscribe({
      next: () => {
        this.router.navigate(["/login"], { queryParams: { registered: true } })
      },
      error: (error) => {
        this.error = error.error?.message || "Registration failed"
        this.loading = false
      },
    })
  }*/

}
