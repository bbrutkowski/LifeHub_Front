import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private baseUrl = environment.apiBaseUrl;

  constructor(private http: HttpClient) {}

  private buildUrl(path: string) {
    if (path.startsWith('http')) return path;
    return `${this.baseUrl}${path.startsWith('/') ? '' : '/'}${path}`;
  }

  get<T>(path: string, params?: HttpParams, headers?: HttpHeaders): Observable<T> {
    return this.http.get<T>(this.buildUrl(path), { params, headers });
  }

  post<T>(path: string, body: any, params?: HttpParams, headers?: HttpHeaders): Observable<T> {
    return this.http.post<T>(this.buildUrl(path), body, { params, headers });
  }

  put<T>(path: string, body: any, params?: HttpParams, headers?: HttpHeaders): Observable<T> {
    return this.http.put<T>(this.buildUrl(path), body, { params, headers });
  }

  delete<T>(path: string, params?: HttpParams, headers?: HttpHeaders): Observable<T> {
    return this.http.delete<T>(this.buildUrl(path), { params, headers });
  }
}
