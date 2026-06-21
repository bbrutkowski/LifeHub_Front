import { Injectable } from '@angular/core';
import { ApiService } from '../../core/services/api.service';
import { Observable } from 'rxjs';

export interface LoginResponse {
  token: string;
  userId: string;
  username: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
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

  storeUserData(userId: string, username: string): void {
    localStorage.setItem('userId', userId);
    localStorage.setItem('username', username);
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

  updateUserProfile(id: string, name: string, email: string): Observable<UserProfile> {
    return this._apiService.put<UserProfile>(`${this._basePath}/${id}`, { name, email });
  }
}
