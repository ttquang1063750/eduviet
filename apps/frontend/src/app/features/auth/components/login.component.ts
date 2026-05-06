import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);

  readonly isLoading = this.authService.isLoading;
  readonly errorMessage = signal<string | null>(null);
  readonly showPassword = signal(false);

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  readonly demoAccounts = [
    { role: 'SUPER_ADMIN', label: 'Super Admin', email: 'admin@eduviet.vn' },
    { role: 'SCHOOL_ADMIN', label: 'School Admin', email: 'school.admin@eduviet.vn' },
    { role: 'CONTENT_CREATOR', label: 'Soạn thảo', email: 'creator@eduviet.vn' },
    { role: 'CONTENT_REVIEWER', label: 'Reviewer', email: 'reviewer@eduviet.vn' },
    { role: 'CONTENT_APPROVER', label: 'Phê duyệt', email: 'approver@eduviet.vn' },
    { role: 'SUBJECT_TEACHER', label: 'Giáo viên', email: 'teacher@eduviet.vn' },
    { role: 'STUDENT', label: 'Học sinh', email: 'student@eduviet.vn' },
    { role: 'PARENT', label: 'Phụ huynh', email: 'parent@eduviet.vn' },
  ];

  fillDemo(account: { email: string }) {
    this.form.patchValue({ email: account.email, password: 'Admin@123' });
  }

  isFieldInvalid(field: 'email' | 'password'): boolean {
    const control = this.form.get(field);
    return !!(control?.invalid && control?.touched);
  }

  onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.errorMessage.set(null);
    const { email, password } = this.form.getRawValue();

    this.authService.login({ email, password }).subscribe({
      error: (err) => {
        const msg = err?.error?.error?.message ?? 'Đã có lỗi xảy ra, vui lòng thử lại';
        this.errorMessage.set(msg);
      },
    });
  }
}
