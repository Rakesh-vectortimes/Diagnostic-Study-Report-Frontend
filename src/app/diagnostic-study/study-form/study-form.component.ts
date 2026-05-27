import { Component, OnInit, ViewChild, inject, signal } from '@angular/core';
import { AbstractControl, FormArray, FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatStepper, MatStepperModule } from '@angular/material/stepper';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { DiagnosticStudyService } from '../../core/services/diagnostic-study.service';
import { NotificationService } from '../../core/services/notification.service';
import { AuthService } from '../../core/services/auth.service';
import {
  createStudyForm,
  formToStudyPayload,
  patchStudyForm,
} from '../utils/study-form.builder';
import { CompanyBackgroundComponent } from '../sections/company-background/company-background.component';
import { ProductVolumeMixComponent } from '../sections/product-volume-mix/product-volume-mix.component';
import { CustomerBaseComponent } from '../sections/customer-base/customer-base.component';
import { MarketFocusComponent } from '../sections/market-focus/market-focus.component';
import { QualityPerformanceComponent } from '../sections/quality-performance/quality-performance.component';
import { CostPerformanceComponent } from '../sections/cost-performance/cost-performance.component';
import { DeliveryPerformanceComponent } from '../sections/delivery-performance/delivery-performance.component';
import { ProcessExcellenceComponent } from '../sections/process-excellence/process-excellence.component';
import { ReportPreviewComponent } from '../report-preview/report-preview.component';

@Component({
  selector: 'app-study-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatStepperModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    CompanyBackgroundComponent,
    ProductVolumeMixComponent,
    CustomerBaseComponent,
    MarketFocusComponent,
    QualityPerformanceComponent,
    CostPerformanceComponent,
    DeliveryPerformanceComponent,
    ProcessExcellenceComponent,
    ReportPreviewComponent,
  ],
  templateUrl: './study-form.component.html',
  styleUrl: './study-form.component.scss',
})
export class StudyFormComponent implements OnInit {
  @ViewChild('stepper') stepper!: MatStepper;

  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly studyService = inject(DiagnosticStudyService);
  private readonly notification = inject(NotificationService);
  private readonly auth = inject(AuthService);

  form: FormGroup = createStudyForm(this.fb);
  isEdit = false;
  studyId: number | string | null = null;
  previewData = signal<Record<string, unknown> | null>(null);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEdit = true;
      this.studyId = id;
      this.loadStudy(this.studyId);
    }
  }

  loadStudy(id: number | string): void {
    this.studyService.getStudyById(id).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          patchStudyForm(this.form, this.fb, res.data as unknown as Record<string, unknown>);
          this.previewData.set(this.form.getRawValue());
        }
      },
    });
  }

  get companyBackground(): FormGroup {
    return this.form.get('company_background') as FormGroup;
  }

  get processExcellence(): FormGroup {
    return this.form.get('process_excellence') as FormGroup;
  }

  get productVolumeMix(): FormArray {
    return this.form.get('product_volume_mix') as FormArray;
  }

  get customerBase(): FormArray {
    return this.form.get('customer_base') as FormArray;
  }

  get marketFocus(): FormArray {
    return this.form.get('market_focus') as FormArray;
  }

  get qualityPerformance(): FormArray {
    return this.form.get('quality_performance') as FormArray;
  }

  get headCountData(): FormArray {
    return this.form.get('head_count_data') as FormArray;
  }

  get deliveryPerformance(): FormArray {
    return this.form.get('delivery_performance') as FormArray;
  }

  updatePreview(): void {
    this.previewData.set(this.form.getRawValue());
  }

  onStepSelectionChange(selectedIndex: number): void {
    if (selectedIndex === 8) {
      this.updatePreview();
    }
  }

  nextStep(stepper: MatStepper, control: AbstractControl, updatePreview = false): void {
    control.markAllAsTouched();
    control.updateValueAndValidity({ emitEvent: false });

    if (control.invalid) {
      this.notification.error('Please complete the required fields before continuing.');
      return;
    }

    if (updatePreview) {
      this.updatePreview();
    }

    stepper.next();
  }

  saveDraft(): void {
    this.form.patchValue({ status: 'draft' });
    this.companyBackground.patchValue({ analysis_period_to: null });
    this.save();
  }

  submitFinal(): void {
    this.form.markAllAsTouched();
    this.form.updateValueAndValidity({ emitEvent: false });
    if (this.form.invalid) {
      this.notification.error('Please complete all required fields before submitting.');
      return;
    }
    this.companyBackground.patchValue({ analysis_period_to: new Date() });
    this.form.patchValue({ status: 'submitted' });
    this.save(true);
  }

  private save(submit = false): void {
    const user = this.auth.currentUser();
    if (user?.name) {
      this.companyBackground.patchValue({ prepared_by: user.name });
    }
    const startedAt = this.companyBackground.get('analysis_period_from')?.value || new Date();
    this.companyBackground.patchValue({
      report_date: this.companyBackground.get('report_date')?.value || startedAt,
      analysis_period_from: startedAt,
    });
    const payload = formToStudyPayload(this.form);
    const request =
      this.isEdit && this.studyId
        ? this.studyService.updateStudy(this.studyId, payload)
        : this.studyService.createStudy(payload);

    request.subscribe({
      next: (res) => {
        if (res.success) {
          this.notification.success(submit ? 'Study submitted successfully' : 'Draft saved successfully');
          this.router.navigate(['/diagnostic-studies']);
        }
      },
    });
  }

  exportPdf(): void {
    if (!this.studyId) {
      this.notification.info('Save the study first to export');
      return;
    }
    const tab = this.studyService.openExportWindow('Preparing PDF report...');
    this.studyService.exportPdf(this.studyId).subscribe({
      next: (blob) => this.studyService.openPdfInNewTab(blob, tab),
    });
  }

  exportWord(): void {
    if (!this.studyId) {
      this.notification.info('Save the study first to export');
      return;
    }
    const tab = this.studyService.openExportWindow('Preparing Word report...');
    this.studyService.exportWord(this.studyId).subscribe({
      next: (blob) => this.studyService.openWordInNewTab(blob, `study-${this.studyId}.docx`, tab),
    });
  }

  resetForm(): void {
    this.form = createStudyForm(this.fb);
    this.previewData.set(null);
    this.stepper?.reset();
  }
}
