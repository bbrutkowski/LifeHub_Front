import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, map, throwError } from 'rxjs';
import { ApiService } from './api.service';
import { HttpHeaders } from '@angular/common/http';

type RefreshTokenResponse = {
  token?: string;
  accessToken?: string;
  refreshToken?: string;
};

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly accessTokenKey = 'access_token';
  private readonly refreshTokenKey = 'refresh_token';
  private readonly skipAuthHeader = 'X-Skip-Auth';
  private readonly refreshPath = 'api/user/refreshToken';

  constructor(
    private router: Router,
    private apiService: ApiService,
  ) {}

  getToken(): string | null {
    return this.getAccessToken();
  }

  getAccessToken(): string | null {
    try {
      return localStorage.getItem(this.accessTokenKey);
    } catch {
      return null;
    }
  }

  getRefreshToken(): string | null {
    try {
      return localStorage.getItem(this.refreshTokenKey);
    } catch {
      return null;
    }
  }

  setToken(token: string) {
    try {
      localStorage.setItem(this.accessTokenKey, token);
    } catch {
      // Ignore storage failures and keep app running.
    }
  }

  setRefreshToken(token: string) {
    try {
      localStorage.setItem(this.refreshTokenKey, token);
    } catch {
      // Ignore storage failures and keep app running.
    }
  }

  setSession(loginResponse: { token?: string; accessToken?: string; refreshToken?: string }) {
    const accessToken = loginResponse.token || loginResponse.accessToken;
    const refreshToken = loginResponse.refreshToken;

    this.setToken(accessToken || '');
    if (refreshToken) {
      this.setRefreshToken(refreshToken);
    }
  }
  
  clearToken() {
    this.clearSession();
  }

  clearSession() {
    try {
      localStorage.removeItem(this.accessTokenKey);
      localStorage.removeItem(this.refreshTokenKey);
      localStorage.removeItem('userId');
      localStorage.removeItem('username');
    } catch {
      // Ignore storage failures and keep app running.
    }
  }

  isAuthenticated(): boolean {
    return !!this.getAccessToken();
  }

  refreshAccessToken(): Observable<string> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      return throwError(() => new Error('Missing refresh token'));
    }

    const headers = new HttpHeaders({ [this.skipAuthHeader]: 'true' });

    return this.apiService
      .post<RefreshTokenResponse>(this.refreshPath, { refreshToken }, undefined, headers)
      .pipe(
        map((response) => {
          const nextAccessToken = response.token || response.accessToken;
          if (!nextAccessToken) {
            throw new Error('Refresh response does not include access token');
          }

          this.setToken(nextAccessToken);
          if (response.refreshToken) {
            this.setRefreshToken(response.refreshToken);
          }

          return nextAccessToken;
        }),
      );
  }

  logout(redirect: string = '/login') {
    this.clearSession();
    this.router.navigate([redirect]);
  }
}
