import { Component, inject, computed, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-blog-layout',
  standalone: true,
  imports: [RouterLink, RouterOutlet],
  templateUrl: './blog-layout.component.html',
  styleUrl: './blog-layout.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BlogLayoutComponent {
  private authService = inject(AuthService);

  readonly isLoggedIn = computed(() => this.authService.isAuthenticated());
  readonly user = computed(() => this.authService.user());
  readonly currentYear = new Date().getFullYear();
}
