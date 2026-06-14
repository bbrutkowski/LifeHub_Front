import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ThemeToggle } from '../../../core/components/theme-toggle/theme-toggle';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { UserService } from '../../user/user-service';
import { finalize, map, tap } from 'rxjs';

@Component({
  standalone: true,
  selector: 'app-login',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    ThemeToggle
  ],
  templateUrl: './login.html',
  styleUrls: ['./login.css'],
})
export class Login {
  loginForm: FormGroup;
  signupForm: FormGroup;

  isSignUp = false;
  loading = false;
  loginError: string | null = null;
  registerError: string | null = null;
  successMessage: string | null = null;

  constructor(
    private fb: FormBuilder,
    private _userService: UserService,
    private _auth: AuthService,
    private _router: Router
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });

    this.signupForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],
    }, { validators: this.passwordMatchValidator });
  }

  passwordMatchValidator(group: FormGroup): { [key: string]: any } | null {
    const password = group.get('password')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    return password === confirmPassword ? null : { passwordMismatch: true };
  }

  toggleMode() {
    this.isSignUp = !this.isSignUp;
    this.loginError = null;
    this.registerError = null;
    this.successMessage = null;
  }

  get currentForm(): FormGroup {
    return this.isSignUp ? this.signupForm : this.loginForm;
  }

  submitLogin() {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.loginError = null;

    const { email, password } = this.loginForm.value as { email: string; password: string };

    this._userService.login(email, password).pipe(
      tap(response => {
        if (!response?.token) {
          throw new Error('No token received');
        }
        this._auth.setToken(response.token);
        this._userService.storeUserData(response.userId, response.username);
      }),
      finalize(() => {
        this.loading = false;
      })
      ).subscribe({
        next: () => {
          this._router.navigate(['/dashboard']);
        },
        error: err => {
          this.loginError =
            err?.error?.message ??
            err?.message ??
            'Login failed';
        }
      });
  }

  submitSignUp() {
    if (this.signupForm.invalid) {
      this.signupForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.registerError = null;

    const { name, email, password } = this.signupForm.value as {
      name: string;
      email: string;
      password: string;
    };

    this._userService.registerUser(name, email, password).subscribe({
      next: (res) => {
        this.successMessage = 'Account created successfully! Please sign in.';
        this.signupForm.reset();
        setTimeout(() => {
          this.isSignUp = false;
          this.successMessage = null;
        }, 2000);
        this.loading = false;
      },
      error: (err) => {
        this.registerError = err?.error?.message ?? err?.message ?? 'Registration failed';
        this.loading = false;
      },
    });
  }

  submit() {
    if (this.isSignUp) {
      this.submitSignUp();
    } else {
      this.submitLogin();
    }
  }
}
