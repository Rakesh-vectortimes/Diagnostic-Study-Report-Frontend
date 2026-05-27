import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe, TitleCasePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { DiagnosticStudyService } from '../core/services/diagnostic-study.service';
import { CompanyService } from '../core/services/company.service';
import { DiagnosticStudy } from '../shared/models/diagnostic-study.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    RouterLink,
    DatePipe,
    TitleCasePipe,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit {
  private readonly studyService = inject(DiagnosticStudyService);
  private readonly companyService = inject(CompanyService);

  stats = signal({
    totalCompanies: 0,
    totalStudies: 0,
    draftReports: 0,
    completedReports: 0,
  });
  recentStudies = signal<DiagnosticStudy[]>([]);

  displayedColumns = ['company_name', 'prepared_by', 'status', 'report_date', 'actions'];

  ngOnInit(): void {
    this.loadDashboard();
  }

  loadDashboard(): void {
    this.companyService.getCompanies().subscribe((cRes) => {
      const companies = cRes.success ? cRes.data?.length || 0 : 0;
      this.studyService.getStudies().subscribe((sRes) => {
        const studies = sRes.success ? sRes.data || [] : [];
        this.stats.set({
          totalCompanies: companies,
          totalStudies: studies.length,
          draftReports: studies.filter((s) => s.status === 'draft').length,
          completedReports: studies.filter((s) => ['completed', 'submitted', 'published'].includes(s.status)).length,
        });
        this.recentStudies.set(studies.slice(0, 10));
      });
    });
  }
}
