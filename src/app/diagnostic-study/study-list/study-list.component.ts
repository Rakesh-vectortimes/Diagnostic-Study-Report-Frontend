import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { debounceTime } from 'rxjs';
import { DatePipe, TitleCasePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDialog } from '@angular/material/dialog';
import { DiagnosticStudyService } from '../../core/services/diagnostic-study.service';
import { NotificationService } from '../../core/services/notification.service';
import { AuthService } from '../../core/services/auth.service';
import { UserService } from '../../core/services/user.service';
import { DiagnosticStudy } from '../../shared/models/diagnostic-study.model';
import { User } from '../../shared/models/user.model';
import {
  ConfirmDialogComponent,
  ConfirmDialogData,
} from '../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-study-list',
  standalone: true,
  imports: [
    RouterLink,
    ReactiveFormsModule,
    DatePipe,
    TitleCasePipe,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
  ],
  templateUrl: './study-list.component.html',
  styleUrl: './study-list.component.scss',
})
export class StudyListComponent implements OnInit {
  private readonly studyService = inject(DiagnosticStudyService);
  private readonly notification = inject(NotificationService);
  private readonly dialog = inject(MatDialog);
  private readonly auth = inject(AuthService);
  private readonly userService = inject(UserService);

  studies = signal<DiagnosticStudy[]>([]);
  preparedByOptions = signal<string[]>([]);
  total = signal(0);
  page = signal(1);
  pages = signal(1);
  readonly limitOptions = [5, 10, 25, 50];

  searchControl = new FormControl('');
  statusControl = new FormControl('');
  preparedByControl = new FormControl('');
  periodFromControl = new FormControl<Date | null>(null);
  periodToControl = new FormControl<Date | null>(null);
  limitControl = new FormControl(10, { nonNullable: true });

  displayedColumns = ['sno', 'company', 'analysis_period', 'prepared_by', 'status', 'report_date', 'actions'];

  ngOnInit(): void {
    this.loadPreparedByOptions();
    this.loadStudies();
    const reloadFirstPage = () => {
      this.page.set(1);
      this.loadStudies();
    };

    this.searchControl.valueChanges.pipe(debounceTime(300)).subscribe(reloadFirstPage);
    this.statusControl.valueChanges.pipe(debounceTime(300)).subscribe(reloadFirstPage);
    this.preparedByControl.valueChanges.pipe(debounceTime(300)).subscribe(reloadFirstPage);
    this.periodFromControl.valueChanges.pipe(debounceTime(300)).subscribe(reloadFirstPage);
    this.periodToControl.valueChanges.pipe(debounceTime(300)).subscribe(reloadFirstPage);
    this.limitControl.valueChanges.pipe(debounceTime(300)).subscribe(reloadFirstPage);
  }

  loadPreparedByOptions(): void {
    const currentUser = this.auth.currentUser();
    if (currentUser) {
      this.loadOptionsForUser(currentUser);
      return;
    }

    this.auth.getCurrentUser().subscribe((user) => {
      if (user) {
        this.loadOptionsForUser(user);
      }
    });
  }

  private loadOptionsForUser(user: User): void {
    if (user.role !== 'admin') {
      this.mergePreparedByOptions([user.name]);
      return;
    }

    this.userService.getUsers(1, 100).subscribe({
      next: (res) => {
        if (res.success) {
          this.mergePreparedByOptions((res.data || []).map((u) => u.name));
        }
      },
      error: () => this.mergePreparedByOptions([user.name]),
    });
  }

  loadStudies(): void {
    this.studyService
      .getStudiesPage({
        page: this.page(),
        limit: this.limitControl.value,
        search: this.searchControl.value || undefined,
        status: this.statusControl.value || undefined,
        prepared_by: this.preparedByControl.value || undefined,
        period_from: this.formatDate(this.periodFromControl.value),
        period_to: this.formatDate(this.periodToControl.value),
      })
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.studies.set(res.data.items);
            this.mergePreparedByOptions(res.data.items.map((study) => study.prepared_by).filter(Boolean) as string[]);
            this.total.set(res.data.total);
            this.page.set(res.data.page);
            this.pages.set(res.data.pages);
          }
        },
      });
  }

  clearFilters(): void {
    this.searchControl.setValue('', { emitEvent: false });
    this.statusControl.setValue('', { emitEvent: false });
    this.preparedByControl.setValue('', { emitEvent: false });
    this.periodFromControl.setValue(null, { emitEvent: false });
    this.periodToControl.setValue(null, { emitEvent: false });
    this.limitControl.setValue(10, { emitEvent: false });
    this.page.set(1);
    this.loadStudies();
  }

  previousPage(): void {
    if (this.page() > 1) {
      this.page.update((page) => page - 1);
      this.loadStudies();
    }
  }

  nextPage(): void {
    if (this.page() < this.pages()) {
      this.page.update((page) => page + 1);
      this.loadStudies();
    }
  }

  rowNumber(index: number): number {
    return (this.page() - 1) * this.limitControl.value + index + 1;
  }

  formatAnalysisPeriod(period: string | undefined): string {
    if (!period) {
      return '—';
    }

    const [from, to] = period.split(/\s+to\s+/i);
    const formattedFrom = this.formatDisplayDate(from);
    const formattedTo = this.formatDisplayDate(to);

    if (formattedFrom && formattedTo) {
      return `${formattedFrom} to ${formattedTo}`;
    }

    return period;
  }

  deleteStudy(study: DiagnosticStudy): void {
    const data: ConfirmDialogData = {
      title: 'Delete Study',
      message: `Delete diagnostic study for "${study.company_name}"?`,
      confirmText: 'Delete',
    };
    this.dialog
      .open(ConfirmDialogComponent, { width: '400px', data })
      .afterClosed()
      .subscribe((confirmed) => {
        if (confirmed && study.id) {
          this.studyService.deleteStudy(study.id).subscribe({
            next: (res) => {
              if (res.success) {
                this.notification.success('Study deleted');
                this.loadStudies();
              }
            },
          });
        }
      });
  }

  exportPdf(study: DiagnosticStudy): void {
    if (!study.id) return;
    const tab = this.studyService.openExportWindow('Preparing PDF report...');
    this.studyService.exportPdf(study.id).subscribe({
      next: (blob) => this.studyService.openPdfInNewTab(blob, tab),
    });
  }

  exportWord(study: DiagnosticStudy): void {
    if (!study.id) return;
    const tab = this.studyService.openExportWindow('Preparing Word report...');
    this.studyService.exportWord(study.id).subscribe({
      next: (blob) => this.studyService.openWordInNewTab(blob, `study-${study.id}.docx`, tab),
    });
  }

  private formatDate(value: Date | null): string | undefined {
    if (!value) {
      return undefined;
    }
    return value.toISOString().split('T')[0];
  }

  private formatDisplayDate(value: string | undefined): string | null {
    if (!value) {
      return null;
    }

    const [year, month, day] = value.split('-').map(Number);
    if (!year || !month || !day) {
      return null;
    }

    const date = new Date(year, month - 1, day);
    return new Intl.DateTimeFormat('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(date).replace(',', '');
  }

  private mergePreparedByOptions(names: string[]): void {
    const normalized = names
      .map((name) => name?.trim())
      .filter((name): name is string => !!name);
    this.preparedByOptions.set(Array.from(new Set([...this.preparedByOptions(), ...normalized])));
  }
}
