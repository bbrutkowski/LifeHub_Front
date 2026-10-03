import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { Observable } from 'rxjs';

export interface LoginResponse {
  token?: string;
  accessToken?: string;
  refreshToken?: string;
  userId: string;
  username: string;
  email?: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  timezone: string;
  city: string;
  currency: string;
  dateFormat: string;
  weekStartsOn: string;
  createdAt: string;
}

export interface UserSession {
  id: string;
  createdAt: string;
  expiresAt: string;
  isActive: boolean;
  isCurrent: boolean;
}

export interface ApiMessageResponse {
  message: string;
}

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private readonly _basePath = 'api/user';

  constructor(private _apiService: ApiService) {}

  storeUserData(loginResponse: LoginResponse): void {
    localStorage.setItem('userId', loginResponse.userId);
    localStorage.setItem('username', loginResponse.username);
    localStorage.setItem('email', loginResponse.email || '');
  }

  registerUser(name: string, email: string, password: string): Observable<ApiMessageResponse> {
    return this._apiService.post<ApiMessageResponse>(`${this._basePath}/register`, { name, email, password });
  }

  login(email: string, password: string): Observable<LoginResponse> {
    return this._apiService.post<LoginResponse>(`${this._basePath}/login`, { email, password });
  }

  resetPassword(email: string): Observable<ApiMessageResponse> {
    return this._apiService.post<ApiMessageResponse>(`${this._basePath}/resetPassword`, { email });
  }

  getUser(id: string): Observable<UserProfile> {
    return this._apiService.get<UserProfile>(`${this._basePath}/${id}`);
  }

  updateUserProfile(id: string, profile: Omit<UserProfile, 'id' | 'avatarUrl' | 'createdAt'>): Observable<UserProfile> {
    return this._apiService.put<UserProfile>(`${this._basePath}/${id}`, profile);
  }

  changePassword(currentPassword: string, newPassword: string): Observable<void> {
    return this._apiService.post<void>(`${this._basePath}/changePassword`, { currentPassword, newPassword });
  }

  uploadAvatar(file: File): Observable<UserProfile> {
    const formData = new FormData();
    formData.append('file', file);
    return this._apiService.post<UserProfile>(`${this._basePath}/avatar`, formData);
  }

  deleteAvatar(): Observable<void> {
    return this._apiService.delete<void>(`${this._basePath}/avatar`);
  }

  getSessions(): Observable<UserSession[]> {
    return this._apiService.get<UserSession[]>(`${this._basePath}/sessions`);
  }

  revokeSession(id: string): Observable<void> {
    return this._apiService.delete<void>(`${this._basePath}/sessions/${id}`);
  }

  revokeOtherSessions(): Observable<void> {
    return this._apiService.delete<void>(`${this._basePath}/sessions`);
  }

  exportData(): Observable<Blob> {
    return this._apiService.getBlob(`${this._basePath}/export`);
  }

  logoutCurrentSession(): Observable<void> {
    return this._apiService.post<void>(`${this._basePath}/logout`, {});
  }

  deactivateAccount(currentPassword: string): Observable<void> {
    return this._apiService.post<void>(`${this._basePath}/deactivate`, { currentPassword });
  }
}
