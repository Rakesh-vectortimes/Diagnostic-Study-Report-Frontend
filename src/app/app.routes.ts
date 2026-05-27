import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  {
    path: 'login',
    loadComponent: () => import('./auth/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'register',
    loadComponent: () => import('./auth/register/register.component').then((m) => m.RegisterComponent),
  },
  {
    path: '',
    loadComponent: () =>
      import('./layout/main-layout/main-layout.component').then((m) => m.MainLayoutComponent),
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./dashboard/dashboard.component').then((m) => m.DashboardComponent),
      },
      {
        path: 'profile',
        loadComponent: () => import('./profile/profile.component').then((m) => m.ProfileComponent),
      },
      {
        path: 'companies',
        loadComponent: () =>
          import('./companies/company-list/company-list.component').then((m) => m.CompanyListComponent),
      },
      {
        path: 'companies/create',
        loadComponent: () =>
          import('./companies/company-form/company-form.component').then((m) => m.CompanyFormComponent),
      },
      {
        path: 'companies/edit/:id',
        loadComponent: () =>
          import('./companies/company-form/company-form.component').then((m) => m.CompanyFormComponent),
      },
      {
        path: 'companies/view/:id',
        loadComponent: () =>
          import('./companies/company-view/company-view.component').then((m) => m.CompanyViewComponent),
      },
      {
        path: 'diagnostic-studies',
        loadComponent: () =>
          import('./diagnostic-study/study-list/study-list.component').then((m) => m.StudyListComponent),
      },
      {
        path: 'diagnostic-studies/create',
        loadComponent: () =>
          import('./diagnostic-study/study-form/study-form.component').then((m) => m.StudyFormComponent),
      },
      {
        path: 'diagnostic-studies/edit/:id',
        loadComponent: () =>
          import('./diagnostic-study/study-form/study-form.component').then((m) => m.StudyFormComponent),
      },
      {
        path: 'diagnostic-studies/preview/:id',
        loadComponent: () =>
          import('./diagnostic-study/report-preview/report-preview.component').then(
            (m) => m.ReportPreviewComponent
          ),
      },
    ],
  },
  { path: '**', redirectTo: 'dashboard' },
];
