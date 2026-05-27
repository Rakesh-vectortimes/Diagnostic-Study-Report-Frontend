import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, catchError, of, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../../shared/models/api-response.model';
import {
  AuthTokenResponse,
  LoginRequest,
  RegisterRequest,
  User,
} from '../../shared/models/user.model';
import { TokenService } from './token.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly tokenService = inject(TokenService);
  private readonly baseUrl = `${environment.apiBaseUrl}/auth`;

  readonly currentUser = signal<User | null>(null);

  login(credentials: LoginRequest): Observable<ApiResponse<AuthTokenResponse>> {
    return this.http
      .post<ApiResponse<AuthTokenResponse>>(`${this.baseUrl}/login`, credentials)
      .pipe(
        tap((res) => {
          if (res.success && res.data?.access_token) {
            this.tokenService.setTokens(res.data.access_token, res.data.refresh_token);
            if (res.data.user) {
              this.currentUser.set(this.normalizeUser(res.data.user));
            }
          }
        })
      );
  }

  register(payload: RegisterRequest): Observable<ApiResponse<User>> {
    return this.http.post<ApiResponse<User>>(`${this.baseUrl}/register`, payload);
  }

  getCurrentUser(): Observable<User | null> {
    if (!this.isLoggedIn()) {
      return of(null);
    }
    return this.http.get<ApiResponse<User>>(`${this.baseUrl}/me`).pipe(
      tap((res) => {
        if (res.success) {
          this.currentUser.set(this.normalizeUser(res.data));
        }
      }),
      map((res) => (res.success ? res.data : null)),
      catchError(() => {
        this.logout();
        return of(null);
      })
    );
  }

  loadCurrentUser(): void {
    if (this.isLoggedIn()) {
      this.getCurrentUser().subscribe();
    }
  }

  logout(callApi = true): void {
    const refreshToken = this.tokenService.getRefreshToken();

    if (callApi && refreshToken) {
      this.http
        .post(`${this.baseUrl}/logout`, { refresh_token: refreshToken })
        .subscribe({ complete: () => this.clearSession(), error: () => this.clearSession() });
      return;
    }

    this.clearSession();
  }

  private clearSession(): void {
    this.tokenService.removeToken();
    this.currentUser.set(null);
    this.router.navigate(['/login']);
  }

  isLoggedIn(): boolean {
    return !!this.tokenService.getToken();
  }

  private normalizeUser(user: User): User {
    const id = user.id ?? user.user_id ?? user._id;
    return {
      ...user,
      id: id ?? '',
    };
  }
}
