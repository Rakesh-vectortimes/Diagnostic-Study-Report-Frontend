import { Component, inject, input, OnInit } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { CompanyService } from '../../../core/services/company.service';
import { Company, EntityId } from '../../../shared/models/company.model';
import { RichTextEditorComponent } from '../../../shared/components/rich-text-editor/rich-text-editor.component';

@Component({
  selector: 'app-company-background',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    RichTextEditorComponent,
  ],
  templateUrl: './company-background.component.html',
})
export class CompanyBackgroundComponent implements OnInit {
  formGroup = input.required<FormGroup>();
  private readonly companyService = inject(CompanyService);
  companies: Company[] = [];

  ngOnInit(): void {
    this.companyService.getCompanies().subscribe((res) => {
      if (res.success) {
        this.companies = res.data || [];
      }
    });

    this.syncAnalysisPeriod();
  }

  onCompanyChange(companyId: EntityId | undefined): void {
    if (companyId == null) {
      return;
    }
    const selectedId = companyId;
    const company = this.companies.find((c) => String(c.id) === String(selectedId));
    if (company) {
      this.formGroup().patchValue({
        company_id: selectedId,
        company_name: company.company_name,
        location: company.location,
        total_workforce: company.total_workforce,
        shift_operation: company.shift_operation,
        working_hours: company.working_hours,
        working_days: company.working_days,
      });
    }
  }

  companyOptionValue(company: Company): EntityId | undefined {
    return company.id ?? company.company_id ?? company.companyId ?? company._id;
  }

  compareCompanyId = (a: EntityId | null | undefined, b: EntityId | null | undefined): boolean =>
    a != null && b != null && String(a) === String(b);

  syncAnalysisPeriod(): void {
    const group = this.formGroup();
    const from = this.formatDate(group.get('analysis_period_from')?.value);
    const to = this.formatDate(group.get('analysis_period_to')?.value);
    group.patchValue(
      { analysis_period: from && to ? `${from} to ${to}` : '' },
      { emitEvent: false }
    );
  }

  private formatDate(value: unknown): string {
    if (!value) return '';
    if (value instanceof Date) {
      return value.toISOString().split('T')[0];
    }
    return String(value).split('T')[0];
  }
}
