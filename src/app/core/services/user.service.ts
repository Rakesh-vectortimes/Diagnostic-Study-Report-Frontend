import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../../shared/models/api-response.model';
import { User } from '../../shared/models/user.model';

type ListResponse<T> = T[] | {
  items?: T[];
  results?: T[];
  data?: T[];
  users?: T[];
};

export interface UpdateProfileRequest {
  name: string;
  email: string;
  mobile_number: string;
}

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/users`;

  getUsers(page = 1, limit = 100, search?: string): Observable<ApiResponse<User[]>> {
    let params = new HttpParams().set('page', page).set('limit', limit);
    if (search) {
      params = params.set('search', search);
    }

    return this.http
      .get<ApiResponse<ListResponse<User>>>(this.baseUrl, { params })
      .pipe(map((res) => ({ ...res, data: this.toArray(res.data).map((user) => this.normalizeUser(user)) })));
  }

  updateUser(id: number | string, payload: UpdateProfileRequest): Observable<ApiResponse<User>> {
    return this.http
      .put<ApiResponse<User>>(`${this.baseUrl}/${id}`, payload)
      .pipe(map((res) => ({ ...res, data: this.normalizeUser(res.data) })));
  }

  private toArray(data: ListResponse<User> | null | undefined): User[] {
    if (Array.isArray(data)) {
      return data;
    }
    return data?.items || data?.results || data?.data || data?.users || [];
  }

  private normalizeUser(user: User): User {
    const id = user.id ?? user.user_id ?? user._id;
    return { ...user, id: id ?? '' };
  }
}
