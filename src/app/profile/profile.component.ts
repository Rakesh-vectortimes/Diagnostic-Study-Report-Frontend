import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { AuthService } from '../core/services/auth.service';
import { NotificationService } from '../core/services/notification.service';
import { UpdateProfileRequest, UserService } from '../core/services/user.service';
import { User } from '../shared/models/user.model';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
  ],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss',
})
export class ProfileComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly userService = inject(UserService);
  private readonly notification = inject(NotificationService);
  private readonly router = inject(Router);

  user: User | null = null;

  form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    mobile_number: ['', [Validators.required, Validators.pattern(/^[0-9+\-\s]{10,15}$/)]],
  });

  ngOnInit(): void {
    const currentUser = this.auth.currentUser();
    if (currentUser) {
      this.patchUser(currentUser);
      return;
    }

    this.auth.getCurrentUser().subscribe((user) => {
      if (user) {
        this.patchUser(user);
      }
    });
  }

  save(): void {
    if (this.form.invalid || !this.user?.id) {
      this.form.markAllAsTouched();
      return;
    }

    const payload = this.form.getRawValue() as UpdateProfileRequest;
    this.userService.updateUser(this.user.id, payload).subscribe({
      next: (res) => {
        if (res.success) {
          this.auth.currentUser.set({ ...this.user!, ...res.data, ...payload });
          this.notification.success('Profile updated successfully');
          this.router.navigate(['/dashboard']);
        }
      },
    });
  }

  cancel(): void {
    this.router.navigate(['/dashboard']);
  }

  private patchUser(user: User): void {
    this.user = user;
    this.form.patchValue({
      name: user.name,
      email: user.email,
      mobile_number: user.mobile_number || '',
    });
  }
}
