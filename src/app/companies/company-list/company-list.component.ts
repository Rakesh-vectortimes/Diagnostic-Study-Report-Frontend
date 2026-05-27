import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDialog } from '@angular/material/dialog';
import { TitleCasePipe } from '@angular/common';
import { CompanyService } from '../../core/services/company.service';
import { NotificationService } from '../../core/services/notification.service';
import { Company, CompanyStatus } from '../../shared/models/company.model';
import {
  ConfirmDialogComponent,
  ConfirmDialogData,
} from '../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-company-list',
  standalone: true,
  imports: [
    RouterLink,
    ReactiveFormsModule,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    TitleCasePipe,
  ],
  templateUrl: './company-list.component.html',
  styleUrl: './company-list.component.scss',
})
export class CompanyListComponent implements OnInit {
  private readonly companyService = inject(CompanyService);
  private readonly notification = inject(NotificationService);
  private readonly dialog = inject(MatDialog);

  companies = signal<Company[]>([]);
  locationOptions = signal<string[]>([]);
  total = signal(0);
  page = signal(1);
  pages = signal(1);
  readonly limitOptions = [5, 10, 25, 50];
  readonly statusOptions: CompanyStatus[] = ['active', 'inactive'];

  searchControl = new FormControl('');
  statusControl = new FormControl<CompanyStatus | ''>('');
  locationControl = new FormControl('');
  limitControl = new FormControl(10, { nonNullable: true });

  displayedColumns = ['sno', 'company_name', 'location', 'total_workforce', 'shift_operation', 'status', 'actions'];

  ngOnInit(): void {
    this.loadLocationOptions();
    this.loadCompanies();
    const reloadFirstPage = () => {
      this.page.set(1);
      this.loadCompanies();
    };

    this.searchControl.valueChanges
      .pipe(debounceTime(400), distinctUntilChanged())
      .subscribe(reloadFirstPage);
    this.statusControl.valueChanges.pipe(debounceTime(300), distinctUntilChanged()).subscribe(reloadFirstPage);
    this.locationControl.valueChanges.pipe(debounceTime(400), distinctUntilChanged()).subscribe(reloadFirstPage);
    this.limitControl.valueChanges.pipe(debounceTime(300), distinctUntilChanged()).subscribe(reloadFirstPage);
  }

  loadCompanies(): void {
    this.companyService.getCompaniesPage({
      page: this.page(),
      limit: this.limitControl.value,
      search: this.searchControl.value || undefined,
      status: this.statusControl.value || undefined,
      location: this.locationControl.value || undefined,
    }).subscribe({
      next: (res) => {
        if (res.success) {
          this.companies.set(res.data.items);
          this.total.set(res.data.total);
          this.page.set(res.data.page);
          this.pages.set(res.data.pages);
          this.mergeLocationOptions(res.data.items);
        }
      },
    });
  }

  loadLocationOptions(): void {
    this.companyService.getCompaniesPage({ page: 1, limit: 100 }).subscribe({
      next: (res) => {
        if (res.success) {
          this.mergeLocationOptions(res.data.items);
        }
      },
    });
  }

  clearFilters(): void {
    this.searchControl.setValue('', { emitEvent: false });
    this.statusControl.setValue('', { emitEvent: false });
    this.locationControl.setValue('', { emitEvent: false });
    this.limitControl.setValue(10, { emitEvent: false });
    this.page.set(1);
    this.loadCompanies();
  }

  previousPage(): void {
    if (this.page() > 1) {
      this.page.update((page) => page - 1);
      this.loadCompanies();
    }
  }

  nextPage(): void {
    if (this.page() < this.pages()) {
      this.page.update((page) => page + 1);
      this.loadCompanies();
    }
  }

  rowNumber(index: number): number {
    return (this.page() - 1) * this.limitControl.value + index + 1;
  }

  private mergeLocationOptions(companies: Company[]): void {
    const locations = companies
      .map((company) => company.location?.trim())
      .filter((location): location is string => !!location);
    this.locationOptions.set(Array.from(new Set([...this.locationOptions(), ...locations])));
  }

  deleteCompany(company: Company): void {
    const data: ConfirmDialogData = {
      title: 'Delete Company',
      message: `Are you sure you want to delete "${company.company_name}"?`,
      confirmText: 'Delete',
    };
    this.dialog
      .open(ConfirmDialogComponent, { width: '400px', data })
      .afterClosed()
      .subscribe((confirmed) => {
        if (confirmed && company.id) {
          this.companyService.deleteCompany(company.id).subscribe({
            next: (res) => {
              if (res.success) {
                this.notification.success('Company deleted successfully');
                this.loadCompanies();
              }
            },
          });
        }
      });
  }
}
