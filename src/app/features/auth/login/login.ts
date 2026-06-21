import { ApplicationRef, Component, DestroyRef, inject } from '@angular/core';
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
import { finalize, tap, timer } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

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
  private destroyRef = inject(DestroyRef);
  private _appRef = inject(ApplicationRef);

  loginForm: FormGroup;
  signupForm: FormGroup;
  resetPasswordForm: FormGroup;

  isSignUp = false;
  showForgotPasswordForm = false;
  loading = false;
  resetLoading = false;
  loginError: string | null = null;
  registerError: string | null = null;
  resetError: string | null = null;
  successMessage: string | null = null;
  resetSuccessMessage: string | null = null;

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

    this.resetPasswordForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
    });
  }

  passwordMatchValidator(group: FormGroup): { [key: string]: any } | null {
    const password = group.get('password')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    return password === confirmPassword ? null : { passwordMismatch: true };
  }

  toggleMode() {
    this.isSignUp = !this.isSignUp;
    this.showForgotPasswordForm = false;
    this.loginError = null;
    this.registerError = null;
    this.resetError = null;
    this.resetSuccessMessage = null;
    this.successMessage = null;
  }

  openForgotPassword() {
    this.showForgotPasswordForm = true;
    this.resetError = null;
    this.resetSuccessMessage = null;
    this.resetPasswordForm.reset({ email: this.loginForm.get('email')?.value ?? '' });
  }

  openSignIn() {
    this.isSignUp = false;
    this.closeForgotPassword();
  }

  openSignUp() {
    this.isSignUp = true;
    this.closeForgotPassword();
  }

  closeForgotPassword() {
    this.showForgotPasswordForm = false;
    this.resetError = null;
    this.resetSuccessMessage = null;
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
        this.loading = false;
        timer(2000).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
          this.successMessage = null;
          this.openSignIn();
          this._appRef.tick();
        });
      },
      error: (err) => {
        this.registerError = err?.error?.message ?? err?.message ?? 'Registration failed';
        this.loading = false;
      },
    });
  }

  submitResetPassword() {
    if (this.resetPasswordForm.invalid) {
      this.resetPasswordForm.markAllAsTouched();
      return;
    }

    this.resetLoading = true;
    this.resetError = null;
    this.resetSuccessMessage = null;

    const { email } = this.resetPasswordForm.value as { email: string };

    this._userService.resetPassword(email).pipe(
      finalize(() => {
        this.resetLoading = false;
      })
    ).subscribe({
      next: () => {
        this.resetSuccessMessage = 'Password reset instructions have been sent.';
        timer(2500).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
          this.resetSuccessMessage = null;
          this.openSignIn();
          this._appRef.tick();
        });
      },
      error: (err) => {
        this.resetError =
          err?.error?.message ??
          err?.message ??
          'Sending reset instructions failed';
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
