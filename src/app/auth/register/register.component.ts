import { Component, inject } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { UserRole } from '../../shared/models/user.model';

function passwordMatchValidator(group: AbstractControl) {
  const password = group.get('password')?.value;
  const confirm = group.get('confirm_password')?.value;
  return password === confirm ? null : { passwordMismatch: true };
}

@Component({
  selector: 'app-register',
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
  ],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss',
})
export class RegisterComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly notification = inject(NotificationService);

  hidePassword = true;
  roles: { value: UserRole; label: string }[] = [
    { value: 'admin', label: 'Admin' },
    { value: 'consultant', label: 'Consultant' },
    { value: 'company_user', label: 'Company User' },
  ];

  form = this.fb.group(
    {
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      mobile_number: ['', [Validators.required, Validators.pattern(/^[0-9+\-\s]{10,15}$/)]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirm_password: ['', Validators.required],
      role: ['consultant' as UserRole, Validators.required],
    },
    { validators: passwordMatchValidator }
  );

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { confirm_password, ...payload } = this.form.getRawValue();
    this.auth.register(payload as Parameters<AuthService['register']>[0]).subscribe({
      next: (res) => {
        if (res.success) {
          this.notification.success('Registration successful. Please login.');
          this.router.navigate(['/login']);
        }
      },
    });
  }
}
