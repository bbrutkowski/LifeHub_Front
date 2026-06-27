import { Component, DestroyRef, inject } from '@angular/core';
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
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { UserService } from '../../user/user-service';
import { NotificationService } from '../../../core/services/notification.service';
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
    MatSnackBarModule,
    ThemeToggle
  ],
  templateUrl: './login.html',
  styleUrls: ['./login.css'],
})
export class Login {
  private destroyRef = inject(DestroyRef);

  loginForm: FormGroup;
  signupForm: FormGroup;
  resetPasswordForm: FormGroup;

  isSignUp = false;
  showForgotPasswordForm = false;
  loading = false;
  resetLoading = false;

  constructor(
    private fb: FormBuilder,
    private _userService: UserService,
    private _auth: AuthService,
    private _router: Router,
    private _notification: NotificationService
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

  openForgotPassword() {
    this.showForgotPasswordForm = true;
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
  }

  submitLogin() {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.loading = true;

    const { email, password } = this.loginForm.value as { email: string; password: string };

    this._userService.login(email, password).pipe(
      tap(response => {
        const accessToken = response?.token || response?.accessToken;
        if (!accessToken) {
          throw new Error('No access token received');
        }
        this._auth.setSession(accessToken, response.refreshToken);
        this._userService.storeUserData(response.userId, response.username);
      }),
      finalize(() => {
        this.loading = false;
      })
      ).subscribe({
        next: () => {
          this._notification.success('Login successful. Welcome back!');
          this._router.navigate(['/dashboard']);
        },
        error: err => {
          this._notification.error(
            err?.error?.message ??
            err?.message ??
            'Login failed'
          );
        }
      });
  }

  submitSignUp() {
    if (this.signupForm.invalid) {
      this.signupForm.markAllAsTouched();
      return;
    }

    this.loading = true;

    const { name, email, password } = this.signupForm.value as {
      name: string;
      email: string;
      password: string;
    };

    this._userService.registerUser(name, email, password).subscribe({
      next: () => {
        this._notification.success('Account created successfully! Please sign in.');
        this.signupForm.reset();
        this.loading = false;
        timer(2000).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
          this.openSignIn();
        });
      },
      error: (err) => {
        this._notification.error(err?.error?.message ?? err?.message ?? 'Registration failed');
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

    const { email } = this.resetPasswordForm.value as { email: string };

    this._userService.resetPassword(email).pipe(
      finalize(() => {
        this.resetLoading = false;
      })
    ).subscribe({
      next: () => {
        this._notification.success('Password reset instructions have been sent.');
        timer(2500).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
          this.openSignIn();
        });
      },
      error: (err) => {
        this._notification.error(
          err?.error?.message ??
          err?.message ??
          'Sending reset instructions failed'
        );
      },
    });
  }

}
