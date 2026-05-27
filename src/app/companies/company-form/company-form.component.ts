import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TitleCasePipe } from '@angular/common';
import { CompanyService } from '../../core/services/company.service';
import { NotificationService } from '../../core/services/notification.service';
import { Company, CompanyStatus, EntityId } from '../../shared/models/company.model';

@Component({
  selector: 'app-company-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    TitleCasePipe,
  ],
  templateUrl: './company-form.component.html',
  styleUrl: './company-form.component.scss',
})
export class CompanyFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly companyService = inject(CompanyService);
  private readonly notification = inject(NotificationService);

  isEdit = false;
  companyId: EntityId | null = null;
  currentPage: 'basic' | 'main' = 'basic';

  statuses: CompanyStatus[] = ['active', 'inactive'];
  currencies = ['INR'];
  productionSystems = [
    { value: 1, label: 'Preparatory & Assembly' },
    { value: 2, label: 'Only Assembly' },
  ];
  inventoryTypes = [
    { value: 1, label: 'Bundle system' },
    { value: 2, label: 'Manual UPS' },
    { value: 3, label: 'Hanger UPS' },
  ];
  workstationTypes = [
    { value: 1, label: 'Sitting' },
    { value: 2, label: 'Standing' },
  ];
  lineConfigurations = [
    { value: 1, label: 'Sewing only' },
    { value: 2, label: 'Sewing plus finishing' },
    { value: 3, label: 'Sewing plus finishing plus packing' },
  ];

  readonly basicInfoControls = [
    'company_name',
    'location',
    'contact_person',
    'mail_id',
    'contact_phone_number',
    'whatsapp_number',
    'currency',
    'status',
  ] as const;

  form = this.fb.group({
    company_name: ['', Validators.required],
    location: ['', Validators.required],
    contact_person: ['', Validators.required],
    mail_id: [
      '',
      [
        Validators.required,
        Validators.email,
        Validators.maxLength(100),
        Validators.pattern(/^\S+@\S+\.\S+$/),
      ],
    ],
    contact_phone_number: ['', [Validators.required, Validators.pattern(/^[6-9]\d{9}$/)]],
    whatsapp_number: ['', [Validators.required, Validators.pattern(/^[6-9]\d{9}$/)]],
    currency: ['INR', Validators.required],
    total_workforce: [null as number | null, [Validators.required, Validators.min(0)]],
    shift_operation: [null as number | null, [Validators.required, Validators.min(0)]],
    working_hours: [''],
    working_days: [null as number | null, [Validators.min(0)]],
    sewing_lines: [null as number | null, [Validators.min(0)]],
    production_system: [null as number | null],
    inventory_type: [null as number | null],
    workstation_type: [null as number | null],
    line_configuration: [null as number | null],
    status: ['active' as CompanyStatus, Validators.required],
  });

  ngOnInit(): void {
    this.loadCurrencies();
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEdit = true;
      this.companyId = id;
      this.loadCompany(this.companyId);
    }
  }

  loadCompany(id: EntityId): void {
    this.companyService.getCompanyById(id).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.form.patchValue({
            ...res.data,
            production_system: this.enumValue(this.productionSystems, res.data.production_system),
            inventory_type: this.enumValue(this.inventoryTypes, res.data.inventory_type),
            workstation_type: this.enumValue(this.workstationTypes, res.data.workstation_type),
            line_configuration: this.enumValue(this.lineConfigurations, res.data.line_configuration),
          });
          this.mergeCurrencyOption(res.data.currency);
        }
      },
    });
  }

  loadCurrencies(): void {
    this.companyService.getCountries().subscribe({
      next: (countries) => {
        const currencies = countries
          .map((country) => country.currency?.trim())
          .filter((currency): currency is string => !!currency);
        this.currencies = Array.from(new Set(currencies)).sort((a, b) => a.localeCompare(b));
        this.mergeCurrencyOption(this.form.controls.currency.value);
      },
      error: () => this.mergeCurrencyOption(this.form.controls.currency.value),
    });
  }

  goToMainInfo(): void {
    if (this.basicInfoControls.some((controlName) => this.form.controls[controlName].invalid)) {
      this.basicInfoControls.forEach((controlName) => this.form.controls[controlName].markAsTouched());
      return;
    }

    this.currentPage = 'main';
  }

  goToBasicInfo(): void {
    this.currentPage = 'basic';
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const payload = this.form.getRawValue() as Company;
    const request =
      this.isEdit && this.companyId
        ? this.companyService.updateCompany(this.companyId, payload)
        : this.companyService.createCompany(payload);

    request.subscribe({
      next: (res) => {
        if (res.success) {
          this.notification.success(
            this.isEdit ? 'Company updated successfully' : 'Company created successfully'
          );
          this.router.navigate(['/companies']);
        }
      },
    });
  }

  private mergeCurrencyOption(currency: string | null | undefined): void {
    if (currency && !this.currencies.includes(currency)) {
      this.currencies = [...this.currencies, currency].sort((a, b) => a.localeCompare(b));
    }
  }

  private enumValue(options: { value: number; label: string }[], value: unknown): number | null {
    if (typeof value === 'number') {
      return value;
    }
    const numeric = Number(value);
    if (Number.isFinite(numeric) && options.some((option) => option.value === numeric)) {
      return numeric;
    }
    const match = options.find((option) => option.label.toLowerCase() === String(value || '').toLowerCase());
    return match?.value ?? null;
  }
}
