import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../../shared/models/api-response.model';
import { DiagnosticStudy } from '../../shared/models/diagnostic-study.model';
import { AuthService } from './auth.service';

type ListResponse<T> = T[] | {
  items?: T[];
  results?: T[];
  data?: T[];
  studies?: T[];
  diagnostic_studies?: T[];
  total?: number;
  page?: number;
  limit?: number;
  pages?: number;
};

export interface StudyQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  company_id?: string;
  prepared_by?: string;
  report_date_from?: string;
  report_date_to?: string;
  period_from?: string;
  period_to?: string;
  status?: string;
}

export interface PaginatedStudies {
  items: DiagnosticStudy[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

@Injectable({ providedIn: 'root' })
export class DiagnosticStudyService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);
  private readonly baseUrl = `${environment.apiBaseUrl}/diagnostic-studies`;

  createStudy(study: Partial<DiagnosticStudy>): Observable<ApiResponse<DiagnosticStudy>> {
    return this.http
      .post<ApiResponse<DiagnosticStudy>>(this.baseUrl, study)
      .pipe(map((res) => ({ ...res, data: this.normalizeStudy(res.data) })));
  }

  getStudies(search?: string, status?: string, page = 1, limit = 10): Observable<ApiResponse<DiagnosticStudy[]>> {
    return this.getStudiesPage({ search, status, page, limit }).pipe(
      map((res) => ({ ...res, data: res.data.items }))
    );
  }

  getStudiesPage(query: StudyQueryParams): Observable<ApiResponse<PaginatedStudies>> {
    let params = new HttpParams()
      .set('page', query.page || 1)
      .set('limit', query.limit || 10);

    const filters: Record<string, string | undefined> = {
      search: query.search || undefined,
      company_id: query.company_id || undefined,
      prepared_by: query.prepared_by || undefined,
      report_date_from: query.report_date_from || undefined,
      report_date_to: query.report_date_to || undefined,
      period_from: query.period_from || undefined,
      period_to: query.period_to || undefined,
      status: query.status === 'submitted' ? 'published' : query.status || undefined,
    };

    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        params = params.set(key, value);
      }
    });

    return this.http
      .get<ApiResponse<ListResponse<DiagnosticStudy>>>(this.baseUrl, { params })
      .pipe(map((res) => ({ ...res, data: this.toPaginatedStudies(res, query) })));
  }

  getStudyById(id: number | string): Observable<ApiResponse<DiagnosticStudy>> {
    return this.http
      .get<ApiResponse<DiagnosticStudy>>(`${this.baseUrl}/${id}`)
      .pipe(map((res) => ({ ...res, data: this.normalizeStudy(res.data) })));
  }

  updateStudy(id: number | string, study: Partial<DiagnosticStudy>): Observable<ApiResponse<DiagnosticStudy>> {
    return this.http
      .put<ApiResponse<DiagnosticStudy>>(`${this.baseUrl}/${id}`, study)
      .pipe(map((res) => ({ ...res, data: this.normalizeStudy(res.data) })));
  }

  deleteStudy(id: number | string): Observable<ApiResponse<unknown>> {
    return this.http.delete<ApiResponse<unknown>>(`${this.baseUrl}/${id}`);
  }

  exportPdf(id: number | string): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/${id}/export/pdf`, {
      responseType: 'blob',
    });
  }

  exportWord(id: number | string): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/${id}/export/word`, {
      responseType: 'blob',
    });
  }

  openExportWindow(message: string): Window | null {
    const page = window.open('', '_blank');
    if (!page) {
      return null;
    }

    page.document.write(`
      <!doctype html>
      <html lang="en">
        <head>
          <meta charset="utf-8" />
          <title>Preparing report</title>
          <style>
            body {
              margin: 0;
              min-height: 100vh;
              display: grid;
              place-items: center;
              font-family: Arial, sans-serif;
              background: #f5f7fa;
              color: #263238;
            }
          </style>
        </head>
        <body><p>${this.escapeHtml(message)}</p></body>
      </html>
    `);
    page.document.close();
    return page;
  }

  openPdfInNewTab(blob: Blob, targetWindow?: Window | null): void {
    const file = blob.type === 'application/pdf' ? blob : new Blob([blob], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(file);
    if (targetWindow && !targetWindow.closed) {
      targetWindow.location.href = url;
    } else {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
    setTimeout(() => window.URL.revokeObjectURL(url), 60_000);
  }

  openWordInNewTab(blob: Blob, filename: string, targetWindow?: Window | null): void {
    const file = new Blob([blob], {
      type: blob.type || 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });
    const fileUrl = window.URL.createObjectURL(file);
    const page = targetWindow && !targetWindow.closed ? targetWindow : window.open('', '_blank');

    if (!page) {
      return;
    }

    const safeFilename = this.escapeHtml(filename);
    page.document.write(`
      <!doctype html>
      <html lang="en">
        <head>
          <meta charset="utf-8" />
          <title>${safeFilename}</title>
          <style>
            body {
              margin: 0;
              min-height: 100vh;
              display: grid;
              place-items: center;
              font-family: Arial, sans-serif;
              background: #f5f7fa;
              color: #263238;
            }
            .card {
              max-width: 520px;
              padding: 32px;
              border-radius: 12px;
              background: #fff;
              box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
              text-align: center;
            }
            a {
              display: inline-block;
              margin-top: 16px;
              padding: 10px 18px;
              border-radius: 999px;
              background: #006d8f;
              color: #fff;
              text-decoration: none;
              font-weight: 600;
            }
          </style>
        </head>
        <body>
          <main class="card">
            <h1>Word Report Ready</h1>
            <p>Word files cannot be previewed directly in most browsers. Use the button below when you want to download the report.</p>
            <a href="${fileUrl}" download="${safeFilename}">Download ${safeFilename}</a>
          </main>
        </body>
      </html>
    `);
    page.document.close();
    setTimeout(() => window.URL.revokeObjectURL(fileUrl), 10 * 60_000);
  }

  private escapeHtml(value: string): string {
    return value.replace(/[&<>"']/g, (char) => {
      const entities: Record<string, string> = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
      };
      return entities[char];
    });
  }

  private toArray(data: ListResponse<DiagnosticStudy> | null | undefined): DiagnosticStudy[] {
    if (Array.isArray(data)) {
      return data;
    }
    return data?.items || data?.results || data?.data || data?.studies || data?.diagnostic_studies || [];
  }

  private toPaginatedStudies(
    res: ApiResponse<ListResponse<DiagnosticStudy>>,
    query: StudyQueryParams
  ): PaginatedStudies {
    const response = res as unknown as Record<string, unknown>;
    const data = res.data as ListResponse<DiagnosticStudy> & Record<string, unknown>;
    const studies = this.toArray(res.data).map((study) => this.normalizeStudy(study));
    const page = Number(data?.['page'] ?? response['page'] ?? query.page ?? 1);
    const limit = Number(data?.['limit'] ?? response['limit'] ?? query.limit ?? 10);
    const total = Number(data?.['total'] ?? response['total'] ?? studies.length);
    const pages = Number(data?.['pages'] ?? response['pages'] ?? Math.max(1, Math.ceil(total / limit)));

    return {
      items: studies,
      total,
      page,
      limit,
      pages,
    };
  }

  private normalizeStudy(study: DiagnosticStudy): DiagnosticStudy {
    if (!study) {
      return study;
    }

    const record = study as unknown as Record<string, unknown>;
    const companyBackground = this.sectionDetails(record['company_background']);
    const costPerformance = this.sectionDetails(record['cost_performance']);

    return {
      ...study,
      id: (record['id'] || record['study_id'] || record['_id']) as number | undefined,
      company_name:
        study.company_name ||
        (companyBackground?.['company_name'] as string | undefined) ||
        (record['title'] as string | undefined),
      report_date:
        study.report_date ||
        (companyBackground?.['report_date'] as string | undefined) ||
        '',
      analysis_period:
        study.analysis_period ||
        (companyBackground?.['analysis_period'] as string | undefined) ||
        '',
      prepared_by:
        this.resolvePreparedBy(study.prepared_by) ||
        this.resolvePreparedBy(companyBackground?.['prepared_by']) ||
        this.getDisplayName(record['prepared_by']) ||
        this.getDisplayName(record['preparedBy']) ||
        this.getDisplayName(record['created_by']) ||
        this.getDisplayName(record['createdBy']) ||
        this.getDisplayName(record['user']) ||
        this.getDisplayName(record['created_by_user']),
      company_background: companyBackground || study.company_background,
      product_volume_mix: this.sectionItems(record['product_volume_mix']) || study.product_volume_mix,
      customer_base: this.sectionItems(record['customer_base']) || study.customer_base,
      market_focus: this.sectionItems(record['market_focus']) || study.market_focus,
      quality_performance: this.sectionItems(record['quality_performance']) || study.quality_performance,
      head_count_data:
        (costPerformance?.['head_count_data'] as DiagnosticStudy['head_count_data']) ||
        study.head_count_data,
      cost_data:
        (costPerformance?.['cost_data'] as DiagnosticStudy['cost_data']) ||
        study.cost_data,
      delivery_performance: this.sectionItems(record['delivery_performance']) || study.delivery_performance,
      process_excellence:
        (this.sectionDetails(record['process_excellence']) as DiagnosticStudy['process_excellence']) ||
        study.process_excellence,
    };
  }

  private sectionDetails(section: unknown): Record<string, unknown> | undefined {
    return (section as Record<string, unknown> | undefined)?.['details'] as Record<string, unknown> | undefined;
  }

  private sectionItems(section: unknown): never[] | undefined {
    const details = this.sectionDetails(section);
    const items = details?.['items'];
    return Array.isArray(items) ? (items as never[]) : undefined;
  }

  private getDisplayName(value: unknown): string | undefined {
    if (!value) {
      return undefined;
    }
    if (typeof value === 'string') {
      return this.resolvePreparedBy(value);
    }
    const record = value as Record<string, unknown>;
    return (
      (record['name'] as string | undefined) ||
      (record['full_name'] as string | undefined) ||
      (record['email'] as string | undefined)
    );
  }

  private resolvePreparedBy(value: unknown): string | undefined {
    if (!value || typeof value !== 'string') {
      return undefined;
    }

    const currentUser = this.auth.currentUser();
    if (currentUser && String(currentUser.id) === value) {
      return currentUser.name;
    }

    // Avoid showing raw database IDs in the Prepared By column.
    if (/^[a-f\d]{24}$/i.test(value)) {
      return undefined;
    }

    return value;
  }
}
