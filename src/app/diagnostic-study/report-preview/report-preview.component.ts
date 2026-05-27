import { Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { DiagnosticStudyService } from '../../core/services/diagnostic-study.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-report-preview',
  standalone: true,
  imports: [DatePipe, RouterLink, MatButtonModule, MatIconModule, MatCardModule],
  templateUrl: './report-preview.component.html',
  styleUrl: './report-preview.component.scss',
})
export class ReportPreviewComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly studyService = inject(DiagnosticStudyService);
  private readonly auth = inject(AuthService);

  studyData = input<Record<string, unknown> | null>(null);
  inline = input(false);

  private readonly loadedData = signal<Record<string, unknown>>({});
  readonly data = computed(() => this.studyData() || this.loadedData());
  studyId: number | string | null = null;

  ngOnInit(): void {
    if (this.studyData()) {
      return;
    }
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.studyId = id;
      this.studyService.getStudyById(id).subscribe({
        next: (res) => {
          if (res.success && res.data) {
            this.loadedData.set(this.mapStudyToPreview(res.data as unknown as Record<string, unknown>));
          }
        },
      });
    }
  }

  private mapStudyToPreview(study: Record<string, unknown>): Record<string, unknown> {
    return {
      company_background: study['company_background'] || {
        company_id: study['company_id'],
        report_date: study['report_date'],
        analysis_period: study['analysis_period'],
        ...(study['company_background'] as object),
      },
      company_name: study['company_name'],
      prepared_by: study['prepared_by'] || this.auth.currentUser()?.name,
      product_volume_mix: study['product_volume_mix'],
      customer_base: study['customer_base'],
      market_focus: study['market_focus'],
      quality_performance: study['quality_performance'],
      head_count_data: study['head_count_data'],
      cost_data: study['cost_data'],
      delivery_performance: study['delivery_performance'],
      process_excellence: study['process_excellence'],
    };
  }

  bg(): Record<string, unknown> {
    return (this.data()['company_background'] as Record<string, unknown>) || {};
  }

  companyName(): string {
    return String(this.data()['company_name'] || this.bg()['company_name'] || 'Company Name');
  }

  preparedBy(): string {
    return String(
      this.data()['prepared_by'] ||
      this.bg()['prepared_by'] ||
      this.auth.currentUser()?.name ||
      'N/A'
    );
  }

  arr(key: string): Record<string, unknown>[] {
    const rows = (this.data()[key] as Record<string, unknown>[]) || [];
    return rows.filter((row) => {
      const label = row['product_category'] || row['customer_name'] || row['market_focus'] || row['department'];
      return String(label || '').trim().toLowerCase() !== 'total';
    });
  }

  totalFor(section: string, key: string): number {
    return this.arr(section).reduce((sum, row) => {
      const value = row[key] ?? (key === 'operators' ? row['workers'] : undefined);
      return sum + this.numericValue(value);
    }, 0);
  }

  percentTotalFor(section: string, volumeKey: string): number {
    return this.totalFor(section, volumeKey) > 0 ? 100 : 0;
  }

  percentFor(section: string, key: string, value: unknown): number {
    const total = this.totalFor(section, key);
    const rowValue = this.numericValue(value);
    return total > 0 ? Math.round((rowValue / total) * 10000) / 100 : 0;
  }

  display(value: unknown): string {
    return value == null || value === '' ? 'N/A' : String(value);
  }

  performanceStatusLabel(value: unknown): string {
    return this.enumLabel(value, {
      1: 'Measured',
      2: 'Not Measured',
      measured: 'Measured',
      not_measured: 'Not Measured',
    });
  }

  cost(): Record<string, unknown> {
    return (this.data()['cost_data'] as Record<string, unknown>) || {};
  }

  process(): Record<string, unknown> {
    return (this.data()['process_excellence'] as Record<string, unknown>) || {};
  }

  processProjects(): Record<string, unknown>[] {
    const projects = this.process()['improvement_projects'];
    return Array.isArray(projects) ? (projects as Record<string, unknown>[]) : [];
  }

  private numericValue(value: unknown): number {
    if (value == null || value === '') {
      return 0;
    }
    const parsed = Number(String(value).replace(/,/g, ''));
    return Number.isFinite(parsed) ? parsed : 0;
  }

  processFields(): { key: string; label: string; rich?: boolean; enumType?: 'leanBelt' | 'fiveS' | 'leanPractice' }[] {
    return [
      { key: 'measure_standard_time', label: 'Do you measure Standard Time?' },
      { key: 'measure_pcd', label: 'Do you measure Planned Cut Date (PCD) performance?' },
      { key: 'interested_automation', label: 'Are you interested in automation of processes?' },
      { key: 'ie_department', label: 'Do you have Industrial Engineering / Operation Excellence Department?' },
      { key: 'lean_belt_professionals', label: 'Do you have Lean Belt certified professionals in the organization?' },
      { key: 'lean_belt_level', label: 'Lean Belt level', enumType: 'leanBelt' },
      { key: 'track_operator_performance', label: 'Do you track individual operator performance?' },
      { key: 'training_school', label: 'Do you have Training School for operators / Supervisor?' },
      { key: 'five_s_certification', label: 'Do you have certification of 5S?' },
      { key: 'five_s_level', label: '5S level', enumType: 'fiveS' },
      { key: 'incentive_system', label: 'Do you have incentive system in the factory?' },
      { key: 'incentive_details', label: 'Incentive details', rich: true },
      { key: 'one_year_plan', label: 'Do you have 1 year plan for improvement?' },
      { key: 'lean_tools_practiced', label: 'Have you ever practiced Lean Manufacturing Tools & Technique?' },
      { key: 'lean_practice_details', label: 'Lean practice method', enumType: 'leanPractice' },
      { key: 'pain_areas', label: 'Pain areas', rich: true },
      { key: 'improvements_expected', label: 'Improvement expected', rich: true },
    ];
  }

  formatProcessValue(value: unknown, enumType?: 'leanBelt' | 'fiveS' | 'leanPractice'): string {
    if (!value) {
      return 'N/A';
    }
    if (enumType === 'leanBelt') {
      return this.enumLabel(value, {
        1: 'White',
        2: 'Yellow',
        3: 'Green',
        4: 'Black',
        5: 'Master Black',
        white: 'White',
        yellow: 'Yellow',
        green: 'Green',
        black: 'Black',
        master_black: 'Master Black',
      });
    }
    if (enumType === 'fiveS') {
      return this.enumLabel(value, {
        1: 'Excellence',
        2: 'Sustenance',
        3: 'Model',
        excellence: 'Excellence',
        sustenance: 'Sustenance',
        model: 'Model',
      });
    }
    if (enumType === 'leanPractice') {
      return this.enumLabel(value, {
        1: 'Self implementation',
        2: 'Hired coach',
        self_implementation: 'Self implementation',
        hired_coach: 'Hired coach',
      });
    }
    return String(value)
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (char) => char.toUpperCase());
  }

  private enumLabel(value: unknown, labels: Record<string, string>): string {
    if (!value) {
      return 'N/A';
    }
    return labels[String(value)] || labels[String(value).toLowerCase()] || this.display(value);
  }

  exportPdf(): void {
    if (!this.studyId) return;
    const tab = this.studyService.openExportWindow('Preparing PDF report...');
    this.studyService.exportPdf(this.studyId).subscribe({
      next: (blob) => this.studyService.openPdfInNewTab(blob, tab),
    });
  }

  exportWord(): void {
    if (!this.studyId) return;
    const tab = this.studyService.openExportWindow('Preparing Word report...');
    this.studyService.exportWord(this.studyId).subscribe({
      next: (blob) => this.studyService.openWordInNewTab(blob, `study-${this.studyId}.docx`, tab),
    });
  }
}
