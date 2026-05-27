export type UserRole = 'admin' | 'consultant' | 'company_user';

export interface User {
  id: number | string;
  _id?: number | string;
  user_id?: number | string;
  name: string;
  email: string;
  mobile_number?: string;
  role: UserRole;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  mobile_number: string;
  password: string;
  role: UserRole;
}

export interface AuthTokenResponse {
  access_token: string;
  refresh_token?: string;
  token_type?: string;
  user?: User;
}
