import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { Router } from '@angular/router';
import { AuthUser, LoginRequest, LoginResponse } from '../models';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly API = `${environment.apiUrl}/auth`;
  private userSubject = new BehaviorSubject<AuthUser | null>(null);
  user$ = this.userSubject.asObservable();

  constructor(private http: HttpClient, private router: Router) {
    const stored = localStorage.getItem('auth_user');
    if (stored) {
      try { this.userSubject.next(JSON.parse(stored)); } catch { localStorage.clear(); }
    }
  }

  get currentUser(): AuthUser | null { return this.userSubject.value; }
  get isLoggedIn(): boolean { return !!this.userSubject.value; }
  get isFactory(): boolean { return !!this.userSubject.value?.isFactory; }
  get isAdmin(): boolean { return !!this.userSubject.value?.isAdmin; }

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.API}/login`, credentials).pipe(
      tap(res => {
        localStorage.setItem('auth_token', res.token);
        localStorage.setItem('auth_user', JSON.stringify(res.store));
        this.userSubject.next(res.store);
      })
    );
  }

  logout() {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    this.userSubject.next(null);
    this.router.navigate(['/login']);
  }

  getToken(): string | null { return localStorage.getItem('auth_token'); }
  changePassword(currentPassword: string, newPassword: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.API}/change-password`, { currentPassword, newPassword });
  }
}
