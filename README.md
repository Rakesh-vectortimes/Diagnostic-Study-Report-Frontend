# Diagnostic Study Report Management System — Frontend

Angular 19 frontend for managing companies, diagnostic studies, and report exports. Connects to a REST API with JWT authentication.

## Tech Stack

- Angular 19 (standalone components)
- Angular Material
- Reactive Forms
- JWT authentication with HTTP interceptor
- SCSS responsive layout

## Prerequisites

- Node.js 18+ (recommended: 20+)
- npm 9+
- Backend API running at `http://127.0.0.1:8000/api/v1`

## Setup

```bash
# Install dependencies
npm install

# Start development server
npm start
# or
ng serve --open
```

The app runs at **http://localhost:4200**.

## API Configuration

Edit `src/environments/environment.ts`:

```typescript
export const environment = {
  production: false,
  apiBaseUrl: 'http://127.0.0.1:8000/api/v1',
};
```

## Features

| Module | Routes | Description |
|--------|--------|-------------|
| Auth | `/login`, `/register` | JWT login/register |
| Dashboard | `/dashboard` | Stats cards and recent reports |
| Companies | `/companies`, `/companies/create`, `/companies/edit/:id`, `/companies/view/:id` | CRUD with search |
| Diagnostic Studies | `/diagnostic-studies`, `/diagnostic-studies/create`, `/diagnostic-studies/edit/:id`, `/diagnostic-studies/preview/:id` | Multi-step stepper form, preview, PDF/Word export |

## Project Structure

```
src/app/
├── core/           # Services, guards, interceptors
├── shared/         # Models, loader, confirm dialog
├── layout/         # Header, sidebar, main layout
├── auth/           # Login, register
├── dashboard/
├── companies/
└── diagnostic-study/
    ├── sections/   # Stepper section components
    ├── study-form/
    ├── study-list/
    └── report-preview/
```

## API Endpoints Used

- `POST /auth/login`, `POST /auth/register`, `GET /auth/me`
- `GET|POST /companies`, `GET|PUT|DELETE /companies/{id}`
- `GET|POST /diagnostic-studies`, `GET|PUT|DELETE /diagnostic-studies/{id}`
- `POST /diagnostic-studies/{id}/submit`
- `GET /diagnostic-studies/{id}/export/pdf`, `GET .../export/word`

## Build

```bash
ng build              # Production build
ng build --configuration development
```

## Default Workflow

1. Register or login at `/login`
2. Add companies under **Companies**
3. Create a diagnostic study via **Create Study** (9-step Material stepper)
4. Save draft or submit final report
5. Preview and export PDF/Word from list or preview page

## Notes

- JWT token is stored in `localStorage` under `access_token`
- Protected routes use `authGuard`
- API responses expect `{ success, message, data }` format
- Ensure CORS is enabled on the backend for `http://localhost:4200`
