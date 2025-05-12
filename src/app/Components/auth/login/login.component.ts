import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormGroup, ReactiveFormsModule ,FormBuilder ,Validators} from '@angular/forms';
import { RouterLink,Router ,ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule,ReactiveFormsModule,RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  loginForm: FormGroup
  loading = false
  submitted = false
  error = ""

  constructor(
    private formBuilder: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
  //  private authService: AuthService,
  ) {
    this.loginForm = this.formBuilder.group({
      email: ["", [Validators.required, Validators.email]],
      password: ["", [Validators.required, Validators.minLength(6)]],
    })
  }

  get f() {
    return this.loginForm.controls
  }

 /* onSubmit() {
    this.submitted = true

    if (this.loginForm.invalid) {
      return
    }

    this.loading = true
    this.error = ""

    this.authService.login(this.f["email"].value, this.f["password"].value).subscribe({
      next: () => {
        const returnUrl = this.route.snapshot.queryParams["returnUrl"] || "/dashboard"
        this.router.navigateByUrl(returnUrl)
      },
      error: (error) => {
        this.error = error.error?.message || "Invalid credentials"
        this.loading = false
      },
    })
  }
*/
}
