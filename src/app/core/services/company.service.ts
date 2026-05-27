import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../../shared/models/api-response.model';
import { Company, CompanyStatus, Country, EntityId } from '../../shared/models/company.model';

type ListResponse<T> = T[] | {
  items?: T[];
  results?: T[];
  data?: T[];
  companies?: T[];
  countries?: T[];
  total?: number;
  page?: number;
  limit?: number;
  pages?: number;
};
type CountryResponse = Country[] | ApiResponse<ListResponse<Country>> | { countries?: Country[] };

export interface CompanyQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: CompanyStatus | '';
  location?: string;
}

export interface PaginatedCompanies {
  items: Company[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

@Injectable({ providedIn: 'root' })
export class CompanyService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/companies`;
  private readonly countriesUrl = `${environment.apiBaseUrl}/countries`;

  createCompany(company: Company): Observable<ApiResponse<Company>> {
    return this.http
      .post<ApiResponse<Company>>(this.baseUrl, company)
      .pipe(map((res) => ({ ...res, data: this.normalizeCompany(res.data) })));
  }

  getCompanies(search?: string, page = 1, limit = 10): Observable<ApiResponse<Company[]>> {
    return this.getCompaniesPage({ search, page, limit }).pipe(
      map((res) => ({ ...res, data: res.data.items }))
    );
  }

  getCompaniesPage(query: CompanyQueryParams): Observable<ApiResponse<PaginatedCompanies>> {
    let params = new HttpParams()
      .set('page', query.page || 1)
      .set('limit', query.limit || 10);

    const filters: Record<string, string | undefined> = {
      search: query.search || undefined,
      status: query.status || undefined,
      location: query.location || undefined,
    };

    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        params = params.set(key, value);
      }
    });

    return this.http
      .get<ApiResponse<ListResponse<Company>>>(this.baseUrl, { params })
      .pipe(map((res) => ({ ...res, data: this.toPaginatedCompanies(res, query) })));
  }

  getCompanyById(id: EntityId): Observable<ApiResponse<Company>> {
    return this.http
      .get<ApiResponse<Company>>(`${this.baseUrl}/${id}`)
      .pipe(map((res) => ({ ...res, data: this.normalizeCompany(res.data) })));
  }

  updateCompany(id: EntityId, company: Company): Observable<ApiResponse<Company>> {
    return this.http
      .put<ApiResponse<Company>>(`${this.baseUrl}/${id}`, company)
      .pipe(map((res) => ({ ...res, data: this.normalizeCompany(res.data) })));
  }

  deleteCompany(id: EntityId): Observable<ApiResponse<unknown>> {
    return this.http.delete<ApiResponse<unknown>>(`${this.baseUrl}/${id}`);
  }

  getCountries(search?: string): Observable<Country[]> {
    let params = new HttpParams();
    if (search) {
      params = params.set('search', search);
    }

    return this.http
      .get<CountryResponse>(this.countriesUrl, { params })
      .pipe(map((res) => this.toCountryArray(res)));
  }

  private toArray<T>(data: ListResponse<T> | null | undefined): T[] {
    if (Array.isArray(data)) {
      return data;
    }
    return data?.items || data?.results || data?.data || data?.companies || data?.countries || [];
  }

  private toPaginatedCompanies(
    res: ApiResponse<ListResponse<Company>>,
    query: CompanyQueryParams
  ): PaginatedCompanies {
    const response = res as unknown as Record<string, unknown>;
    const data = res.data as ListResponse<Company> & Record<string, unknown>;
    const companies = this.toArray(res.data).map((company) => this.normalizeCompany(company));
    const page = Number(data?.['page'] ?? response['page'] ?? query.page ?? 1);
    const limit = Number(data?.['limit'] ?? response['limit'] ?? query.limit ?? 10);
    const total = Number(data?.['total'] ?? response['total'] ?? companies.length);
    const pages = Number(data?.['pages'] ?? response['pages'] ?? Math.max(1, Math.ceil(total / limit)));

    return {
      items: companies,
      total,
      page,
      limit,
      pages,
    };
  }

  private normalizeCompany(company: Company): Company {
    const id = company.id ?? company.company_id ?? company.companyId ?? company._id;
    const address = company.address ?? company.location;
    return {
      ...company,
      id,
      company_id: id,
      address,
      location: company.location ?? address,
    };
  }

  private toCountryArray(res: CountryResponse): Country[] {
    if (Array.isArray(res)) {
      return res;
    }

    if ('success' in res) {
      return this.toArray(res.data as ListResponse<Country>);
    }

    return res.countries || [];
  }
}
