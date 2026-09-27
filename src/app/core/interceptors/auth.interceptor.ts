import { Injectable } from '@angular/core';
import {
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable, ReplaySubject, throwError } from 'rxjs';
import { catchError, finalize, switchMap, take, tap } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private isRefreshing = false;
  private refreshTokenSubject = new ReplaySubject<string>(1);
  private readonly skipAuthHeader = 'X-Skip-Auth';

  constructor(private auth: AuthService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (this.shouldSkipAuth(req)) {
      const cleanHeaders = req.headers.delete(this.skipAuthHeader);
      return next.handle(req.clone({ headers: cleanHeaders }));
    }

    const token = this.auth.getAccessToken();
    const cloned = token ? this.addAuthorizationHeader(req, token) : req;

    return next.handle(cloned).pipe(catchError((err: HttpErrorResponse) => this.handleAuthError(err, req, next)));
  }

  private handleAuthError(err: HttpErrorResponse, req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (err.status !== 401 || this.isAuthEndpoint(req.url)) {
      return throwError(() => err);
    }

    const refreshToken = this.auth.getRefreshToken();
    if (!refreshToken) {
      this.auth.logout();
      return throwError(() => err);
    }

    if (this.isRefreshing) {
      return this.refreshTokenSubject.pipe(
        take(1),
        switchMap((newToken) => next.handle(this.addAuthorizationHeader(req, newToken))),
      );
    }

    this.isRefreshing = true;
    this.refreshTokenSubject = new ReplaySubject<string>(1);

    return this.auth.refreshAccessToken().pipe(
      tap((newToken) => {
        this.refreshTokenSubject.next(newToken);
        this.refreshTokenSubject.complete();
      }),
      catchError((refreshErr) => {
        this.refreshTokenSubject.error(refreshErr);
        if (!(refreshErr instanceof HttpErrorResponse) || refreshErr.status === 401) {
          this.auth.logout();
        }
        return throwError(() => refreshErr);
      }),
      switchMap((newToken) =>
        next.handle(this.addAuthorizationHeader(req, newToken)).pipe(
          catchError((retryErr: HttpErrorResponse) => {
            if (retryErr.status === 401) {
              this.auth.logout();
            }
            return throwError(() => retryErr);
          }),
        ),
      ),
      finalize(() => {
        this.isRefreshing = false;
      }),
    );
  }

  private addAuthorizationHeader(req: HttpRequest<any>, token: string): HttpRequest<any> {
    return req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  private shouldSkipAuth(req: HttpRequest<any>): boolean {
    return req.headers.has(this.skipAuthHeader);
  }

  private isAuthEndpoint(url: string): boolean {
    return (
      url.includes('/login') ||
      url.includes('/register') ||
      url.includes('/resetPassword') ||
      url.includes('/refreshToken')
    );
  }
}
