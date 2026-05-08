import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ClassesService } from '../../../core/services/classes.service';
import { ToastService } from '../../../core/services/toast.service';
import { switchMap, tap } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
  selector: 'app-classes-admin-detail',
  standalone: true,
  imports: [RouterLink, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './classes-admin-detail.component.html',
  styleUrl: './classes-admin-detail.component.scss',
})
export class ClassesAdminDetailComponent implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private classesService = inject(ClassesService);
  private toastService = inject(ToastService);

  classForm = this.fb.group({
    name: ['', Validators.required],
    schoolId: ['', Validators.required],
    homeroomTeacherId: [''],
  });

  classId = signal<string | null>(null);
  isEditMode = signal(false);

  ngOnInit(): void {
    this.route.paramMap.pipe(
      switchMap(params => {
        const id = params.get('id');
        this.classId.set(id);
        this.isEditMode.set(!!id);
        if (id) {
          return this.classesService.getById(id);
        }
        return of(null);
      }),
      tap(res => {
        if (res?.data) {
          this.classForm.patchValue({
            name: res.data.name,
            schoolId: res.data.school.id,
            homeroomTeacherId: res.data.homeroomTeacher?.id ?? '',
          });
        }
      }),
    ).subscribe();
  }

  onSubmit(): void {
    if (this.classForm.invalid) return;
    this.toastService.success('Thao tác lưu được giả lập (cần API backend)');
    this.router.navigate(['/admin/classes']);
  }
}
