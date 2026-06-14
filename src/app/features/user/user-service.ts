import { Injectable } from '@angular/core';
import { ApiService } from '../../core/services/api.service';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private _basePath = 'api/user';

  constructor(private _apiService: ApiService) {}

  storeUserData(userId: string, username: string): void {
    localStorage.setItem('userId', userId);
    localStorage.setItem('username', username);
  }

  registerUser(name: string, email: string, password: string): Observable<any> {
    return this._apiService.post(`${this._basePath}/register`, { name, email, password });
  }

  login(email: string, password: string): Observable<any> {
    return this._apiService.post(`${this._basePath}/login`, { email, password });
  }

  getUser(id: string): Observable<any> {
    return this._apiService.get(`${this._basePath}/${id}`);
  }

  updateUserProfile(id: string, name: string, email: string): Observable<any> {
    return this._apiService.put(`${this._basePath}/${id}`, { name, email });
  }
}
